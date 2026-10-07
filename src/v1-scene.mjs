import { PLACES, replay } from './v1-engine.mjs';

const coordinates = {
  camp: [0, 0, 0],
  training: [-5, 0, 3],
  forge: [5, 0, 3]
};

/** Probe-only display layout: neither geography nor additional travel edges. */
export function createSceneProjection(run) {
  const verified = replay(run?.events);
  if (JSON.stringify(verified) !== JSON.stringify(run))
    throw Error('snapshot_divergence');

  return Object.freeze({
    rulesVersion: verified.rulesVersion,
    revision: verified.revision,
    grantsAuthority: false,
    standing: 'probe-only-display',
    places: Object.freeze(Object.entries(PLACES).map(([id, { label }]) => Object.freeze({
      id,
      label,
      position: Object.freeze([...coordinates[id]])
    }))),
    character: Object.freeze({ ...verified.state.character }),
    place: verified.state.place
  });
}
