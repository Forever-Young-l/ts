export class AudioDirector {
  constructor(){this.ctx=null;this.master=null;this.destination=null;this.noiseGain=null;this.voiceElement=null;this.voiceNode=null;this.hasVoiceFile=false;this.nextPluck=0;this.noteIndex=0;this.delay=null;this.feedback=null;}
  async start(){
    if(!this.ctx){
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
      this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.72;
      this.destination=this.ctx.createMediaStreamDestination();
      this.master.connect(this.ctx.destination);this.master.connect(this.destination);
      this.delay=this.ctx.createDelay(1.2);this.delay.delayTime.value=.38;
      this.feedback=this.ctx.createGain();this.feedback.gain.value=.22;
      this.master.connect(this.delay);this.delay.connect(this.feedback);this.feedback.connect(this.delay);
      this.delay.connect(this.ctx.destination);this.delay.connect(this.destination);
      const len=this.ctx.sampleRate*3,buffer=this.ctx.createBuffer(1,len,this.ctx.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*.35;
      const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=true;
      const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=520;
      this.noiseGain=this.ctx.createGain();this.noiseGain.gain.value=.022;
      source.connect(filter);filter.connect(this.noiseGain);this.noiseGain.connect(this.master);source.start();
      this.drone1=this.ctx.createOscillator();this.drone1.type='sine';this.drone1.frequency.value=110;
      this.droneGain=this.ctx.createGain();this.droneGain.gain.value=.018;this.drone1.connect(this.droneGain);this.droneGain.connect(this.master);this.drone1.start();
      this.drone2=this.ctx.createOscillator();this.drone2.type='sine';this.drone2.frequency.value=164.81;
      this.droneGain2=this.ctx.createGain();this.droneGain2.gain.value=.009;this.drone2.connect(this.droneGain2);this.droneGain2.connect(this.master);this.drone2.start();
      if(this.voiceElement&&!this.voiceNode){this.voiceNode=this.ctx.createMediaElementSource(this.voiceElement);this.voiceNode.connect(this.master);}
    }
    if(this.ctx.state==='suspended')await this.ctx.resume();
    return this.destination?.stream;
  }
  getStream(){return this.destination?.stream||new MediaStream();}
  update(t){
    if(!this.ctx||this.ctx.currentTime<this.nextPluck)return;
    const scale=[146.83,164.81,196,220,261.63,293.66,329.63];
    const f=scale[this.noteIndex%scale.length];this.noteIndex++;
    this.pluck(f,t>24&&t<54?.8:1);
    this.nextPluck=this.ctx.currentTime+(t<20?2.4:1.65);
    if(this.noiseGain)this.noiseGain.gain.setTargetAtTime(t<8?.028:t>65?.012:.018,this.ctx.currentTime,.8);
  }
  pluck(freq,volume=1){
    const now=this.ctx.currentTime,osc=this.ctx.createOscillator(),o2=this.ctx.createOscillator(),gain=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();
    osc.type='triangle';osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(freq*.994,now+1.1);
    o2.type='sine';o2.frequency.value=freq*2.01;filter.type='lowpass';filter.frequency.value=2100;
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.075*volume,now+.018);gain.gain.exponentialRampToValueAtTime(.0001,now+2.1);
    osc.connect(filter);o2.connect(filter);filter.connect(gain);gain.connect(this.master);
    osc.start(now);o2.start(now);osc.stop(now+2.2);o2.stop(now+2.2);
  }
  setChapter(idx){if(this.ctx){const f=[110,123.47,130.81,146.83,138.59,98][idx]||110;this.drone1?.frequency.setTargetAtTime(f,this.ctx.currentTime,1.4);}}
  async loadVoiceFile(file){
    await this.start();
    if(this.voiceElement){this.voiceElement.pause();this.voiceElement.remove();}
    this.voiceElement=new Audio(URL.createObjectURL(file));this.voiceElement.preload='auto';
    this.voiceNode=this.ctx.createMediaElementSource(this.voiceElement);this.voiceNode.connect(this.master);this.hasVoiceFile=true;
  }
  startVoiceTrack(){if(this.hasVoiceFile&&this.voiceElement){this.voiceElement.currentTime=0;this.voiceElement.play().catch(()=>{});}}
  pauseVoice(){this.voiceElement?.pause();if(window.speechSynthesis)window.speechSynthesis.pause();}
  resumeVoice(){this.voiceElement?.play().catch(()=>{});if(window.speechSynthesis)window.speechSynthesis.resume();}
  stopVoice(){this.voiceElement?.pause();if(this.voiceElement)this.voiceElement.currentTime=0;this.stopSpeech();}
  stopSpeech(){if(window.speechSynthesis)window.speechSynthesis.cancel();}
  speak(text){
    if(!('speechSynthesis'in window))return;
    this.stopSpeech();
    const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.82;u.pitch=.78;u.volume=.92;
    const voices=window.speechSynthesis.getVoices();
    const chinese=voices.filter(v=>/^zh(-|_)?CN/i.test(v.lang)||/Chinese|中文|普通话/i.test(v.name));
    const preferred=chinese.find(v=>/yunxi|yunyang|male|男|云希|云扬/i.test(v.name))||chinese[0];
    if(preferred)u.voice=preferred;
    window.speechSynthesis.speak(u);
  }
}