import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,existsSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawnSync} from 'node:child_process';
import {generatePopulation} from '../src/v1-population.mjs';
const run=(input,path)=>spawnSync('python3',['scripts/v1-population-db.py',path],{input:JSON.stringify(input),encoding:'utf8',maxBuffer:1024*1024});
test('SQLite import retains named people, decision links and explicit fictional provenance',()=>{
 const dir=mkdtempSync(join(tmpdir(),'v1-db-'));try{
  const out=join(dir,'origins.sqlite');const result=run(generatePopulation({count:6,seed:'database'}),out);assert.equal(result.status,0,result.stderr);
  const query=spawnSync('python3',['-c',`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1]);print(json.dumps([c.execute('select count(*) from identities').fetchone()[0],c.execute('select count(*) from decisions').fetchone()[0],c.execute('select count(*) from decision_links').fetchone()[0],c.execute("select count(*) from identities where standing='staged' and provenance='fabricated_origin'").fetchone()[0],c.execute('pragma integrity_check').fetchone()[0],c.execute('pragma foreign_key_check').fetchall()]))`,out],{encoding:'utf8'});
  assert.equal(query.status,0,query.stderr);assert.deepEqual(JSON.parse(query.stdout),[6,60,54,6,'ok',[]]);
  assert.ok(existsSync(`${out}.gz`));
  const before=readFileSync(out);assert.notEqual(run(generatePopulation({count:7,seed:'different'}),out).status,0);assert.deepEqual(readFileSync(out),before);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('bad cohort creates no partially imported database',()=>{
 const dir=mkdtempSync(join(tmpdir(),'v1-db-'));try{
  const out=join(dir,'invalid.sqlite');const c=generatePopulation({count:3,seed:'bad-db'});c.people[1].authority_grants=['admin'];
  assert.notEqual(run(c,out).status,0);assert.equal(existsSync(out),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('compressed SQLite content is reproducible across output locations',()=>{
 const dir=mkdtempSync(join(tmpdir(),'v1-db-'));try{
  const c=generatePopulation({count:4,seed:'repeat-db'});const a=join(dir,'a.sqlite'),b=join(dir,'b.sqlite');
  assert.equal(run(c,a).status,0);assert.equal(run(c,b).status,0);assert.deepEqual(readFileSync(`${a}.gz`),readFileSync(`${b}.gz`));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
