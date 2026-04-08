// ⚠️ ONLY CHANGE: runAnalysis() updated to use Flask backend
// Everything else is SAME as your original file

const SAMPLE=`a1b2c3d feat: add user authentication with JWT tokens
e4f5g6h fix: resolve login redirect loop on mobile
i7j8k9l feat: implement dashboard chart components
m0n1o2p chore: update webpack dependencies
q3r4s5t fix: correct timezone offset in scheduler
u6v7w8x feat: add CSV export for reports
y9z0a1b fix: patch XSS vulnerability in comments
c2d3e4f feat: implement team member invite flow
g5h6i7j release: v2.1.0 — dashboard milestone shipped
k8l9m0n fix: resolve race condition in async fetch
o1p2q3r feat: dark mode support across all pages
s4t5u6v chore: add unit tests for auth module
w7x8y9z feat: integrate Stripe payment gateway
a0b1c2d fix: memory leak in image carousel
e3f4g5h release: v2.2.0 — payments milestone`;

let parsedData=null, audioCtx=null, journeyActive=false, journeyTimer=null;

/* ═══════════════ AUDIO ═══════════════ */
function getAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}

function playRocket(){
  try{
    const ctx=getAudio(), now=ctx.currentTime, dur=4.0;
    // LAYER 1: Deep low-frequency rumble (engine core)
    const rumbleBuf=ctx.createBuffer(2,ctx.sampleRate*dur,ctx.sampleRate);
    for(let ch=0;ch<2;ch++){
      const d=rumbleBuf.getChannelData(ch);
      for(let i=0;i<d.length;i++){
        const t=i/ctx.sampleRate;
        const rumble=(Math.random()*2-1)*0.7;
        const sine1=Math.sin(2*Math.PI*40*t)*0.3;
        const sine2=Math.sin(2*Math.PI*65*t)*0.2;
        const sine3=Math.sin(2*Math.PI*120*t)*0.1;
        d[i]=(rumble+sine1+sine2+sine3)*Math.min(1,t*3)*(1-t/dur*0.3);
      }
    }
    const rumbleSrc=ctx.createBufferSource(); rumbleSrc.buffer=rumbleBuf;
    const lp1=ctx.createBiquadFilter(); lp1.type='lowpass'; lp1.frequency.setValueAtTime(180,now); lp1.frequency.linearRampToValueAtTime(80,now+dur);
    const g1=ctx.createGain(); g1.gain.setValueAtTime(0,now); g1.gain.linearRampToValueAtTime(0.55,now+0.15); g1.gain.setValueAtTime(0.55,now+2.5); g1.gain.linearRampToValueAtTime(0.001,now+dur);
    rumbleSrc.connect(lp1); lp1.connect(g1); g1.connect(ctx.destination); rumbleSrc.start(now);

    // LAYER 2: Mid-range crackling thrust
    const thrustBuf=ctx.createBuffer(1,ctx.sampleRate*dur,ctx.sampleRate);
    const td=thrustBuf.getChannelData(0);
    for(let i=0;i<td.length;i++){
      const t=i/ctx.sampleRate;
      td[i]=(Math.random()*2-1)*Math.pow(Math.max(0,1-i/td.length*0.4),0.5);
    }
    const tSrc=ctx.createBufferSource(); tSrc.buffer=thrustBuf;
    const bp=ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.setValueAtTime(380,now); bp.frequency.exponentialRampToValueAtTime(120,now+dur); bp.Q.value=1.2;
    const g2=ctx.createGain(); g2.gain.setValueAtTime(0,now); g2.gain.linearRampToValueAtTime(0.35,now+0.2); g2.gain.exponentialRampToValueAtTime(0.001,now+dur);
    tSrc.connect(bp); bp.connect(g2); g2.connect(ctx.destination); tSrc.start(now);

    // LAYER 3: High-freq hiss (exhaust steam/smoke)
    const hissOsc=ctx.createOscillator(); hissOsc.type='sawtooth';
    hissOsc.frequency.setValueAtTime(280,now);
    hissOsc.frequency.exponentialRampToValueAtTime(55,now+3.5);
    const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=220;
    const g3=ctx.createGain(); g3.gain.setValueAtTime(0,now); g3.gain.linearRampToValueAtTime(0.14,now+0.08); g3.gain.exponentialRampToValueAtTime(0.001,now+3.5);
    hissOsc.connect(hp); hp.connect(g3); g3.connect(ctx.destination); hissOsc.start(now); hissOsc.stop(now+3.5);

    // LAYER 4: Initial ignition BANG
    const bangBuf=ctx.createBuffer(1,ctx.sampleRate*0.25,ctx.sampleRate);
    const bd=bangBuf.getChannelData(0);
    for(let i=0;i<bd.length;i++) bd[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*0.08));
    const bangSrc=ctx.createBufferSource(); bangSrc.buffer=bangBuf;
    const bangLp=ctx.createBiquadFilter(); bangLp.type='lowpass'; bangLp.frequency.value=300;
    const g4=ctx.createGain(); g4.gain.setValueAtTime(0.8,now); g4.gain.exponentialRampToValueAtTime(0.001,now+0.25);
    bangSrc.connect(bangLp); bangLp.connect(g4); g4.connect(ctx.destination); bangSrc.start(now);

    // LAYER 5: Doppler shift (rocket departing)
    const dopOsc=ctx.createOscillator(); dopOsc.type='sawtooth';
    dopOsc.frequency.setValueAtTime(160,now+0.3);
    dopOsc.frequency.exponentialRampToValueAtTime(28,now+dur);
    const dopG=ctx.createGain(); dopG.gain.setValueAtTime(0,now+0.3); dopG.gain.linearRampToValueAtTime(0.2,now+0.6); dopG.gain.exponentialRampToValueAtTime(0.001,now+dur);
    const dopLp=ctx.createBiquadFilter(); dopLp.type='lowpass'; dopLp.frequency.value=350;
    dopOsc.connect(dopLp); dopLp.connect(dopG); dopG.connect(ctx.destination); dopOsc.start(now+0.3); dopOsc.stop(now+dur);
  }catch(e){}
}

