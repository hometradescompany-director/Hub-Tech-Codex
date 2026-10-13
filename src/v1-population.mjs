import {createHash} from 'node:crypto';
import {lifePatterns,scenarios} from './v1-life-scenarios.mjs';
export const POPULATION_VERSION='v1-earth-origins/1';
const firstNames='Ada Aisha Alina Amara Anika Arlo Arun Aster Beatrice Ben Callum Carmen Celia Charlie Clara Cora Dalia Daniel Dara David Devon Eden Elena Eli Elias Emilia Esme Eva Farah Felix Finn Flora Gabriel Hana Harriet Hazel Hugo Idris Imani Iris Isaac Isla Ivan Ivy Jade James Jamie Jasper Joel Jonah Jonas Jordan Jules Jun Kai Kieran Lara Leila Lena Leo Leon Levi Lila Lina Luca Lucy Mae Maia Malik Mara Maya Mira Morgan Nadia Naomi Nathan Nell Nia Nico Nina Noah Nora Oliver Omar Oscar Owen Paige Priya Quinn Rafael Ravi Remy Rina Robin Rosa Rowan Ruby Sam Sara Sasha Selene Seth Sofia Talia Theo Tobias Una Vera Wren Yasmin Zara Zoya'.split(' ');
const surnames='Abbott Adler Akhtar Allen Anders Archer Armitage Ashford Avery Baines Baker Barros Baxter Bell Bennett Berg Blake Bowen Brooks Byrne Calder Campbell Carter Chen Clarke Cole Costa Cruz Dale Darzi Dawson Ellis Evans Farouk Farrell Fischer Flores Ford Foster Fox Fraser Garcia Grant Gray Green Hall Harper Hayes Hill Holt Huang Hughes Iqbal James Jensen Jones Kaur Kelly Khan Kim King Lane Laurent Lee Lewis Lin Lopez Lowe Malik Marsh Mason Meyer Miller Moore Morgan Morris Navarro Nguyen Nolan Ortiz Owen Park Patel Perry Quinn Ramos Reed Reid Reyes Rivera Ross Ruiz Santos Shah Shaw Singh Sloan Smith Stone Tan Taylor Thomas Tran Turner Vale Voss Walker Walsh Ward Wells West White Wong Woods Wright Yates Young Zhao'.split(' ');
const priorities=['stability','curiosity','belonging','independence','care','completion'];
function rng(seed){let x=createHash('sha256').update(seed).digest().readUInt32LE(0)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function shuffled(items,random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
const pick=(items,random)=>items[Math.floor(random()*items.length)];
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function generatePopulation({count=1000,seed='v1-earth-2026'}={}){
 if(!Number.isInteger(count)||count<1||count>10000)throw new Error('Count must be an integer between 1 and 10000');
 if(typeof seed!=='string'||!seed.trim()||seed.length>200)throw new Error('A nonempty bounded seed is required');
 const names=shuffled(firstNames.flatMap(first=>surnames.map(last=>`${first} ${last}`)),rng(`${seed}:names`));
 const people=[];
 for(let i=0;i<count;i++){
  const id=`v1-origin-${String(i+1).padStart(5,'0')}`,personSeed=`${seed}:${id}`,random=rng(personSeed);
  const age=18+Math.floor(random()*67),pattern=lifePatterns[i%lifePatterns.length],initialPriority=pick(priorities,random);
  const decisions=[];let carry=initialPriority;
  for(const [j,scenario] of shuffled(scenarios,random).slice(0,10).entries()){
   // Earlier choices change which concerns receive weight; random variation leaves room to change direction.
   const weights=scenario.options.map(o=>1+(o.orientation===carry?2:0)+(o.orientation===initialPriority?1:0));
   let draw=random()*weights.reduce((a,b)=>a+b,0),selected=0;
   while(selected<weights.length-1&&draw>=weights[selected]){draw-=weights[selected];selected++;}
   const option=scenario.options[selected],previous=decisions.at(-1);
   const decisionAge=16+Math.floor((age-16)*j/9);
   const memory={id:`${id}:decision:${j+1}`,sequence:j+1,age:decisionAge,earth_year:2026-age+decisionAge,scenario_id:scenario.id,provenance:'fabricated_origin',
    situation:scenario.situation,known_then:scenario.known,unknown_then:scenario.unknown,
    alternatives:scenario.options.map(o=>({id:o.id,action:o.action,anticipated_cost:o.cost})),choice_id:option.id,chosen_action:option.action,
    reason_at_the_time:previous?`${option.motive}. The earlier consequence, "${previous.consequence}", kept ${carry} salient. The remembered rule "${previous.working_rule}" was considered, while this choice put ${option.orientation} first.`:`${option.motive}. At this point ${initialPriority} felt especially important, while this choice put ${option.orientation} first.`,
    priority_before:carry,priority_after:option.orientation,
    influenced_by:previous?[previous.id]:[],influence_standing:'authored-fictional-link',consequence:option.result,cost:option.cost,working_rule:option.heuristic,
    later_interpretation:`${option.heuristic}. This is a present interpretation of a remembered choice, not proof that the choice was optimal.`,
    unresolved_question:option.question,emotional_residue:pick(['quiet satisfaction with a remaining doubt','unease about a displaced commitment','affection mixed with frustration','relief without complete resolution','curiosity about the path not taken','pride complicated by an acknowledged cost'],random),
    counterfactual:{standing:'unexperienced_possibility',text:'Unchosen alternatives remain possibilities; no alternate outcome is recorded as something that happened.'},
    recall:{standing:'generated_recollection',detail:pick(['clear choice, uncertain wording','clear consequence, uncertain sequence within the year','strong emotional trace, incomplete situational detail'],random)}};
   decisions.push(memory);carry=option.orientation;
  }
  people.push({id,world_id:'V1',name:names[i],age,birth_year:2026-age,date_precision:'year-only; age is a fictional reference-age',reference_date:'2026-10-07',provenance:'fabricated_origin',standing:'staged',participant_kind:'fictional-human-origin',generator_version:POPULATION_VERSION,seed:personSeed,
   template_lineage:{standing:'newly-authored',template_id:pattern[0],version:'1',professional_registry_import:'not-performed'},life_pattern:pattern[0],life_context:pattern[1],initial_priority:initialPriority,
   biography:`${names[i]} is a fictional ${age}-year-old Earth-origin character. ${pattern[1]} Their remembered life centres on choices and consequences rather than a claim to one career.`,
   decisions,learned_heuristics:decisions.slice(-3).map(d=>({text:d.working_rule,decision_refs:[d.id],standing:'fallible-personal-interpretation'})),unresolved_threads:decisions.slice(-3).map(d=>({question:d.unresolved_question,decision_ref:d.id})),
   arrival:{premise:'transmigrant-remembers-earth',standing:'proposed-not-experienced',event_ref:null},system:{standing:'interface-proposal',ability_grants:[]},authority_grants:[],experienced_event_refs:[]});
 }
 const relationships=[];
 for(let i=0;i+1<count;i+=2)relationships.push({id:`v1-origin-relation-${i/2+1}`,world_id:'V1',from_id:people[i].id,to_id:people[i+1].id,type:'fictional-earth-acquaintance',provenance:'fabricated_origin',description:'They remember occasional contact through a shared local activity; this is generated background, not a V1 encounter.',reciprocal:true});
 const cohort={schema_version:'v1-population/1',generator_version:POPULATION_VERSION,world_id:'V1',reference_date:'2026-10-07',seed,standing:'staged-fictional-population',source_import:{standing:'not-performed',actual_count:null},people,relationships};cohort.content_digest=digest(cohort);return cohort;
}
export function validatePopulation(cohort){
 const fail=message=>{throw new Error(`Invalid V1 population: ${message}`);};
 const keys=(value,allowed)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!allowed.includes(key)))fail('unsupported fields');};
 keys(cohort,['schema_version','generator_version','world_id','reference_date','seed','standing','source_import','people','relationships','content_digest']);
 if(!cohort||cohort.schema_version!=='v1-population/1'||cohort.world_id!=='V1'||cohort.standing!=='staged-fictional-population'||!Array.isArray(cohort.people)||cohort.people.length<1||cohort.people.length>10000||!Array.isArray(cohort.relationships))fail('envelope');
 keys(cohort.source_import,['standing','actual_count']);
 if(cohort.generator_version!==POPULATION_VERSION||cohort.reference_date!=='2026-10-07'||typeof cohort.seed!=='string'||!cohort.seed.trim()||cohort.seed.length>200||cohort.source_import.standing!=='not-performed'||cohort.source_import.actual_count!==null)fail('generation/source envelope');
 const ids=new Set(),names=new Set();
 for(const p of cohort.people){
  keys(p,['id','world_id','name','age','birth_year','date_precision','reference_date','provenance','standing','participant_kind','generator_version','seed','template_lineage','life_pattern','life_context','initial_priority','biography','decisions','learned_heuristics','unresolved_threads','arrival','system','authority_grants','experienced_event_refs']);
  if(typeof p.id!=='string'||!p.id||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||names.has(p.name))fail('identity/name collision');ids.add(p.id);names.add(p.name);
  if(p.world_id!=='V1'||p.standing!=='staged'||p.provenance!=='fabricated_origin'||!Array.isArray(p.authority_grants)||p.authority_grants.length||!Array.isArray(p.experienced_event_refs)||p.experienced_event_refs.length||p.arrival?.event_ref!==null||p.arrival?.standing!=='proposed-not-experienced'||p.system?.ability_grants?.length!==0)fail('provenance or activation');
  keys(p.template_lineage,['standing','template_id','version','professional_registry_import']);keys(p.arrival,['premise','standing','event_ref']);keys(p.system,['standing','ability_grants']);
  if(p.generator_version!==POPULATION_VERSION||p.seed!==`${cohort.seed}:${p.id}`||p.reference_date!==cohort.reference_date||p.participant_kind!=='fictional-human-origin'||p.template_lineage.standing!=='newly-authored'||p.template_lineage.professional_registry_import!=='not-performed'||p.template_lineage.version!=='1'||p.template_lineage.template_id!==p.life_pattern||!lifePatterns.some(([id,context])=>id===p.life_pattern&&context===p.life_context)||p.system.standing!=='interface-proposal'||!Array.isArray(p.system.ability_grants)||p.arrival.premise!=='transmigrant-remembers-earth'||!priorities.includes(p.initial_priority))fail('identity lineage');
  if(!Number.isInteger(p.age)||p.age<18||p.age>84||p.birth_year!==2026-p.age||!Array.isArray(p.decisions)||p.decisions.length<8||p.decisions.length>20)fail('age or decisions');
  let last=15;const seen=new Set();
  for(const [index,d] of p.decisions.entries()){
   keys(d,['id','sequence','age','earth_year','scenario_id','provenance','situation','known_then','unknown_then','alternatives','choice_id','chosen_action','reason_at_the_time','priority_before','priority_after','influenced_by','influence_standing','consequence','cost','working_rule','later_interpretation','unresolved_question','emotional_residue','counterfactual','recall']);
   if(typeof d.id!=='string'||!d.id.startsWith(`${p.id}:decision:`)||seen.has(d.id)||d.sequence!==index+1||d.provenance!=='fabricated_origin'||!Number.isInteger(d.age)||d.age<last||d.age>p.age||d.earth_year!==p.birth_year+d.age)fail('decision chronology');last=d.age;
   if(!Array.isArray(d.alternatives)||d.alternatives.length<2||new Set(d.alternatives.map(o=>o.id)).size!==d.alternatives.length||!d.alternatives.some(o=>o.id===d.choice_id))fail('alternatives');
   for(const option of d.alternatives){keys(option,['id','action','anticipated_cost']);if(typeof option.id!=='string'||typeof option.action!=='string'||option.action.length<8||typeof option.anticipated_cost!=='string'||option.anticipated_cost.length<16)fail('alternative detail');}
   if(d.alternatives.find(o=>o.id===d.choice_id).action!==d.chosen_action)fail('chosen action mismatch');
   for(const key of ['situation','known_then','unknown_then','reason_at_the_time','consequence','cost','working_rule','later_interpretation','unresolved_question','emotional_residue'])if(typeof d[key]!=='string'||d[key].length<16)fail(`decision ${key}`);
   keys(d.recall,['standing','detail']);keys(d.counterfactual,['standing','text']);
   if(d.recall.standing!=='generated_recollection'||typeof d.recall.detail!=='string'||d.recall.detail.length<16||typeof d.counterfactual.text!=='string'||d.counterfactual.text.length<16||d.influence_standing!=='authored-fictional-link'||!scenarios.some(s=>s.id===d.scenario_id)||!priorities.includes(d.priority_after)||d.priority_before!==(index?p.decisions[index-1].priority_after:p.initial_priority))fail('interpretation and priority continuity');
   if(!Array.isArray(d.influenced_by)||d.influenced_by.some(ref=>!seen.has(ref))||(index>0&&!d.influenced_by.length)||d.counterfactual?.standing!=='unexperienced_possibility')fail('decision lineage');seen.add(d.id);
  }
  if(!Array.isArray(p.learned_heuristics)||!p.learned_heuristics.length||p.learned_heuristics.some(h=>typeof h.text!=='string'||h.text.length<16||h.standing!=='fallible-personal-interpretation'||!Array.isArray(h.decision_refs)||!h.decision_refs.length||h.decision_refs.some(ref=>!seen.has(ref))))fail('heuristic lineage');
  if(!Array.isArray(p.unresolved_threads)||!p.unresolved_threads.length||p.unresolved_threads.some(t=>typeof t.question!=='string'||t.question.length<16||!seen.has(t.decision_ref)))fail('unresolved lineage');
 }
 const edges=new Set();for(const r of cohort.relationships){if(!r.id||edges.has(r.id)||r.world_id!=='V1'||r.provenance!=='fabricated_origin'||!ids.has(r.from_id)||!ids.has(r.to_id)||r.from_id===r.to_id)fail('relationship');edges.add(r.id);}
 const {content_digest,...body}=cohort;if(content_digest!==digest(body))fail('content digest');return true;
}
