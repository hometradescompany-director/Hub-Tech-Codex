export const KINDS = Object.freeze(['hub','repository','tool','database','api','dataset','agent','surface']);
export const STANDINGS = Object.freeze(['observed','declared','planned','evaluated','authorised','connected']);
const text=(v)=>typeof v==='string' && v.trim().length>0 && v.length<=2000;
export function safeLink(value) {
  try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
export function validateGraph(graph) {
  if (!graph||graph.version!=='hub-graph/v0'||!Array.isArray(graph.nodes)||!Array.isArray(graph.edges)) throw new Error('Unsupported graph schema');
  if(graph.nodes.length>5000||graph.edges.length>20000)throw new Error('Graph exceeds bounds');
  const ids=new Set(),edgeIds=new Set();
  for(const n of graph.nodes){
    if(!text(n?.id)||!text(n.label)||!KINDS.includes(n.kind)||!STANDINGS.includes(n.standing)||typeof n.summary!=='string'||n.summary.length>4000||!text(n.source?.kind)||!text(n.source?.ref))throw new Error('Invalid node schema');
    if(ids.has(n.id))throw new Error('Duplicate node identity');ids.add(n.id);
    if(n.url&&!safeLink(n.url))throw new Error('Unsafe node URL');
  }
  for(const e of graph.edges){
    if(!text(e?.id)||!text(e.kind)||!STANDINGS.includes(e.standing))throw new Error('Invalid edge schema');
    if(edgeIds.has(e.id))throw new Error('Duplicate edge identity');edgeIds.add(e.id);
    if(!ids.has(e.from)||!ids.has(e.to))throw new Error('Unknown relationship endpoint');
  }
  return graph;
}
export function related(graph,id) {
  if(!graph.nodes.some(n=>n.id===id))throw new Error('Unknown node');
  const byId=new Map(graph.nodes.map(n=>[n.id,n]));
  return graph.edges.filter(e=>e.from===id||e.to===id).map(e=>({edge:e,node:byId.get(e.from===id?e.to:e.from),direction:e.from===id?'outgoing':'incoming'}));
}
export function walk(graph,id,{limit=100}={}) {
  if(!Number.isInteger(limit)||limit<1||limit>5000)throw new Error('Invalid traversal limit');
  const queue=[id],seen=new Set(),result=[];
  while(queue.length&&result.length<limit){const next=queue.shift();if(seen.has(next))continue;seen.add(next);const neighbours=related(graph,next);result.push(graph.nodes.find(n=>n.id===next));for(const r of neighbours)if(!seen.has(r.node.id))queue.push(r.node.id);}
  return result;
}
export function searchNodes(graph,query='',kind='all') {
  const q=query.trim().toLowerCase();
  return graph.nodes.filter(n=>(kind==='all'||n.kind===kind)&&`${n.label} ${n.summary} ${n.id}`.toLowerCase().includes(q));
}