function playGlow(){
  try{
    const ctx=getAudio(),now=ctx.currentTime;
    const osc=ctx.createOscillator();osc.type='sine';osc.frequency.setValueAtTime(520,now);osc.frequency.exponentialRampToValueAtTime(1040,now+.2);
    const g=ctx.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.1,now+.04);g.gain.exponentialRampToValueAtTime(.001,now+.35);
    osc.connect(g);g.connect(ctx.destination);osc.start(now);osc.stop(now+.35);
  }catch(e){}
}

function playChime(freq,delay=0){
  try{
    const ctx=getAudio(),now=ctx.currentTime+delay;
    const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=freq;
    const g=ctx.createGain();g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.12,now+.03);g.gain.exponentialRampToValueAtTime(.001,now+.8);
    osc.connect(g);g.connect(ctx.destination);osc.start(now);osc.stop(now+.8);
  }catch(e){}
}

/* ═══════════════ GALAXY CANVAS ═══════════════ */
const C=document.getElementById('gc');
const X=C.getContext('2d');
let stars=[],shoots=[],bursts=[];

function mkStar(){
  const angle=Math.random()*Math.PI*2;
  const r=Math.random()<.15?Math.random()*60:Math.pow(Math.random(),1.3)*520;
  const spread=Math.random()<.5?angle+.35:angle-.35;
  const inArm=Math.random()<.5&&r>60;
  const bx=C.width*.5,by=C.height*.48;
  const cx=bx+Math.cos(inArm?spread:angle)*r;
  const cy=by+Math.sin(inArm?spread:angle)*r*.42;
  const hue=Math.random()<.25?260+Math.random()*40:220+Math.random()*120;
  return{x:cx,y:cy,r:Math.random()<.07?2.2:Math.random()<.2?1.2:.65,
    a:Math.random(),da:(.002+Math.random()*.007)*(Math.random()<.5?1:-1),
    hue,bright:Math.random()<.12};
}

function burst(n){
  for(let i=0;i<n;i++){
    const angle=Math.random()*Math.PI*2,speed=.5+Math.random()*2;
    bursts.push({
      x:C.width*.5+(Math.random()-.5)*200,
      y:C.height*.45+(Math.random()-.5)*120,
      vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
      r:.6+Math.random()*1.4,hue:260+Math.random()*100,
      life:1,decay:.012+Math.random()*.018
    });
  }
}

