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
    if(cinematic&&narratorEnabled&&!audio.hasVoiceFile)audio.speak(c.verse);
    audio.setChapter(idx);
  }
  $('progress').style.width=(t/DURATION*100)+'%';
  $('progress-live').style.width=(t/DURATION*100)+'%';
}
function drawRecordFrame(t){
  const ctx=recordCtx;ctx.drawImage(renderer.domElement,0,0,WIDTH,HEIGHT);
  const shade=ctx.createLinearGradient(0,1200,0,HEIGHT);
  shade.addColorStop(0,'rgba(9,20,23,0)');shade.addColorStop(.42,'rgba(9,20,23,.24)');shade.addColorStop(1,'rgba(9,20,23,.78)');
  ctx.fillStyle=shade;ctx.fillRect(0,0,WIDTH,HEIGHT);
  const c=CHAPTERS[chapterIndex(t)];
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,.65)';ctx.shadowBlur=24;
  ctx.fillStyle='rgba(231,211,169,.88)';ctx.font='28px "KaiTi","STKaiti","Songti SC",serif';
  ctx.fillText('王 勃 · 滕 王 阁 序',WIDTH/2,145);
  ctx.fillStyle='#f4e7c8';ctx.font='bold 51px "KaiTi","STKaiti","Songti SC",serif';
  if(c.verse.length>15){
    const split=c.verse.indexOf('，')>0?c.verse.indexOf('，')+1:Math.ceil(c.verse.length/2);
    ctx.fillText(c.verse.slice(0,split),WIDTH/2,1575);ctx.fillText(c.verse.slice(split),WIDTH/2,1650);
  }else ctx.fillText(c.verse,WIDTH/2,1610);
  ctx.shadowBlur=0;ctx.fillStyle='rgba(226,207,167,.72)';ctx.font='25px "KaiTi","STKaiti","Songti SC",serif';
  ctx.fillText(c.note,WIDTH/2,1735);
  ctx.strokeStyle='rgba(218,188,126,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(180,1820);ctx.lineTo(900,1820);ctx.stroke();
  ctx.fillStyle='rgba(218,188,126,.7)';ctx.font='20px serif';ctx.fillText('江 天 一 阁 · 秋 水 长 天',WIDTH/2,1860);
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
  await audio.start();intro.classList.add('hidden');manual=false;cinematic=true;finished=false;elapsed=0;lastChapter=-1;startedAt=performance.now();
  camera.position.set(0,1.72,31);updateCaption(0);if(narratorEnabled)audio.startVoiceTrack();
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
$('roam').addEventListener('click',()=>{cinematic=false;manual=true;finished=false;intro.classList.add('hidden');audio.start();camera.position.set(0,1.72,25);yaw=0;pitch=0;toast('漫游已开启：W、A、S、D 行走，鼠标转身。');});
$('day').addEventListener('click',()=>{manualNight=!manualNight;toast(manualNight?'夜色已至。':'霞光重临。');});
$('narrator').addEventListener('click',()=>{narratorEnabled=!narratorEnabled;$('narrator').textContent=narratorEnabled?'诵读：开':'诵读：静';if(!narratorEnabled)audio.stopSpeech();});
$('voice-file').addEventListener('change',async e=>{const file=e.target.files&&e.target.files[0];if(file){await audio.loadVoiceFile(file);toast('已载入旁白音轨：'+file.name);}});
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
  const worldTime=cinematic?elapsed:(manual?12+now/100000:manualNight?78:12);
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
