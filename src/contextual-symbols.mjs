// Candidate visual interpretations. These records describe; they never execute.
const fail=message=>{throw new TypeError(`Contextual symbols: ${message}`);};
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function shape(value,keys,name){
  if(!isObject(value)||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key))||Object.keys(value).some(key=>!keys.includes(key)))fail(`${name} has unexpected or missing fields`);
}
function text(value,name,max=2048){if(typeof value!=='string'||!value.trim()||value.length>max)fail(`${name} must be bounded, non-empty text`);}
function key(value,name){text(value,name,96);if(!/^[a-zA-Z0-9][a-zA-Z0-9:._-]*$/.test(value))fail(`${name} must be an explicit identifier`);}
function revision(value){if(!Number.isSafeInteger(value)||value<1)fail('revision must be an explicit positive integer');}
function list(value,name,max){if(!Array.isArray(value)||value.length>max)fail(`${name} exceeds its bounded list contract`);}
function notes(value,name){list(value,name,12);if(!value.length)fail(`${name} must preserve at least one example`);value.forEach(item=>text(item,name));}
const freezeRecord=r=>Object.freeze({...r,invariants:Object.freeze([...r.invariants]),failureExamples:Object.freeze([...r.failureExamples]),source:Object.freeze({...r.source})});

export function validateSymbols(packet,{subjectIds}={}){
  shape(packet,['version','standing','grantsAuthority','records','bindings'],'catalog');
  if(packet.version!=='contextual-symbols/v0'||packet.standing!=='candidate'||packet.grantsAuthority!==false)fail('only candidate records without authority are accepted');
  list(packet.records,'records',256);list(packet.bindings,'bindings',512);
  const records=new Map(),identities=new Map();
  for(const r of packet.records){
    shape(r,['id','revision','motif','context','meaning','invariants','failureExamples','source'],'record');
    for(const field of ['id','motif','context'])key(r[field],field);
    revision(r.revision);text(r.meaning,'meaning');notes(r.invariants,'invariants');notes(r.failureExamples,'failure examples');
    shape(r.source,['reference','attribution','assetRights'],'source');text(r.source.reference,'source reference',512);
    if(r.source.attribution!=='unknown'||r.source.assetRights!=='unknown')fail('this candidate contract requires unknown image attribution and asset rights');
    const versionKey=`${r.id}@${r.revision}`;
    if(records.has(versionKey))fail('duplicate record identity and revision');
    const identity=identities.get(r.id);
    if(identity&&(identity.motif!==r.motif||identity.context!==r.context))fail('persistent identity cannot be rebound to another motif or context');
    records.set(versionKey,r);identities.set(r.id,r);
  }
  let subjects;
  if(subjectIds!==undefined){list(subjectIds,'subjects',5000);subjectIds.forEach(id=>key(id,'subject'));subjects=new Set(subjectIds);}
  const bindings=new Set();
  for(const b of packet.bindings){
    shape(b,['subject','recordId','revision','context'],'binding');
    for(const field of ['subject','recordId','context'])key(b[field],field);
    revision(b.revision);
    const record=records.get(`${b.recordId}@${b.revision}`);
    if(!record||record.context!==b.context)fail('binding requires the exact record revision and context');
    if(subjects&&!subjects.has(b.subject))fail('binding subject is absent from the source field');
    const bindingKey=JSON.stringify([b.subject,b.recordId,b.revision,b.context]);
    if(bindings.has(bindingKey))fail('duplicate binding');bindings.add(bindingKey);
  }
  return Object.freeze({...packet,records:Object.freeze(packet.records.map(freezeRecord)),bindings:Object.freeze(packet.bindings.map(b=>Object.freeze({...b})))});
}

export function resolveSymbol(packet,query={}){
  const catalog=validateSymbols(packet);
  const unresolved={status:'unresolved',grantsAuthority:false};
  if(!isObject(query)||typeof query.motif!=='string'||typeof query.context!=='string'||!Number.isSafeInteger(query.revision)||query.revision<1)return unresolved;
  const matches=catalog.records.filter(r=>r.motif===query.motif&&r.context===query.context&&r.revision===query.revision);
  if(matches.length>1)return {status:'ambiguous',grantsAuthority:false};
  return matches.length===1?{status:'resolved',record:matches[0],grantsAuthority:false}:unresolved;
}

export function symbolsForSubject(packet,subject){
  const catalog=validateSymbols(packet);
  const records=new Map(catalog.records.map(r=>[`${r.id}@${r.revision}`,r]));
  return catalog.bindings.filter(b=>b.subject===subject).map(b=>records.get(`${b.recordId}@${b.revision}`));
}
