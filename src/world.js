import * as THREE from 'three';

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const DURATION = 80;

export const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(1);
renderer.setSize(WIDTH,HEIGHT,false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.className = 'scene-canvas';

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(43,WIDTH/HEIGHT,.1,320);
camera.position.set(0,1.72,31);

const boxGeo = new THREE.BoxGeometry(1,1,1);
const mat = (c,r=.88,extra={}) => new THREE.MeshStandardMaterial({color:c,roughness:r,...extra});
const M = {
  wood:mat('#68412e'),wood2:mat('#8c593b'),woodLight:mat('#b17a4e'),red:mat('#873d32'),
  roof:mat('#263e3b'),roof2:mat('#3e5b50'),roofEdge:mat('#71806a'),
  stone:mat('#9b9783'),stone2:mat('#6f7168'),gold:mat('#c7a15c',.55,{metalness:.28}),
  grass:mat('#657e59'),grass2:mat('#81966a'),leaf:mat('#47664a'),leaf2:mat('#68825a'),
  dark:mat('#293b37'),lantern:mat('#e8b866',.4,{emissive:'#e5a64e',emissiveIntensity:1.5}),
  cloud:new THREE.MeshStandardMaterial({color:'#e9e2d1',roughness:1,transparent:true,opacity:.72}),
  bird:mat('#242f31',.95),boat:mat('#63402d'),waterBank:mat('#6b765f')
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const colorMix=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),t);

function cube(parent,x,y,z,sx,sy,sz,material,name=''){
  const mesh=new THREE.Mesh(boxGeo,material);
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;
  if(name)mesh.name=name;parent.add(mesh);return mesh;
}
function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}

function addRoof(parent,y,width,depth){
  const layers=[[width+3,depth+3,.38,0],[width+2,depth+2,.32,.32],[width+.8,depth+.8,.28,.62],[width*.52,depth*.52,.25,.9]];
  layers.forEach((l,i)=>cube(parent,0,y+l[3],0,l[0],l[2],l[1],i<2?M.roof:M.roof2,'黛瓦叠檐'));
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const tip=cube(parent,sx*(width/2+1.55),y+.42,sz*(depth/2+1.55),1.9,.22,1.9,M.roof2,'飞檐翘角');
    tip.rotation.z=-sx*.11;tip.rotation.x=sz*.11;
    cube(parent,sx*(width/2+.9),y+.72,sz*(depth/2+.9),.28,.58,.28,M.gold,'檐角铜饰');
  }
  cube(parent,0,y+1.08,0,width*.42,.22,.42,M.roofEdge,'正脊');
  cube(parent,0,y+1.34,0,.28,.42,.28,M.gold,'脊兽宝顶');
  for(const sx of [-1,1])cube(parent,sx*width*.28,y+1.15,0,.9,.18,.3,M.roofEdge,'垂脊');
}
function addFloor(parent,y,width,depth){
  const halfW=width/2-.55,halfD=depth/2-.55;
  cube(parent,0,y,0,width,.48,depth,M.stone,'楼层台基');
  cube(parent,0,y+.28,0,width+.3,.16,depth+.3,M.red,'朱漆裙板');
  const posts=[];
  for(let x=-halfW;x<=halfW+.01;x+=(width-1.1)/4)posts.push([x,-halfD],[x,halfD]);
  for(let z=-halfD+1.5;z<halfD;z+=1.6)posts.push([-halfW,z],[halfW,z]);
  const seen=new Set();
  posts.forEach(([x,z])=>{
    const key=x.toFixed(2)+':'+z.toFixed(2);if(seen.has(key))return;seen.add(key);
    cube(parent,x,y+1.75,z,.38,3.5,.38,M.red,'朱柱');
    cube(parent,x,y+3.48,z,.78,.24,.78,M.woodLight,'斗拱托木');
    cube(parent,x,y+3.7,z,.58,.16,.58,M.gold,'斗拱饰片');
  });
  cube(parent,0,y+.88,-halfD,width-1.1,.16,.18,M.woodLight,'栏杆横枋');
  cube(parent,0,y+.88,halfD,width-1.1,.16,.18,M.woodLight,'栏杆横枋');
  cube(parent,-halfW,y+.88,0,.18,.16,depth-1.1,M.woodLight,'栏杆横枋');
  cube(parent,halfW,y+.88,0,.18,.16,depth-1.1,M.woodLight,'栏杆横枋');
  for(let x=-halfW+.4;x<halfW;x+=.72){
    cube(parent,x,y+.62,-halfD,.09,.58,.09,M.wood2,'栏杆望柱');
    cube(parent,x,y+.62,halfD,.09,.58,.09,M.wood2,'栏杆望柱');
  }
  for(let z=-halfD+.4;z<halfD;z+=.72){
    cube(parent,-halfW,y+.62,z,.09,.58,.09,M.wood2,'栏杆望柱');
    cube(parent,halfW,y+.62,z,.09,.58,.09,M.wood2,'栏杆望柱');
  }
  for(const side of [-1,1]){
    for(let x=-halfW+1.2;x<halfW-.8;x+=2.15){
      if(Math.abs(x)<1.25)continue;
      const z=side*(halfD-.12);
      cube(parent,x,y+2.15,z,1.5,1.8,.12,M.wood,'雕花窗格');
      for(let k=-1;k<=1;k++)cube(parent,x+k*.42,y+2.15,z-side*.08,.07,1.68,.06,M.woodLight,'窗棂');
      cube(parent,x,y+1.72,z-side*.08,1.4,.07,.06,M.woodLight,'窗棂');
      cube(parent,x,y+2.58,z-side*.08,1.4,.07,.06,M.woodLight,'窗棂');
    }
  }
  cube(parent,0,y+3.48,-halfD,width+.3,.34,.34,M.wood2,'檐下横梁');
  cube(parent,0,y+3.48,halfD,width+.3,.34,.34,M.wood2,'檐下横梁');
  cube(parent,-halfW,y+3.48,0,.34,.34,depth+.3,M.wood2,'檐下横梁');
  cube(parent,halfW,y+3.48,0,.34,.34,depth+.3,M.wood2,'檐下横梁');
  addRoof(parent,y+4.05,width,depth);
}

