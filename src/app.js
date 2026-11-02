import { AudioDirector } from './audio.js';
import { WIDTH, HEIGHT, DURATION, renderer, camera, CHAPTERS, setCameraAt, updateWorld, renderWorld } from './world.js';

const mount=document.querySelector('#world');mount.appendChild(renderer.domElement);
const audio=new AudioDirector();
const recordCanvas=document.createElement('canvas');recordCanvas.width=WIDTH;recordCanvas.height=HEIGHT;
const recordCtx=recordCanvas.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id);
let cinematic=false,manual=false,finished=false,elapsed=0,startedAt=0,lastChapter=-1,manualNight=false;
let narratorEnabled=true,recordActive=false,recorder=null,recordChunks=[],displayAudioStream=null;
let yaw=0,pitch=0,keys={};
const intro=$('intro'),toastEl=$('toast'),playBtn=$('play'),recordBtn=$('record');

function toast(message){
  toastEl.textContent=message;toastEl.classList.add('show');
  clearTimeout(toast._timer);toast._timer=setTimeout(()=>toastEl.classList.remove('show'),4200);
}
function chapterIndex(t){let i=0;for(let k=0;k<CHAPTERS.length;k++)if(t>=CHAPTERS[k].at)i=k;return i;}
function updateCaption(t){
  const idx=chapterIndex(t),c=CHAPTERS[idx];
  if(idx!==lastChapter){
    lastChapter=idx;
    $('status').textContent='诗境 '+String(idx+1).padStart(2,'0')+' / 六';
    $('chapter').textContent=c.title;$('verse').textContent=c.verse;$('note').textContent=c.note;
    $('chapter-live').textContent=c.title;$('verse-live').textContent=c.verse;$('note-live').textContent=c.note;
    document.querySelectorAll('.chapter-dot').forEach((dot,i)=>dot.classList.toggle('active',i<=idx));
    if(cinematic&&narratorEnabled&&!audio.hasVoiceFile)audio.speak(c.verse);
    audio.setChapter(idx);
  }
  const progress=$('progress');if(progress)progress.style.width=(t/DURATION*100)+'%';
  $('progress-live').style.width=(t/DURATION*100)+'%';
}
const grainCanvas=document.createElement('canvas');
grainCanvas.width=160;grainCanvas.height=160;
const grainCtx=grainCanvas.getContext('2d');
const grainImage=grainCtx.createImageData(160,160);
for(let i=0;i<grainImage.data.length;i+=4){
  const n=100+Math.random()*100;
  grainImage.data[i]=n;grainImage.data[i+1]=n;grainImage.data[i+2]=n;grainImage.data[i+3]=34;
}
grainCtx.putImageData(grainImage,0,0);
const grainPattern=recordCtx.createPattern(grainCanvas,'repeat');

