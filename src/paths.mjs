export function validatePaths(data) {
  if(data?.version!=='hub-paths/v0'||!Array.isArray(data.paths)||data.paths.length>100)throw new Error('Invalid development paths');
  const byId=new Map(),branches=new Set();for(const p of data.paths){if(typeof p.id!=='string'||!p.id||!/^(feature|domain|research)\/[a-z0-9-]+$/.test(p.branch)||!Array.isArray(p.dependsOn))throw new Error('Invalid development path');if(byId.has(p.id)||branches.has(p.branch))throw new Error('Duplicate development path');byId.set(p.id,p);branches.add(p.branch);}
  const done=new Set(),active=new Set();function visit(id){if(id==='foundation'||done.has(id))return;if(active.has(id))throw new Error('Development path cycle');const p=byId.get(id);if(!p)throw new Error('Unknown dependency');active.add(id);for(const dep of p.dependsOn)visit(dep);active.delete(id);done.add(id);}for(const id of byId.keys())visit(id);return data;
}
