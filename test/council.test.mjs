import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCouncil,validAvailability,reviewHandoff} from '../src/council.mjs';

const fixture=validateCouncil(JSON.parse(readFileSync(new URL('../data/council.json',import.meta.url))));
const task=fixture.tasks[0],provider=fixture.providers[0],now=Date.parse('2026-10-13T08:00:00Z');
const available={...provider,state:'available-verified'};
const receipt={providerId:provider.id,reference:'synthetic:availability-1',observedAt:'2026-10-13T07:59:00Z',expiresAt:'2026-10-13T08:05:00Z'};
const decision={contract:'atlas-council-decision/v0',providerId:provider.id,taskId:task.id,sourceReference:'https://github.com/hometradescompany-director/atlas/issues/209',targetRepository:task.targetRepository,permissionScope:task.permissionScope,issuedAt:'2026-10-13T07:59:00Z',expiresAt:'2026-10-13T08:05:00Z',eventReference:'synthetic:event-1',replayKey:'synthetic:replay-1',allowed:true,denialReason:'',signature:'synthetic-signature'};
const context=()=>({now,verifySignature:d=>d===decision,seenKeys:new Map()});

test('fixture is a proposal without a handoff receipt or live provider',()=>{
 assert.equal(task.handoffReceipt,null);
 assert.equal(task.source.repository,'hometradescompany-director/atlas');
 assert.equal(fixture.providers[1].state,'unknown');
 assert.equal(fixture.providers.every(p=>p.availabilityReceipt===null),true);
 assert.throws(()=>validateCouncil({...fixture,providers:[{...provider,state:'available-verified'}]}),/unverified_provider/);
 assert.throws(()=>validateCouncil({...fixture,providers:[{...available,availabilityReceipt:receipt}]}),/unverified_provider/);
});
test('unverified, unknown and stale provider receipts fail closed',()=>{
 for(const p of [provider,fixture.providers[1],{...provider,state:'unavailable'}])assert.equal(reviewHandoff(task,p,receipt,decision,context()).reason,'provider_unverified');
 assert.equal(validAvailability(available,{...receipt,expiresAt:'2026-10-13T08:00:00Z'},now),false);
 assert.equal(reviewHandoff(task,available,{...receipt,expiresAt:'2026-10-13T08:00:00Z'},decision,context()).reason,'provider_unverified');
});
test('signed decision mock requires verifier, scoped identity and freshness',()=>{
 assert.equal(reviewHandoff(task,available,receipt,decision,{now,seenKeys:new Map()}).reason,'unverified_signature');
 assert.equal(reviewHandoff(task,available,receipt,decision,{...context(),verifySignature:()=>false}).reason,'unverified_signature');
 assert.equal(reviewHandoff(task,available,receipt,decision,{...context(),verifySignature:()=>{throw Error('offline');}}).reason,'unverified_signature');
 assert.equal(reviewHandoff(task,available,receipt,{...decision,expiresAt:'2026-10-13T08:00:00Z'},context()).reason,'stale_decision');
 assert.equal(reviewHandoff(task,available,receipt,{...decision,targetRepository:'hometradescompany-director/Hub-Tech-Codex'},context()).reason,'decision_mismatch');
 assert.equal(reviewHandoff({...task,targetRepository:'hometradescompany-director/Hub-Tech-Codex'},available,receipt,decision,context()).reason,'cross_repo_or_invalid_task');
 assert.equal(reviewHandoff({...task,id:undefined},available,receipt,decision,context()).reason,'cross_repo_or_invalid_task');
 assert.equal(reviewHandoff({...task,source:{...task.source,repository:'other/atlas'}},available,receipt,decision,context()).reason,'cross_repo_or_invalid_task');
});
test('denial, duplicate dispatch and replay key conflict remain refused',()=>{
 assert.equal(reviewHandoff(task,available,receipt,{...decision,allowed:false,denialReason:'owner_refused'},{...context(),verifySignature:()=>true}).reason,'owner_refused');
 const state=context();
 const first=reviewHandoff(task,available,receipt,decision,state);
 assert.deepEqual(first,{ok:true,reason:'review_only',grantsAuthority:false,sourceReference:decision.sourceReference});
 assert.equal(reviewHandoff(task,available,receipt,decision,state).reason,'duplicate_dispatch');
 const changed={...decision,eventReference:'synthetic:event-2'};
 assert.equal(reviewHandoff(task,available,receipt,changed,{...state,verifySignature:()=>true}).reason,'replay_key_conflict');
 assert.equal(state.seenKeys.size,1);
});
