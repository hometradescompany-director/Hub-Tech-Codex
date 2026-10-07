import {generatePopulation,validatePopulation} from '../src/v1-population.mjs';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const output=resolve(process.argv[2]||'data/v1-population');
const seed=process.argv[3]||'v1-earth-2026';
const cohort=generatePopulation({count:1000,seed});validatePopulation(cohort);
mkdirSync(output,{recursive:true});
for(const file of ['origins.sqlite','origins.sqlite.gz','manifest.json','index.json','samples.json'])if(existsSync(join(output,file)))throw new Error(`Refusing to overwrite ${file}; select an empty output directory`);
const result=spawnSync('python3',['scripts/v1-population-db.py',join(output,'origins.sqlite')],{input:JSON.stringify(cohort),encoding:'utf8',maxBuffer:64*1024*1024});
if(result.status!==0)throw new Error(result.stderr||'Database import failed');
const summary=JSON.parse(result.stdout);const coverage={};for(const p of cohort.people)coverage[p.life_pattern]=(coverage[p.life_pattern]||0)+1;
const sha=file=>createHash('sha256').update(readFileSync(join(output,file))).digest('hex');
const manifest={schema_version:cohort.schema_version,generator_version:cohort.generator_version,seed,standing:cohort.standing,content_digest:cohort.content_digest,...summary,decision_links:cohort.people.reduce((n,p)=>n+p.decisions.reduce((m,d)=>m+d.influenced_by.length,0),0),life_pattern_counts:coverage,
 artifacts:{'origins.sqlite':{sha256:sha('origins.sqlite')},'origins.sqlite.gz':{sha256:sha('origins.sqlite.gz')}},professional_registry_import:'not-performed',activation:'none',limitations:['Procedural combinations of 16 authored situations, not 1000 independently hand-written lives.','Not statistically representative of Earth society.','Background links are fictional acquaintances, not observed causal evidence.','No production account bindings, sessions, permissions or experienced V1 events.']};
writeFileSync(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
writeFileSync(join(output,'index.json'),JSON.stringify(cohort.people.map(p=>({id:p.id,name:p.name,age:p.age,life_pattern:p.life_pattern,biography:p.biography,decision_count:p.decisions.length})),null,2)+'\n');
const samples=[];for(const p of cohort.people)if(!samples.some(s=>s.life_pattern===p.life_pattern))samples.push(p);
writeFileSync(join(output,'samples.json'),JSON.stringify(samples,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
