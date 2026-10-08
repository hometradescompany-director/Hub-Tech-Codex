// View geometry only. No source object is changed by camera or layout.
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const scale=(a,s)=>a.map(v=>v*s);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const normal=a=>scale(a,1/(Math.hypot(...a)||1));
const basis=(eye,target)=>{const z=normal(sub(eye,target)),up=Math.abs(z[1])>.999?[0,0,1]:[0,1,0],x=normal(cross(up,z));return {x,y:cross(z,x),z};};
export function perspective(fov,aspect,near,far){
 if(!(fov>0&&fov<Math.PI&&aspect>0&&near>0&&far>near)||![fov,aspect,near,far].every(Number.isFinite))throw new Error('Invalid perspective');
 const f=1/Math.tan(fov/2),d=near-far;
 return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/d,-1,0,0,2*far*near/d,0]);
}
export function lookAt(eye,target){const {x,y,z}=basis(eye,target);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
export function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
export function modelMatrix(position,size=1,angle=0,tilt=0){const c=Math.cos(angle),s=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);return new Float32Array([c*size,0,-s*size,0,s*st*size,ct*size,c*st*size,0,s*ct*size,-st*size,c*ct*size,0,...position,1]);}
export function project(p,m,width,height){const v=[...p,1],o=[0,0,0,0];for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[r]+=m[k*4+r]*v[k];if(o[3]<=0)return null;return {x:(o[0]/o[3]+1)*width/2,y:(1-o[1]/o[3])*height/2,depth:o[2]/o[3]};}
export function cameraRay(x,y,width,height,{eye,target,fov}){const b=basis(eye,target),s=Math.tan(fov/2);return {origin:[...eye],direction:normal(add(scale(b.z,-1),add(scale(b.x,(2*x/width-1)*width/height*s),scale(b.y,(1-2*y/height)*s))))};}
export function pickRay(ray,objects){let best=Infinity,id=null;for(const o of objects){const v=sub(ray.origin,o.position),b=dot(v,ray.direction),d=b*b-dot(v,v)+o.radius*o.radius;if(d<0)continue;const root=Math.sqrt(d),near=-b-root,far=-b+root,t=near>=0?near:far;if(t>=0&&t<best){best=t;id=o.id;}}return id;}
// The renderer and picker use the same opaque mesh instances. Glow is decoration.
export function objectMeshes(o,phase=0){
 const instances=[{id:o.id,mesh:'sphere',position:o.position,size:o.radius*(o.kind==='event'?.9:.64),angle:phase,tilt:.1}];
 if(['universe','hub','galaxy'].includes(o.kind)){
  const rings=o.kind==='universe'?3:o.kind==='galaxy'?2:1;
  for(let i=0;i<rings;i++)instances.push({id:o.id,mesh:'torus',position:o.position,size:o.radius*(1+i*.15),angle:phase*(i%2?1:-1)+i*.7,tilt:i*.55+(o.kind==='hub'?.6:0)});
 }else if(o.kind==='system')instances.push({id:o.id,mesh:'torus',position:o.position,size:o.radius*1.1,angle:phase,tilt:.4});
 return instances;
}
export function pickMeshes(ray,instances,meshes){
 let nearest=Infinity,id=null;
 for(const instance of instances){
  const mesh=meshes[instance.mesh],bound=instance.size*(instance.mesh==='torus'?1.065:1);
  if(!mesh||pickRay(ray,[{id:'candidate',position:instance.position,radius:bound}])===null)continue;
  const m=modelMatrix(instance.position,instance.size,instance.angle,instance.tilt),v=sub(ray.origin,instance.position),squared=instance.size*instance.size;
  // Inverse uniform scale/rotation. Do not normalize: t remains world distance.
  const local=a=>[0,1,2].map(c=>dot(a,[m[c*4],m[c*4+1],m[c*4+2]])/squared);
  const origin=local(v),direction=local(ray.direction),point=index=>mesh.positions.slice(index*3,index*3+3);
  for(let i=0;i<mesh.indices.length;i+=3){
   const a=point(mesh.indices[i]),b=point(mesh.indices[i+1]),c=point(mesh.indices[i+2]),e1=sub(b,a),e2=sub(c,a),p=cross(direction,e2),det=dot(e1,p);
   if(det<=1e-8)continue; // Match the renderer's back-face culling.
   const v=sub(origin,a),u=dot(v,p)/det;if(u<0||u>1)continue;
   const q=cross(v,e1),w=dot(direction,q)/det;if(w<0||u+w>1)continue;
   const t=dot(e2,q)/det;if(t>=0&&t<nearest){nearest=t;id=instance.id;}
  }
 }
 return id;
}
export function sphereMesh(rows=32,columns=48){const positions=[],normals=[],indices=[];for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){const a=i/rows*Math.PI,b=j/columns*Math.PI*2,n=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];positions.push(...n);normals.push(...n);}for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){const k=i*(columns+1)+j;indices.push(k,k+1,k+columns+1,k+1,k+columns+2,k+columns+1);}return {positions,normals,indices};}
export function torusMesh(rows=80,columns=14,tube=.065){const positions=[],normals=[],indices=[];for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){const a=i/rows*Math.PI*2,b=j/columns*Math.PI*2,n=[Math.cos(a)*Math.cos(b),Math.sin(b),Math.sin(a)*Math.cos(b)];positions.push((1+tube*Math.cos(b))*Math.cos(a),tube*Math.sin(b),(1+tube*Math.cos(b))*Math.sin(a));normals.push(...n);}for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){const k=i*(columns+1)+j;indices.push(k,k+1,k+columns+1,k+1,k+columns+2,k+columns+1);}return {positions,normals,indices};}
export function layoutGraph(nodes,edges,focus){
 const ids=new Set(nodes.map(n=>n.id));if(!ids.size)return new Map();if(!ids.has(focus))focus=[...ids].sort()[0];
 const adj=new Map([...ids].map(id=>[id,new Set()]));for(const e of edges)if(ids.has(e.from)&&ids.has(e.to)){adj.get(e.from).add(e.to);adj.get(e.to).add(e.from);}
 const depth=new Map([[focus,0]]),queue=[focus];for(let i=0;i<queue.length;i++)for(const next of [...adj.get(queue[i])].sort())if(!depth.has(next)){depth.set(next,depth.get(queue[i])+1);queue.push(next);}
 for(const id of [...ids].sort())if(!depth.has(id))depth.set(id,1);
 const groups=new Map();for(const id of [...ids].sort()){const d=depth.get(id);if(!groups.has(d))groups.set(d,[]);groups.get(d).push(id);}
 const out=new Map([[focus,[0,3.2,0]]]);for(const [d,members] of groups){if(d===0)continue;members.forEach((id,i)=>{const a=i/members.length*Math.PI*2-.8+d*.33,r=7+d*5;out.set(id,[Math.cos(a)*r,3.2-d*3.8+(i%2)*.9,Math.sin(a)*r]);});}return out;
}