scene.add(new THREE.HemisphereLight('#f7ead2','#43564b',1.35));
const sun=new THREE.DirectionalLight('#ffdda0',2.6);
sun.position.set(-28,46,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-65;sun.shadow.camera.right=65;sun.shadow.camera.top=65;sun.shadow.camera.bottom=-65;sun.shadow.bias=-.0002;scene.add(sun);
const moon=new THREE.DirectionalLight('#9eb9d2',.05);moon.position.set(20,28,-40);scene.add(moon);
const hemi=scene.children.find(o=>o.isHemisphereLight);

const skyUniforms={zenith:{value:new THREE.Color('#617e89')},horizon:{value:new THREE.Color('#b8b8a5')},sunColor:{value:new THREE.Color('#ffe0a4')},sunDirection:{value:new THREE.Vector3(-.45,.5,-.7).normalize()}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(250,32,20),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,uniforms:skyUniforms,
  vertexShader:'varying vec3 vWorld; void main(){vec4 p=modelMatrix*vec4(position,1.0);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
  fragmentShader:'uniform vec3 zenith;uniform vec3 horizon;uniform vec3 sunColor;uniform vec3 sunDirection;varying vec3 vWorld;void main(){vec3 d=normalize(vWorld-cameraPosition);float h=max(0.0,d.y);vec3 c=mix(horizon,zenith,smoothstep(0.02,0.86,h));float s=pow(max(dot(d,normalize(sunDirection)),0.0),180.0);float halo=pow(max(dot(d,normalize(sunDirection)),0.0),12.0);c+=sunColor*(s*1.8+halo*.16);gl_FragColor=vec4(c,1.0);}'
}));
scene.add(sky);

