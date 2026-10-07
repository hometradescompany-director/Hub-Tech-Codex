import {test} from 'node:test';
import assert from 'node:assert/strict';

import {fitSceneY,compactScenePoints} from '../src/cosmic-layout.mjs';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`expected ${expected}, got ${actual}`);

test('landscape Universe clears the measured HUD with its entire body',()=>{
 near(fitSceneY(8,{height:250,hudBottom:52,halfButtonHeight:36}),43.264);
});
test('wrapped navigation reserves its actual increased height',()=>{
 near(fitSceneY(8,{height:250,hudBottom:110,halfButtonHeight:36}),64.608);
});
test('top and bottom scene coordinates leave complete buttons visible',()=>{
 near(fitSceneY(0,{height:250,hudBottom:52,halfButtonHeight:36}),40);
 near(fitSceneY(100,{height:250,hudBottom:52,halfButtonHeight:36}),80.8);
});
test('body, atom and bond coordinates share an order-preserving projection',()=>{
 const dimensions={height:250,hudBottom:52,halfButtonHeight:36};
 near(fitSceneY(2,dimensions),40.816);
 near(fitSceneY(26,dimensions),50.608);
 near(fitSceneY(90,dimensions),76.72);
});
test('hidden scenes keep finite source coordinates until entry measures them',()=>{
 near(fitSceneY(8,{height:0,hudBottom:0,halfButtonHeight:0}),8);
});

test('landscape places the focus and three children in separate measured columns',()=>{
 const points=compactScenePoints(['universe','atlas','domain','swarm'],{width:844,buttonWidth:120});
 assert.deepEqual([...points],[['universe',[12.5,50]],['atlas',[37.5,50]],['domain',[62.5,50]],['swarm',[87.5,50]]]);
});
test('compact columns wrap without changing body identity or navigation order',()=>{
 const points=compactScenePoints(['universe','atlas','domain','swarm'],{width:390,buttonWidth:120});
 assert.deepEqual([...points],[['universe',[25,25]],['atlas',[75,25]],['domain',[25,75]],['swarm',[75,75]]]);
});
test('an empty compact projection has no positions',()=>{
 assert.deepEqual([...compactScenePoints([],{width:844,buttonWidth:120})],[]);
});
