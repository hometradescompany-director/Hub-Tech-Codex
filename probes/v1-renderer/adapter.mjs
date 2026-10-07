/** Rendering and selection callbacks confer no fixture authority. */
export function mountRenderer({
  sdk,
  engine,
  canvas,
  windowTarget = globalThis.window,
  projection,
  onSelect = () => {},
  onFailure = () => {}
} = {}) {
  let scene, ownedEngine = engine, disposed = false, observer;
  const meshes = new Map();
  let character;
  const resize = () => {
    try {
      ownedEngine.resize();
    } catch {
      fail('Renderer resize failed');
    }
  };
  const lost = event => {
    event.preventDefault();
    fail('WebGL context lost; textual fixture remains available');
  };
  const frame = () => {
    if (!disposed)try {
      scene.render();
    } catch {
      fail('Renderer frame failed; textual fixture remains available');
    }
  };
  function dispose() {
    if (disposed)
      return;
    disposed = true;
    canvas?.removeEventListener('webglcontextlost', lost);
    windowTarget?.removeEventListener('resize', resize);
    if (scene && observer)
      scene.onPointerObservable.remove(observer);
    ownedEngine?.stopRenderLoop(frame);
    scene?.dispose();
    ownedEngine?.dispose();
  }

  function fail(message) {
    dispose();
    onFailure(message);
  }

  function update(p) {
    if (disposed)
      return;
    const place = p.places.find(x => x.id === p.place);
    if (!place || p.grantsAuthority !== false)
      throw Error('invalid_projection');
    character.position.copyFromFloats(place.position[0], 1.2, place.position[2]);
  }

  try {
    if (!sdk)
      throw Error('SDK unavailable');
    ownedEngine ??= new sdk.Engine(canvas, true);
    scene = new sdk.Scene(ownedEngine);
    scene.clearColor = new sdk.Color4(.04, .06, .1, 1);
    const camera = new sdk.ArcRotateCamera('probe-camera', -Math.PI / 2, Math.PI / 3, 18, new sdk.Vector3(0, 0, 2), scene);
    if (canvas?.getContext)
      camera.attachControl(canvas, true);
    new sdk.HemisphericLight('probe-light', new sdk.Vector3(0, 1, 0), scene);
    for (const place of projection.places) {
      const mesh = sdk.MeshBuilder.CreateBox(place.id, {
        width: 3, depth: 3, height: .3
      }, scene);
      mesh.id = place.id;
      mesh.position.copyFromFloats(...place.position);
      mesh.metadata = {
        placeId: place.id
      };
      meshes.set(place.id, mesh);
    }
    character = sdk.MeshBuilder.CreateSphere(projection.character.id, {
      diameter: 1.2
    }, scene);
    character.id = projection.character.id;
    character.isPickable = false;
    observer = scene.onPointerObservable.add(info => {
      if (info.type === sdk.PointerEventTypes.POINTERPICK) {
        const id = info.pickInfo?.pickedMesh?.metadata?.placeId;
        if (meshes.has(id))
          onSelect(id);
      }
    });
    canvas?.addEventListener('webglcontextlost', lost);
    windowTarget?.addEventListener('resize', resize);
    update(projection);
    ownedEngine.runRenderLoop(frame);
  } catch (error) {
    fail(`3D unavailable: ${error.message}; textual fixture remains available`);
  }

  return {
    get scene() {
      return scene;
    },
    update,
    dispose
  };
}
