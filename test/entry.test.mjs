import {test} from 'node:test';import assert from 'node:assert/strict';import {resolveEntry} from '../src/entry.mjs';
const entry={contract:'environment-entry/v0',id:'codex-cosmos',mode:'projection',destination:'/cosmic.html'};
test('projection entry gives navigation without authority',()=>{assert.deepEqual(resolveEntry(entry),{ok:true,destination:'/cosmic.html',grantsAuthority:false,mode:'projection'});});
test('unsafe or credential-bearing destinations never become doors',()=>{for(const destination of ['//evil.example','javascript:alert(1)','https://u:p@example.com','https://example.com?token=secret','/\\evil','/cosmic.html#token=secret'])assert.equal(resolveEntry({...entry,destination}).ok,false);});
test('a button cannot admit an agent or person to a sandbox',()=>{assert.equal(resolveEntry({...entry,mode:'sandbox'}).code,'admission_required');assert.equal(resolveEntry({...entry,mode:'sandbox'},{admission:{allowed:true}}).ok,false);});
test('unsupported contracts and unbounded destination fail closed',()=>{assert.equal(resolveEntry({...entry,contract:'unknown'}).ok,false);assert.equal(resolveEntry({...entry,destination:'x'.repeat(2049)}).ok,false);});
