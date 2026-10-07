// Read-only geometry over an attributed source packet; never an event writer.
const ID=/^[a-zA-Z0-9][a-zA-Z0-9:_.\/-]{0,199}$/;
const text=(v,max=500)=>typeof v==='string'&&v.length>0&&v.length<=max;
const time=v=>{if(typeof v!=='string')return false;const match=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.(\d{1,3}))?Z$/.exec(v);if(!match||!Number.isFinite(Date.parse(v)))return false;return new Date(v).toISOString()===v.slice(0,19)+'.'+(match[1]||'').padEnd(3,'0')+'Z';};
export function validateCosmic(packet){
 if(!packet||packet.version!=='cosmic-field/v0'||!['synthetic','observed','declared'].includes(packet.standing))throw new Error('Unsupported cosmic field');
 for(const [key,max] of [['bodies',5000],['events',5000],['relationships',20000]])if(!Array.isArray(packet[key])||packet[key].length>max)throw new Error('Cosmic field bound exceeded');
 const all=new Set(),bodies=new Set(),events=new Set();const identify=(id,set)=>{if(typeof id!=='string'||!ID.test(id)||all.has(id))throw new Error('Invalid or conflicting identity');all.add(id);set.add(id);};
 for(const b of packet.bodies){identify(b.id,bodies);if(!['universe','galaxy','system','planet','moon'].includes(b.kind)||!text(b.label,200)||!text(b.source,1000))throw new Error('Invalid body');}
 for(const e of packet.events){identify(e.id,events);if(!bodies.has(e.subject)||!text(e.type,120)||!text(e.actor,200)||!text(e.source,1000)||!['fixture','observed','declared','unknown'].includes(e.standing)||!time(e.occurredAt)||!time(e.recordedAt))throw new Error('Invalid event evidence');}
 for(const r of packet.relationships){identify(r.id,new Set());const refs=r.kind==='contains'?bodies:r.kind==='bond'?events:null;if(!refs||!refs.has(r.from)||!refs.has(r.to)||!events.has(r.establishedBy)||(r.supersededBy!==undefined&&!events.has(r.supersededBy)))throw new Error('Invalid relationship evidence');}
 return packet;
}
export function projectCosmic(input,{at,knownAt}={}){
 const packet=validateCosmic(input);if((at!==undefined&&!time(at))||(knownAt!==undefined&&!time(knownAt)))throw new Error('Invalid replay coordinate');
 const cutoff=at===undefined?Infinity:Date.parse(at),knowledge=knownAt===undefined?cutoff:Date.parse(knownAt);
 const atoms=packet.events.filter(e=>Date.parse(e.occurredAt)<=cutoff&&Date.parse(e.recordedAt)<=knowledge).map(e=>({...e})).sort((a,b)=>Date.parse(a.occurredAt)-Date.parse(b.occurredAt)||a.id.localeCompare(b.id));const visible=new Set(atoms.map(e=>e.id));
 const relationships=packet.relationships.filter(r=>visible.has(r.establishedBy)&&!visible.has(r.supersededBy)).filter(r=>r.kind!=='bond'||visible.has(r.from)&&visible.has(r.to)).map(r=>({...r})).sort((a,b)=>a.id.localeCompare(b.id));
 const bodies=packet.bodies.map(b=>({...b,active:atoms.some(e=>e.subject===b.id),eventIds:atoms.filter(e=>e.subject===b.id).map(e=>e.id)})).sort((a,b)=>a.id.localeCompare(b.id));
 return {version:'cosmic-projection/v0',standing:packet.standing,at:at??null,knownAt:knownAt??at??null,bodies,atoms,relationships,history:'bounded-source-packet',grantsAuthority:false};
}
export function descendants(projection,id){if(!projection.bodies.some(b=>b.id===id))throw new Error('Unknown body');const seen=new Set(),queue=[id],adj=new Map();for(const r of projection.relationships.filter(r=>r.kind==='contains')){if(!adj.has(r.from))adj.set(r.from,[]);adj.get(r.from).push(r.to);}for(let i=0;i<queue.length;i++){const current=queue[i];if(seen.has(current))continue;seen.add(current);for(const next of adj.get(current)||[])if(!seen.has(next))queue.push(next);}return [...seen];}
export function eventMolecules(projection){const adjacency=new Map();for(const r of projection.relationships.filter(r=>r.kind==='bond')){for(const [a,b] of [[r.from,r.to],[r.to,r.from]]){if(!adjacency.has(a))adjacency.set(a,[]);adjacency.get(a).push(b);}}const seen=new Set(),out=[];for(const id of [...adjacency.keys()].sort()){if(seen.has(id))continue;const queue=[id],members=[];for(let i=0;i<queue.length;i++){const current=queue[i];if(seen.has(current))continue;seen.add(current);members.push(current);for(const next of adjacency.get(current)||[])if(!seen.has(next))queue.push(next);}out.push({id:'molecule:'+members.sort().join('+'),eventIds:members,meaning:'explicit-source-bonds; no inferred causation'});}return out;}
