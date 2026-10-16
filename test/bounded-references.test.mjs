import test from 'node:test';import assert from 'node:assert/strict';import {validateBoundedReferences as check} from '../src/bounded-references.mjs';
test('accepts known graph edges',()=>assert.equal(check([{from:'a',to:'b'}],['a','b']).valid,true));
test('rejects unknown endpoints',()=>assert.equal(check([{from:'a',to:'c'}],['a','b']).reason,'unknown_endpoint'));
test('rejects duplicates and excessive edges',()=>{assert.equal(check([],['a','a']).valid,false);assert.equal(check([{from:'a',to:'a'}],['a'],0).valid,false)});