/* Shooting stars — more frequent, throughout whole page */
function addShoot(){
  const fromTop=Math.random()<.6;
  const x=fromTop?Math.random()*C.width:-20;
  const y=fromTop?-10:Math.random()*C.height*.4;
  const angle=fromTop?(Math.PI/4+Math.random()*.5):(Math.random()*.6);
  const speed=3+Math.random()*6;
  shoots.push({
    x,y,
    vx:Math.cos(angle)*speed,
    vy:Math.sin(angle)*speed,
    len:70+Math.random()*120,
    life:1,
    decay:.018+Math.random()*.025,
    hue:260+Math.random()*80
  });
}
// More frequent shooting stars
setInterval(()=>{
  if(Math.random()<.85)addShoot();
  if(Math.random()<.3)addShoot(); // extra burst of 2
},600);

function resize(){
  C.width=C.offsetWidth||700;C.height=C.offsetHeight||700;
  stars=Array.from({length:420},mkStar);
}

function drawFrame(){
  X.clearRect(0,0,C.width,C.height);
  const cx=C.width*.5,cy=C.height*.48;

  // Purple-toned milky way core
  [{rx:240,ry:35,a:.018,c:'140,90,220'},{rx:170,ry:26,a:.032,c:'160,110,240'},
   {rx:100,ry:16,a:.055,c:'190,150,255'},{rx:50,ry:10,a:.09,c:'210,180,255'},
   {rx:20,ry:5,a:.16,c:'235,215,255'}].forEach(l=>{
    X.save();X.translate(cx,cy);X.scale(1,.42);
    X.beginPath();X.ellipse(0,0,l.rx,l.rx,0,0,Math.PI*2);
    X.fillStyle=`rgba(${l.c},${l.a})`;X.fill();X.restore();
  });

  stars.forEach(s=>{
    s.a=Math.max(.04,Math.min(.95,s.a+s.da));
    if(s.a<=.04||s.a>=.95)s.da*=-1;
    X.beginPath();X.arc(s.x,s.y,s.r,0,Math.PI*2);
    X.fillStyle=`hsla(${s.hue},${s.bright?80:55}%,${s.bright?92:74}%,${s.bright?s.a:s.a*.65})`;
    X.fill();
  });

  bursts=bursts.filter(b=>{
    b.life-=b.decay;b.x+=b.vx;b.y+=b.vy;
    if(b.life<=0)return false;
    X.beginPath();X.arc(b.x,b.y,b.r,0,Math.PI*2);
    X.fillStyle=`hsla(${b.hue},88%,85%,${b.life})`;X.fill();
    return true;
  });

  // Shooting stars — more dramatic
  shoots=shoots.filter(s=>{
    s.life-=s.decay;s.x+=s.vx;s.y+=s.vy;
    if(s.life<=0||s.x>C.width+100||s.y>C.height+50)return false;
    const tailLen=s.len;
    const tx=s.x-s.vx*(tailLen/Math.hypot(s.vx,s.vy));
    const ty=s.y-s.vy*(tailLen/Math.hypot(s.vx,s.vy));
    const g=X.createLinearGradient(s.x,s.y,tx,ty);
    g.addColorStop(0,`hsla(${s.hue},90%,95%,${s.life*.95})`);
    g.addColorStop(0.3,`hsla(${s.hue},80%,85%,${s.life*.5})`);
    g.addColorStop(1,`hsla(${s.hue},70%,75%,0)`);
    X.beginPath();X.moveTo(s.x,s.y);X.lineTo(tx,ty);
    X.strokeStyle=g;X.lineWidth=1.5+s.life*.8;X.lineCap='round';X.stroke();
    // Head glow
    X.beginPath();X.arc(s.x,s.y,1.5+s.life*.8,0,Math.PI*2);
    X.fillStyle=`hsla(${s.hue},100%,98%,${s.life*.9})`;X.fill();
    return true;
  });

  requestAnimationFrame(drawFrame);
}
window.addEventListener('resize',resize);
resize();drawFrame();

/* ═══════════════ FLAME ANIMATION ═══════════════ */
let ft=0;
(function fl(){
  ft+=.09;
  const ids=['fa','fb','fc','fd'],bases=[14,19,14,11];
  ids.forEach((id,i)=>{const e=document.getElementById(id);if(e)e.setAttribute('ry',String(bases[i]+Math.sin(ft+i*1.1)*2.2));});
  requestAnimationFrame(fl);
})();

