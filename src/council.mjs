const states=new Set(['declared','discovered','available-verified','unavailable','unknown','retired']);
const repo=/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
const ref=r=>r&&['issue','pull'].includes(r.kind)&&typeof r.repository==='string'&&repo.test(r.repository)&&Number.isSafeInteger(r.number)&&r.number>0;
const date=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s)&&Number.isFinite(Date.parse(s));
const sourceUrl=r=>`https://github.com/${r.repository}/${r.kind==='issue'?'issues':'pull'}/${r.number}`;

export function validateCouncil(packet){
 if(packet?.contract!=='hub-council/v0'||packet.standing!=='declared-proposal'||!Array.isArray(packet.providers)||packet.providers.length>50||!Array.isArray(packet.tasks)||packet.tasks.length>50)throw Error('invalid_council');
 const ids=new Set();
 for(const p of packet.providers){
  if(typeof p.id!=='string'||!/^provider:[a-z0-9-]+$/.test(p.id)||ids.has(p.id)||p.kind!=='coding-assistant'||typeof p.label!=='string'||!states.has(p.state)||typeof p.provenance!=='string')throw Error('invalid_provider');
  ids.add(p.id);
  if(p.state==='available-verified')throw Error('unverified_provider');
 }
 const tasks=new Set();
 for(const t of packet.tasks){
  if(typeof t.id!=='string'||!/^proposal:[a-z0-9-]+$/.test(t.id)||tasks.has(t.id)||!ref(t.source)||t.owner!==t.source.repository||t.targetRepository!==t.source.repository||t.permissionScope!=='read-and-propose'||t.status!=='proposed'||typeof t.proposal!=='string'||!Array.isArray(t.dependencies)||!t.dependencies.every(d=>typeof d==='string')||typeof t.provenance?.reference!=='string'||!/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+\/(issues|pull)\/[1-9]\d*$/.test(t.provenance.reference)||!date(t.provenance.observedAt)||typeof t.provenance.scope!=='string'||t.handoffReceipt!==null)throw Error('invalid_proposal');
  tasks.add(t.id);
 }
 return packet;
}

export function validAvailability(provider,receipt,now){
 return provider?.state==='available-verified'&&receipt?.providerId===provider.id&&typeof receipt?.reference==='string'&&date(receipt.observedAt)&&date(receipt.expiresAt)&&Number.isFinite(now)&&Date.parse(receipt.observedAt)<=now&&now<Date.parse(receipt.expiresAt);
}

// Pure review of an external decision: never sends work or grants authority.
export function reviewHandoff(task,provider,availability,decision,{now,verifySignature,seenKeys}={}){
 const refuse=reason=>({ok:false,reason,grantsAuthority:false});
 if(!ref(task?.source)||typeof task.id!=='string'||!/^proposal:[a-z0-9-]+$/.test(task.id)||task.targetRepository!==task.source.repository||task.owner!==task.source.repository||task.permissionScope!=='read-and-propose'||task.status!=='proposed')return refuse('cross_repo_or_invalid_task');
 if(!validAvailability(provider,availability,now))return refuse('provider_unverified');
 if(!decision||decision.contract!=='atlas-council-decision/v0'||decision.providerId!==provider.id||decision.taskId!==task.id||decision.targetRepository!==task.targetRepository||decision.permissionScope!==task.permissionScope||decision.sourceReference!==sourceUrl(task.source))return refuse('decision_mismatch');
 if(!date(decision.issuedAt)||!date(decision.expiresAt)||Date.parse(decision.issuedAt)>now||now>=Date.parse(decision.expiresAt))return refuse('stale_decision');
 if(typeof decision.eventReference!=='string'||!decision.eventReference||typeof decision.replayKey!=='string'||!decision.replayKey||typeof decision.signature!=='string'||!decision.signature||typeof decision.denialReason!=='string')return refuse('invalid_decision');
 try{if(typeof verifySignature!=='function'||verifySignature(decision)!==true)return refuse('unverified_signature');}
 catch{return refuse('unverified_signature');}
 if(decision.allowed!==true)return refuse(decision.denialReason||'denied');
 if(decision.denialReason)return refuse('inconsistent_decision');
 if(!(seenKeys instanceof Map))return refuse('replay_store_required');
 const fingerprint=JSON.stringify(decision);
 if(seenKeys.has(decision.replayKey))return refuse(seenKeys.get(decision.replayKey)===fingerprint?'duplicate_dispatch':'replay_key_conflict');
 seenKeys.set(decision.replayKey,fingerprint);
 return {ok:true,reason:'review_only',grantsAuthority:false,sourceReference:decision.sourceReference};
}
