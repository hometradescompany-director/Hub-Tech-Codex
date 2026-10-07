"""Offline, non-activating SQLite import. Node validates the same contract first."""
import gzip
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent

def build(raw, destination):
    destination = Path(destination)
    compressed = Path(str(destination) + '.gz')
    if destination.exists() or compressed.exists():
        raise ValueError('Refusing to overwrite an existing database or compressed export')
    validator = 'import {validatePopulation} from ' + json.dumps((ROOT / 'src/v1-population.mjs').as_uri()) + '; let raw=""; for await(const chunk of process.stdin)raw+=chunk; validatePopulation(JSON.parse(raw));'
    checked = subprocess.run(['node', '--input-type=module', '-e', validator], input=raw, text=True, capture_output=True)
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
        if len(sys.argv) != 2:
            raise ValueError('Usage: python3 scripts/v1-population-db.py OUTPUT.sqlite < population.json')
        print(json.dumps(build(sys.stdin.read(), sys.argv[1])))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
