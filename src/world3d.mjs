import {add,sub,scale,normal,cross,perspective,lookAt,multiply,modelMatrix,project,cameraRay,pickMeshes,objectMeshes,sphereMesh,torusMesh} from './space3d.mjs';

const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uVP;uniform mat4 uModel;varying vec3 vNormal;varying vec3 vWorld;varying vec3 vLocal;void main(){vec4 p=uModel*vec4(aPosition,1.0);vWorld=p.xyz;vLocal=aPosition;vNormal=normalize(mat3(uModel)*aNormal);gl_Position=uVP*p;}`;
const fragment=`precision mediump float;varying vec3 vNormal;varying vec3 vWorld;varying vec3 vLocal;uniform vec3 uColor;uniform vec3 uEye;uniform float uGlow;uniform float uSelected;
void main(){vec3 n=normalize(vNormal),v=normalize(uEye-vWorld),l=normalize(vec3(0.6,0.8,0.9));float rim=pow(1.0-abs(dot(n,v)),2.7);if(uGlow>0.5){gl_FragColor=vec4(uColor*rim*.7,rim*.6);return;}float diffuse=max(dot(n,l),0.0);float spec=pow(max(dot(n,normalize(l+v)),0.0),80.0);float flow=sin(vLocal.y*18.0+sin(vLocal.x*9.0+vLocal.z*13.0))*0.06;vec3 base=uColor*(.15+diffuse*.68+flow);base+=uColor*rim*(.55+uSelected*.65)+vec3(.8,.91,1.0)*spec*.8;gl_FragColor=vec4(base,1.0);}`;
const simpleVertex=`attribute vec3 aPosition;uniform mat4 uVP;uniform float uSize;void main(){vec4 p=uVP*vec4(aPosition,1.0);gl_Position=p;gl_PointSize=clamp(uSize/max(p.w,1.0),1.0,4.0);}`;
const simpleFragment=`precision mediump float;uniform vec4 uTint;uniform float uPoint;void main(){if(uPoint>.5){vec2 p=gl_PointCoord-.5;float d=length(p);if(d>.5)discard;gl_FragColor=vec4(uTint.rgb,uTint.a*(1.0-d*1.6));}else gl_FragColor=uTint;}`;
const palette={universe:[.95,.72,.38],hub:[.62,.87,.80],galaxy:[.48,.80,.88],system:[.55,.65,.94],planet:[.76,.62,.95],repository:[.60,.75,.90],event:[.83,.97,.94]};
const identity=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);

export function mountWorld3D(host,{onSelect=()=>{},onError=()=>{},camera:initialCamera}={}){
 const canvas=document.createElement('canvas');canvas.className='world3d-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Three-dimensional source map. Drag to orbit, scroll or pinch to zoom. Use arrow keys on a selected label to orbit.');
 const labels=document.createElement('div');labels.className='world3d-labels';
 const failure=document.createElement('p');failure.className='world3d-failure';failure.setAttribute('role','alert');failure.hidden=true;
 host.append(canvas,labels,failure);
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:true});
 let disposed=false,lost=false,initialised=false,rejected=false,active=false,moving=false,raf=0,phase=0,last=0,objects=[],edges=[],selected=null,focus=null,width=1,height=1,vp=identity,eye=[0,10,30],frame=0;
 const initialBounds=host.getBoundingClientRect();width=Math.max(1,initialBounds.width);height=Math.max(1,initialBounds.height);
 const cameraHistory=new Map();
 let camera={target:[0,0,0],distance:45,theta:.65,phi:.56,...initialCamera};
 const listeners=[],resources=[],labelButtons=new Map(),pointers=new Map();let gesture=null;
 const listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));};
 const error=message=>{failure.hidden=false;failure.textContent=message;canvas.dataset.renderer='unavailable';onError(message);};
 let solid,basic,sphere,torus,stars,lineBuffer;const meshData={sphere:sphereMesh(),torus:torusMesh()};
 function shader(type,source){const s=gl.createShader(type);resources.push(['shader',s]);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('3D shader compilation failed');return s;}
 function program(v,f){const p=gl.createProgram();resources.push(['program',p]);gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('3D shader linking failed');return {p,loc:new Map()};}
 function loc(p,name){if(!p.loc.has(name))p.loc.set(name,name.startsWith('a')?gl.getAttribLocation(p.p,name):gl.getUniformLocation(p.p,name));return p.loc.get(name);}
 function buffer(data,target=gl.ARRAY_BUFFER){const b=gl.createBuffer();resources.push(['buffer',b]);gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b;}
 function mesh(m){return {position:buffer(new Float32Array(m.positions)),normal:buffer(new Float32Array(m.normals)),index:buffer(new Uint16Array(m.indices),gl.ELEMENT_ARRAY_BUFFER),count:m.indices.length};}
 function bindAttribute(p,name,b){const at=loc(p,name);if(at<0)return;gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,3,gl.FLOAT,false,0,0);}
 function drawMesh(m,position,size,angle,tilt,color,glow=0,chosen=0){gl.useProgram(solid.p);bindAttribute(solid,'aPosition',m.position);bindAttribute(solid,'aNormal',m.normal);gl.uniformMatrix4fv(loc(solid,'uVP'),false,vp);gl.uniformMatrix4fv(loc(solid,'uModel'),false,modelMatrix(position,size,angle,tilt));gl.uniform3fv(loc(solid,'uColor'),color);gl.uniform3fv(loc(solid,'uEye'),eye);gl.uniform1f(loc(solid,'uGlow'),glow);gl.uniform1f(loc(solid,'uSelected'),chosen);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.index);gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0);}
 function drawSimple(b,count,mode,tint,size=0){gl.useProgram(basic.p);bindAttribute(basic,'aPosition',b);const normalAt=loc(solid,'aNormal');if(normalAt>=0&&normalAt!==loc(basic,'aPosition'))gl.disableVertexAttribArray(normalAt);gl.uniformMatrix4fv(loc(basic,'uVP'),false,vp);gl.uniform4fv(loc(basic,'uTint'),tint);gl.uniform1f(loc(basic,'uPoint'),mode===gl.POINTS?1:0);gl.uniform1f(loc(basic,'uSize'),size);gl.drawArrays(mode,0,count);}
 if(gl)try{
  solid=program(vertex,fragment);basic=program(simpleVertex,simpleFragment);sphere=mesh(meshData.sphere);torus=mesh(meshData.torus);lineBuffer=buffer(new Float32Array());
  let seed=9731;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const points=[];for(let i=0;i<900;i++){const a=rand()*Math.PI*2,z=rand()*2-1,r=80+rand()*130,s=Math.sqrt(1-z*z);points.push(Math.cos(a)*s*r,z*r,Math.sin(a)*s*r);}stars=buffer(new Float32Array(points));
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);initialised=true;canvas.dataset.renderer='webgl';
 }catch{error('3D could not initialise. Source inspection and the list views remain available.');}
 else error('3D is unavailable on this device. Source inspection and the list views remain available.');

 const cameraState=()=>({...camera,target:[...camera.target],eye:[...eye],focus});
 function setEye(){eye=add(camera.target,[Math.sin(camera.theta)*Math.cos(camera.phi)*camera.distance,Math.sin(camera.phi)*camera.distance,Math.cos(camera.theta)*Math.cos(camera.phi)*camera.distance]);}
 function fit(redraw=true){if(!objects.length)return;const body=objects.filter(o=>o.kind!=='event'),items=body.length?body:objects;const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const o of items)for(let i=0;i<3;i++){min[i]=Math.min(min[i],o.position[i]-o.radius*1.5);max[i]=Math.max(max[i],o.position[i]+o.radius*1.5);}camera.target=min.map((v,i)=>(v+max[i])/2);const radius=Math.max(5,...items.map(o=>Math.hypot(...sub(o.position,camera.target))+o.radius*1.5));const aspect=width/height,vertical=.72,horizontal=2*Math.atan(Math.tan(vertical/2)*aspect);camera.distance=Math.max(12,radius/Math.sin(Math.min(vertical,horizontal)/2)*1.08);if(redraw)invalidate();}
 function setScene(scene){
  if(disposed)return;
  if(scene.objects.length>700||scene.edges.length>6000){error('This 3D view exceeds its rendering budget. Inspect the source through the list views.');rejected=true;setActive(false);return;}
  const seen=new Set();for(const o of scene.objects)if(seen.has(o.id)||!Array.isArray(o.position)||o.position.length!==3||!o.position.every(Number.isFinite)||!Number.isFinite(o.radius)||!(o.radius>0)){error('3D view coordinates were rejected. Source data was not changed.');rejected=true;setActive(false);return;}else seen.add(o.id);
  const changed=focus!==scene.focus||!objects.length;if(focus!==null&&focus!==scene.focus){cameraHistory.set(focus,cameraState());if(cameraHistory.size>100)cameraHistory.delete(cameraHistory.keys().next().value);}
  rejected=false;if(initialised&&!lost){failure.hidden=true;canvas.dataset.renderer='webgl';}
  objects=scene.objects.map(o=>({...o,position:[...o.position]}));edges=scene.edges;selected=scene.selected;focus=scene.focus;
  labels.replaceChildren();labelButtons.clear();
  for(const o of objects){if(o.kind==='event'&&o.id!==selected)continue;const b=document.createElement('button');b.type='button';b.className='world3d-label';b.dataset.id=o.id;b.dataset.body=o.id;b.textContent=o.label;b.setAttribute('aria-label','Inspect '+o.label);b.setAttribute('aria-pressed',String(selected===o.id));b.addEventListener('click',()=>onSelect(o.id));labels.append(b);labelButtons.set(o.id,b);}
  if(changed){const saved=cameraHistory.get(focus)||(initialCamera?.focus===focus?initialCamera:null);if(saved)camera={...saved,target:[...saved.target]};else fit();}invalidate();
 }
 function updateLabels(){const hud=host.closest('.field')?.querySelector('.view-controls'),hudBottom=hud?hud.getBoundingClientRect().bottom-host.getBoundingClientRect().top+12:10;const accepted=[];
  for(const o of [...objects].sort((a,b)=>(a.id===selected?-1:b.id===selected?1:a.id.localeCompare(b.id)))){const b=labelButtons.get(o.id);if(!b)continue;const p=project(add(o.position,[0,-o.radius*1.45,0]),vp,width,height),w=b.offsetWidth||100,h=b.offsetHeight||28;const visible=p&&p.depth>=-1&&p.depth<=1&&p.x>w/2+8&&p.x<width-w/2-8&&p.y>hudBottom&&p.y<height-h-20;const rect=p?{left:p.x-w/2,right:p.x+w/2,top:p.y,bottom:p.y+h}:null;const overlaps=visible&&accepted.some(a=>rect.left<a.right+6&&rect.right>a.left-6&&rect.top<a.bottom+6&&rect.bottom>a.top-6);b.hidden=!visible||overlaps;if(!b.hidden){b.style.left=p.x+'px';b.style.top=p.y+'px';accepted.push(rect);}}
 }
 function render(now){raf=0;if(disposed||!active||!gl||lost||!solid)return;const r=host.getBoundingClientRect();if(r.width<=0||r.height<=0)return;const oldAspect=width/height;width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);if(Math.abs(oldAspect-width/height)>.15)fit(false);}
  setEye();vp=multiply(perspective(.72,width/height,.1,600),lookAt(eye,camera.target));gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.012,.020,.044,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  if(moving&&!document.hidden){phase+=Math.min(.035,(now-last)/1000||0)*.12;}last=now;
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);drawSimple(stars,900,gl.POINTS,[.55,.69,.85,.72],120*dpr);
  gl.depthMask(true);gl.disable(gl.BLEND);
  for(const o of objects){const color=palette[o.kind]||palette.repository,chosen=o.id===selected?1:0;for(const instance of objectMeshes(o,phase))drawMesh(instance.mesh==='sphere'?sphere:torus,instance.position,instance.size,instance.angle,instance.tilt,color,0,chosen);}
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
  const byId=new Map(objects.map(o=>[o.id,o]));const lines=[];for(const e of edges){const a=byId.get(e.from),b=byId.get(e.to);if(!a||!b)continue;for(let i=0;i<24;i++)for(const j of [i,i+1]){const t=j/24;lines.push(...a.position.map((v,k)=>v*(1-t)+b.position[k]*t+(k===1?Math.sin(t*Math.PI)*1.25:0)));}}
  gl.bindBuffer(gl.ARRAY_BUFFER,lineBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(lines),gl.DYNAMIC_DRAW);drawSimple(lineBuffer,lines.length/3,gl.LINES,[.36,.61,.69,.25]);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);gl.cullFace(gl.FRONT);for(const o of objects)if(o.kind!=='event')drawMesh(sphere,o.position,o.radius*.91,0,0,palette[o.kind]||palette.repository,1,o.id===selected?1:0);gl.cullFace(gl.BACK);gl.depthMask(true);gl.disable(gl.BLEND);
  updateLabels();canvas.dataset.frame=String(++frame);if(moving&&!document.hidden)raf=requestAnimationFrame(render);
 }
 function invalidate(){if(active&&!disposed&&!raf&&!lost&&gl)raf=requestAnimationFrame(render);}
 function setActive(value){active=Boolean(value)&&initialised&&!disposed&&!lost&&!rejected;if(!active&&raf){cancelAnimationFrame(raf);raf=0;}else invalidate();}
 function setMotion(value){moving=Boolean(value)&&!matchMedia('(prefers-reduced-motion: reduce)').matches;invalidate();}
 function orbit(dx,dy){camera.theta-=dx*.006;camera.phi=Math.max(-1.25,Math.min(1.25,camera.phi+dy*.006));invalidate();}
 function zoom(amount){camera.distance=Math.max(3,Math.min(250,camera.distance*Math.exp(amount)));invalidate();}
 function pan(dx,dy){setEye();const forward=normal(sub(camera.target,eye)),right=normal(cross(forward,[0,1,0])),up=cross(right,forward),speed=camera.distance/Math.max(1,height);camera.target=add(camera.target,add(scale(right,-dx*speed),scale(up,dy*speed)));invalidate();}
 function pickAt(x,y){setEye();return pickMeshes(cameraRay(x,y,width,height,{eye,target:camera.target,fov:.72}),objects.flatMap(o=>objectMeshes(o,phase)),meshData);}
 listen(canvas,'pointerdown',e=>{if(!active)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={x:e.clientX,y:e.clientY,moved:0,pan:e.shiftKey||e.button===2};else gesture={moved:10,span:Math.hypot(...[...pointers.values()].reduce((a,p,i)=>i?[p.x-a[0],p.y-a[1]]:[p.x,p.y],[]))};});
 listen(canvas,'pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;const p=pointers.get(e.pointerId),dx=e.clientX-p.x,dy=e.clientY-p.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture.moved+=Math.hypot(dx,dy);if(pointers.size===2){const [a,b]=[...pointers.values()],span=Math.hypot(a.x-b.x,a.y-b.y);if(gesture.span>0&&span>0)zoom(Math.log(gesture.span/span));gesture.span=span;}else if(gesture.pan)pan(dx,dy);else orbit(dx,dy);});
 const release=e=>{if(!pointers.has(e.pointerId))return;if(e.type!=='pointercancel'&&gesture?.moved<5&&pointers.size===1){const r=canvas.getBoundingClientRect(),id=pickAt(e.clientX-r.left,e.clientY-r.top);if(id)onSelect(id);}pointers.delete(e.pointerId);if(!pointers.size)gesture=null;else{const p=[...pointers.values()][0];gesture={x:p.x,y:p.y,moved:10,pan:false};}};
 listen(canvas,'pointerup',release);listen(canvas,'pointercancel',release);listen(canvas,'contextmenu',e=>e.preventDefault());listen(canvas,'wheel',e=>{if(active){e.preventDefault();zoom(Math.max(-.25,Math.min(.25,e.deltaY*.001)));}},{passive:false});
 listen(host,'keydown',e=>{if(!active||!e.target.closest('.world3d-label'))return;const directions={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]};if(directions[e.key])orbit(...directions[e.key]);else if(e.key==='+'||e.key==='=')zoom(-.12);else if(e.key==='-')zoom(.12);else if(e.key==='Home')fit();else return;e.preventDefault();});
 listen(document,'visibilitychange',()=>{if(document.hidden&&raf){cancelAnimationFrame(raf);raf=0;}else invalidate();});
 listen(canvas,'webglcontextlost',e=>{e.preventDefault();lost=true;setActive(false);error('The 3D graphics context was lost. Reload to restore it; source inspection remains available.');});
 const observer=new ResizeObserver(()=>invalidate());observer.observe(host);
 const api={setScene,setActive,setMotion,fit,cameraState,projectObject:id=>{setEye();const m=multiply(perspective(.72,width/height,.1,600),lookAt(eye,camera.target)),o=objects.find(o=>o.id===id);return o?project(o.position,m,width,height):null;},pickAt,dispose:()=>{if(disposed)return;setActive(false);disposed=true;observer.disconnect();for(const off of listeners)off();if(gl&&!lost)for(const [kind,r] of resources){if(kind==='shader')gl.deleteShader(r);else if(kind==='program')gl.deleteProgram(r);else gl.deleteBuffer(r);}labelButtons.clear();canvas.remove();labels.remove();failure.remove();if(host.world3d===api)delete host.world3d;}};host.world3d=api;return api;
}
