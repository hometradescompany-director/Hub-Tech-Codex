import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from '@babylonjs/core/index.js';
import { createController } from '../controller.mjs';
import { mountRenderer } from '../adapter.mjs';
test('selection proposes identical fixture moves; refusals and retries preserve history', () => {
  const c = createController();
  assert.equal(c.select('training', 'one').ok, true);
  const before = JSON.stringify(c.run);
  assert.equal(c.select('forge', 'two').reason, 'unreachable_place');
  assert.equal(JSON.stringify(c.run), before);
  assert.equal(c.select('training', 'one').replayed, true);
  assert.equal(JSON.stringify(c.run), before);
});
test('real SDK meshes follow stable IDs; frames never progress and repeated disposal releases resources', () => {
  const c = createController(), engine = new B.NullEngine();
  let callback, stopped = 0, removed = 0;
  engine.runRenderLoop = fn => {
    callback = fn;
  };
  engine.stopRenderLoop = () => stopped++;
  const target = {
    addEventListener() {
    }, removeEventListener() {
      removed++;
    }
  };
  const r = mountRenderer({
    sdk: B, engine, canvas: target, windowTarget: target, projection: c.projection(), onSelect: id => c.select(id), onFailure: () => {}
  });
  assert.deepEqual(r.scene.meshes.filter(m => m.metadata?.placeId).map(m => m.metadata.placeId), ['camp', 'training', 'forge']);
  const before = JSON.stringify(c.run);
  for (let i = 0; i < 20; i++)
    callback();
  assert.equal(JSON.stringify(c.run), before);
  r.scene.onPointerObservable.notifyObservers({
    type: B.PointerEventTypes.POINTERPICK, pickInfo: {
      pickedMesh: r.scene.getMeshById('training')
    }
  });
  assert.equal(c.run.state.place, 'training');
  r.update(c.projection());
  assert.equal(r.scene.getMeshById(c.run.state.character.id).position.x, -5);
  r.dispose();
  const stoppedAfterDispose = stopped;
  r.dispose();
  assert.equal(r.scene.isDisposed, true);
  assert.ok(stoppedAfterDispose >= 1);
  assert.equal(stopped, stoppedAfterDispose);
  assert.equal(removed, 2);
});
test('missing SDK and context loss explicitly fall back without losing controller', () => {
  const c = createController();
  let reason;
  const unavailable = mountRenderer({
    projection: c.projection(), onFailure: x => reason = x
  });
  assert.match(reason, /unavailable/);
  unavailable.dispose();
  let loss;
  const canvas = {
    addEventListener(name, fn) {
      if (name === 'webglcontextlost')
        loss = fn;
    }, removeEventListener() {
    }
  };
  const engine = new B.NullEngine();
  engine.runRenderLoop = () => {};
  engine.stopRenderLoop = () => {};
  const r = mountRenderer({
    sdk: B, engine, canvas, projection: c.projection(), onFailure: x => reason = x
  });
  loss({
    preventDefault() {
    }
  });
  assert.match(reason, /context/);
  assert.equal(r.scene.isDisposed, true);
  assert.equal(c.select('training').ok, true);
  r.dispose();
});