function drawRecordFrame(t){
  const ctx=recordCtx;
  ctx.drawImage(renderer.domElement,0,0,WIDTH,HEIGHT);

  const vignette=ctx.createRadialGradient(WIDTH*.5,HEIGHT*.43,HEIGHT*.18,WIDTH*.5,HEIGHT*.48,HEIGHT*.72);
  vignette.addColorStop(0,'rgba(5,11,11,0)');
  vignette.addColorStop(.72,'rgba(5,11,11,.12)');
  vignette.addColorStop(1,'rgba(5,11,11,.52)');
  ctx.fillStyle=vignette;ctx.fillRect(0,0,WIDTH,HEIGHT);

  const shade=ctx.createLinearGradient(0,1320,0,HEIGHT);
  shade.addColorStop(0,'rgba(8,15,15,0)');
  shade.addColorStop(.26,'rgba(8,15,15,.18)');
  shade.addColorStop(1,'rgba(8,15,15,.78)');
  ctx.fillStyle=shade;ctx.fillRect(0,0,WIDTH,HEIGHT);

  const c=CHAPTERS[chapterIndex(t)];
  ctx.save();
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=20;
  ctx.fillStyle='rgba(232,216,181,.82)';
  ctx.font='25px "Noto Serif SC","Songti SC","STSong",serif';
  ctx.fillText('王 勃  ·  滕 王 阁 序',WIDTH/2,126);
  ctx.strokeStyle='rgba(215,185,129,.5)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(390,165);ctx.lineTo(690,165);ctx.stroke();

  ctx.fillStyle='rgba(218,185,126,.94)';
  ctx.font='25px "Noto Serif SC","Songti SC","STSong",serif';
  ctx.fillText(c.title,WIDTH/2,1452);

  const long=c.verse.length>13;
  const size=c.verse.length>17?43:(long?46:54);
  ctx.fillStyle='#f2e7d0';
  ctx.font='bold '+size+'px "Noto Serif SC","Songti SC","STSong",serif';
  if(c.verse.length>13){
    const split=c.verse.indexOf('，')>0?c.verse.indexOf('，')+1:Math.ceil(c.verse.length/2);
    ctx.fillText(c.verse.slice(0,split),WIDTH/2,1540);
    ctx.fillText(c.verse.slice(split),WIDTH/2,1610);
  }else{
    ctx.fillText(c.verse,WIDTH/2,1572);
  }
  ctx.shadowBlur=0;
  ctx.fillStyle='rgba(225,211,184,.76)';
  ctx.font='24px "Noto Serif SC","Songti SC","STSong",serif';
  ctx.fillText(c.note,WIDTH/2,1700);

  ctx.strokeStyle='rgba(211,181,126,.55)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(170,1792);ctx.lineTo(910,1792);ctx.stroke();
  ctx.fillStyle='rgba(222,202,161,.7)';
  ctx.font='18px "Noto Serif SC","Songti SC","STSong",serif';
  ctx.fillText('江 天 一 阁  ·  秋 水 长 天',WIDTH/2,1840);

  ctx.fillStyle='rgba(126,47,39,.92)';ctx.fillRect(944,1808,58,58);
  ctx.strokeStyle='rgba(235,211,172,.82)';ctx.lineWidth=2;ctx.strokeRect(950,1814,46,46);
  ctx.fillStyle='#ead9b9';ctx.font='28px KaiTi,STKaiti,serif';ctx.fillText('诗',973,1838);

  ctx.globalAlpha=.055;ctx.fillStyle=grainPattern;ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.restore();
}
function updateManual(dt){
  const speed=6.5*dt,forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  if(keys.w)camera.position.addScaledVector(forward,speed);if(keys.s)camera.position.addScaledVector(forward,-speed);
  if(keys.a)camera.position.addScaledVector(right,-speed);if(keys.d)camera.position.addScaledVector(right,speed);
  camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;
}
import * as THREE from 'three';
document.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;});
document.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
renderer.domElement.addEventListener('click',()=>{if(manual&&document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock?.();});
document.addEventListener('mousemove',e=>{if(manual&&document.pointerLockElement===renderer.domElement){yaw-=e.movementX*.0018;pitch=Math.max(-1.1,Math.min(1.1,pitch-e.movementY*.0018));}});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&manual)toast('轻触画面可继续漫游。');});

async function startJourney(){
  await audio.start();intro.classList.add('hidden');manual=false;manualNight=false;cinematic=true;finished=false;elapsed=0;lastChapter=-1;startedAt=performance.now();audio.resumeVoice();
  camera.position.set(0,1.68,10);updateCaption(0);if(narratorEnabled)audio.startVoiceTrack();audio.startMusicTrack();
  playBtn.textContent='暂停诗境';toast('诗卷已展开，请随镜而行。');
}
function pauseJourney(){
  if(cinematic){cinematic=false;audio.pauseVoice();playBtn.textContent='继续诗境';}
  else if(!finished){cinematic=true;startedAt=performance.now()-elapsed*1000;audio.resumeVoice();playBtn.textContent='暂停诗境';}
}
function restartJourney(){audio.stopVoice();startJourney();}
playBtn.addEventListener('click',()=>{if(cinematic)pauseJourney();else if(!finished&&elapsed>0)pauseJourney();else startJourney();});
$('close-intro').addEventListener('click',startJourney);
$('restart').addEventListener('click',restartJourney);
$('roam').addEventListener('click',()=>{cinematic=false;manual=true;finished=false;intro.classList.add('hidden');audio.start();camera.position.set(0,1.68,10);yaw=0;pitch=0;toast('漫游已开启：W、A、S、D 行走，鼠标转身。');});
$('day').addEventListener('click',()=>{manualNight=!manualNight;toast(manualNight?'夜色已至。':'霞光重临。');});
$('narrator').addEventListener('click',()=>{narratorEnabled=!narratorEnabled;$('narrator').textContent=narratorEnabled?'诵读：开':'诵读：静';if(!narratorEnabled){audio.stopSpeech();audio.voiceElement?.pause();}else if(cinematic&&audio.hasVoiceFile)audio.voiceElement?.play().catch(()=>{});});
$('voice-file').addEventListener('change',async e=>{const file=e.target.files&&e.target.files[0];if(file){await audio.loadVoiceFile(file);toast('已载入男声旁白：'+file.name);}});
$('music-file').addEventListener('change',async e=>{const file=e.target.files&&e.target.files[0];if(file){await audio.loadMusicFile(file);toast('已载入配乐音轨：'+file.name);}});
$('listen').addEventListener('click',async()=>{await audio.start();audio.speak('云销雨霁，彩彻区明。落霞与孤鹜齐飞，秋水共长天一色。');});
$('fullscreen').addEventListener('click',()=>document.documentElement.requestFullscreen?.());

