import * as THREE from 'three';

export const WIDTH = 1080, HEIGHT = 1920, DURATION = 80;
export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(WIDTH, HEIGHT, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.className = 'scene-canvas';

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(39, WIDTH / HEIGHT, .1, 420);
camera.position.set(0, 1.68, 10);
scene.add(camera);

const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const mix = (a,b,t) => a+(b-a)*t;
const smooth = t => t*t*(3-2*t);
const colorMix = (a,b,t) => new THREE.Color(a).lerp(new THREE.Color(b),t);
const seeded = n => { const x=Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };

function canvasTexture(draw,w=512,h=512,rx=1,ry=1){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);
  t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}
const woodTexture=canvasTexture((ctx,w,h)=>{
  const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#50362b');g.addColorStop(.48,'#8a5a3d');g.addColorStop(1,'#382821');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  for(let i=0;i<210;i++){const y=seeded(i+2)*h,x=seeded(i+81)*w;ctx.strokeStyle=i%4===0?'rgba(222,173,117,.13)':'rgba(24,17,14,.16)';ctx.lineWidth=.4+seeded(i+12)*2;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(w*.25,y+Math.sin(i)*5,w*.72,y-Math.cos(i)*7,w,y+Math.sin(i*.3)*4);ctx.stroke();if(i%13===0){ctx.strokeStyle='rgba(27,18,13,.22)';ctx.beginPath();ctx.ellipse(x,y,8+seeded(i+3)*22,2+seeded(i+4)*5,.1,0,Math.PI*2);ctx.stroke();}}
},512,512,2,1);
const roofTexture=canvasTexture((ctx,w,h)=>{
  ctx.fillStyle='#263d3b';ctx.fillRect(0,0,w,h);const rows=18,cols=13,rh=h/rows,cw=w/cols;
  for(let r=0;r<rows;r++)for(let c=-1;c<=cols;c++){const x=c*cw+(r%2?-cw/2:0),y=r*rh;ctx.fillStyle=(r+c)%4===0?'#38534c':((r+c)%3===0?'#304944':'#263f3c');ctx.beginPath();ctx.moveTo(x,y+1);ctx.quadraticCurveTo(x+cw/2,y-rh*.12,x+cw,y+1);ctx.lineTo(x+cw-2,y+rh-1);ctx.quadraticCurveTo(x+cw/2,y+rh+3,x+2,y+rh-1);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(154,168,133,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+3,y+3);ctx.quadraticCurveTo(x+cw/2,y+1,x+cw-3,y+3);ctx.stroke();}
  const sh=ctx.createLinearGradient(0,0,0,h);sh.addColorStop(0,'rgba(9,21,21,.05)');sh.addColorStop(1,'rgba(5,14,15,.38)');ctx.fillStyle=sh;ctx.fillRect(0,0,w,h);
},768,768,1,1);
const stoneTexture=canvasTexture((ctx,w,h)=>{
  ctx.fillStyle='#827f70';ctx.fillRect(0,0,w,h);
  for(let i=0;i<3600;i++){const x=seeded(i+8)*w,y=seeded(i+43)*h,a=.025+seeded(i+99)*.09;ctx.fillStyle=i%2?'rgba(27,34,31,'+a+')':'rgba(242,225,189,'+a+')';ctx.fillRect(x,y,1+seeded(i+2)*3,1+seeded(i+4)*2);}
  ctx.strokeStyle='rgba(43,48,42,.25)';ctx.lineWidth=2;for(let y=0;y<=h;y+=128){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}for(let x=0;x<=w;x+=128){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
},512,512,2,2);
const silkTexture=canvasTexture((ctx,w,h)=>{
  const g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,'#6c2925');g.addColorStop(.5,'#a34c3c');g.addColorStop(1,'#57221f');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  for(let x=0;x<w;x+=9){ctx.strokeStyle='rgba(245,193,133,.08)';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+3,h);ctx.stroke();}
},256,512,1,1);
const M={
  timber:new THREE.MeshStandardMaterial({map:woodTexture,color:'#c08a60',roughness:.76}),
  darkTimber:new THREE.MeshStandardMaterial({map:woodTexture,color:'#6d4935',roughness:.84}),
  cinnabar:new THREE.MeshStandardMaterial({map:woodTexture,color:'#873d32',roughness:.68}),
  roof:new THREE.MeshStandardMaterial({map:roofTexture,color:'#a0aa91',roughness:.76,metalness:.05,side:THREE.DoubleSide}),
  roofDark:new THREE.MeshStandardMaterial({color:'#172b2a',roughness:.9,side:THREE.DoubleSide}),
  stone:new THREE.MeshStandardMaterial({map:stoneTexture,color:'#c0b69b',roughness:.94}),
  stoneDark:new THREE.MeshStandardMaterial({map:stoneTexture,color:'#77786e',roughness:.95}),
  brass:new THREE.MeshStandardMaterial({color:'#b58a50',roughness:.42,metalness:.56}),
  leaf:new THREE.MeshStandardMaterial({color:'#4d6853',roughness:.94}),
  leafLight:new THREE.MeshStandardMaterial({color:'#78846a',roughness:.94}),
  lantern:new THREE.MeshStandardMaterial({map:silkTexture,color:'#e8b17b',roughness:.8,emissive:'#8b321c',emissiveIntensity:.34}),
  bird:new THREE.MeshStandardMaterial({color:'#2a3030',roughness:.92,side:THREE.DoubleSide}),
  birdLight:new THREE.MeshStandardMaterial({color:'#c5bca5',roughness:.92,side:THREE.DoubleSide}),
  boat:new THREE.MeshStandardMaterial({map:woodTexture,color:'#785039',roughness:.82}),
  canopy:new THREE.MeshStandardMaterial({color:'#263b38',roughness:.98,side:THREE.DoubleSide})
};
function addBox(parent,x,y,z,w,h,d,material,name){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;if(name)m.name=name;parent.add(m);return m;
}
function addCylinder(parent,x,y,z,rt,rb,h,material,radial=16,name=''){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,radial),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;if(name)m.name=name;parent.add(m);return m;
}
function addTube(parent,points,radius,material,segments=32){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],p[1],p[2])));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,8,false),material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}

