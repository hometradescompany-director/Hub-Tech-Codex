export const INVENTORY_OPERATION='inventory.dependencies';
const scopes=['dependencies','devDependencies','optionalDependencies','peerDependencies'];
export async function reviewInventory({target,operation,manifest,now=new Date()}) {
  const refuse=(code)=>({contract:'hub-diamond-demo/v0',outcome:'refused',code,execution:'none',grantsAuthority:false});
  if(operation!==INVENTORY_OPERATION)return refuse('operation_not_supported');
  if(!target||target.standing!=='accepted'||!Array.isArray(target.operations)||!target.operations.includes(operation))return refuse('authority_absent');
  if(target.simulation!==true)return refuse('simulation_only');
  const start=Date.parse(target.startsAt),end=Date.parse(target.expiresAt),clock=now.getTime();
  if(!Number.isFinite(start)||!Number.isFinite(end)||!Number.isFinite(clock)||start>clock||clock>=end||end<=start)return refuse('outside_authorisation_window');
  if(typeof manifest!=='string'||new TextEncoder().encode(manifest).byteLength>262144)return refuse('manifest_size_invalid');
  let parsed;try{parsed=JSON.parse(manifest);}catch{return refuse('manifest_invalid');}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return refuse('manifest_invalid');
  const dependencies=[];
  for(const scope of scopes){const group=parsed[scope];if(group===undefined)continue;if(!group||typeof group!=='object'||Array.isArray(group))return refuse('dependencies_invalid');
    for(const [name,version] of Object.entries(group)){if(!name||name.length>214||typeof version!=='string'||version.length>500)return refuse('dependency_invalid');dependencies.push({name,version,scope});if(dependencies.length>1000)return refuse('inventory_bound_exceeded');}}
  dependencies.sort((a,b)=>a.scope.localeCompare(b.scope)||a.name.localeCompare(b.name));
  const bytes=new TextEncoder().encode(JSON.stringify({target,operation,manifest}));
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  return {contract:'hub-diamond-demo/v0',id:`demo:${hash}`,outcome:'demonstrated',operation,issuedAt:now.toISOString(),targetRef:target.id,dependencies,execution:'local-inert-demo',grantsAuthority:false,boundary:'No code execution, advisory query or live Diamond invocation. Simulated target authorisation only.'};
}
