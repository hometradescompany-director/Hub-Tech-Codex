const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const fs = require('node:fs/promises');
const net = require('node:net');
const path = require('node:path');

const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const evidenceDirectory = process.env.PROBE_EVIDENCE_DIR;
if (!runtimeModules) throw Error('Set CODEX_PRIMARY_RUNTIME_NODE_MODULES to the operator Playwright module directory');
if (!evidenceDirectory) throw Error('Set PROBE_EVIDENCE_DIR to an existing directory outside tracked source');

const {chromium} = require(path.join(runtimeModules, 'playwright'));
const repositoryRoot = path.resolve(__dirname, '../..');
const serverScript = path.join(__dirname, 'server.mjs');
const pages = new Set();
let server;

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const {port} = listener.address();
  await new Promise(resolve => listener.close(resolve));
  return port;
}

async function startServer() {
  const port = await freePort();
  const child = spawn(process.execPath, [serverScript], {
    cwd: repositoryRoot,
    env: {...process.env, PORT: String(port)},
    stdio: 'ignore',
  });
  const origin = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw Error(`Probe server exited with status ${child.exitCode}`);
    try {
      const response = await fetch(origin);
      if (response.ok) return {child, origin};
    } catch {}
    await delay(50);
  }
  await stopServer(child);
  throw Error('Probe server did not become ready');
}

function observePage(page) {
  const observed = {requests: [], responses: [], responseBodies: [], consoleErrors: [], pageErrors: []};
  page.on('request', request => observed.requests.push(request.url()));
  page.on('response', response => {
    observed.responses.push({url: response.url(), status: response.status()});
    observed.responseBodies.push(response.body().then(body => body.byteLength));
  });
  page.on('console', message => {
    if (message.type() === 'error') observed.consoleErrors.push(message.text());
  });
  page.on('pageerror', error => observed.pageErrors.push(error.message));
  return observed;
}

async function responseSummary(observed, origin) {
  const externalRequests = observed.requests.filter(url => new URL(url).origin !== origin);
  assert.deepEqual(externalRequests, [], 'page made an unexpected external request');
  return {
    requests: observed.requests.length,
    decodedResponseBytes: (await Promise.all(observed.responseBodies)).reduce((sum, bytes) => sum + bytes, 0),
    consoleErrors: observed.consoleErrors,
    pageErrors: observed.pageErrors,
  };
}

async function state(page) {
  return JSON.parse(await page.locator('#state').innerText());
}

async function waitForStatus(page, text) {
  await page.waitForFunction(
    expected => document.querySelector('#render-status').textContent.includes(expected),
    text,
    {timeout: 60000},
  );
}

async function browserPage(browser, viewport) {
  const page = await browser.newPage({viewport, deviceScaleFactor: 1});
  await page.route('**/favicon.ico', route => route.fulfill({status: 204, body: ''}));
  pages.add(page);
  return page;
}

async function pickPoint(page, placeId) {
  return page.evaluate(async id => {
    const Babylon = await import('/probes/v1-renderer/node_modules/@babylonjs/core/index.js');
    const scene = Babylon.EngineStore.LastCreatedScene;
    const canvas = document.querySelector('#scene');
    const engine = scene.getEngine();
    const rect = canvas.getBoundingClientRect();
    const width = engine.getRenderWidth();
    const height = engine.getRenderHeight();
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const picked = scene.pick(x, y, mesh => mesh.metadata?.placeId === id);
        if (picked?.hit) {
          return {
            x: rect.left + x * rect.width / width,
            y: rect.top + y * rect.height / height,
            rect: {left: rect.left, top: rect.top, width: rect.width, height: rect.height},
            render: {width, height},
          };
        }
      }
    }
    throw Error(`Could not find a rendered pick point for ${id}`);
  }, placeId);
}