scene.add(new THREE.HemisphereLight('#e8e5d4','#35413b',1.28));
const hemi=scene.children.find(o=>o.isHemisphereLight);
const sun=new THREE.DirectionalLight('#ffe0b2',2.75);
sun.position.set(-42,38,-52);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-42;sun.shadow.camera.right=42;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-30;
sun.shadow.camera.near=1;sun.shadow.camera.far=150;sun.shadow.bias=-.00018;sun.shadow.normalBias=.025;scene.add(sun);
const moon=new THREE.DirectionalLight('#a8bfd2',.04);moon.position.set(24,32,-70);scene.add(moon);

const skyUniforms={
  zenith:{value:new THREE.Color('#405b68')},horizon:{value:new THREE.Color('#9a9f98')},
  sunColor:{value:new THREE.Color('#f7d5a3')},sunDirection:{value:new THREE.Vector3(-.48,.22,-.84).normalize()},
  uTime:{value:0},uDusk:{value:0}
};
const skyVertex=[
'varying vec3 vDir;','varying vec2 vUv;',
'void main(){','vDir=normalize(position);vUv=uv;',
'gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);','}'
].join('\n');
const skyFragment=[
'uniform vec3 zenith;','uniform vec3 horizon;','uniform vec3 sunColor;','uniform vec3 sunDirection;',
'uniform float uTime;','uniform float uDusk;','varying vec3 vDir;','varying vec2 vUv;',
'void main(){',
'float h=smoothstep(-.14,.82,vDir.y);vec3 col=mix(horizon,zenith,h);',
'float sun=max(dot(normalize(vDir),normalize(sunDirection)),0.0);',
'float aureole=pow(sun,8.0)*.32;float disc=pow(sun,180.0)*1.8;col=mix(col,sunColor,aureole+disc);',
'float band=smoothstep(.15,.8,1.0-abs(vUv.y-.53)*2.2);',
'float wisps=sin(vUv.x*29.0+sin(vUv.y*17.0+uTime*.008)*2.4)*sin(vUv.x*11.0-vUv.y*13.0);',
'float cloud=smoothstep(.28,.78,wisps*.5+.5)*band;',
'col=mix(col,mix(horizon,sunColor,uDusk*.34),cloud*.16);gl_FragColor=vec4(col,1.0);','}'
].join('\n');
const sky=new THREE.Mesh(new THREE.SphereGeometry(390,48,32),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,uniforms:skyUniforms,vertexShader:skyVertex,fragmentShader:skyFragment
}));
scene.add(sky);

const glowTexture=canvasTexture((ctx,w,h)=>{
  const g=ctx.createRadialGradient(w/2,h/2,1,w/2,h/2,w/2);
  g.addColorStop(0,'rgba(255,237,202,.95)');g.addColorStop(.12,'rgba(255,210,151,.52)');
  g.addColorStop(.38,'rgba(244,167,116,.16)');g.addColorStop(1,'rgba(244,167,116,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
},256,256);
const sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color:'#f4c28c',transparent:true,opacity:.78,blending:THREE.AdditiveBlending,depthWrite:false}));
sunGlow.position.set(-56,25,-136);sunGlow.scale.set(74,74,1);scene.add(sunGlow);

