import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,act} from '../src/v1-engine.mjs';
import {createSceneProjection} from '../src/v1-scene.mjs';
test('projection preserves stable identities and never mutates accepted history',()=>{const run=createRun({name:'Probe'}), before=JSON.stringify(run);const p=createSceneProjection(run);assert.deepEqual(p.places.map(x=>x.id),['camp','training','forge']);assert.equal(p.character.id,run.state.character.id);assert.equal(p.place,'camp');assert.equal(p.grantsAuthority,false);assert.equal(p.rulesVersion,'v1-local-rules/1');assert.equal(JSON.stringify(run),before);const next=act(run,{kind:'move',place:'training',key:'move',expectedRevision:0}).run;assert.equal(createSceneProjection(next).place,'training');});
test('projection refuses tampered snapshots, history and authority',()=>{const run=createRun({name:'Probe'});for(const mutate of [r=>r.state.practice++,r=>r.revision++,r=>r.grantsAuthority=true,r=>r.events[0].outcome.inventory.ore++]){const changed=structuredClone(run);mutate(changed);assert.throws(()=>createSceneProjection(changed));}assert.throws(()=>createSceneProjection(null));});
