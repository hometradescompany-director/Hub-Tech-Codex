import {test} from 'node:test';
import assert from 'node:assert/strict';
import {perspective,lookAt,multiply,project,cameraRay,pickRay,pickMeshes,objectMeshes,sphereMesh,torusMesh,layoutGraph} from '../src/space3d.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
test('perspective projects true depth and the centre of a three-dimensional camera',()=>{
 const matrix=multiply(perspective(Math.PI/2,4/3,1,10),lookAt([0,0,5],[0,0,0]));
 const p=project([0,0,0],matrix,800,600);near(p.x,400);near(p.y,300);near(p.depth,7/9);
 assert.equal(project([0,0,6],matrix,800,600),null);
 const nearPoint=project([1,0,3],matrix,800,600),farPoint=project([1,0,0],matrix,800,600);
 near(nearPoint.x,550);near(farPoint.x,460);
});
test('centre picking ray points into the world rather than screen coordinates',()=>{
 const r=cameraRay(400,300,800,600,{eye:[0,0,5],target:[0,0,0],fov:Math.PI/2});
 assert.deepEqual(r.origin,[0,0,5]);near(r.direction[0],0);near(r.direction[1],0);near(r.direction[2],-1);
});
test('overlapping targets choose the nearest positive intersection',()=>{
 const ray={origin:[0,0,5],direction:[0,0,-1]};
 assert.equal(pickRay(ray,[{id:'far',position:[0,0,0],radius:1},{id:'near',position:[0,0,3],radius:.5}]),'near');
 assert.equal(pickRay(ray,[{id:'behind',position:[0,0,8],radius:1}]),null);
 assert.equal(pickRay(ray,[{id:'miss',position:[5,0,0],radius:1}]),null);
});
test('vertical cameras and narrow aspect ratios remain finite',()=>{
 assert.ok([...lookAt([0,5,0],[0,0,0])].every(Number.isFinite));
 const ray=cameraRay(0,0,320,900,{eye:[0,5,0],target:[0,0,0],fov:Math.PI/3});assert.ok(ray.direction.every(Number.isFinite));
 assert.throws(()=>perspective(Math.PI/3,0,1,100));
});
for(const [name,make] of [['sphere',sphereMesh],['torus',torusMesh]])test(name+' contains bounded triangle meshes and unit normals',()=>{
 const mesh=make();assert.ok(mesh.positions.length>1000);assert.equal(mesh.positions.length,mesh.normals.length);
 assert.ok(mesh.indices.every(i=>i>=0&&i<mesh.positions.length/3));assert.equal(mesh.indices.length%3,0);
 for(let i=0;i<mesh.normals.length;i+=3)near(Math.hypot(...mesh.normals.slice(i,i+3)),1);
});
test('cyclic multi-parent layout retains one source identity and stable coordinates',()=>{
 const nodes=[{id:'root'},{id:'a'},{id:'b'},{id:'c'}],edges=[{from:'root',to:'a'},{from:'root',to:'b'},{from:'a',to:'c'},{from:'b',to:'c'},{from:'c',to:'root'}];
 const before=JSON.stringify({nodes,edges}),a=layoutGraph(nodes,edges,'root'),b=layoutGraph([...nodes].reverse(),[...edges].reverse(),'root');
 assert.equal(a.size,4);assert.deepEqual([...a].sort(),[...b].sort());assert.equal(JSON.stringify({nodes,edges}),before);
 assert.deepEqual(a.get('root'),[0,3.2,0]);assert.ok([...a.values()].every(p=>p.length===3&&p.every(Number.isFinite)));
});
const meshes={sphere:sphereMesh(),torus:torusMesh()};
test('mesh picking passes through an empty foreground sphere envelope',()=>{
 const objects=[{id:'near',kind:'planet',position:[1,0,4],radius:1},{id:'far',kind:'planet',position:[0,0,0],radius:1}];
 const ray={origin:[0,0,10],direction:[0,0,-1]};
 assert.equal(pickMeshes(ray,objects.flatMap(o=>objectMeshes(o,0)),meshes),'far');
 assert.equal(pickMeshes(ray,objectMeshes(objects[0],0),meshes),null);
});
test('mesh picking passes through a ring hole to the visible body behind it',()=>{
 const near={id:'near',kind:'galaxy',position:[0,3,0],radius:1},far={id:'far',kind:'planet',position:[.82,0,0],radius:.6};
 const ray={origin:[.82,5,0],direction:[0,-1,0]};
 assert.equal(pickMeshes(ray,[...objectMeshes(near,0),...objectMeshes(far,0)],meshes),'far');
 assert.equal(pickMeshes(ray,objectMeshes(near,0),meshes),null);
});
test('mesh picking respects translated, scaled and rotated geometry without changing source',()=>{
 const object={id:'drawn',kind:'hub',position:[3,2,-4],radius:2},before=JSON.stringify(object);
 assert.equal(pickMeshes({origin:[3,2,10],direction:[0,0,-1]},objectMeshes(object,.8),meshes),'drawn');
 assert.equal(pickMeshes({origin:[3,2,-20],direction:[0,0,-1]},objectMeshes(object,.8),meshes),null);
 assert.equal(JSON.stringify(object),before);
});