const cloudTexture=canvasTexture((ctx,w,h)=>{
  ctx.clearRect(0,0,w,h);
  for(let i=0;i<22;i++){const x=i/21*w,y=h*(.34+seeded(i+17)*.32),rx=24+seeded(i+31)*58,ry=12+seeded(i+71)*24;
    const g=ctx.createRadialGradient(x,y,1,x,y,rx);g.addColorStop(0,'rgba(244,230,210,.32)');g.addColorStop(.55,'rgba(222,218,202,.14)');g.addColorStop(1,'rgba(210,215,209,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
},1024,256);
const clouds=[];
for(let i=0;i<7;i++){
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTexture,color:'#e8d9c0',transparent:true,opacity:.28+(i%3)*.04,depthWrite:false}));
  s.position.set(-90+i*29,22+(i%3)*6,-116-(i%2)*18);s.scale.set(50+(i%3)*14,13+(i%2)*5,1);scene.add(s);clouds.push(s);
}

function roofHeight(u,v,rise){const edge=Math.max(Math.abs(u),Math.abs(v));return rise*(1-edge)+.52*Math.pow(Math.abs(u*v),2.8);}
function addRoof(parent,baseY,width,depth,rise){
  const seg=28,positions=[],uvs=[],indices=[];
  for(let j=0;j<=seg;j++)for(let i=0;i<=seg;i++){const u=i/seg*2-1,v=j/seg*2-1;positions.push(u*width*.5,roofHeight(u,v,rise),v*depth*.5);uvs.push(i/seg*3,j/seg*3);}
  for(let j=0;j<seg;j++)for(let i=0;i<seg;i++){const a=j*(seg+1)+i,b=a+1,c=a+seg+1,d=c+1;indices.push(a,c,b,b,c,d);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
  const roof=new THREE.Mesh(geo,M.roof);roof.position.y=baseY;roof.castShadow=true;roof.receiveShadow=true;parent.add(roof);
  const underside=new THREE.Mesh(geo.clone(),M.roofDark);underside.position.y=baseY-.14;parent.add(underside);
  const edgeMat=new THREE.MeshStandardMaterial({color:'#1e3331',roughness:.72});
  const front=[],back=[],left=[],right=[];
  for(let i=0;i<=20;i++){const u=-1+i/10,v=-1+i/10;front.push([-width/2+i/20*width,baseY+roofHeight(u,-1,rise),-depth/2]);back.push([-width/2+i/20*width,baseY+roofHeight(u,1,rise),depth/2]);left.push([-width/2,baseY+roofHeight(-1,v,rise),-depth/2+i/20*depth]);right.push([width/2,baseY+roofHeight(1,v,rise),-depth/2+i/20*depth]);}
  addTube(parent,front,.105,edgeMat,42);addTube(parent,back,.105,edgeMat,42);addTube(parent,left,.105,edgeMat,42);addTube(parent,right,.105,edgeMat,42);
  addTube(parent,[[-width*.47,baseY+rise+.05,0],[-width*.24,baseY+rise+.05,0],[0,baseY+rise+.05,0],[width*.24,baseY+rise+.05,0],[width*.47,baseY+rise+.05,0]],.13,edgeMat,36);
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=sx*width/2,z=sz*depth/2,tip=[x+sx*.45,baseY+.62,z+sz*.45];
    addTube(parent,[[x-sx*.7,baseY+.05,z-sz*.7],[x-sx*.1,baseY+.28,z-sz*.1],tip],.085,edgeMat,18);
    const finial=new THREE.Mesh(new THREE.SphereGeometry(.12,12,10),M.brass);finial.position.set(...tip);finial.castShadow=true;parent.add(finial);
  }
  addBox(parent,0,baseY+rise+.17,0,width*.34,.17,.3,M.darkTimber,'正脊');
  for(const sx of [-1,1]){const o=new THREE.Mesh(new THREE.ConeGeometry(.13,.48,8),M.brass);o.position.set(sx*width*.18,baseY+rise+.36,0);o.rotation.z=-sx*.45;parent.add(o);}
  return roof;
}
function addBracket(parent,x,y,z,outX=0,outZ=0){
  const g=group(parent,x,y,z);
  const a=addBox(g,0,0,0,.72,.16,.34,M.darkTimber);a.rotation.z=outX*.08;
  addBox(g,outX*.28,-.17,outZ*.28,.52,.14,.28,M.timber);
  addBox(g,outX*.48,-.31,outZ*.48,.32,.12,.22,M.darkTimber);
  addBox(g,0,.16,0,.38,.12,.4,M.brass);
}
function addRailing(parent,y,width,depth,openFront=false){
  const railY=y+.92,halfW=width/2-.24,halfD=depth/2-.24;
  const xs=[];for(let x=-halfW;x<=halfW+.01;x+=1.05)xs.push(x);
  for(const [z,front] of [[-halfD,true],[halfD,false]]){
    const pts=[];
    xs.forEach(x=>{if(front&&openFront&&Math.abs(x)<1.2)return;addCylinder(parent,x,y+.52,z,.055,.07,.96,M.darkTimber,10);pts.push([x,railY,z]);});
    if(pts.length>1)addTube(parent,pts,.075,M.timber,44);
  }
  for(const x of [-halfW,halfW]){
    const pts=[[x,railY,-halfD],[x,railY,halfD]];
    for(let z=-halfD+.6;z<halfD;z+=1.05){addCylinder(parent,x,y+.52,z,.05,.065,.96,M.darkTimber,10);pts.push([x,railY,z]);}
    addTube(parent,pts,.075,M.timber,38);
  }
}
function addFloorLevel(parent,baseY,width,depth,columnHeight,roofRise,options={}){
  addBox(parent,0,baseY-.16,0,width,.32,depth,M.stone,'青石台基');
  addBox(parent,0,baseY+.035,0,width-.28,.13,depth-.28,M.timber,'木地板');
  for(let z=-depth/2+.45;z<depth/2;z+=.52)addBox(parent,0,baseY+.11,z,width-.5,.035,.035,M.darkTimber,'地板拼缝');
  const xs=[-width/2+.5,0,width/2-.5],zs=[-depth/2+.5,depth/2-.5],cols=[];
  xs.forEach(x=>zs.forEach(z=>cols.push([x,z])));
  for(const z of zs)for(let x=-width/2+.5;x<=width/2-.5;x+=2.4)cols.push([x,z]);
  const seen=new Set();
  cols.forEach(([x,z])=>{const key=x.toFixed(2)+':'+z.toFixed(2);if(seen.has(key))return;seen.add(key);
    addCylinder(parent,x,baseY+.12,z,.31,.38,.25,M.stoneDark,12);
    addCylinder(parent,x,baseY+columnHeight/2,z,.22,.28,columnHeight,M.cinnabar,20,'朱漆圆柱');
    addCylinder(parent,x,baseY+columnHeight+.05,z,.38,.34,.22,M.timber,12);
    addBracket(parent,x,baseY+columnHeight+.22,z,Math.sign(x),Math.sign(z));
  });
  const by=baseY+columnHeight+.22;
  addBox(parent,0,by,-depth/2+.5,width+.7,.34,.38,M.darkTimber,'前檐通枋');
  addBox(parent,0,by,depth/2-.5,width+.7,.34,.38,M.darkTimber,'后檐通枋');
  addBox(parent,-width/2+.5,by,0,.38,.34,depth+.7,M.darkTimber,'侧檐通枋');
  addBox(parent,width/2-.5,by,0,.38,.34,depth+.7,M.darkTimber,'侧檐通枋');
  if(options.rail!==false)addRailing(parent,baseY,width,depth,options.openFront===true);
  if(options.roof!==false)addRoof(parent,baseY+columnHeight+.42,width+2.4,depth+2.1,roofRise);
}