const ground=new THREE.Mesh(new THREE.PlaneGeometry(220,150),M.grass);
ground.rotation.x=-Math.PI/2;ground.position.set(0,-.12,35);ground.receiveShadow=true;scene.add(ground);
const riverMaterial=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uWarm:{value:0},uNight:{value:0}},
  vertexShader:'uniform float uTime;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z+=sin(p.x*.13+uTime*.72)*.09+cos(p.y*.18+uTime*.55)*.06;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}',
  fragmentShader:'uniform float uTime;uniform float uWarm;uniform float uNight;varying vec2 vUv;void main(){float a=sin(vUv.x*210.0+uTime*1.4+sin(vUv.y*25.0))*.5+.5;float b=sin(vUv.y*135.0-uTime*.9)*.5+.5;float glint=pow(max(0.0,a*b),9.0)*.52;vec3 deep=vec3(.10,.27,.29);vec3 dusk=vec3(.39,.28,.25);vec3 night=vec3(.055,.12,.18);vec3 c=mix(deep,dusk,uWarm);c=mix(c,night,uNight);c+=vec3(.65,.57,.40)*glint*(1.0-uNight*.65);gl_FragColor=vec4(c,1.0);}'
});
const river=new THREE.Mesh(new THREE.PlaneGeometry(190,95,90,50),riverMaterial);
river.rotation.x=-Math.PI/2;river.position.set(0,.12,-35);river.receiveShadow=true;scene.add(river);
cube(scene,0,.12,13,180,.38,5,M.waterBank,'江岸石堤');
const farBank=cube(scene,0,.2,-84,210,.5,8,M.grass,'彼岸');farBank.receiveShadow=true;
for(let i=0;i<13;i++){
  const x=-66+i*11,m=new THREE.Mesh(new THREE.ConeGeometry(9+(i%3)*4,15+(i%4)*5,6),mat(i%2?'#718276':'#596d6c'));
  m.position.set(x,6+(i%4)*1.2,-84+(i%3)*2);m.scale.z=.42;m.rotation.y=i*.31;scene.add(m);
}
for(let i=0;i<22;i++){const x=-76+i*7.2,h=3+(i*7%5);cube(scene,x,h/2,-78+(i%4)*1.1,2.2,h,1.6,M.dark,'远岸楼影');}

const pavilion=group(scene,0,0,4);
cube(pavilion,0,.45,0,20,.9,16,M.stone2,'滕王阁石台');
cube(pavilion,0,1.02,0,18.8,.22,14.8,M.gold,'台基压边');
addFloor(pavilion,1.25,16,12);
addFloor(pavilion,6.15,12.2,9.3);
addFloor(pavilion,11.05,8.7,6.8);
// Open exterior stair: the visitor climbs along the western gallery.
for(let i=0;i<17;i++){
  const z=7.2-i*.58,y=1.55+i*.285;
  cube(pavilion,-8.25,y,z,2.35,.34,.86,i%2?M.woodLight:M.wood2,'登阁木阶');
  cube(pavilion,-9.55,y+.36,z,.16,.7,.16,M.woodLight,'扶手望柱');
  cube(pavilion,-6.95,y+.36,z,.16,.7,.16,M.woodLight,'扶手望柱');
}
cube(pavilion,-8.25,6.35,-2.7,2.8,.18,1,M.woodLight,'二层登临平台');
cube(pavilion,0,3.15,-6.03,4.1,3.8,.24,M.red,'朱门框');
cube(pavilion,0,4.7,-6.2,2.4,.55,.12,M.gold,'匾额边框');
cube(pavilion,0,4.7,-6.28,2.15,.36,.08,M.wood,'匾额');
const plaqueCanvas=document.createElement('canvas');plaqueCanvas.width=512;plaqueCanvas.height=128;
const pctx=plaqueCanvas.getContext('2d');pctx.fillStyle='#4b2d21';pctx.fillRect(0,0,512,128);pctx.strokeStyle='#c8a66b';pctx.lineWidth=5;pctx.strokeRect(8,8,496,112);pctx.fillStyle='#e8d7aa';pctx.font='bold 66px serif';pctx.textAlign='center';pctx.textBaseline='middle';pctx.fillText('滕 王 阁',256,67);
const plaqueTex=new THREE.CanvasTexture(plaqueCanvas);plaqueTex.colorSpace=THREE.SRGBColorSpace;
const plaque=new THREE.Mesh(new THREE.PlaneGeometry(2.05,.34),new THREE.MeshBasicMaterial({map:plaqueTex,transparent:true}));
plaque.position.set(0,4.7,-6.34);pavilion.add(plaque);
for(let i=0;i<8;i++)cube(scene,0,.12+i*.06,18-i*1.15,4.2+i*.28,.26,1.05,M.stone,'青石登阶');
for(let i=0;i<12;i++)cube(scene,0,.12,27+i*1.1,3.1,.18,.92,M.stone2,'青石甬道');