let lastFrame=performance.now();
function frame(now){
  const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
  if(cinematic){
    elapsed=Math.max(0,Math.min(DURATION,(now-startedAt)/1000));
    setCameraAt(elapsed);updateCaption(elapsed);
    if(elapsed>=DURATION&&!finished){finished=true;cinematic=false;audio.pauseVoice();playBtn.textContent='重启诗境';toast('诗境已尽。长江仍在，余韵未散。');if(recordActive)stopRecording();}
  }else if(manual){elapsed+=dt;updateManual(dt);}
  const worldTime=cinematic||(!manual&&elapsed>0)?elapsed:(manual?12+now/100000:manualNight?78:12);
  updateWorld(worldTime,dt,manualNight);audio.update(worldTime);renderWorld();drawRecordFrame(elapsed);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function startRecording(){
  if(!window.MediaRecorder||!recordCanvas.captureStream){toast('此浏览器暂不支持网页录制，请使用桌面版 Chrome 或 Edge。');return;}
  await audio.start();let audioTracks=[];
  if(!audio.hasVoiceFile&&narratorEnabled&&navigator.mediaDevices?.getDisplayMedia){
    try{
      toast('请选择当前浏览器标签页，并勾选“共享标签页音频”，以收录朗诵与配乐。');
      displayAudioStream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});
      audioTracks=displayAudioStream.getAudioTracks();
      if(!audioTracks.length)toast('未取得标签页声音：本次将录制原创配乐，旁白请另行配音。');
    }catch(e){toast('未授权标签页音频，将使用网页原创配乐录制。');}
  }
  if(!audioTracks.length)audioTracks=audio.getStream().getAudioTracks();
  const videoStream=recordCanvas.captureStream(30);
  const stream=new MediaStream([...videoStream.getVideoTracks(),...audioTracks]);
  const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t))||'';
  recordChunks=[];
  try{
    recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:9000000}:undefined);
    recorder.ondataavailable=e=>{if(e.data&&e.data.size)recordChunks.push(e.data);};
    recorder.onstop=()=>{
      const blob=new Blob(recordChunks,{type:recorder.mimeType||'video/webm'});
      downloadBlob(blob,'滕王阁序-第一人称诗境.webm');recordActive=false;recordBtn.textContent='录制诗境';recordBtn.classList.remove('active');
      videoStream.getTracks().forEach(t=>t.stop());displayAudioStream?.getTracks().forEach(t=>t.stop());displayAudioStream=null;
      toast('影像已录成 WebM，可用剪映或 CapCut 导出 MP4。');
    };
    recorder.start(1000);recordActive=true;recordBtn.textContent='停止录制';recordBtn.classList.add('active');
    await startJourney();
  }catch(e){toast('录制未能开始：'+e.message);recordActive=false;}
}
function stopRecording(){if(recorder&&recorder.state!=='inactive')recorder.stop();}
recordBtn.addEventListener('click',()=>{if(recordActive)stopRecording();else startRecording();});
window.addEventListener('beforeunload',()=>audio.stopVoice());
