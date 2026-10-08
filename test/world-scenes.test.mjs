import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {projectCosmic} from '../src/cosmic.mjs';import {cosmicScene,hubScene} from '../src/world-scenes.mjs';
const packet=JSON.parse(await readFile(new URL('../data/cosmic-fixture.json',import.meta.url)));
test('3D adapter preserves each source identity, explicit bonds and source packet',()=>{
 const before=JSON.stringify(packet),projection=projectCosmic(packet),scene=cosmicScene(projection);
 assert.equal(new Set(scene.objects.map(o=>o.id)).size,scene.objects.length);
 assert.deepEqual(scene.objects.map(o=>o.id).sort(),[...projection.bodies,...projection.atoms].map(o=>o.id).sort());
 assert.deepEqual(scene.edges.map(e=>e.id).sort(),projection.relationships.map(e=>e.id).sort());
 assert.ok(scene.objects.every(o=>o.position.length===3&&o.position.every(Number.isFinite)));assert.equal(JSON.stringify(packet),before);
});
test('descending projects only the chosen context without duplicating multi-parent bodies',()=>{
 const scene=cosmicScene(projectCosmic(packet),{focus:'p:atlas',selected:'p:atlas'});
 assert.ok(scene.objects.some(o=>o.id==='p:atlas'));assert.equal(scene.objects.some(o=>o.id==='universe'),false);
 assert.equal(scene.objects.filter(o=>o.kind!=='event').length,1);
});
test('Hub filtered spatial view keeps source IDs and does not manufacture edges',()=>{
 const graph={nodes:[{id:'codex',label:'Hub',kind:'hub'},{id:'repo',label:'Repo',kind:'repository'}],edges:[{id:'edge',from:'codex',to:'repo'}]};
 const scene=hubScene(graph,graph.nodes,'repo');assert.deepEqual(scene.objects.map(o=>o.id),['codex','repo']);assert.deepEqual(scene.edges,graph.edges);assert.equal(scene.selected,'repo');
});
