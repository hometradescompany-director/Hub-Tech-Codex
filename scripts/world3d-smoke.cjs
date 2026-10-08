// Operator verification dependency only; the application has no package install.
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const {mkdir}=require('node:fs/promises');
(async()=>{
 const port='4185',server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});let browser;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',n=>reject(new Error('Server exited '+n)));});
  browser=await chromium.launch({headless:true,args:['--no-proxy-server','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:'+port;
  await page.goto(base);await page.waitForFunction(()=>Number(document.querySelector('.world3d-canvas')?.dataset.frame)>0);
  assert.equal(await page.locator('.world3d-canvas').getAttribute('data-renderer'),'webgl');
  const verify=async id=>{
   const state=await page.locator('.world3d-canvas').evaluate(canvas=>({version:canvas.getContext('webgl').getParameter(canvas.getContext('webgl').VERSION),error:canvas.getContext('webgl').getError()}));
   assert.match(state.version,/WebGL/);assert.equal(state.error,0);console.log('PASS WebGL context and GPU draw: '+id);
  };
  await verify('Hub');await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/hub-3d-desktop.png'});
  const before=await page.locator('#explorer').evaluate(host=>host.world3d.cameraState());
  const bounds=await page.locator('.world3d-canvas').boundingBox();await page.mouse.move(bounds.x+bounds.width*.72,bounds.y+bounds.height*.5);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.72+110,bounds.y+bounds.height*.5+30,{steps:8});await page.mouse.up();
  const after=await page.locator('#explorer').evaluate(host=>host.world3d.cameraState());assert.notEqual(after.theta,before.theta);console.log('PASS camera orbit changes the three-dimensional view');
  await page.locator('.world3d-label[data-id="codex"]').click();assert.match(await page.locator('#inspector-content').textContent(),/Hub Tech Codex/);
  await page.goto(base+'/cosmic.html');assert.equal(await page.getByRole('main').count(),1);await page.locator('#enter-atlas').click();
  await page.waitForFunction(()=>Number(document.querySelector('.world3d-canvas')?.dataset.frame)>0);await verify('Cosmic');assert.equal(await page.getByRole('main').count(),1);
  const hit=await page.locator('#cosmic-scene').evaluate(host=>{const p=host.world3d.projectObject('universe');return {point:p,id:host.world3d.pickAt(p.x,p.y)};});assert.equal(hit.id,'universe');
  const field=await page.locator('.world3d-canvas').boundingBox();await page.mouse.click(field.x+hit.point.x,field.y+hit.point.y);assert.equal(await page.locator('#matter-inspector').isVisible(),true);assert.match(await page.locator('#matter-inspector .evidence-dl').textContent(),/Identityuniverse/);await page.locator('#evidence-toggle').click();console.log('PASS three-dimensional picking opens the existing source evidence');
  await page.locator('#epoch').focus();await page.locator('#epoch').press('Home');assert.equal(await page.locator('.world3d-canvas').getAttribute('data-renderer'),'webgl');await page.locator('#epoch').press('End');await page.waitForFunction(()=>document.querySelector('#epoch').value===document.querySelector('#epoch').max);
  await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/cosmic-3d-desktop.png'});
  for(const viewport of [{width:844,height:390},{width:390,height:844}]){await page.setViewportSize(viewport);await page.waitForFunction(()=>{const c=document.querySelector('.world3d-canvas');return c.width>0&&c.height>0;});assert.equal(await page.locator('.world3d-canvas').getAttribute('data-renderer'),'webgl');const c=await page.locator('#cosmic-scene').evaluate(host=>host.world3d.cameraState());assert.ok(c.eye.every(Number.isFinite));assert.ok((await page.locator('.world3d-label:visible').count())>0);console.log('PASS finite visible 3D scene at '+viewport.width+'x'+viewport.height);}
  await page.screenshot({path:'artifacts/cosmic-3d-phone.png'});
  await page.locator('#exit-atlas').click();assert.equal(await page.getByRole('main').count(),1);assert.equal(await page.locator('#enter-atlas').evaluate(b=>b===document.activeElement),true);await page.locator('#enter-atlas').click();await page.waitForFunction(()=>Number(document.querySelector('.world3d-canvas')?.dataset.frame)>0);assert.deepEqual(errors,[]);console.log('PASS exit, re-entry, landmarks and browser execution');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