async function exerciseViewport(browser, origin, label, viewport) {
  const page = await browserPage(browser, viewport);
  const observed = observePage(page);
  await page.goto(`${origin}/`, {waitUntil: 'networkidle'});
  await waitForStatus(page, '3D active');

  const graphics = await page.evaluate(() => {
    const canvas = document.querySelector('#scene');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const rendererInfo = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      context: gl?.getParameter(gl.VERSION),
      renderer: rendererInfo && gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL),
      lost: gl?.isContextLost(),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    };
  });
  assert.match(graphics.context ?? '', /WebGL 2\.0/);
  assert.match(graphics.renderer ?? '', /SwiftShader/);
  assert.equal(graphics.lost, false);
  assert.ok(observed.responses.some(({url, status}) => new URL(url).pathname.endsWith('/node_modules/@babylonjs/core/index.js') && status === 200));

  const initial = await state(page);
  const canvas = await page.locator('#scene').boundingBox();
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width / 2 + 35, canvas.y + canvas.height / 2 + 15, {steps: 6});
  await page.mouse.up();
  await page.waitForTimeout(800);
  assert.deepEqual(await state(page), initial, 'camera input and rendered frames must not change fixture history or state');

  await page.getByRole('button', {name: 'Training ground', exact: true}).click();
  const training = await state(page);
  assert.equal(training.place, 'training');
  assert.equal(training.revision, initial.revision + 1);

  await page.getByRole('button', {name: 'Forge', exact: true}).click();
  assert.match(await page.locator('#result').innerText(), /unreachable_place/);
  assert.deepEqual(await state(page), training, 'an unreachable move must preserve revision and state');

  await page.getByRole('button', {name: 'Practise', exact: true}).click();
  const practised = await state(page);
  assert.equal(practised.practice, 1);
  assert.equal(practised.revision, training.revision + 1);

  const campButton = page.getByRole('button', {name: 'Camp', exact: true});
  await campButton.focus();
  await page.keyboard.press('Enter');
  const camp = await state(page);
  assert.equal(camp.place, 'camp', 'semantic place buttons must support keyboard activation');
  assert.equal(camp.revision, practised.revision + 1);

  await page.evaluate(() => window.scrollTo(0, 0));
  const trainingPoint = await pickPoint(page, 'training');
  await page.mouse.click(trainingPoint.x, trainingPoint.y);
  const picked = await state(page);
  assert.equal(picked.place, 'training', `a real SDK mesh pick must propose the same fixture move as its semantic button (${JSON.stringify({trainingPoint, picked, result: await page.locator('#result').innerText()})})`);
  assert.equal(picked.revision, camp.revision + 1);

  await page.screenshot({path: path.join(evidenceDirectory, `${label}.png`), fullPage: true});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(observed.pageErrors, []);
  assert.deepEqual(observed.consoleErrors, []);
  const requests = await responseSummary(observed, origin);
  console.log(JSON.stringify({viewport: label, browserViewport: viewport, graphics, ...requests}));

  await page.getByRole('button', {name: 'Dispose 3D'}).click();
  await waitForStatus(page, '3D disposed');
  await page.getByRole('button', {name: 'Camp', exact: true}).click();
  assert.equal((await state(page)).place, 'camp', 'text controls must remain usable after disposal');

  await page.getByRole('button', {name: 'Mount 3D'}).click();
  await waitForStatus(page, '3D active');
  await page.getByRole('button', {name: 'Training ground', exact: true}).click();
  assert.equal((await state(page)).place, 'training', 'a remounted renderer must leave the fixture usable');
  assert.deepEqual(observed.pageErrors, []);
  assert.deepEqual(observed.consoleErrors, []);
}

