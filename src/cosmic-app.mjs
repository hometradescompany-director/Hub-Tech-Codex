import {mountWorld3D} from './world3d.mjs';
import {cosmicScene} from './world-scenes.mjs';
import {validateCosmic,projectCosmic,eventMolecules,descendants} from './cosmic.mjs';
import {resolveEntry} from './entry.mjs';
const $=id=>document.getElementById(id),el=(tag,className='',value='')=>{const n=document.createElement(tag);n.className=className;n.textContent=value;return n;};
const world=$('atlas-world'), menu=$('world-menu');
function setEvidence(open){$('matter-inspector').hidden=!open;$('evidence-toggle').setAttribute('aria-expanded',String(open));}
function closeMenu(){menu.close();$('environment-menu').focus();}
function enterWorld(){world.hidden=false;$('cosmic-launcher').hidden=true;document.body.classList.add('world-active');world.focus();window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('cosmicvisibility'));}
async function exitWorld(){menu.close();if(document.fullscreenElement===world){try{await document.exitFullscreen();}catch{}}world.hidden=true;$('cosmic-launcher').hidden=false;document.body.classList.remove('world-active');$('world-status').textContent='';$('enter-atlas').focus();window.dispatchEvent(new Event('cosmicvisibility'));}
$('enter-atlas').addEventListener('click',enterWorld);
$('exit-atlas').addEventListener('click',exitWorld);
$('environment-menu').addEventListener('click',()=>menu.showModal());
$('menu-close').addEventListener('click',closeMenu);$('menu-cosmic').addEventListener('click',closeMenu);
menu.addEventListener('cancel',event=>{event.preventDefault();closeMenu();});
$('evidence-toggle').addEventListener('click',()=>setEvidence($('matter-inspector').hidden));
$('native-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement===world)await document.exitFullscreen();else if(world.requestFullscreen)await world.requestFullscreen();else throw new Error('unavailable');$('world-status').textContent='';}catch{$('world-status').textContent='Native fullscreen unavailable. The world still fills this browser window.';}});
document.addEventListener('fullscreenchange',()=>{$('native-fullscreen').textContent=document.fullscreenElement===world?'Window mode':'Fullscreen';});
document.addEventListener('keydown',event=>{if(event.key!=='Escape'||world.hidden||menu.open)return;if(!$('matter-inspector').hidden){setEvidence(false);$('evidence-toggle').focus();}else{menu.showModal();}event.preventDefault();});
async function start(){
let packet;try{const response=await fetch('./data/cosmic-fixture.json');if(!response.ok)throw new Error('Fixture unavailable');packet=validateCosmic(await response.json());}catch{ $('cosmic-scene').append(el('p','caption','Source packet rejected or unavailable. No partial event history was accepted.'));$('matter-inspector').textContent='Source unavailable. Return to the hub to choose another path.';$('epoch').disabled=true;$('sandbox-entry').disabled=true;$('enter-atlas').disabled=false;return;}
const epochs=[...new Set(packet.events.flatMap(e=>[e.occurredAt,e.recordedAt]))].sort((a,b)=>Date.parse(a)-Date.parse(b));
let selected='universe',focus='universe',history=[],list=false,projection;
const scene3d=mountWorld3D($('cosmic-scene'),{onSelect:id=>choose(id),onError:message=>{$('world-status').textContent=message;}});
scene3d.setMotion(true);
$('substrate-toggle').textContent='Pause motion';
$('substrate-toggle').addEventListener('click',()=>{const motion=$('substrate-toggle').getAttribute('aria-pressed')!=='true';$('substrate-toggle').setAttribute('aria-pressed',String(motion));$('substrate-toggle').textContent=motion?'Pause motion':'Resume motion';scene3d.setMotion(motion);});
window.addEventListener('pagehide',event=>{if(!event.persisted)scene3d.dispose();});
$('epoch').max=epochs.length-1;$('epoch').value=epochs.length-1;
const button=(label,fn,className='inspector-link')=>{const b=el('button',className,label);b.addEventListener('click',fn);return b;};
function choose(id){selected=id;setEvidence(true);render();}
function descend(id){history.push({focus,selected,epoch:$('epoch').value,known:$('known-then').checked});history=history.slice(-100);focus=id;selected=id;render();}
function drawScene(){scene3d.setScene(cosmicScene(projection,{focus,selected}));scene3d.setActive(!world.hidden&&!list);}
function inspector(){const host=$('matter-inspector');host.replaceChildren();const atom=projection.atoms.find(e=>e.id===selected),body=projection.bodies.find(b=>b.id===selected);
 if(!atom&&!body){selected=focus;return inspector();}
 host.append(el('p','eyebrow',atom?'EVENT / ATOM':'IDENTITY / BODY'),el('h2','',atom?atom.type:body.label),el('p','tag',atom?'SYNTHETIC EVENT':body.active?'FIXTURE ACTIVITY OBSERVED':'DECLARED · NO VISIBLE EVENTS'));
 const fields=atom?[['Event identity',atom.id],['Subject',atom.subject],['Actor',atom.actor],['Occurred',atom.occurredAt],['Recorded',atom.recordedAt],['Source',atom.source],['Standing',atom.standing]]:[['Identity',body.id],['Scale',body.kind],['Source',body.source],['Visible event atoms',String(body.eventIds.length)]];
 const dl=el('dl','evidence-dl');for(const [k,v] of fields)dl.append(el('dt','',k),el('dd','',v));host.append(dl);
 if(atom){host.append(button('Return to subject →',()=>choose(atom.subject)));const bonds=projection.relationships.filter(r=>r.kind==='bond'&&(r.from===atom.id||r.to===atom.id));host.append(el('h3','','EXPLICIT BONDS'));for(const r of bonds)host.append(button(`${r.id} → ${r.from===atom.id?r.to:r.from}`,()=>choose(r.from===atom.id?r.to:r.from)));if(!bonds.length)host.append(el('p','','No explicit bonds in this packet. Nearby time is not evidence of causation.'));}
 else{if(body.id!==focus)host.append(button('Descend into '+body.label,()=>descend(body.id)));host.append(el('h3','','RECIPROCAL STRUCTURE'));for(const r of projection.relationships.filter(r=>r.kind==='contains'&&(r.from===body.id||r.to===body.id))){const target=r.from===body.id?r.to:r.from;host.append(button(`${r.from===body.id?'↘ Child':'↗ Parent'} · ${projection.bodies.find(b=>b.id===target).label}`,()=>choose(target)));}host.append(el('h3','','SOURCE EVENTS'));for(const id of body.eventIds)host.append(button(id,()=>choose(id)));}
 host.append(el('h3','','EVIDENCE BOUNDARY'),el('p','','This synthetic packet illustrates the design. The map owns geometry only; it grants no authority and claims no live agent runtime. A1-A1 remains provisional and perspective-dependent.'));
}
function render(){const at=epochs[Number($('epoch').value)],knownAt=$('known-then').checked?at:epochs.at(-1);projection=projectCosmic(packet,{at,knownAt});$('epoch-label').textContent=new Date(at).toISOString().slice(11,16)+' UTC';$('matter-count').textContent=`${projection.atoms.length} atoms · ${eventMolecules(projection).length} molecules`;$('focus-label').textContent=projection.bodies.find(b=>b.id===focus).label;$('cosmic-back').disabled=!history.length;$('cosmic-scene').hidden=world.hidden||list;$('matter-list').hidden=!list;$('list-toggle').setAttribute('aria-pressed',String(list));drawScene();
 const host=$('matter-list');host.replaceChildren();for(const e of projection.atoms){const b=button(e.type,()=>choose(e.id),'event-row');b.append(el('small','',`${e.id} · ${e.subject} · occurred ${e.occurredAt.slice(11,16)} · recorded ${e.recordedAt.slice(11,16)}`));host.append(b);}if(!projection.atoms.length)host.append(el('p','','No visible events within this replay coordinate. This does not establish non-occurrence.'));inspector();}
$('epoch').addEventListener('input',render);$('known-then').addEventListener('change',render);$('list-toggle').addEventListener('click',()=>{list=!list;render();});$('cosmic-root').addEventListener('click',()=>descend('universe'));$('cosmic-back').addEventListener('click',()=>{const previous=history.pop();if(!previous)return;({focus,selected}=previous);$('epoch').value=previous.epoch;$('known-then').checked=previous.known;render();});
$('sandbox-entry').addEventListener('click',()=>{const r=resolveEntry({contract:'environment-entry/v0',id:'bounded-world',mode:'sandbox',destination:'/cosmic.html'});$('entry-result').textContent=`${r.code}: an owning server must verify identity, scope, expiry and admission before a sandbox session can begin. No session was created.`;});render();

window.addEventListener('resize',render);
window.addEventListener('cosmicvisibility',render);
$('enter-atlas').disabled=false;
}
start();
