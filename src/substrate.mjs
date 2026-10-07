/** Newly authored projection of the sine-field mathematics supplied by Jarrod
 * Cobb, 2026-10-07. Points are decoration, never event atoms or causal edges. */
export function substrateFrame({width,height,seconds,bodyCount}) {
  for(const value of [width,height,seconds,bodyCount])if(!Number.isFinite(value)||value<0)throw new Error('Invalid substrate coordinate');
  const radius=Math.min(width,height)*(.24+.20*Math.min(1,Math.log1p(bodyCount)/Math.log(21)));
  const phase=(seconds*.0003)%(2*Math.PI);
  const modulation=Math.sin(phase)*2*Math.PI;
  return Array.from({length:400},(_,i)=>{
    const r=radius*Math.sin(i*modulation);
    return {x:width/2+Math.sin(i)*r,y:height/2+Math.cos(i)*r,hue:(i+12)%360};
  });
}

export function mountSubstrate(canvas,{host,toggle,getBodyCount}) {
  const context=canvas.getContext('2d');
  if(!context){toggle.disabled=true;return ()=>{};}
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let paused=reduced.matches,frame=0,last=null,seconds=30,disposed=false;
  function paint(){
    const {width,height}=host.getBoundingClientRect();if(!width||!height)return;
    const dpr=Math.min(devicePixelRatio||1,2);
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    }
    context.setTransform(dpr,0,0,dpr,0,0);
    context.globalCompositeOperation='source-over';
    context.clearRect(0,0,width,height);
    for(const p of substrateFrame({width,height,seconds,bodyCount:getBodyCount()})){
      context.fillStyle=`hsl(${p.hue} 70% 65% / .28)`;
      context.beginPath();context.arc(p.x,p.y,1.1,0,2*Math.PI);context.fill();
    }
  }
  function tick(now){
    frame=0;if(disposed||paused||document.hidden||host.hidden)return;
    if(last!==null)seconds+=Math.min((now-last)/1000,.1);
    last=now;paint();frame=requestAnimationFrame(tick);
  }
  function sync(){
    cancelAnimationFrame(frame);last=null;paint();
    toggle.textContent=paused?'Animate substrate':'Pause substrate';
    toggle.setAttribute('aria-pressed',String(!paused));
    if(!paused&&!document.hidden&&!host.hidden)frame=requestAnimationFrame(tick);
  }
  const click=()=>{paused=!paused;sync();};
  const preference=()=>{paused=reduced.matches;sync();};
  toggle.addEventListener('click',click);reduced.addEventListener('change',preference);
  document.addEventListener('visibilitychange',sync);
  const resize=new ResizeObserver(sync);resize.observe(host);
  const visibility=new MutationObserver(sync);visibility.observe(host,{attributes:true,attributeFilter:['hidden']});
  sync();
  return ()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();visibility.disconnect();toggle.removeEventListener('click',click);reduced.removeEventListener('change',preference);document.removeEventListener('visibilitychange',sync);};
}
