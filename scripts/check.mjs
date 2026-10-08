import {validateCosmic} from '../src/cosmic.mjs';
import {validateSymbols} from '../src/contextual-symbols.mjs';
import {readFile,readdir} from 'node:fs/promises';import {spawnSync} from 'node:child_process';
import {validateGraph} from '../src/graph.mjs';import {validatePaths} from '../src/paths.mjs';
validateGraph(JSON.parse(await readFile(new URL('../data/constellation.json',import.meta.url))));validatePaths(JSON.parse(await readFile(new URL('../data/development-paths.json',import.meta.url))));
for(const dir of ['src','scripts'])for(const file of await readdir(new URL(`../${dir}/`,import.meta.url))){if(!/\.(mjs|cjs)$/.test(file))continue;const r=spawnSync(process.execPath,['--check',`${dir}/${file}`],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}

const field=validateCosmic(JSON.parse(await readFile(new URL('../data/cosmic-fixture.json',import.meta.url),'utf8')));
validateSymbols(JSON.parse(await readFile(new URL('../data/contextual-symbols.json',import.meta.url),'utf8')),{subjectIds:field.bodies.map(b=>b.id)});
console.log('Graph, paths, cosmic field, contextual symbols and JavaScript syntax validated.');
