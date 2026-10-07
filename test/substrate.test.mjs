import {test} from 'node:test';
import assert from 'node:assert/strict';
import {substrateFrame} from '../src/substrate.mjs';

test('substrate stays bounded on phone and desktop at every sampled phase',()=>{
  for(const [width,height] of [[390,500],[1440,660]])for(const seconds of [0,30,900,10000]){
    const points=substrateFrame({width,height,seconds,bodyCount:5000});
    assert.equal(points.length,400);
    for(const p of points){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>=0&&p.x<=width&&p.y>=0&&p.y<=height);}
  }
});
test('visible architecture expands the field without adding event identities',()=>{
 const small=substrateFrame({width:1000,height:800,seconds:30,bodyCount:1});
 const large=substrateFrame({width:1000,height:800,seconds:30,bodyCount:20});
 const radius=points=>Math.max(...points.map(p=>Math.hypot(p.x-500,p.y-400)));
 assert.ok(radius(large)>radius(small));assert.equal(large.length,small.length);
 assert.ok(large.every(p=>!('eventId' in p)));
});
test('elapsed phase is deterministic and refuses invalid geometry',()=>{
 const options={width:390,height:500,seconds:90,bodyCount:20};
 assert.deepEqual(substrateFrame(options),substrateFrame(options));
 for(const value of [NaN,Infinity,-1])assert.throws(()=>substrateFrame({...options,width:value}));
});