const trees=[];
function makeTree(x,z,s=1){
  const g=group(scene,x,0,z);cube(g,0,1.25*s,0,.58*s,2.5*s,.58*s,M.wood,'古木');
  for(let j=0;j<4;j++){const crown=group(g,0,(2.1+j*.88)*s,0);cube(crown,0,.25*s,0,(3.9-j*.55)*s,1.05*s,(3.6-j*.5)*s,j%2?M.leaf2:M.leaf,'层叠树冠');trees.push(crown);}
}
[[-18,8,1.25],[-24,17,1.5],[19,13,1.3],[25,4,1.2],[-28,-9,1],[30,-15,1.1],[15,-2,.9]].forEach(p=>makeTree(...p));
for(let i=0;i<38;i++){
  const x=-36+i*1.95,reed=group(scene,x,.15,12+Math.sin(i*1.7)*2.4);
  const stem=cube(reed,0,.95,0,.08,1.9+(i%4)*.18,.08,M.grass2,'芦苇');stem.rotation.z=(i%2?1:-1)*.12;
  cube(reed,.25,1.45,0,.52,.08,.08,M.grass,'芦叶').rotation.z=.35;trees.push(reed);
}
function makeLantern(x,y,z,parent=scene){
  const g=group(parent,x,y,z);cube(g,0,0,0,.48,.62,.48,M.lantern,'灯笼灯芯');
  for(const dx of [-.28,.28])for(const dz of [-.28,.28])cube(g,dx,0,dz,.045,.76,.045,M.wood,'灯笼骨');
  cube(g,0,.4,0,.68,.12,.68,M.woodLight,'灯笼檐');cube(g,0,-.4,0,.5,.12,.5,M.gold,'灯笼坠');
  const light=new THREE.PointLight('#ffbd68',0,10,2);g.add(light);return {g,light};
}
const lanterns=[
  makeLantern(-6.8,4.3,-1.1,pavilion),makeLantern(6.8,4.3,-1.1,pavilion),
  makeLantern(-4.8,9.1,-1,pavilion),makeLantern(4.8,9.1,-1,pavilion),
  makeLantern(-6.5,2.7,4.1,pavilion),makeLantern(6.5,2.7,4.1,pavilion)
];

const boat=group(scene,-35,.65,-28);
cube(boat,0,0,0,4.8,.48,1.45,M.boat,'乌篷船船身');
cube(boat,0,.38,-.08,2.8,.16,1.3,M.woodLight,'船舷');
cube(boat,0,1.15,-.05,1.9,1.25,1.45,M.wood,'乌篷');
cube(boat,0,1.82,-.05,2.2,.18,1.7,M.roof,'船篷');
const boatLamp=makeLantern(.55,1.05,.85,boat);lanterns.push(boatLamp);

const birds=[];
function makeBird(x,y,z,s=1,phase=0){
  const g=group(scene,x,y,z);
  cube(g,0,0,0,.78*s,.16*s,.22*s,M.bird,'孤鹜身影');
  cube(g,.43*s,.04*s,-.02*s,.26*s,.11*s,.11*s,M.gold,'鸟喙');
  const left=cube(g,-.05*s,.1*s,-.4*s,.9*s,.08*s,.5*s,M.bird,'左翼');
  const right=cube(g,-.05*s,.1*s,.4*s,.9*s,.08*s,.5*s,M.bird,'右翼');
  birds.push({g,left,right,phase,s});
}
makeBird(-18,23,-45,1.45,0);
for(let i=0;i<7;i++)makeBird(-32+i*3.4,26+Math.sin(i)*2,-54-i*1.2,.56,i*.7);