const pavilion=group(scene,0,0,2.5);
addBox(pavilion,0,-.62,0,18,.9,15,M.stoneDark,'须弥石台');
addBox(pavilion,0,-.16,0,17.3,.12,14.3,M.brass,'台基束腰');
addFloorLevel(pavilion,0,15.2,12.2,4.05,.86,{openFront:true});
addFloorLevel(pavilion,5.28,10.4,8.4,3,.78,{openFront:true});
addFloorLevel(pavilion,9.82,6.8,5.8,2.55,1.05,{openFront:true});

function addStairFlight(){
  const stair=group(pavilion,-7.8,0,0),count=19,rise=5.28/count,run=10.8/count;
  for(let i=0;i<count;i++){const y=(i+.5)*rise,z=5.7-(i+.5)*run;addBox(stair,0,y,z,2.45,.2,run+.06,i%2?M.stone:M.stoneDark,'登阁石阶');addBox(stair,-1.1,y+.18,z,.12,.36,.12,M.timber,'扶手栏柱');addBox(stair,1.1,y+.18,z,.12,.36,.12,M.timber,'扶手栏柱');}
  addTube(stair,Array.from({length:10},(_,i)=>[-1.1,.72+i*.5,5.7-i*.57]),.075,M.timber,30);
  addTube(stair,Array.from({length:10},(_,i)=>[1.1,.72+i*.5,5.7-i*.57]),.075,M.timber,30);
}
addStairFlight();

