"""Offline, non-activating SQLite import. Node validates the same contract first."""
import gzip
import json
import os
import platform
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import zlib

ROOT = Path(__file__).resolve().parent.parent

def runtime_info():
    if sys.version_info < (3, 11) or sys.version_info >= (3, 14):
        raise ValueError('Python 3.11 through 3.13 is required; found ' + platform.python_version())
    if sqlite3.sqlite_version_info < (3, 37, 0):
        raise ValueError('SQLite 3.37 or later is required; found ' + sqlite3.sqlite_version)
    if tuple(int(part) for part in zlib.ZLIB_RUNTIME_VERSION.split('.')[:3]) < (1, 2, 11):
        raise ValueError('zlib 1.2.11 or later is required; found ' + zlib.ZLIB_RUNTIME_VERSION)

    db = sqlite3.connect(':memory:')
    try:
        if db.execute("SELECT json_valid('{}'), json_extract('{}', '$')").fetchone() != (1, '{}'):
            raise ValueError('SQLite JSON functions are unavailable')
        db.execute('PRAGMA foreign_keys=ON')
        if db.execute('PRAGMA foreign_keys').fetchone()[0] != 1:
            raise ValueError('SQLite foreign-key enforcement is unavailable')
    finally:
        db.close()
    sample = b'v1-population-runtime-preflight'
    if zlib.decompress(zlib.compress(sample)) != sample:
        raise ValueError('zlib compression capability check failed')

    node = os.environ.get('V1_POPULATION_NODE')
    if not node or not Path(node).is_absolute():
        raise ValueError('The invoking Node executable was not supplied')
    checked = subprocess.run([node, '--version'], text=True, capture_output=True)
    if checked.returncode:
        raise ValueError('Could not run the invoking Node executable: ' + checked.stderr[-1000:])
    node_version = checked.stdout.strip()
    try:
        node_major = int(node_version.removeprefix('v').split('.')[0])
    except (ValueError, IndexError):
        raise ValueError('Could not determine the invoking Node version: ' + node_version) from None
    if node_major < 22:
        raise ValueError('Node.js 22 or later is required; found ' + node_version)
    return {
        'node': {'version': node_version},
        'python': {'version': platform.python_version()},
        'sqlite': {'version': sqlite3.sqlite_version},
        'zlib': {'version': zlib.ZLIB_RUNTIME_VERSION},
    }

def build(raw, destination):
    runtime_info()
    destination = Path(destination)
    compressed = Path(str(destination) + '.gz')
    if destination.exists() or compressed.exists():
        raise ValueError('Refusing to overwrite an existing database or compressed export')
    validator = 'import {validatePopulation} from ' + json.dumps((ROOT / 'src/v1-population.mjs').as_uri()) + '; let raw=""; for await(const chunk of process.stdin)raw+=chunk; validatePopulation(JSON.parse(raw));'
    node = os.environ['V1_POPULATION_NODE']
    checked = subprocess.run([node, '--input-type=module', '-e', validator], input=raw, text=True, capture_output=True)
    if checked.returncode:
        raise ValueError('Population validation refused: ' + checked.stderr[-1500:])
    cohort = json.loads(raw)
    destination.parent.mkdir(parents=True, exist_ok=True)
    created = []
    with tempfile.TemporaryDirectory(prefix='.v1-import-', dir=destination.parent) as directory:
        staged = Path(directory) / 'origins.sqlite'
        db = sqlite3.connect(staged)
        try:
            db.executescript((ROOT / 'data/v1-population/schema.sql').read_text())
            def encoded(value):
                return json.dumps(value, ensure_ascii=False, separators=(',', ':'))
            with db:
                for key, value in cohort.items():
                    if key not in ('people', 'relationships'):
                        db.execute('INSERT INTO cohort_manifest VALUES (?,?)', (key, encoded(value)))
                templates = {}
                for person in cohort['people']:
                    templates[person['life_pattern']] = person['life_context']
                for key in sorted(templates):
                    db.execute('INSERT INTO template_snapshots VALUES (?,?,?,?)', (key, '1', 'newly-authored', templates[key]))
                for p in cohort['people']:
                    profile = {key:value for key,value in p.items() if key != 'decisions'}
                    db.execute('INSERT INTO identities VALUES (?,?,?,?,?,?,?,?,?)', (p['id'], p['world_id'], p['name'], p['age'], p['birth_year'], p['life_pattern'], p['standing'], p['provenance'], encoded(profile)))
                # Group comparable payloads for a smaller compressed export; IDs and sequence, not insertion order, define history.
                memories = [(p, d) for p in cohort['people'] for d in p['decisions']]
                for p, d in sorted(memories, key=lambda item: (item[1]['scenario_id'], item[1]['choice_id'], item[0]['id'])):
                    db.execute('INSERT INTO decisions VALUES (?,?,?,?,?,?,?,?,?,?)', (d['id'], p['world_id'], p['id'], d['sequence'], d['age'], d['earth_year'], d['scenario_id'], d['choice_id'], d['provenance'], encoded(d)))
                for p in cohort['people']:
                    for d in p['decisions']:
                        for earlier in d['influenced_by']:
                            db.execute('INSERT INTO decision_links VALUES (?,?,?)', (p['id'], earlier, d['id']))
                for r in cohort['relationships']:
                    db.execute('INSERT INTO relationships VALUES (?,?,?,?,?,?,?)', (r['id'], r['world_id'], r['from_id'], r['to_id'], r['type'], r['provenance'], encoded(r)))
            if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok' or db.execute('PRAGMA foreign_key_check').fetchall():
                raise ValueError('Database integrity refused')
        finally:
            db.close()
        zipped = Path(directory) / 'origins.sqlite.gz'
        with zipped.open('wb') as output:
            with gzip.GzipFile(filename='', mode='wb', fileobj=output, mtime=0) as archive:
                archive.write(staged.read_bytes())
        try:
            # Exclusive hard links prevent concurrent imports from overwriting a destination.
            os.link(staged, destination)
            created.append(destination)
            os.link(zipped, compressed)
            created.append(compressed)
        except Exception:
            for path in created:
                path.unlink()
            raise
    return {'identities':len(cohort['people']), 'decisions':sum(len(p['decisions']) for p in cohort['people']), 'relationships':len(cohort['relationships']), 'integrity':'ok'}

if __name__ == '__main__':
    try:
        if sys.argv[1:] == ['--preflight']:
            print(json.dumps(runtime_info()))
            sys.exit(0)
        if len(sys.argv) != 2:
            raise ValueError('Usage: $V1_POPULATION_PYTHON scripts/v1-population-db.py OUTPUT.sqlite < population.json')
        print(json.dumps(build(sys.stdin.read(), sys.argv[1])))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