/* ═══════════════ INPUT ═══════════════ */
document.getElementById('git-input').addEventListener('input',function(){
  const n=this.value.split('\n').filter(l=>l.trim()).length;
  document.getElementById('ccount').textContent=n+' commit'+(n===1?'':'s');
});

/* ═══════════════ DROP ZONE ═══════════════ */
const dz=document.getElementById('dropZone');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over');});
dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
dz.addEventListener('drop',e=>{
  e.preventDefault();dz.classList.remove('drag-over');
  const file=e.dataTransfer.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{const ta=document.getElementById('git-input');ta.value=ev.target.result;ta.dispatchEvent(new Event('input'));};
  reader.readAsText(file);
});

function loadSample(){const ta=document.getElementById('git-input');ta.value=SAMPLE;ta.dispatchEvent(new Event('input'));}

/* ═══════════════ NAV ═══════════════ */
function switchPage(a,b){
  const f=document.getElementById(a),t=document.getElementById(b);
  f.classList.add('out');
  setTimeout(()=>{f.classList.add('hidden');f.classList.remove('out');t.classList.remove('hidden');},800);
}
function goToInput(){
  playRocket();
  document.getElementById('lrocket').classList.add('go');
  burst(100);setTimeout(()=>burst(60),350);setTimeout(()=>burst(40),700);
  setTimeout(()=>switchPage('p-land','p-input'),1100);
}
function goBack(){switchPage('p-results','p-input');}

/* ═══════════════ CLASSIFY ═══════════════ */
function classify(msg){
  const m=msg.toLowerCase();
  if(m.match(/release|milestone|v\d+\.\d+/))return'milestone';
  if(m.match(/^feat|add |implement|support|integrat/))return'feat';
  if(m.match(/^fix|resolv|patch|correct|bug|hotfix/))return'fix';
  return'chore';
}
function parseCommits(raw){
  return raw.split('\n').filter(l=>l.trim()).map(l=>{const p=l.trim().split(' ');return{hash:p[0].slice(0,7),msg:p.slice(1).join(' ')};});
}

