import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {validatePaths} from '../src/paths.mjs';
import {validateGraph} from '../src/graph.mjs';
test('development branches form an explicit dependency DAG',async()=>{const paths=JSON.parse(await readFile(new URL('../data/development-paths.json',import.meta.url)));assert.equal(validatePaths(paths),paths);assert.equal(new Set(paths.paths.map(p=>p.branch)).size,15);});
test('development path cycles and unknown dependencies are refused',()=>{const p={version:'hub-paths/v0',paths:[{id:'a',branch:'feature/a',dependsOn:['b']},{id:'b',branch:'feature/b',dependsOn:['a']}]};assert.throws(()=>validatePaths(p),/cycle/i);assert.throws(()=>validatePaths({...p,paths:[{id:'a',branch:'feature/a',dependsOn:['missing']}]}),/unknown/i)});
test('seed constellation remains valid and claims no connected nodes',async()=>{const graph=JSON.parse(await readFile(new URL('../data/constellation.json',import.meta.url)));validateGraph(graph);assert.ok(graph.nodes.length>=20);assert.equal(graph.nodes.filter(n=>n.standing==='connected').length,0);});
