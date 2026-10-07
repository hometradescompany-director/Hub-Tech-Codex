import {generatePopulation,validatePopulation} from '../src/v1-population.mjs';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,join,resolve,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const databaseScript=join(root,'scripts/v1-population-db.py');
const [outputArgument,seed]=process.argv.slice(2);
if(!outputArgument||!seed)throw new Error('Usage: node scripts/build-v1-population.mjs OUTPUT_DIRECTORY SEED (set V1_POPULATION_PYTHON to an absolute interpreter path)');
if(Number(process.versions.node.split('.')[0])<22)throw new Error(`Node.js 22 or later is required; found ${process.version}`);
const python=process.env.V1_POPULATION_PYTHON;
if(!python||!isAbsolute(python))throw new Error('Set V1_POPULATION_PYTHON to the absolute path of the selected Python interpreter');

const output=resolve(outputArgument);
const files=['origins.sqlite','origins.sqlite.gz','manifest.json','index.json','samples.json','runtime.json'];
for(const file of files)if(existsSync(join(output,file)))throw new Error(`Refusing to overwrite ${file}; select an empty output directory`);

const runtimeEnvironment={...process.env,V1_POPULATION_NODE:process.execPath};
function runPython(args,input) {
 const result=spawnSync(python,[databaseScript,...args],{input,encoding:'utf8',maxBuffer:64*1024*1024,env:runtimeEnvironment});
 if(result.error)throw new Error(`Could not run V1_POPULATION_PYTHON: ${result.error.message}`);
 if(result.status!==0)throw new Error(result.stderr||'Population database operation failed');
 return result.stdout;
}
const runtime=JSON.parse(runPython(['--preflight']));
const cohort=generatePopulation({count:1000,seed});
validatePopulation(cohort);
mkdirSync(output,{recursive:true});
const result=JSON.parse(runPython([join(output,'origins.sqlite')],JSON.stringify(cohort)));
const coverage={};for(const p of cohort.people)coverage[p.life_pattern]=(coverage[p.life_pattern]||0)+1;
const sha=file=>createHash('sha256').update(readFileSync(join(output,file))).digest('hex');
const manifest={schema_version:cohort.schema_version,generator_version:cohort.generator_version,seed,standing:cohort.standing,content_digest:cohort.content_digest,...result,decision_links:cohort.people.reduce((n,p)=>n+p.decisions.reduce((m,d)=>m+d.influenced_by.length,0),0),life_pattern_counts:coverage,
 artifacts:{'origins.sqlite':{sha256:sha('origins.sqlite')},'origins.sqlite.gz':{sha256:sha('origins.sqlite.gz')}},professional_registry_import:'not-performed',activation:'none',limitations:['Procedural combinations of 16 authored situations, not 1000 independently hand-written lives.','Not statistically representative of Earth society.','Background links are fictional acquaintances, not observed causal evidence.','No production account bindings, sessions, permissions or experienced V1 events.']};
writeFileSync(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
writeFileSync(join(output,'index.json'),JSON.stringify(cohort.people.map(p=>({id:p.id,name:p.name,age:p.age,life_pattern:p.life_pattern,biography:p.biography,decision_count:p.decisions.length})),null,2)+'\n');
const samples=[];for(const p of cohort.people)if(!samples.some(s=>s.life_pattern===p.life_pattern))samples.push(p);
writeFileSync(join(output,'samples.json'),JSON.stringify(samples,null,2)+'\n');
writeFileSync(join(output,'runtime.json'),JSON.stringify(runtime,null,2)+'\n');
console.log(JSON.stringify({...manifest,runtime},null,2));
