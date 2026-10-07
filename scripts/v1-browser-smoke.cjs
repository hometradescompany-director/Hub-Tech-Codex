const {chromium}=require('playwright');const {spawn}=require('node:child_process');const assert=require('node:assert/strict');
(async()=>{const server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:'pipe'});let browser;try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-proxy-server']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const path of ['v1.html','src/v1-app.mjs','src/v1-engine.mjs'])assert.equal((await page.request.get('http://127.0.0.1:4173/'+path)).status(),200);
 await page.goto('http://127.0.0.1:4173/v1.html');await page.locator('#character-name').fill('Cobby');await page.locator('#remember').check();await page.locator('#create-character').click();
 await page.locator('[data-place=training]').click();await page.locator('[data-action=practice]').click();await page.locator('[data-action=practice]').click();
 await page.locator('[data-place=camp]').click();await page.locator('[data-place=forge]').click();await page.locator('[data-action=craft]').click();await page.locator('[data-action=cast]').click();
 assert.match(await page.locator('#character-sheet').textContent(),/Spark casts: 1/);assert.match(await page.locator('#event-history').textContent(),/cast/);assert.doesNotMatch(await page.locator('#event-history').textContent(),/undefined/);await page.reload();assert.match(await page.locator('#character-sheet').textContent(),/Spark casts: 1/);
 await page.screenshot({path:'artifacts/v1-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/v1-mobile.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#leave-v1').click();assert.equal(await page.locator('#create-character').isVisible(),true);
 await page.evaluate(()=>localStorage.setItem('htc-v1-local',JSON.stringify({events:[{kind:'tampered'}]})));await page.reload();assert.match(await page.locator('#status').textContent(),/Saved fixture rejected/);assert.equal(await page.locator('#create-character').isVisible(),true);assert.deepEqual(errors,[]);
 console.log('V1 browser PASS: create, movement, practice, forging, magic, device replay, leave, malformed save refusal, desktop/mobile');
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
