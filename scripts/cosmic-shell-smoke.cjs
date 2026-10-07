// Optional regression checks; Playwright is supplied by the operator, not the app.
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');

(async()=>{
 const port='4183';
 const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
 let browser;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error('Server exited '+code)));});
  browser=await chromium.launch({headless:true,args:['--no-proxy-server'],...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[],failures=[];
  page.on('pageerror',error=>errors.push(error.message));
  const check=async(name,run)=>{try{await run();console.log('PASS '+name);}catch(error){failures.push(name+': '+error.message);console.error('FAIL '+name+': '+error.message);}};
  const mainIs=async id=>{const main=page.getByRole('main');assert.equal(await main.count(),1,'one visible main landmark');assert.equal(await main.getAttribute('id'),id);};
  await page.goto('http://127.0.0.1:'+port+'/cosmic.html');
  await check('launcher has one main landmark',()=>mainIs('cosmic-launcher'));
  await page.locator('#enter-atlas').click();
  await page.waitForSelector('.body-button[data-body="universe"]');
  await check('entered world has one main landmark',()=>mainIs('atlas-world'));
  for(const viewport of [{width:844,height:390},{width:390,height:844},{width:1440,height:1000},{width:1920,height:1080}]){
   await page.setViewportSize(viewport);
   await page.waitForFunction(()=>document.getElementById('atlas-world').getBoundingClientRect().width===innerWidth);
   await check('HUD leaves bodies visible and clickable at '+viewport.width+'x'+viewport.height,async()=>{
    const field=await page.locator('#cosmic-scene').boundingBox();
    const hud=await page.locator('.view-controls').boundingBox();
    const bodies=page.locator('.body-button');
    assert.ok(await bodies.count()>0);
    for(const body of await bodies.all()){
     const bounds=await body.boundingBox();
     const id=await body.getAttribute('data-body');
     assert.ok(bounds.y>=hud.y+hud.height+8,id+' is below navigation HUD');
     assert.ok(bounds.y+bounds.height<=field.y+field.height,id+' stays inside the scene');
     const hit=await body.evaluate(button=>{
      const r=button.querySelector('.sphere').getBoundingClientRect();
      return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.body-button')?.dataset.body;
     });
     assert.equal(hit,id,id+' sphere receives its own clicks');
    }
    await page.locator('.body-button[data-body="universe"]').click({timeout:1500});
    assert.equal(await page.locator('#matter-inspector').isVisible(),true);
    assert.match(await page.locator('#matter-inspector .evidence-dl').textContent(),/Identityuniverse/);
    await page.locator('#evidence-toggle').click();
   });
  }
  await page.locator('#exit-atlas').click();
  await check('exit restores launcher landmark and focus',async()=>{await mainIs('cosmic-launcher');assert.equal(await page.locator('#enter-atlas').evaluate(button=>button===document.activeElement),true);});
  await page.locator('#enter-atlas').click();
  await check('re-entry restores world landmark',()=>mainIs('atlas-world'));
  await check('no browser execution errors',async()=>assert.deepEqual(errors,[]));
  if(failures.length)throw new Error(failures.join('\n'));
  console.log('Cosmic shell regression checks passed.');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