function makePlaque(){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');
  ctx.fillStyle='#3c2920';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#c4a16a';ctx.lineWidth=10;ctx.strokeRect(18,18,988,220);ctx.strokeStyle='rgba(224,194,140,.35)';ctx.lineWidth=2;ctx.strokeRect(32,32,960,192);
  ctx.fillStyle='#ead8ad';ctx.font='bold 132px KaiTi, STKaiti, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('滕 王 阁',512,134);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(3.5,.88),new THREE.MeshStandardMaterial({map:tex,roughness:.68,metalness:.12}));
  m.position.set(0,3.55,-3.66);m.castShadow=true;pavilion.add(m);
}
makePlaque();

function makeLantern(x,y,z,parent=scene,scale=1){
  const g=group(parent,x,y,z),pts=[new THREE.Vector2(0,-.5),new THREE.Vector2(.16,-.46),new THREE.Vector2(.3,-.25),new THREE.Vector2(.34,0),new THREE.Vector2(.3,.25),new THREE.Vector2(.16,.46),new THREE.Vector2(0,.5)];
  const body=new THREE.Mesh(new THREE.LatheGeometry(pts,24),M.lantern);body.scale.setScalar(scale);body.castShadow=true;g.add(body);
  addCylinder(g,0,.53*scale,0,.12*scale,.18*scale,.13*scale,M.brass,12);
  addCylinder(g,0,-.53*scale,0,.17*scale,.1*scale,.12*scale,M.brass,12);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x0=Math.cos(a)*.29*scale,z0=Math.sin(a)*.29*scale;addTube(g,[[x0,-.38*scale,z0],[x0*1.1,0,z0*1.1],[x0,.38*scale,z0]],.012*scale,M.brass,10);}
  addCylinder(g,0,-.72*scale,0,.025*scale,.025*scale,.32*scale,M.brass,8);
  const light=new THREE.PointLight('#ffbd79',0,11*scale,2);g.add(light);return {group:g,light};
}
const lanterns=[
  makeLantern(-5.6,3.45,-1.7,pavilion,1.05),makeLantern(5.6,3.45,-1.7,pavilion,1.05),
  makeLantern(-4.3,8.25,-1.3,pavilion,.78),makeLantern(4.3,8.25,-1.3,pavilion,.78),
  makeLantern(-5.8,1.9,3.2,pavilion,.9),makeLantern(5.8,1.9,3.2,pavilion,.9)
];

function makeBoat(){
  const g=group(scene,-34,-.92,-55),shape=new THREE.Shape();
  shape.moveTo(-2.8,-.12);shape.quadraticCurveTo(-2.4,-.62,-1.25,-.72);shape.lineTo(1.25,-.72);shape.quadraticCurveTo(2.4,-.62,2.8,-.12);shape.quadraticCurveTo(1.65,.2,0,.16);shape.quadraticCurveTo(-1.65,.2,-2.8,-.12);
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.92,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.1,bevelThickness:.09});geo.rotateX(-Math.PI/2);
  const hull=new THREE.Mesh(geo,M.boat);hull.position.y=-.04;hull.castShadow=true;hull.receiveShadow=true;g.add(hull);
  addTube(g,[[-2.5,.08,-.42],[-1.2,.22,-.48],[0,.24,-.48],[1.2,.22,-.48],[2.5,.08,-.42]],.065,M.timber,28);
  addTube(g,[[-2.5,.08,.5],[-1.2,.22,.5],[0,.24,.5],[1.2,.22,.5],[2.5,.08,.5]],.065,M.timber,28);
  const canopy=new THREE.Mesh(new THREE.SphereGeometry(1,28,16,0,Math.PI*2,0,Math.PI/2),M.canopy);
  canopy.scale.set(1.55,.82,.76);canopy.position.set(-.12,.68,.02);canopy.castShadow=true;g.add(canopy);
  addTube(g,[[-1.45,.64,-.64],[-1.2,1.04,-.62],[0,1.28,-.62],[1.2,1.04,-.62],[1.45,.64,-.62]],.035,M.brass,24);
  addTube(g,[[-1.45,.64,.68],[-1.2,1.04,.68],[0,1.28,.68],[1.2,1.04,.68],[1.45,.64,.68]],.035,M.brass,24);
  const lamp=makeLantern(.95,.55,.78,g,.58);
  addTube(g,[[-2,.35,.8],[-1,.55,1.3],[.1,.16,1.65]],.045,M.timber,18);
  return {group:g,lamp};
}
const boat=makeBoat();lanterns.push(boat.lamp);