async function exerciseContextLoss(browser, origin) {
  const page = await browserPage(browser, {width: 1280, height: 800});
  const observed = observePage(page);
  await page.goto(`${origin}/`, {waitUntil: 'networkidle'});
  await waitForStatus(page, '3D active');
  const before = await state(page);
  const lossStarted = await page.evaluate(() => {
    const canvas = document.querySelector('#scene');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  assert.equal(lossStarted, true, 'the browser must provide WEBGL_lose_context for this check');
  await waitForStatus(page, 'WebGL context lost');
  assert.deepEqual(await state(page), before);
  await page.getByRole('button', {name: 'Training ground', exact: true}).click();
  assert.equal((await state(page)).place, 'training', 'fixture controls must work after actual WebGL context loss');
  assert.deepEqual(observed.pageErrors, []);
  assert.deepEqual(observed.consoleErrors, []);
  const requests = await responseSummary(observed, origin);
  console.log(JSON.stringify({contextLoss: 'WEBGL_lose_context', consoleErrors: observed.consoleErrors, ...requests}));
}

async function exerciseMissingSdk(browser, origin) {
  const page = await browserPage(browser, {width: 1280, height: 800});
  const observed = observePage(page);
  await page.route('**/node_modules/@babylonjs/core/index.js', route => route.fulfill({status: 404, body: 'SDK unavailable'}));
  await page.goto(`${origin}/`, {waitUntil: 'networkidle'});
  await waitForStatus(page, '3D unavailable');
  await page.getByRole('button', {name: 'Training ground', exact: true}).click();
  assert.equal((await state(page)).place, 'training', 'semantic fixture controls must work when the SDK is missing');
  assert.deepEqual(observed.pageErrors, []);
  assert.equal(observed.consoleErrors.length, 1);
  assert.match(observed.consoleErrors[0], /status of 404/);
  assert.ok(observed.responses.some(({url, status}) => new URL(url).pathname.endsWith('/node_modules/@babylonjs/core/index.js') && status === 404));
  const requests = await responseSummary(observed, origin);
  console.log(JSON.stringify({sdkFallback: 'HTTP 404', consoleErrors: observed.consoleErrors, ...requests}));
}

async function exerciseStaleImports(browser, origin) {
  const page = await browserPage(browser, {width: 1280, height: 800});
  const observed = observePage(page);
  let releaseImport;
  let signalImportStarted;
  const importStarted = new Promise(resolve => {
    signalImportStarted = resolve;
  });
  const importGate = new Promise(resolve => {
    releaseImport = resolve;
  });
  await page.route('**/node_modules/@babylonjs/core/index.js', async route => {
    signalImportStarted();
    await importGate;
    await route.continue();
  });

  try {
    await page.goto(`${origin}/`);
    await Promise.race([
      importStarted,
      delay(10000).then(() => {
        throw Error('The pinned SDK import did not start');
      }),
    ]);
    const before = await state(page);
    await page.getByRole('button', {name: 'Dispose 3D'}).click();
    await page.getByRole('button', {name: 'Mount 3D'}).click();
    await page.getByRole('button', {name: 'Dispose 3D'}).click();
    releaseImport();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#render-status').innerText(), '3D disposed; textual fixture remains available');
    assert.deepEqual(await state(page), before, 'stale overlapping imports must not mount a renderer or mutate fixture state');
    await page.getByRole('button', {name: 'Training ground', exact: true}).click();
    assert.equal((await state(page)).place, 'training');
    assert.deepEqual(observed.pageErrors, []);
    assert.deepEqual(observed.consoleErrors, []);
    const requests = await responseSummary(observed, origin);
    console.log(JSON.stringify({delayedOverlappingMounts: 'disposed before real pinned SDK import resolved', ...requests}));
  } finally {
    releaseImport();
    await page.unroute('**/node_modules/@babylonjs/core/index.js');
  }
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise(resolve => child.once('exit', resolve));
  child.kill('SIGTERM');
  const stopped = await Promise.race([exited.then(() => true), delay(2000).then(() => false)]);
  if (!stopped) {
    child.kill('SIGKILL');
    await exited;
  }
}

(async () => {
  let browser;
  try {
    await fs.access(evidenceDirectory);
    const {child, origin} = await startServer();
    server = child;
    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
    };
    if (process.env.PROBE_CHROMIUM_EXECUTABLE) launchOptions.executablePath = process.env.PROBE_CHROMIUM_EXECUTABLE;
    browser = await chromium.launch(launchOptions);

    await exerciseViewport(browser, origin, 'desktop-1280x800', {width: 1280, height: 800});
    await exerciseViewport(browser, origin, 'mobile-viewport-390x844', {width: 390, height: 844});
    await exerciseContextLoss(browser, origin);
    await exerciseMissingSdk(browser, origin);
    await exerciseStaleImports(browser, origin);
  } finally {
    for (const page of pages) await page.close().catch(() => {});
    await browser?.close().catch(() => {});
    await stopServer(server);
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
