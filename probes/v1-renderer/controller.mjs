import { createRun, act, replay } from '../../src/v1-engine.mjs';
import { createSceneProjection } from '../../src/v1-scene.mjs';
export function createController() {
  let run = createRun({
    name: 'Local explorer'
  }), sequence = 0;
  return {
    get run() {
      return run;
    },
    projection: () => createSceneProjection(run),
    propose(action, key = `probe-${++sequence}`) {
      const result = act(run, {
        ...action, key, expectedRevision: run.revision
      });
      if (result.ok)
        run = replay(result.run.events);
      return result;
    },
    select(place, key) {
      return this.propose({
        kind: 'move', place
      }, key);
    }
  };
}