const birds=[];
function makeBird(x,y,z,scale=1,phase=0,light=false){
  const g=group(scene,x,y,z),bodyMat=light?M.birdLight:M.bird;
  const body=new THREE.Mesh(new THREE.SphereGeometry(.42,14,10),bodyMat);body.scale.set(1.55,.28,.42);body.position.x=.05;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),bodyMat);head.position.set(.58,.12,0);g.add(head);
  const beak=new THREE.Mesh(new THREE.ConeGeometry(.075,.3,7),M.brass);beak.rotation.z=-Math.PI/2;beak.position.set(.78,.1,0);g.add(beak);
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(.55,.58,1.72,.92);shape.quadraticCurveTo(1.32,.28,1.86,-.16);shape.quadraticCurveTo(.8,-.12,0,0);
  const wingGeo=new THREE.ShapeGeometry(shape),left=new THREE.Mesh(wingGeo,bodyMat),right=new THREE.Mesh(wingGeo,bodyMat);
  left.position.set(-.02,.05,-.08);right.position.set(-.02,.05,.08);right.scale.x=-1;g.add(left,right);g.scale.setScalar(scale);
  birds.push({group:g,left,right,phase,scale,startX:x,startY:y,startZ:z});
}
makeBird(-20,23,-98,1.6,0,true);
for(let i=0;i<6;i++)makeBird(-38+i*4.4,28+Math.sin(i)*2,-112-i*1.8,.56,i*.8,false);
for(let i=0;i<4;i++)makeBird(34+i*3.4,18+i*.8,-88-i*2,.48,i*1.1,false);

function makeMountainLayer(z,baseY,height,color,opacity,seed){
  const shape=new THREE.Shape();shape.moveTo(-190,-12);shape.lineTo(-190,baseY);
  for(let i=0;i<=50;i++){const x=-190+i*7.6,peak=Math.sin(i*.63+seed)*.35+Math.sin(i*.19+seed*2)*.45+seeded(i+seed*10)*.2;shape.lineTo(x,baseY+height*(.36+peak*.52));}
  shape.lineTo(190,-12);shape.closePath();
  const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape,2),new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false,side:THREE.DoubleSide}));
  mesh.position.z=z;scene.add(mesh);return mesh;
}
const mountains=[
  makeMountainLayer(-164,1,28,'#455d62',.86,2),
  makeMountainLayer(-184,-2,22,'#637475',.66,7),
  makeMountainLayer(-206,-5,16,'#92988b',.44,11)
];

function makeTree(x,z,scale=1){
  const g=group(scene,x,0,z);addCylinder(g,0,1.8*scale,0,.22*scale,.34*scale,3.6*scale,M.darkTimber,9);
  for(let i=0;i<8;i++){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3*scale*(.7+seeded(i+x)*.45),2),i%3===0?M.leafLight:M.leaf);crown.position.set((seeded(i+4)-.5)*2*scale,(2.8+seeded(i+8)*2.5)*scale,(seeded(i+17)-.5)*1.5*scale);crown.scale.y=.72;crown.castShadow=true;crown.receiveShadow=true;g.add(crown);}
  return g;
}
const trees=[makeTree(-17,5,1.35),makeTree(-22,16,1.55),makeTree(19,12,1.45),makeTree(25,2,1.3),makeTree(-31,-18,1.1),makeTree(33,-12,1.15)];

const reeds=[],reedStemGeo=new THREE.CylinderGeometry(.012,.035,1,5);
for(let i=0;i<74;i++){
  const x=-45+i*1.25,z=8+Math.sin(i*1.7)*2.4,g=group(scene,x,-.25,z),h=1.2+seeded(i+9)*1.6;
  const stem=new THREE.Mesh(reedStemGeo,M.leafLight);stem.scale.y=h;stem.position.y=h*.5;stem.rotation.z=(seeded(i+4)-.5)*.22;g.add(stem);
  for(let j=0;j<3;j++)addTube(g,[[0,h*(.55+j*.12),0],[.18+j*.08,h*(.78+j*.05),.02],[.48+j*.1,h*(.85+j*.04),.02]],.024,M.leafLight,8);
  reeds.push(g);
}

