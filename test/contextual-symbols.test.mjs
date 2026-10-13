import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateSymbols, resolveSymbol, symbolsForSubject} from '../src/contextual-symbols.mjs';

const record=(over={})=>({id:'symbol:feedback',revision:1,motif:'loop',context:'development:feedback',meaning:'An observation can inform another bounded attempt.',invariants:['Every attempt has its own evidence.'],failureExamples:['A loop silently grants permission for another tool call.'],source:{reference:'user:visual-reference-01',attribution:'unknown',assetRights:'unknown'},...over});
const packet=()=>({version:'contextual-symbols/v0',standing:'candidate',grantsAuthority:false,records:[record()],bindings:[{subject:'s:development',recordId:'symbol:feedback',revision:1,context:'development:feedback'}]});
const subjects=['s:development','s:continuity'];

test('one motif resolves differently only with explicit context and revision',()=>{
  const p=packet();p.records.push(record({id:'symbol:replay',context:'continuity:replay',meaning:'Replay follows recorded history; it does not issue another action.'}));
  assert.equal(resolveSymbol(p,{motif:'loop',context:'continuity:replay',revision:1}).record.id,'symbol:replay');
  for(const query of [{motif:'loop'}, {motif:'loop',context:'continuity:replay'}, {motif:'loop',revision:1}]) {
    assert.equal(resolveSymbol(p,query).status,'unresolved');
    assert.equal(resolveSymbol(p,query).grantsAuthority,false);
  }
});

test('ambiguous contextual motifs refuse resolution rather than taking the first record',()=>{
  const p=packet();p.records.push(record({id:'symbol:other'}));
  const resolved=resolveSymbol(p,{motif:'loop',context:'development:feedback',revision:1});
  assert.equal(resolved.status,'ambiguous');assert.equal(resolved.record,undefined);
});

test('a later revision preserves historical binding and source input',()=>{
  const p=packet();p.records.push(record({revision:2,meaning:'A revised interpretation with the same explicit identity and context.'}));
  const validated=validateSymbols(p,{subjectIds:subjects});
  assert.equal(symbolsForSubject(validated,'s:development')[0].meaning,p.records[0].meaning);
  assert.equal(resolveSymbol(validated,{motif:'loop',context:'development:feedback',revision:2}).record.revision,2);
  assert.throws(()=>{validated.records[0].meaning='Silently overwritten';});
  assert.equal(p.records[0].meaning,'An observation can inform another bounded attempt.');
});

test('bindings require an exact existing subject, record, revision and context',()=>{
  for(const over of [{subject:'missing'}, {recordId:'missing'}, {revision:2}, {context:'another:context'}]) {
    const p=packet();Object.assign(p.bindings[0],over);assert.throws(()=>validateSymbols(p,{subjectIds:subjects}));
  }
  assert.deepEqual(symbolsForSubject(packet(),'s:continuity'),[]);
});

test('symbols need meaning, invariants, failure examples and honest source standing',()=>{
  for(const over of [{meaning:''}, {invariants:[]}, {failureExamples:[]}, {source:null}, {source:{reference:'user:ref',attribution:'verified',assetRights:'unknown'}}]) {
    const p=packet();Object.assign(p.records[0],over);assert.throws(()=>validateSymbols(p));
  }
});

test('authority claims and executable extra fields are rejected as data',()=>{
  assert.throws(()=>validateSymbols({...packet(),grantsAuthority:true}));
  const p=packet();p.records[0].onSelect='fetch(privateService)';assert.throws(()=>validateSymbols(p));
  assert.equal(resolveSymbol(packet(),{motif:'loop',context:'development:feedback',revision:1}).grantsAuthority,false);
});

test('duplicate identities, binding duplication and identity-context rebinding are refused',()=>{
  const duplicate=packet();duplicate.records.push(record());assert.throws(()=>validateSymbols(duplicate));
  const rebound=packet();rebound.records.push(record({revision:2,context:'another:context'}));assert.throws(()=>validateSymbols(rebound));
  const bindings=packet();bindings.bindings.push({...bindings.bindings[0]});assert.throws(()=>validateSymbols(bindings));
});

test('catalogs are bounded and imported text remains literal data',()=>{
  const p=packet();p.records[0].meaning='<script>not executable</script>';
  assert.equal(validateSymbols(p).records[0].meaning,p.records[0].meaning);
  assert.throws(()=>validateSymbols({...packet(),records:Array.from({length:257},(_,i)=>record({id:`symbol:r${i}`}))}));
  const long=packet();long.records[0].meaning='x'.repeat(2049);assert.throws(()=>validateSymbols(long));
});

test('shipped candidates bind only existing fixture IDs and retain no authority',async()=>{
  const p=JSON.parse(await readFile(new URL('../data/contextual-symbols.json',import.meta.url),'utf8'));
  const field=JSON.parse(await readFile(new URL('../data/cosmic-fixture.json',import.meta.url),'utf8'));
  const catalog=validateSymbols(p,{subjectIds:field.bodies.map(b=>b.id)});
  assert.ok(catalog.records.length>=5);
  assert.ok(symbolsForSubject(catalog,'s:continuity').length>0);
  assert.equal(catalog.grantsAuthority,false);
});
