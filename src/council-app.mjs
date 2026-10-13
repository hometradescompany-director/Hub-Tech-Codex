import {validateCouncil} from './council.mjs';

const roster=document.querySelector('#roster'),handoff=document.querySelector('#handoff'),choice=document.querySelector('#provider-choice'),selection=document.querySelector('#selection');
const add=(parent,tag,text)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
try{
 const response=await fetch('./data/council.json');
 if(!response.ok)throw Error('unavailable');
 const packet=validateCouncil(await response.json()),task=packet.tasks[0];
 for(const provider of packet.providers){
  const card=add(roster,'article','');card.className='council-card';
  add(card,'h3',provider.label);add(card,'p',`${provider.id} · ${provider.kind} · ${provider.state}`);
  add(card,'p',provider.availabilityReceipt?'Receipt reference present; not verified by this page.':'No availability receipt. No execution eligibility.');
  const option=add(choice,'option',`${provider.label} (${provider.state})`);option.value=provider.id;
 }
 add(handoff,'h3',task.id);
 const link=add(handoff,'a',`${task.source.repository} #${task.source.number} ↗`);
 link.href=`https://github.com/${task.source.repository}/${task.source.kind==='issue'?'issues':'pull'}/${task.source.number}`;
 link.rel='noopener noreferrer';link.target='_blank';
 for(const line of [`Owner: ${task.owner}`,`Proposal: ${task.proposal}`,`Target: ${task.targetRepository} · scope: ${task.permissionScope}`,`Dependencies: ${task.dependencies.join('; ')}`,`Status: ${task.status}`,`Provenance: ${task.provenance.reference} · ${task.provenance.observedAt} · ${task.provenance.scope}`,`Handoff receipt: ${task.handoffReceipt??'none; no Atlas acceptance or dispatch evidenced'}`])add(handoff,'p',line);
 const preview=()=>{const provider=packet.providers.find(p=>p.id===choice.value);selection.textContent=`Preview: ${provider.label} (${provider.state}). No verified availability or Atlas authority receipt; recommendation only. Nothing dispatched.`;};
 choice.addEventListener('change',preview);preview();
}catch{add(roster,'p','Council proposal could not be validated. No provider selection is available.');choice.disabled=true;}
