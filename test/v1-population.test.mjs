import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {generatePopulation, validatePopulation} from '../src/v1-population.mjs';

test('1000 fictional origins have unique names, IDs and diverse non-job life paths', () => {
  const cohort = generatePopulation({count:1000,seed:'v1-earth-2026'});
  assert.equal(cohort.people.length,1000);
  assert.equal(new Set(cohort.people.map(p=>p.name)).size,1000);
  assert.equal(new Set(cohort.people.map(p=>p.id)).size,1000);
  assert.ok(new Set(cohort.people.map(p=>p.life_pattern)).size>=10);
  for(const kind of ['unpaid-care','informal-learning','between-directions','mixed-livelihoods']) assert.ok(cohort.people.some(p=>p.life_pattern===kind));
  assert.equal(validatePopulation(cohort),true);
});
test('origins regenerate exactly and distinct seeds produce different histories', () => {
  const a=generatePopulation({count:25,seed:'alpha'});
  assert.deepEqual(generatePopulation({count:25,seed:'alpha'}),a);
  assert.notDeepEqual(generatePopulation({count:25,seed:'beta'}).people,a.people);
});
test('decisions preserve alternatives and uncertainty with earlier consequence links', () => {
  const {people}=generatePopulation({count:1000,seed:'v1-earth-2026'});
  const signatures=new Set();
  for(const p of people){
    assert.equal(p.provenance,'fabricated_origin');assert.equal(p.standing,'staged');
    assert.deepEqual(p.authority_grants,[]);assert.deepEqual(p.experienced_event_refs,[]);
    assert.ok(p.age>=18&&p.age<=84);assert.ok(p.decisions.length>=8);
    let priorAge=15;const seen=new Set();
    for(const d of p.decisions){
      assert.ok(d.age>=priorAge&&d.age<=p.age);priorAge=d.age;
      assert.ok(d.alternatives.length>=2);assert.ok(d.alternatives.some(o=>o.id===d.choice_id));
      for(const key of ['situation','reason_at_the_time','known_then','unknown_then','consequence','cost','later_interpretation','unresolved_question']) assert.ok(d[key]?.length>15,key);
      assert.equal(d.provenance,'fabricated_origin');
      for(const ref of d.influenced_by) assert.ok(seen.has(ref));
      if(seen.size) assert.ok(d.influenced_by.length>0);
      seen.add(d.id);
    }
    for(const h of p.learned_heuristics) assert.ok(h.decision_refs.every(ref=>seen.has(ref)));
    signatures.add(p.decisions.map(d=>`${d.scenario_id}:${d.choice_id}`).join('|'));
  }
  assert.equal(signatures.size,1000);
});
test('validator refuses false experience, dangling lineage, duplicate names and impossible ages',()=>{
  for(const mutate of [c=>c.people[0].provenance='experienced',c=>c.people[0].authority_grants=['admin'],c=>c.people[0].decisions[1].influenced_by=['missing'],c=>c.people[1].name=c.people[0].name,c=>c.people[0].decisions[0].age=999,c=>c.relationships[0].to_id='missing']){
    const c=generatePopulation({count:5,seed:'bad'});mutate(c);const {content_digest,...body}=c;c.content_digest=createHash('sha256').update(JSON.stringify(body)).digest('hex');assert.throws(()=>validatePopulation(c));
  }
});
test('fresh digests cannot conceal missing memory depth, contradictory choices or invented registry imports',()=>{
  const mutations=[
    c=>delete c.people[0].decisions[0].chosen_action,
    c=>delete c.people[0].decisions[0].working_rule,
    c=>delete c.people[0].decisions[0].emotional_residue,
    c=>delete c.people[0].decisions[0].recall,
    c=>c.people[0].decisions[0].chosen_action='An action that was never among the alternatives',
    c=>c.people[0].decisions[0].alternatives[0].action=12,
    c=>c.source_import={standing:'performed',actual_count:197},
    c=>c.people[0].template_lineage.professional_registry_import='performed',
    c=>c.people[0].system.standing='running',
    c=>c.people[0].unresolved_threads[0].decision_ref='missing',
    c=>c.people[0].secret_key='not-allowed',
  ];
  for(const mutate of mutations){const c=generatePopulation({count:3,seed:'semantic'});mutate(c);const {content_digest,...body}=c;c.content_digest=createHash('sha256').update(JSON.stringify(body)).digest('hex');assert.throws(()=>validatePopulation(c));}
});
test('generator refuses invalid sizes and empty seeds',()=>{
  for(const count of [0,-1,1.5,10001,NaN]) assert.throws(()=>generatePopulation({count,seed:'valid'}));
  assert.throws(()=>generatePopulation({count:5,seed:''}));
});