const waterMaterial=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uDusk:{value:0},uNight:{value:0},uSunX:{value:.36}},
  vertexShader:[
    'uniform float uTime;varying vec2 vUv;varying vec3 vPos;',
    'void main(){vUv=uv;vec3 p=position;',
    'float wave=sin(p.x*.12+uTime*.72)*.055+cos(p.y*.17-uTime*.54)*.045+sin((p.x+p.y)*.055+uTime*.34)*.035;',
    'p.z+=wave;vPos=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}'
  ].join('\n'),
  fragmentShader:[
    'uniform float uTime;uniform float uDusk;uniform float uNight;uniform float uSunX;varying vec2 vUv;varying vec3 vPos;',
    'void main(){',
    'float a=sin(vUv.x*280.0+uTime*1.5+sin(vUv.y*28.0))*.5+.5;',
    'float b=sin(vUv.y*180.0-uTime*1.12+cos(vUv.x*22.0))*.5+.5;',
    'float glint=pow(max(0.0,a*b),9.0);',
    'float reflection=exp(-pow((vUv.x-uSunX)*24.0,2.0))*(.25+.75*pow(a,5.0));',
    'vec3 deep=vec3(.055,.16,.18);vec3 dusk=vec3(.29,.19,.17);vec3 night=vec3(.025,.075,.12);vec3 silver=vec3(.28,.39,.40);',
    'vec3 col=mix(deep,dusk,uDusk);col=mix(col,night,uNight);col=mix(col,silver,(1.0-uDusk)*(1.0-uNight)*.12);',
    'col+=vec3(.62,.39,.22)*reflection*(1.0-uNight*.82);col+=vec3(.42,.48,.43)*glint*(.18+uDusk*.25+uNight*.16);',
    'gl_FragColor=vec4(col,1.0);','}'
  ].join('\n')
});
const river=new THREE.Mesh(new THREE.PlaneGeometry(260,126,150,90),waterMaterial);
river.rotation.x=-Math.PI/2;river.position.set(0,-.88,-73);river.receiveShadow=true;scene.add(river);
const shore=new THREE.Mesh(new THREE.PlaneGeometry(240,45),M.stoneDark);shore.rotation.x=-Math.PI/2;shore.position.set(0,-.55,13);shore.receiveShadow=true;scene.add(shore);

const rainCount=440,rainPositions=new Float32Array(rainCount*6);
for(let i=0;i<rainCount;i++){const x=(seeded(i+3)-.5)*64,y=seeded(i+17)*34+2,z=seeded(i+42)*54-24,k=i*6;rainPositions[k]=x;rainPositions[k+1]=y;rainPositions[k+2]=z;rainPositions[k+3]=x-.11;rainPositions[k+4]=y-.7;rainPositions[k+5]=z;}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:'#d9e0dc',transparent:true,opacity:.22}));scene.add(rain);
scene.fog=new THREE.FogExp2('#a2a79e',.0027);