/* ═══════════════ FILTER ═══════════════ */
let activeFilter='all';
function setFilter(f,el){
  activeFilter=f;
  document.querySelectorAll('.ptab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  renderFilter(f);
}

function applyCheckboxFilter(){
  if(activeFilter!=='all')return;
  renderFilter('all');
}

function getActiveTypes(){
  const cbs=document.querySelectorAll('#filterCheckboxes .cb-item');
  const types=[];
  cbs.forEach(cb=>{
    const inp=cb.querySelector('input');
    if(inp.checked){
      if(cb.classList.contains('feat'))types.push('feat');
      if(cb.classList.contains('fix'))types.push('fix');
      if(cb.classList.contains('mile'))types.push('milestone');
      if(cb.classList.contains('chore'))types.push('chore');
    }
  });
  return types;
}

function renderFilter(f){
  const{data,commits}=parsedData,mc=document.getElementById('mainContent');
  if(f==='standup'){mc.innerHTML=`<div class="narr-card"><div class="narr-title">✦ Standup Summary</div><div class="narr-text">${data.standup}</div></div>`;return;}
  if(f==='release'){mc.innerHTML=`<div class="narr-card"><div class="narr-title">✦ Release Notes</div><div class="narr-text">${data.release}</div></div>`;return;}
  const activeTypes=getActiveTypes();
  let filtered=f==='all'?commits.filter(c=>activeTypes.includes(classify(c.msg))):commits.filter(c=>classify(c.msg)===f);
  let html='<div class="timeline"><div class="tl-line"></div>';
  filtered.forEach((c,i)=>{
    const t=classify(c.msg),clean=c.msg.replace(/^[^:]+:\s*/,''),desc=(data.descriptions&&data.descriptions[c.hash])||'';
    if(t==='milestone'&&i>0)html+=`<div class="tl-divider">✦ milestone reached</div>`;
    html+=`<div class="tl-item" onclick="glowItem(this)">
      <div class="tl-dot ${t}"></div>
      <div class="tl-body">
        <div class="tl-badge ${t}">${t==='milestone'?'⬡ milestone':t==='feat'?'◈ feature':'⬤ bug fix'}</div>
        <div class="tl-msg">${clean}</div>
        ${desc?`<div class="tl-desc">${desc}</div>`:''}
        <div class="tl-hash">${c.hash}</div>
      </div></div>`;
  });
  html+='</div>';
  mc.innerHTML=html;
  renderBottomTimeline(filtered);
}

/* ═══════════════ BOTTOM TIMELINE ═══════════════ */
function renderBottomTimeline(commits){
  const bt=document.getElementById('bottomTimeline');
  const nodes=document.getElementById('btNodes');
  if(!commits||commits.length===0){bt.style.display='none';return;}
  bt.style.display='block';
  const visible=commits.slice(0,20);
  nodes.innerHTML=visible.map((c,i)=>{
    const t=classify(c.msg);
    const lbl=c.msg.replace(/^[^:]+:\s*/,'').slice(0,22);
    return`<div class="bt-node" onclick="glowBtNode(this,${i})">
      <span class="bt-node-tip">${lbl}</span>
      <div class="bt-node-dot ${t}"></div>
    </div>`;
  }).join('');
}

function glowBtNode(el,idx){playGlow();burst(15);}

/* ═══════════════ GLOW INTERACTIONS ═══════════════ */
function glowItem(el){
  const was=el.classList.contains('glowing');
  document.querySelectorAll('.tl-item').forEach(i=>i.classList.remove('glowing'));
  if(!was){el.classList.add('glowing');playGlow();burst(22);}
}
function glowPlanet(el){
  const was=el.classList.contains('glowing');
  document.querySelectorAll('.p-commit').forEach(p=>p.classList.remove('glowing'));
  if(!was){el.classList.add('glowing');playGlow();burst(28);}
}

/* ═══════════════ JOURNEY PLAYBACK ═══════════════ */
const journeyNarrations={
  feat:(msg,idx)=>[
    `Feature #${idx+1} lands in orbit 🛸`,
    `New capability detected: ${msg.slice(0,30)}`,
    `Your universe expands with new functionality ✦`
  ][Math.floor(Math.random()*3)],
  fix:(msg,idx)=>[
    `Bug neutralized! The cosmos stabilizes 🌀`,
    `Patch applied — trajectory corrected`,
    `Anomaly resolved: ${msg.slice(0,28)}`
  ][Math.floor(Math.random()*3)],
  milestone:(msg,idx)=>[
    `🌟 MILESTONE REACHED — a new era begins!`,
    `Major waypoint unlocked: ${msg.slice(0,26)}`,
    `The project reaches a new frontier ⬡`
  ][Math.floor(Math.random()*3)],
  chore:(msg,idx)=>`Maintenance complete — systems running smooth`,
};

async function startJourney(){
  if(journeyActive){stopJourney();return;}
  if(!parsedData)return;
  const btn=document.getElementById('journeyBtn');
  btn.innerHTML='<span class="jb-icon">⏹</span> Stop Journey';
  journeyActive=true;

  const{commits}=parsedData;
  const overlay=document.getElementById('journeyOverlay');
  const joStep=document.getElementById('joStep');
  const joText=document.getElementById('joText');

  // Reset planets and timeline
  document.querySelectorAll('.p-commit').forEach(p=>p.classList.remove('glowing','jplay'));
  document.querySelectorAll('.tl-item').forEach(i=>i.classList.remove('glowing','jplay'));

  // Switch to 'all' view
  setFilter('all',document.querySelector('.ptab-all'));

  const tlItems=document.querySelectorAll('.tl-item');
  const planets=document.querySelectorAll('.p-commit');
  const total=Math.min(tlItems.length, commits.length);

  overlay.classList.add('show');
  joStep.textContent='Mission Start';
  joText.textContent='Initiating project journey playback... 🚀';
  playChime(440,0);

  for(let i=0;i<total;i++){
    if(!journeyActive)break;
    await new Promise(r=>setTimeout(r,1100));
    if(!journeyActive)break;

    const c=commits[i];
    const t=classify(c.msg);
    const msg=c.msg.replace(/^[^:]+:\s*/,'');

    // Highlight timeline item
    if(tlItems[i]){
      tlItems[i].scrollIntoView({behavior:'smooth',block:'nearest'});
      tlItems[i].classList.add('jplay','glowing');
    }

    // Light up planet
    if(planets[i]){
      planets[i].classList.add('jplay');
      setTimeout(()=>{if(planets[i])planets[i].classList.add('glowing');},200);
    }

    // Update narration overlay
    joStep.textContent=`Commit ${i+1} of ${total} — ${t.toUpperCase()}`;
    joText.textContent=journeyNarrations[t](msg,i);

    // Play sound
    if(t==='milestone'){playChime(880,0);playChime(1100,.15);playChime(1320,.3);burst(40);}
    else if(t==='feat'){playChime(660,0);burst(18);}
    else if(t==='fix'){playChime(550,0);burst(10);}
    else playChime(440,0);

    // Remove glow from previous
    if(i>0){
      setTimeout(()=>{
        if(tlItems[i-1])tlItems[i-1].classList.remove('glowing');
        if(planets[i-1])planets[i-1].classList.remove('glowing');
      },900);
    }
  }

  if(journeyActive){
    await new Promise(r=>setTimeout(r,800));
    joStep.textContent='Journey Complete ✦';
    joText.textContent=`Explored ${total} commits — your universe is magnificent!`;
    playChime(880,0);playChime(1100,.2);playChime(1320,.4);playChime(1760,.6);
    burst(80);setTimeout(()=>burst(60),400);
  }

  setTimeout(()=>{overlay.classList.remove('show');},3500);
  journeyActive=false;
  btn.innerHTML='<span class="jb-icon">🚀</span> Play My Project Journey';
}

function stopJourney(){
  journeyActive=false;
  if(journeyTimer)clearTimeout(journeyTimer);
  document.getElementById('journeyBtn').innerHTML='<span class="jb-icon">🚀</span> Play My Project Journey';
  document.getElementById('journeyOverlay').classList.remove('show');
  document.querySelectorAll('.tl-item').forEach(i=>i.classList.remove('glowing','jplay'));
  document.querySelectorAll('.p-commit').forEach(p=>p.classList.remove('glowing','jplay'));
}

/* ═══════════════ PROJECT HEALTH SCORE ═══════════════ */
function computeHealthScore(commits){
  if(!commits||commits.length===0)return null;
  const total=commits.length;
  const feats=commits.filter(c=>classify(c.msg)==='feat').length;
  const fixes=commits.filter(c=>classify(c.msg)==='fix').length;
  const miles=commits.filter(c=>classify(c.msg)==='milestone').length;

  // ── Metric 1: Fix/Feature ratio (0–35 pts)
  // Ideal: fixes ≤ 40% of features. Heavy fix load = worse score.
  let ratioScore=35;
  if(feats===0&&fixes>0){ratioScore=8;}
  else if(feats>0){
    const ratio=fixes/feats; // lower is better
    if(ratio<=0.25)ratioScore=35;
    else if(ratio<=0.5)ratioScore=28;
    else if(ratio<=1.0)ratioScore=18;
    else if(ratio<=2.0)ratioScore=10;
    else ratioScore=4;
  }

  // ── Metric 2: Commit frequency regularity (0–35 pts)
  // We score based on commit volume and distribution
  let freqScore=0;
  if(total>=30)freqScore=35;
  else if(total>=20)freqScore=28;
  else if(total>=12)freqScore=21;
  else if(total>=6)freqScore=14;
  else if(total>=3)freqScore=8;
  else freqScore=3;

  // ── Metric 3: Inactivity gaps (0–30 pts)
  // Inferred from chore/fix density — heavy chore load implies maintenance gaps
  const chores=commits.filter(c=>classify(c.msg)==='chore').length;
  const choreRatio=chores/total;
  let gapScore=30;
  if(choreRatio>0.6)gapScore=8;
  else if(choreRatio>0.4)gapScore=14;
  else if(choreRatio>0.25)gapScore=20;
  else if(choreRatio>0.1)gapScore=26;
  else gapScore=30;
  // Bonus for milestones (shows regular shipped progress)
  if(miles>=2)gapScore=Math.min(30,gapScore+4);

  const total_score=Math.round(ratioScore+freqScore+gapScore);

  // Tier
  let tier,badge,insight;
  if(total_score>=70){
    tier='green';badge='✦ Healthy';
    if(total_score>=88)insight=`<strong>Excellent shape.</strong> Strong feature momentum with a low bug rate and consistent delivery rhythm. Keep shipping!`;
    else insight=`<strong>Looking good.</strong> Solid balance of features and fixes. A few more milestones could elevate this further.`;
  }else if(total_score>=45){
    tier='yellow';badge='⚠ Unstable';
    if(fixes>feats)insight=`<strong>Bug-heavy period detected.</strong> Fix commits are outpacing features — consider investing in testing or tech debt reduction.`;
    else if(choreRatio>0.35)insight=`<strong>High maintenance load.</strong> Many chore commits suggest potential inactivity periods or dependency debt.`;
    else insight=`<strong>Moderate health.</strong> Some imbalance between features and fixes. Aim for 2–3 features per bug fix for a healthier ratio.`;
  }else{
    tier='red';badge='✖ Risky';
    if(total<5)insight=`<strong>Very low commit volume.</strong> Insufficient history to assess momentum. Keep shipping regularly.`;
    else if(fixes>feats*2)insight=`<strong>Critical fix overload.</strong> Far more bug fixes than features — the codebase may be unstable. Prioritize stability before new work.`;
    else insight=`<strong>Needs attention.</strong> Multiple health signals are weak. Focus on consistent feature delivery and reducing reactive fixes.`;
  }

  // Per-metric colors
  function mc(v,max){const p=v/max;return p>=0.65?'green':p>=0.35?'yellow':'red';}

  return{total_score,tier,badge,insight,
    ratioScore,ratioMax:35,
    freqScore,freqMax:35,
    gapScore,gapMax:30,
    mc};
}

function renderHealthScore(commits){
  const h=computeHealthScore(commits);
  const el=document.getElementById('healthScoreCard');
  if(!h){el.innerHTML='';return;}
  const {total_score,tier,badge,insight,ratioScore,ratioMax,freqScore,freqMax,gapScore,gapMax,mc}=h;
  const arc=Math.round((1-(total_score/100))*188); // dashoffset
  const rC=mc(ratioScore,ratioMax),fC=mc(freqScore,freqMax),gC=mc(gapScore,gapMax);

  el.innerHTML=`
  <div class="health-card ${tier}">
    <div class="health-header">
      <span class="health-label">⬡ Project Health Score</span>
      <span class="health-badge">${badge}</span>
    </div>
    <div class="health-score-row">
      <div>
        <div style="display:flex;align-items:flex-end;gap:4px">
          <div class="health-score-num" id="hsNum">0</div>
          <div class="health-score-denom">/100</div>
        </div>
      </div>
      <div class="health-arc-wrap">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle class="health-arc-bg" cx="36" cy="36" r="30"/>
          <circle class="health-arc-fill" id="hsArc" cx="36" cy="36" r="30"/>
        </svg>
        <div class="health-arc-center">${total_score}%</div>
      </div>
    </div>
    <div class="health-breakdown">
      <div class="hb-row">
        <span class="hb-label">Fix/Feat Ratio</span>
        <div class="hb-track"><div class="hb-fill ${rC}" id="hbR" style="width:0%"></div></div>
        <span class="hb-score ${rC}">${ratioScore}/${ratioMax}</span>
      </div>
      <div class="hb-row">
        <span class="hb-label">Commit Freq.</span>
        <div class="hb-track"><div class="hb-fill ${fC}" id="hbF" style="width:0%"></div></div>
        <span class="hb-score ${fC}">${freqScore}/${freqMax}</span>
      </div>
      <div class="hb-row">
        <span class="hb-label">Activity Gaps</span>
        <div class="hb-track"><div class="hb-fill ${gC}" id="hbG" style="width:0%"></div></div>
        <span class="hb-score ${gC}">${gapScore}/${gapMax}</span>
      </div>
    </div>
    <div class="health-insight">${insight}</div>
  </div>`;

  // Animate after paint
  requestAnimationFrame(()=>{
    setTimeout(()=>{
      // Count-up number
      let n=0;const step=Math.ceil(total_score/40);
      const iv=setInterval(()=>{
        n=Math.min(n+step,total_score);
        const numEl=document.getElementById('hsNum');
        if(numEl)numEl.textContent=n;
        if(n>=total_score)clearInterval(iv);
      },28);
      // Arc
      const arc=document.getElementById('hsArc');
      if(arc)arc.style.strokeDashoffset=String(Math.round((1-(total_score/100))*188));
      // Bars
      setTimeout(()=>{
        const r=document.getElementById('hbR');const f=document.getElementById('hbF');const g=document.getElementById('hbG');
        if(r)r.style.width=Math.round((ratioScore/ratioMax)*100)+'%';
        if(f)f.style.width=Math.round((freqScore/freqMax)*100)+'%';
        if(g)g.style.width=Math.round((gapScore/gapMax)*100)+'%';
      },200);
    },120);
  });
}

/* ═══════════════ RENDER RESULTS ═══════════════ */
function renderResults(data,commits){
  parsedData={data,commits};
  const feats=commits.filter(c=>classify(c.msg)==='feat'),
        fixes=commits.filter(c=>classify(c.msg)==='fix'),
        miles=commits.filter(c=>classify(c.msg)==='milestone');

  document.getElementById('statsRow').innerHTML=`
    <div class="stat-card total"><div class="stat-num">${commits.length}</div><div class="stat-lbl">Total</div></div>
    <div class="stat-card feat"><div class="stat-num">${feats.length}</div><div class="stat-lbl">Features</div></div>
    <div class="stat-card fix"><div class="stat-num">${fixes.length}</div><div class="stat-lbl">Bug fixes</div></div>
    <div class="stat-card mile"><div class="stat-num">${miles.length}</div><div class="stat-lbl">Milestones</div></div>`;

  renderHealthScore(commits);

  document.getElementById('planetRow').innerHTML=[...miles,...feats,...fixes].slice(0,12).map(c=>{
    const t=classify(c.msg),lbl=c.msg.replace(/^[^:]+:\s*/,'').slice(0,16),tip=c.msg.replace(/^[^:]+:\s*/,'');
    return`<div class="p-commit" onclick="glowPlanet(this)"><div class="p-commit-tip">${tip}</div><div class="p-commit-orb ${t}"></div><div class="p-commit-lbl">${lbl}</div></div>`;
  }).join('');

  renderFilter('all');
  switchPage('p-input','p-results');
}


async function runAnalysis(){
  const raw = document.getElementById('git-input').value.trim();
  if(!raw) return;

  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinning"></span>Analyzing with backend...';

  try {
    // ✅ CALL FLASK BACKEND
    const response = await fetch("http://127.0.0.1:5000/api/commits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        repo: raw
      })
    });

    const backendData = await response.json();

    if (backendData.error) {
      throw new Error(backendData.error);
    }

    // Convert backend response into your UI format
    const commits = [];

    const allCommits = [
      ...(backendData.analysis.features || []),
      ...(backendData.analysis.bug_fixes || []),
      ...(backendData.analysis.improvements || []),
      ...(backendData.analysis.others || [])
    ];

    allCommits.forEach((msg, i) => {
      commits.push({
        hash: "c" + i + Math.random().toString(36).substring(2,7),
        msg: msg
      });
    });

    const data = {
      standup: `This repository shows <strong>${backendData.total_commits} commits</strong> with a strong mix of features and fixes. The project health score is <strong>${backendData.health_score}%</strong>.`,
      
      release: `This release includes multiple updates across the repository. A total of <strong>${backendData.total_commits} commits</strong> were analyzed with a health score of <strong>${backendData.health_score}%</strong>.`,
      
      descriptions: {}
    };

    renderResults(data, commits);

  } catch (e) {
    console.error(e);

    // fallback to your original logic
    const commits = parseCommits(raw);
    const feats = commits.filter(c=>classify(c.msg)==='feat'),
          fixes = commits.filter(c=>classify(c.msg)==='fix'),
          miles = commits.filter(c=>classify(c.msg)==='milestone');

    renderResults({
      standup:`This sprint delivered <strong>${feats.length} new features</strong> and resolved <strong>${fixes.length} bugs</strong>${miles.length?' with '+miles.length+' milestone'+(miles.length>1?'s':''):''}.`,
      release:`This release includes <strong>${feats.length} features</strong> and <strong>${fixes.length} fixes</strong> across ${commits.length} commits.`,
      descriptions:{}
    }, commits);
  }

  btn.disabled = false;
  btn.innerHTML = '✦ Generate Story';
}