const clouds=[];
for(let i=0;i<9;i++){
  const g=group(scene,-58+i*14,24+(i%3)*4,-62-(i%2)*9);
  for(let j=0;j<5;j++){const puff=new THREE.Mesh(new THREE.IcosahedronGeometry(2.6+(j%2)*.6,1),M.cloud);puff.position.set((j-2)*2.3,Math.sin(j*1.2)*.5,Math.cos(j)*.9);puff.scale.set(1.4,.58,.82);g.add(puff);}
  clouds.push(g);
}
const rainCount=650,rainPositions=new Float32Array(rainCount*6);
for(let i=0;i<rainCount;i++){
  const x=(Math.random()-.5)*95,y=Math.random()*42+3,z=(Math.random()-.5)*90,k=i*6;
  rainPositions[k]=x;rainPositions[k+1]=y;rainPositions[k+2]=z;rainPositions[k+3]=x-.12;rainPositions[k+4]=y-.75;rainPositions[k+5]=z;
}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:'#d5e4e4',transparent:true,opacity:0}));scene.add(rain);
scene.fog=new THREE.Fog('#8d9b99',35,145);

export const CHAPTERS=[
  {at:0,title:'云销雨霁',verse:'云销雨霁，彩彻区明',note:'檐雨初歇，天光乍开。'},
  {at:11,title:'寒潭暮山',verse:'潦水尽而寒潭清，烟光凝而暮山紫',note:'清潭照影，远岫含烟。'},
  {at:23,title:'落霞秋水',verse:'落霞与孤鹜齐飞，秋水共长天一色',note:'一阁临江，天地无垠。'},
  {at:43,title:'渔舟唱晚',verse:'渔舟唱晚，响穷彭蠡之滨',note:'归舟灯火，歌声随水。'},
  {at:56,title:'雁阵惊寒',verse:'雁阵惊寒，声断衡阳之浦',note:'秋声渐远，长空寂寥。'},
  {at:68,title:'长江空流',verse:'阁中帝子今何在？槛外长江空自流',note:'千年一瞬，江水如故。'}
];
const KEYFRAMES=[
  {t:0,p:[0,1.72,31],l:[0,5.2,7]},
  {t:7,p:[0,1.72,21],l:[0,5.7,5]},
  {t:13,p:[-5.2,1.85,8.5],l:[-8,4.2,0]},
  {t:20,p:[-8.2,5.4,2.5],l:[-8,7.4,-10]},
  {t:27,p:[-8.2,7.78,-2.4],l:[-2,8.4,-24]},
  {t:34,p:[-3.8,7.78,-3.1],l:[0,8.2,-48]},
  {t:42,p:[0,7.78,-3.1],l:[0,8.1,-72]},
  {t:53,p:[1,7.78,-3.1],l:[10,1,-28]},
  {t:62,p:[0,7.78,-3.1],l:[0,29,-48]},
  {t:70,p:[0,7.78,-3.1],l:[0,8,-74]},
  {t:80,p:[0,7.78,-3.1],l:[0,.5,-100]}
];
export function setCameraAt(t){
  let i=0;while(i<KEYFRAMES.length-2&&t>KEYFRAMES[i+1].t)i++;
  const a=KEYFRAMES[i],b=KEYFRAMES[i+1],f=smooth(clamp((t-a.t)/(b.t-a.t),0,1));
  const p=a.p.map((v,k)=>mix(v,b.p[k],f)),l=a.l.map((v,k)=>mix(v,b.l[k],f));
  camera.position.set(p[0],p[1],p[2]);camera.lookAt(l[0],l[1],l[2]);
}
const phases=[
  {t:0,sky:'#536a78',h:'#849b9b',sun:'#b5c3c0',warm:0,night:0,fog:'#74878a'},
  {t:10,sky:'#78a3a2',h:'#d5d2bc',sun:'#fff0c8',warm:.1,night:0,fog:'#b1bdb0'},
  {t:22,sky:'#6e7187',h:'#c5a8a6',sun:'#e4b9a0',warm:.3,night:0,fog:'#8f8c96'},
  {t:34,sky:'#d07b58',h:'#f1bb82',sun:'#ffd18b',warm:1,night:0,fog:'#b77e69'},
  {t:46,sky:'#a75f54',h:'#d9a078',sun:'#ffbe77',warm:1,night:0,fog:'#936d6a'},
  {t:58,sky:'#5d657b',h:'#b18481',sun:'#e2b18b',warm:.45,night:.08,fog:'#626b7a'},
  {t:70,sky:'#263b55',h:'#5c7181',sun:'#a2b8d3',warm:0,night:.8,fog:'#30475b'},
  {t:80,sky:'#172b43',h:'#3b536a',sun:'#9ab5d3',warm:0,night:1,fog:'#1d344c'}
];
function updateAtmosphere(t,manualNight){
  const time=manualNight?78:t;
  let i=0;while(i<phases.length-2&&time>phases[i+1].t)i++;
  const a=phases[i],b=phases[i+1],f=smooth(clamp((time-a.t)/(b.t-a.t),0,1));
  skyUniforms.zenith.value.copy(colorMix(a.sky,b.sky,f));
  skyUniforms.horizon.value.copy(colorMix(a.h,b.h,f));
  skyUniforms.sunColor.value.copy(colorMix(a.sun,b.sun,f));
  riverMaterial.uniforms.uWarm.value=mix(a.warm,b.warm,f);
  riverMaterial.uniforms.uNight.value=mix(a.night,b.night,f);
  scene.fog.color.copy(colorMix(a.fog,b.fog,f));
  sun.intensity=mix(2.5,.28,clamp((time-42)/32,0,1));
  sun.color.copy(colorMix('#ffe2ac','#9fb9d3',clamp((time-55)/25,0,1)));
  hemi.intensity=mix(1.25,.48,clamp((time-55)/25,0,1));
  moon.intensity=clamp((time-59)/18,0,1)*.72;
  lanterns.forEach((l,i)=>{const glow=clamp((time-37)/25,0,1)*(1+Math.sin(time*3+i)*.12);l.light.intensity=glow*2.6;l.g.rotation.z=Math.sin(time*.8+i)*.035;});
  rain.material.opacity=clamp(1-t/8,0,1)*.34;
}
export function updateWorld(t,dt,manualNight=false){
  updateAtmosphere(t,manualNight);
  riverMaterial.uniforms.uTime.value=t;
  clouds.forEach((c,i)=>{c.position.x+=dt*(.38+(i%3)*.09);if(c.position.x>78)c.position.x=-78;c.position.y+=Math.sin(t*.12+i)*.002;});
  trees.forEach((g,i)=>{g.rotation.z=Math.sin(t*.7+i*.8)*.035;});
  boat.position.x=-35+clamp((t-42)/17,0,1)*70;
  boat.position.z=-28+Math.sin(t*.24)*.8;
  boat.rotation.y=Math.sin(t*.15)*.035;
  boat.position.y=.62+Math.sin(t*1.1)*.045;
  birds.forEach((b,i)=>{
    const flight=clamp((t-25)/36,0,1);
    b.g.position.x=-36+i*5.2+flight*(18+i*1.4);
    b.g.position.y=24+Math.sin(t*.75+b.phase)*1.6;
    b.g.position.z=-47-i*1.4+Math.cos(t*.3+b.phase)*2;
    b.left.rotation.x=Math.sin(t*5+b.phase)*.48;
    b.right.rotation.x=-Math.sin(t*5+b.phase)*.48;
  });
  const arr=rainGeo.attributes.position.array;
  for(let i=0;i<rainCount;i++){const k=i*6;arr[k+1]-=dt*20;arr[k+4]-=dt*20;if(arr[k+1]<0){const y=35+Math.random()*12;arr[k+1]=y;arr[k+4]=y-.75;}}
  rainGeo.attributes.position.needsUpdate=true;
}
export function renderWorld(){renderer.render(scene,camera);}
