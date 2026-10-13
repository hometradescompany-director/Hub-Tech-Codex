import test from 'node:test';import assert from 'node:assert/strict';
import {chmodSync,mkdtempSync,readFileSync,rmSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {dirname,join,resolve} from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
import {generatePopulation} from '../src/v1-population.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const python=process.env.V1_POPULATION_PYTHON;
const builder=join(root,'scripts/build-v1-population.mjs');
const databaseScript=join(root,'scripts/v1-population-db.py');
const run=(input,path,interpreter=python)=>spawnSync(interpreter,[databaseScript,path],{input:JSON.stringify(input),encoding:'utf8',maxBuffer:1024*1024,env:{...process.env,V1_POPULATION_NODE:process.execPath}});
test('builder resolves authored scripts from another working directory',()=>{
 assert.ok(python,'Set V1_POPULATION_PYTHON to the selected Python interpreter');
 const dir=mkdtempSync(join(tmpdir(),'v1-cwd-'));try{
  const out=join(dir,'output');
  const result=spawnSync(process.execPath,[builder,out,'other-cwd'],{cwd:dir,encoding:'utf8',env:{...process.env,V1_POPULATION_PYTHON:python}});
  assert.equal(result.status,0,result.stderr);assert.ok(existsSync(join(out,'origins.sqlite')));
  const manifest=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8'));
  const runtime=JSON.parse(readFileSync(join(out,'runtime.json'),'utf8'));
  assert.equal(runtime.node.version,process.version);assert.deepEqual(Object.keys(runtime).sort(),['node','python','sqlite','zlib']);
  assert.equal(Object.hasOwn(manifest,'runtime'),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('builder uses the configured Python despite a misleading PATH',()=>{
 assert.ok(python,'Set V1_POPULATION_PYTHON to the selected Python interpreter');
 const dir=mkdtempSync(join(tmpdir(),'v1-path-'));try{
  const fakeBin=join(dir,'bin');mkdirSync(fakeBin);
  const decoy=join(fakeBin,'python3');writeFileSync(decoy,'#!/bin/sh\nexit 91\n');chmodSync(decoy,0o755);
  const out=join(dir,'output');
  const result=spawnSync(process.execPath,[builder,out,'explicit-python'],{cwd:dir,encoding:'utf8',env:{...process.env,PATH:fakeBin,V1_POPULATION_PYTHON:python}});
  assert.equal(result.status,0,result.stderr);assert.ok(existsSync(join(out,'origins.sqlite')));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('builder refuses a missing configured Python before publishing a database',()=>{
 const dir=mkdtempSync(join(tmpdir(),'v1-no-python-'));try{
  const out=join(dir,'output');
  const result=spawnSync(process.execPath,[builder,out,'missing-python'],{cwd:root,encoding:'utf8',env:{...process.env,V1_POPULATION_PYTHON:join(dir,'missing-python')}});
  assert.notEqual(result.status,0);assert.equal(existsSync(join(out,'origins.sqlite')),false);assert.equal(existsSync(join(out,'origins.sqlite.gz')),false);assert.equal(existsSync(out),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('SQLite import retains named people, decision links and explicit fictional provenance',()=>{
 assert.ok(python,'Set V1_POPULATION_PYTHON to the selected Python interpreter');
 const dir=mkdtempSync(join(tmpdir(),'v1-db-'));try{
  const out=join(dir,'origins.sqlite');const result=run(generatePopulation({count:6,seed:'database'}),out);assert.equal(result.status,0,result.stderr);
  const query=spawnSync(python,['-c',`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1]);print(json.dumps([c.execute('select count(*) from identities').fetchone()[0],c.execute('select count(*) from decisions').fetchone()[0],c.execute('select count(*) from decision_links').fetchone()[0],c.execute("select count(*) from identities where standing='staged' and provenance='fabricated_origin'").fetchone()[0],c.execute('pragma integrity_check').fetchone()[0],c.execute('pragma foreign_key_check').fetchall()]))`,out],{encoding:'utf8'});
  assert.equal(query.status,0,query.stderr);assert.deepEqual(JSON.parse(query.stdout),[6,60,54,6,'ok',[]]);
  assert.ok(existsSync(`${out}.gz`));
  const before=readFileSync(out);assert.notEqual(run(generatePopulation({count:7,seed:'different'}),out).status,0);assert.deepEqual(readFileSync(out),before);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('bad cohort creates no partially imported database',()=>{
 assert.ok(python,'Set V1_POPULATION_PYTHON to the selected Python interpreter');
 const dir=mkdtempSync(join(tmpdir(),'v1-db-'));try{
  const out=join(dir,'invalid.sqlite');const c=generatePopulation({count:3,seed:'bad-db'});c.people[1].authority_grants=['admin'];
  assert.notEqual(run(c,out).status,0);assert.equal(existsSync(out),false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('compressed SQLite content is reproducible across output locations',()=>{
 assert.ok(python,'Set V1_POPULATION_PYTHON to the selected Python interpreter');
 const dir=mkdtempSync(join(tmpdir(),'v1-db-'));try{
  const c=generatePopulation({count:4,seed:'repeat-db'});const a=join(dir,'a.sqlite'),b=join(dir,'b.sqlite');
  assert.equal(run(c,a).status,0);assert.equal(run(c,b).status,0);assert.deepEqual(readFileSync(`${a}.gz`),readFileSync(`${b}.gz`));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
