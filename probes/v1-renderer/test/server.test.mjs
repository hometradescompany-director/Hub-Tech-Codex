import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
test('local static server serves probe and installed SDK modules', async () => {
  const child = spawn(process.execPath, [new URL('../server.mjs', import.meta.url).pathname], {
    env: {
      ...process.env, PORT: '4192'
    }
  });
  try {
    await new Promise((resolve, reject) => {
      child.stdout.once('data', resolve);
      child.once('error', reject);
      child.once('exit', code => reject(Error(`server exit ${code}`)));
    });
    for (const url of ['/', '/probes/v1-renderer/view.mjs', '/probes/v1-renderer/node_modules/@babylonjs/core/index.js', '/src/v1-scene.mjs']) {
      const response = await fetch('http://127.0.0.1:4192' + url);
      assert.equal(response.status, 200, url);
      assert.ok((await response.text()).length > 0);
    }
  } finally {
    child.kill();
  }
});
