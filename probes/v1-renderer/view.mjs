import { createController } from './controller.mjs';
import { mountRenderer } from './adapter.mjs';
const controller = createController(), canvas = document.querySelector('#scene'), status = document.querySelector('#render-status');
let renderer, sdk, mountGeneration = 0;
const places = document.querySelector('#places');
function draw() {
  const p = controller.projection();
  for (const button of places.children)
    button.setAttribute('aria-current', String(button.dataset.place === p.place));
  document.querySelector('#state').textContent = JSON.stringify({
    standing: controller.run.standing, rulesVersion: p.rulesVersion, revision: p.revision, grantsAuthority: false, ...controller.run.state
  }, null, 2);
  renderer?.update(p);
}

function propose(action) {
  const result = controller.propose(action);
  document.querySelector('#result').textContent = result.ok ? 'Accepted local fixture action': `Refused: ${result.reason}`;
  draw();
}

for (const place of controller.projection().places) {
  const button = document.createElement('button');
  button.textContent = place.label;
  button.dataset.place = place.id;
  button.onclick = () => propose({
    kind: 'move', place: place.id
  });
  places.append(button);
}

for (const button of document.querySelectorAll('[data-kind]'))button.onclick = () => propose({
  kind: button.dataset.kind, ...(button.dataset.kind === 'craft' ? {
    recipe: 'focus'
  }: button.dataset.kind === 'cast' ? {
    ability: 'spark'
  }: {
  })
});
async function mount() {
  const generation = ++mountGeneration;
  renderer?.dispose();
  renderer = undefined;
  status.textContent = 'Loading optional 3D…';
  try {
    sdk ??= await import('./node_modules/@babylonjs/core/index.js');
    if (generation !== mountGeneration)
      return;
    renderer = mountRenderer({
      sdk, canvas, projection: controller.projection(), onSelect: place => propose({
        kind: 'move', place
      }), onFailure: message => status.textContent = message
    });
    if (renderer.scene && !renderer.scene.isDisposed)
      status.textContent = '3D active; the readable fixture remains available.';
  } catch (error) {
    if (generation === mountGeneration)
      status.textContent = `3D unavailable: ${error.message}; textual fixture remains available`;
  }
}

function dispose() {
  mountGeneration++;
  renderer?.dispose();
  renderer = undefined;
  status.textContent = '3D disposed; textual fixture remains available';
}

document.querySelector('#dispose').onclick = dispose;
document.querySelector('#mount').onclick = mount;
window.addEventListener('pagehide', dispose, {
  once: true
});
draw();
mount();
