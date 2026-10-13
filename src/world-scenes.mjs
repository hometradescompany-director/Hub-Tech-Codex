import {layoutGraph} from './space3d.mjs';
import {descendants} from './cosmic.mjs';
const radius={universe:2.8,galaxy:1.8,system:1.0,planet:.72,moon:.45,hub:1.5,repository:.95,api:.8,tool:.75,database:.9,surface:.8,agent:.7};
export function cosmicScene(projection,{focus='universe',selected='universe'}={}){
 const visible=new Set(descendants(projection,focus)),bodies=projection.bodies.filter(b=>visible.has(b.id)),structural=projection.relationships.filter(r=>r.kind==='contains'&&visible.has(r.from)&&visible.has(r.to));
 const points=layoutGraph(bodies,structural,focus),objects=bodies.map(b=>({...b,position:points.get(b.id),radius:radius[b.kind]}));
 const events=projection.atoms.filter(e=>visible.has(e.subject));
 for(const b of bodies){const atoms=events.filter(e=>e.subject===b.id).sort((a,b)=>a.id.localeCompare(b.id)),p=points.get(b.id),r=radius[b.kind]+1.25;atoms.forEach((e,i)=>{const a=i/Math.max(1,atoms.length)*Math.PI*2+.6;objects.push({id:e.id,label:e.type+' · '+e.id,kind:'event',radius:.16,position:[p[0]+Math.cos(a)*r,p[1]+Math.sin(a)*1.2,p[2]+Math.sin(a)*r]});});}
 const ids=new Set(objects.map(o=>o.id)),edges=[...structural,...projection.relationships.filter(r=>r.kind==='bond'&&ids.has(r.from)&&ids.has(r.to))];
 return {objects,edges,selected,focus};
}
export function hubScene(graph,nodes,selected){const points=layoutGraph(nodes,graph.edges,'codex');return {objects:nodes.map(n=>({id:n.id,label:n.label,kind:n.kind,position:points.get(n.id),radius:radius[n.kind]||.8})),edges:graph.edges,focus:'codex',selected};}
