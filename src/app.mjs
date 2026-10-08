import {mountWorld3D} from './world3d.mjs';
import {hubScene} from './world-scenes.mjs';
import {resolveEntry} from './entry.mjs';
import {validateGraph,related,searchNodes,KINDS,safeLink} from './graph.mjs';
import {createNavigation,navigate,goBack} from './navigation.mjs';
import {observeRepository} from './github.mjs';
import {reviewInventory} from './diamond.mjs';
import {validatePaths} from './paths.mjs';
const $=id=>document.getElementById(id);
const el=(tag,className='',text='')=>{const n=document.createElement(tag);n.className=className;n.textContent=text;return n;};
const entry=resolveEntry({contract:'environment-entry/v0',id:'codex-cosmos',mode:'projection',destination:'/cosmic.html'});if(entry.ok)$('enter-cosmic').href=entry.destination;
const symbols={hub:'◇',repository:'⌘',tool:'⚒',database:'▤',api:'↗',dataset:'▧',agent:'✧',surface:'▣'};
const read=async(path)=>{const r=await fetch(path);if(!r.ok)throw new Error('Environment data unavailable');return r.json();};
let graph,paths,state=createNavigation({selected:'codex'});
try{graph=validateGraph(await read('./data/constellation.json'));paths=validatePaths(await read('./data/development-paths.json')); }catch{$('status').textContent='Environment data could not be validated. Source remains available on GitHub.';throw new Error('Invalid environment data');}
for(const kind of KINDS){const o=el('option','',kind);o.value=kind;$('kind').append(o);}
function change(patch){state=navigate(state,patch);render();}
function choose(id){change({selected:id});}
function badge(standing){return el('span',`standing ${standing}`,standing.toUpperCase());}
function link(url,label){const a=el('a','',label);a.href=safeLink(url);a.target='_blank';a.rel='noopener noreferrer';return a;}
function relation(r){const b=el('button','relation-row');b.append(el('span','relation-arrow',r.direction==='outgoing'?'↗':'↙'));const label=el('span','',r.node.label);label.append(el('small','',`${r.direction} · ${r.edge.kind} · ${r.edge.standing}`));b.append(label);b.addEventListener('click',()=>choose(r.node.id));return b;}
let hub3d=null,savedCamera=null;
window.addEventListener('pagehide',event=>{if(!event.persisted)hub3d?.dispose();});
function renderExplorer(nodes){
  const host=$('explorer');
  if(state.current.lens!=='constellation'){if(hub3d){savedCamera=hub3d.cameraState();hub3d.dispose();hub3d=null;}host.replaceChildren();}
  host.className=state.current.lens;
  if(!nodes.length){hub3d?.setActive(false);host.replaceChildren();hub3d?.dispose();hub3d=null;host.append(el('p','empty','No identities match. Try another path or clear your filter.'));return;}
  if(state.current.lens==='constellation'){
    if(!hub3d){host.replaceChildren();hub3d=mountWorld3D(host,{onSelect:choose,camera:savedCamera,onError:message=>{$('status').textContent=message;}});}
    hub3d.setScene(hubScene(graph,nodes,state.current.selected));hub3d.setActive(true);hub3d.setMotion(false);
  }else if(state.current.lens==='list'){
    host.className='directory';for(const n of nodes){const b=el('button','card');b.dataset.id=n.id;b.append(el('p','eyebrow',`${symbols[n.kind]} / ${n.kind.toUpperCase()}`),el('h3','',n.label),el('p','',n.summary),badge(n.standing));b.addEventListener('click',()=>choose(n.id));host.append(b);}
  }else{
    const selected=graph.nodes.find(n=>n.id===state.current.selected)||graph.nodes[0];const head=el('div','nested-head');head.append(el('p','eyebrow','INSIDE THIS CONTEXT'),el('h2','',selected.label),el('p','muted',selected.summary));host.append(head);
    const visible=new Set(nodes.map(n=>n.id));const neighbours=related(graph,selected.id).filter(r=>visible.has(r.node.id));for(const r of neighbours)host.append(relation(r));if(!neighbours.length)host.append(el('p','empty','No relationships match the current filter.'));
  }
}
function renderInspector(){
  const n=graph.nodes.find(n=>n.id===state.current.selected)||graph.nodes[0],host=$('inspector-content');host.replaceChildren();
  host.append(el('div','identity-mark',symbols[n.kind]),el('h2','',n.label),badge(n.standing),el('p','',n.summary));
  if(n.id==='diamond'||n.id==='inventory'){const b=el('button','primary','Open bounded inventory proof →');b.addEventListener('click',()=>$('proof-dialog').showModal());host.append(b);}
  host.append(el('hr'),el('h3','','SOURCE / PROVENANCE'));const details=el('div','details');details.append(el('strong','',n.source.kind),el('small','',n.source.ref));if(n.source.observedAt)details.append(el('small','',`Observed ${n.source.observedAt}`));if(n.revision)details.append(el('code','',`Revision ${n.revision.slice(0,12)}`));if(n.licence)details.append(el('small','',`Licence: ${n.licence.spdx||'unknown'} · ${n.licence.standing} (not an integration grant)`));if(n.url&&safeLink(n.url)){details.append(el('br'),link(n.url,'Open canonical source ↗'));}host.append(details,el('hr'),el('h3','','RECIPROCAL RELATIONSHIPS'));for(const r of related(graph,n.id))host.append(relation(r));
  host.append(el('hr'),el('h3','','BOUNDARY'),el('p','','Discovery and visual nesting grant no ownership, trust or execution authority. Planned links remain planned.'));
}
function render(){const nodes=searchNodes(graph,state.current.query,state.current.kind);$('search').value=state.current.query;$('kind').value=state.current.kind;$('node-count').textContent=`${nodes.length} identities`;for(const b of document.querySelectorAll('[data-lens]'))b.setAttribute('aria-pressed',String(b.dataset.lens===state.current.lens));$('back').disabled=!state.history.length;$('context-label').textContent=graph.nodes.find(n=>n.id===state.current.selected)?.label||'Core constellation';renderExplorer(nodes);renderInspector();}
$('search').addEventListener('input',e=>{state={...state,current:{...state.current,query:e.target.value}};render();$('search').focus();});$('kind').addEventListener('change',e=>change({kind:e.target.value}));
for(const b of document.querySelectorAll('[data-lens]'))b.addEventListener('click',()=>change({lens:b.dataset.lens}));$('back').addEventListener('click',()=>{state=goBack(state);render();});
for(const b of document.querySelectorAll('[data-section]'))b.addEventListener('click',()=>{const isPaths=b.dataset.section==='paths';$('paths-section').hidden=!isPaths;$('explore-section').hidden=isPaths;hub3d?.setActive(!isPaths);for(const x of document.querySelectorAll('[data-section]'))x.classList.toggle('active',x===b);});
for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>$(b.dataset.close).close());$('open-source').addEventListener('click',()=>$('source-dialog').showModal());$('open-proof').addEventListener('click',()=>$('proof-dialog').showModal());
$('source-form').addEventListener('submit',async e=>{e.preventDefault();$('observe-submit').disabled=true;$('source-result').textContent='Observing public source…';
  try{const r=await observeRepository($('repository-input').value);if(!r.ok){$('source-result').textContent=`${r.code}: ${r.detail}`;return;}
    const match=graph.nodes.find(n=>n.url?.toLowerCase()===r.node.url.toLowerCase());const node={...r.node,id:match?.id||r.node.id};const next={...graph,nodes:match?graph.nodes.map(n=>n.id===match.id?node:n):[...graph.nodes,node],edges:[...graph.edges]};
    if(!match)next.edges.push({id:`codex/discovered/${node.id}`,from:'codex',to:node.id,kind:'discovered',standing:'observed'},{id:`${node.id}/source/github`,from:node.id,to:'github',kind:'sourced-from',standing:'observed'});
    graph=validateGraph(next);choose(node.id);$('status').textContent=`Observed ${node.label} at ${node.revision.slice(0,12)}. Session observation only; no installation or trust granted.`;$('source-result').textContent='Public revision observed. No code executed.';$('source-dialog').close();
  }catch{$('source-result').textContent='Observation could not be validated. No graph changes accepted.';}finally{$('observe-submit').disabled=false;}
});
$('run-proof').addEventListener('click',async()=>{const now=new Date(),target=$('demo-authority').checked?{id:'fixture:local-manifest',standing:'accepted',startsAt:new Date(now.getTime()-60000).toISOString(),expiresAt:new Date(now.getTime()+60000).toISOString(),operations:['inventory.dependencies'],simulation:true}:null;const r=await reviewInventory({target,operation:'inventory.dependencies',manifest:$('manifest').value,now});$('proof-result').textContent=JSON.stringify(r,null,2);});
paths.paths.forEach((path,i)=>{const card=el('article','path-card');card.append(el('span','step',String(i+1).padStart(2,'0')));const body=el('div');body.append(el('h3','',path.title),el('code','',path.branch),el('p','',path.summary),el('small','',`Depends on: ${path.dependsOn.join(' · ')}`),el('p','',`Acceptance: ${path.acceptance}`));card.append(body);$('paths').append(card);});
render();