export const CHAPTERS=[
 {at:0,title:'云销雨霁',verse:'云销雨霁，彩彻区明',note:'檐雨初歇，天光乍开。'},
 {at:11,title:'寒潭暮山',verse:'潦水尽而寒潭清，烟光凝而暮山紫',note:'清潭照影，远岫含烟。'},
 {at:23,title:'落霞秋水',verse:'落霞与孤鹜齐飞，秋水共长天一色',note:'一阁临江，天地无垠。'},
 {at:43,title:'渔舟唱晚',verse:'渔舟唱晚，响穷彭蠡之滨',note:'归舟灯火，歌声随水。'},
 {at:56,title:'雁阵惊寒',verse:'雁阵惊寒，声断衡阳之浦',note:'秋声渐远，长空寂寥。'},
 {at:68,title:'长江空流',verse:'阁中帝子今何在？槛外长江空自流',note:'千年一瞬，江水如故。'}
];
const KEYFRAMES=[
 {t:0,p:[0,1.68,10],l:[0,2.7,-35]},
 {t:7,p:[0,1.68,6],l:[-1,2.5,-38]},
 {t:13,p:[-4.2,2.9,4.5],l:[-8,4,-28]},
 {t:20,p:[-7.1,6.65,.3],l:[-9,7.3,-35]},
 {t:27,p:[-3.2,6.65,-1],l:[-3,7.1,-72]},
 {t:34,p:[0,6.65,-1.1],l:[-10,12,-120]},
 {t:42,p:[0,6.65,-1.1],l:[0,6.2,-145]},
 {t:53,p:[0,6.65,-1.1],l:[10,-.2,-58]},
 {t:62,p:[0,6.65,-1.1],l:[0,24,-104]},
 {t:70,p:[0,6.65,-1.1],l:[0,7,-138]},
 {t:80,p:[0,6.65,-1.1],l:[0,.2,-172]}
];
export function setCameraAt(t){
  let i=0;while(i<KEYFRAMES.length-2&&t>KEYFRAMES[i+1].t)i++;
  const a=KEYFRAMES[i],b=KEYFRAMES[i+1],f=smooth(clamp((t-a.t)/(b.t-a.t),0,1));
  const p=a.p.map((v,k)=>mix(v,b.p[k],f)),l=a.l.map((v,k)=>mix(v,b.l[k],f));
  camera.position.set(p[0],p[1],p[2]);camera.lookAt(l[0],l[1],l[2]);
}
const phases=[
 {t:0,sky:'#425967',horizon:'#788b8b',sun:'#aebbb6',dusk:0,night:0,fog:'#73858a',power:2.15},
 {t:10,sky:'#78918f',horizon:'#c4c2ad',sun:'#f2dfbd',dusk:.12,night:0,fog:'#a9b4a9',power:2.5},
 {t:22,sky:'#777587',horizon:'#c5a6a1',sun:'#e4b7a0',dusk:.42,night:0,fog:'#969097',power:2.15},
 {t:34,sky:'#9d5e55',horizon:'#e5a879',sun:'#ffd09a',dusk:1,night:0,fog:'#a7796f',power:1.75},
 {t:46,sky:'#855b60',horizon:'#d19a80',sun:'#f4b77f',dusk:.92,night:0,fog:'#8c7476',power:1.3},
 {t:58,sky:'#586678',horizon:'#a18b89',sun:'#d7ad91',dusk:.42,night:.1,fog:'#626e7b',power:.85},
 {t:70,sky:'#263b50',horizon:'#536c7a',sun:'#9db3c5',dusk:.08,night:.82,fog:'#344c5b',power:.38},
 {t:80,sky:'#172c40',horizon:'#354c5d',sun:'#8ba9c4',dusk:0,night:1,fog:'#20384a',power:.22}
];
function updateAtmosphere(t,manualNight){
  const time=manualNight?78:t;let i=0;while(i<phases.length-2&&time>phases[i+1].t)i++;
  const a=phases[i],b=phases[i+1],f=smooth(clamp((time-a.t)/(b.t-a.t),0,1));
  const dusk=mix(a.dusk,b.dusk,f),night=mix(a.night,b.night,f);
  skyUniforms.zenith.value.copy(colorMix(a.sky,b.sky,f));skyUniforms.horizon.value.copy(colorMix(a.horizon,b.horizon,f));
  skyUniforms.sunColor.value.copy(colorMix(a.sun,b.sun,f));skyUniforms.uTime.value=time;skyUniforms.uDusk.value=dusk;
  waterMaterial.uniforms.uDusk.value=dusk;waterMaterial.uniforms.uNight.value=night;waterMaterial.uniforms.uTime.value=time;
  sun.intensity=mix(a.power,b.power,f);sun.color.copy(colorMix('#ffe2bd','#a6bfd1',night));
  hemi.intensity=mix(1.25,.48,night);moon.intensity=night*.82;
  scene.fog.color.copy(colorMix(a.fog,b.fog,f));scene.fog.density=mix(.0021,.0038,night);
  sunGlow.material.opacity=mix(.68,.16,night);sunGlow.material.color.copy(colorMix('#f4c28c','#9eb6c7',night));
  lanterns.forEach((item,i)=>{const glow=clamp((time-38)/20,0,1)*(1+Math.sin(time*2.6+i)*.07);item.light.intensity=glow*2.1;item.group.rotation.z=Math.sin(time*.8+i)*.018;});
  rain.material.opacity=clamp(1-time/9,0,1)*.2;
  mountains.forEach((m,i)=>m.material.color.copy(colorMix(['#455d62','#637475','#92988b'][i],'#263b4b',night*.65)));
}
export function updateWorld(t,dt,manualNight=false){
  updateAtmosphere(t,manualNight);
  clouds.forEach((c,i)=>{c.position.x+=dt*(.24+(i%3)*.08);if(c.position.x>112)c.position.x=-112;c.position.y+=Math.sin(t*.11+i)*.0015;});
  reeds.forEach((r,i)=>{r.rotation.z=Math.sin(t*.8+i*.61)*.055;});
  trees.forEach((tree,i)=>{tree.rotation.z=Math.sin(t*.38+i)*.012;});
  boat.group.position.x=-34+clamp((t-42)/16,0,1)*67;boat.group.position.z=-55+Math.sin(t*.18)*.8;
  boat.group.position.y=-.92+Math.sin(t*.9)*.045;boat.group.rotation.y=Math.sin(t*.14)*.025;boat.lamp.group.rotation.z=Math.sin(t*1.2)*.035;
  birds.forEach((b,i)=>{const flight=clamp((t-24)/35,0,1);b.group.position.x=b.startX+flight*(i===0?42:28);b.group.position.y=b.startY+Math.sin(t*.7+b.phase)*(i===0?1.5:.9);b.group.position.z=b.startZ+Math.cos(t*.26+b.phase)*2;b.left.rotation.z=Math.sin(t*4.6+b.phase)*.42;b.right.rotation.z=-Math.sin(t*4.6+b.phase)*.42;});
  const arr=rainGeo.attributes.position.array;
  for(let i=0;i<rainCount;i++){const k=i*6;arr[k+1]-=dt*16;arr[k+4]-=dt*16;if(arr[k+1]<0){const y=29+seeded(i+Math.floor(t*2))*12;arr[k+1]=y;arr[k+4]=y-.7;}}
  rainGeo.attributes.position.needsUpdate=true;
}
export function renderWorld(){renderer.render(scene,camera);}
