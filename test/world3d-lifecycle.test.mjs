import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mountWorld3D} from '../src/world3d.mjs';
test('failed shader initialization releases its allocated GPU resources on disposal',()=>{
 const previous={document:globalThis.document,ResizeObserver:globalThis.ResizeObserver};
 const deleted=[];
 const gl={VERTEX_SHADER:1,COMPILE_STATUS:2,createProgram:()=>({kind:'program'}),createShader:()=>({kind:'shader'}),shaderSource(){},compileShader(){},getShaderParameter:()=>false,deleteProgram:r=>deleted.push(r.kind),deleteShader:r=>deleted.push(r.kind)};
 const element=()=>({className:'',dataset:{},style:{},hidden:false,setAttribute(){},append(){},remove(){},addEventListener(){},removeEventListener(){},getBoundingClientRect:()=>({width:800,height:600}),getContext:()=>gl});
 const host=element(),messages=[];
 try{globalThis.document={...element(),createElement:element};globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  const view=mountWorld3D(host,{onError:message=>messages.push(message)});view.dispose();view.dispose();
  assert.deepEqual(deleted.sort(),['program','shader']);assert.equal(messages.length,1);assert.match(messages[0],/could not initialise/);
 }finally{for(const [key,value] of Object.entries(previous))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});
