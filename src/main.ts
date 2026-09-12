import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import './style.css';
import {packageParts,buildPackage,type PartId,type PackageRig} from './package-model';

const layers = [
 {name:'마이크로렌즈',en:'MICROLENS',color:'#a9dae4',text:'픽셀 위의 작은 렌즈가 들어오는 빛을 포토다이오드 쪽으로 모읍니다. 픽셀의 제한된 면적을 더 효율적으로 활용하도록 돕습니다.',tip:'렌즈 하나가 픽셀 하나에 대응하는 개념 모델입니다.'},
 {name:'컬러 필터',en:'COLOR FILTER ARRAY',color:'#e59b86',text:'각 픽셀에 도달하는 빛의 파장 대역을 선택합니다. 이 모델은 빨강·초록·파랑 필터를 RGGB 베이어 배열로 배치했습니다.',tip:'픽셀 하나가 RGB 전체를 측정하지는 않습니다. 주변 픽셀과 함께 색을 복원합니다.'},
 {name:'실리콘 · 포토다이오드',en:'PHOTODIODE',color:'#9ce488',text:'실리콘에 흡수된 빛이 전자·정공 쌍을 만들고, 포토다이오드는 노출 시간 동안 신호 전하를 축적합니다.',tip:'노출 시간과 빛의 세기가 커지면 전하량이 늘지만, 저장 가능한 양에는 한계가 있습니다.'},
 {name:'배선 · 읽기 회로',en:'READOUT CIRCUIT',color:'#d6b975',text:'축적된 전하를 읽어 전압 신호로 전달합니다. 이후 ADC가 신호를 디지털 값으로 바꿉니다. ADC는 이 모델의 개별 픽셀 안에 표현하지 않았습니다.',tip:'BSI에서는 빛이 들어오는 면의 반대쪽에 배선을 배치합니다.'},
 {name:'지지체 · 패키지 기판',en:'SUPPORT & PACKAGE',color:'#8292a3',text:'지지체와 다이 접착층이 센서를 고정하고, 패키지 기판의 금속 배선과 비아가 다이 패드를 하부 접점에 연결합니다. 패키지·회로 화면에서 각 연결부를 따로 선택할 수 있습니다.',tip:'이 모델은 특정 제조사 제품의 설계도나 실제 치수를 재현하지 않습니다.'}
];
const stages = [
 ['빛 입사','마이크로렌즈가 빛을 모으고 컬러 필터가 파장 대역을 선택합니다.'],
 ['전하 축적','포토다이오드에 흡수된 빛이 신호 전하를 만듭니다. 노출이 길수록 더 많은 전하가 축적됩니다.'],
 ['신호 읽기','픽셀의 신호를 읽기 회로로 전달합니다. 실제 전하 이동과 회로 타이밍은 여기서 단순화했습니다.'],
 ['디지털 변환','ADC가 아날로그 신호를 수치로 변환합니다. 색 복원은 그 이후의 영상 처리 단계입니다.']
];
const $ = <T extends HTMLElement = HTMLElement>(id:string) => document.getElementById(id) as T;
let mode = 3, selected = 0, separation = .48, stage = 0, playing = false, elapsed = 0;
const visibility = layers.map(()=>true);
let selectedPart:PartId|null=null;let packageRig:PackageRig|undefined;
const partVisibility=new Map<PartId,boolean>(packageParts.map(p=>[p.id,p.id!=='cover']));
const fullPackage=()=>mode===0||mode===3;
document.querySelector('#app')!.innerHTML = `
<header><a class="brand" href="./" aria-label="Sensor Lab 홈"><span class="brand-icon">▦</span> SENSOR<span>LAB</span></a><span class="header-sub">이미지 센서 탐구실</span><span class="edition">INTERACTIVE LEARNING / 01</span><button id="export" class="quiet">모델 다운로드 ↗</button></header>
<main><aside class="sidebar"><div class="eyebrow">EXPLORE THE INVISIBLE</div><h1>빛이 이미지가<br>되는 순간.</h1><p class="intro">작은 픽셀 안에서 일어나는 일을<br>직접 살펴보세요.</p><div class="section-label">01 — 관찰 범위</div><nav id="modes" aria-label="관찰 범위">${['센서 전체','픽셀 배열','픽셀 단면','패키지·회로'].map((n,i)=>`<button data-mode="${i}" aria-pressed="${i===3}"><span class="nav-num">0${i+1}</span>${n}<span class="nav-arrow">↗</span></button>`).join('')}</nav><div class="section-label layer-heading">02 — 센서의 구조</div><div id="layers">${layers.map((l,i)=>`<div class="layer-row"><button class="layer-select" data-layer="${i}" aria-pressed="${i===0}"><i style="background:${l.color}"></i>${l.name}</button><input type="checkbox" data-visible="${i}" checked aria-label="${l.name} 표시"></div>`).join('')}</div><section id="package-parts"><div class="section-label">패키지·회로 세부 구조</div><p class="parts-caption">회로는 다이 측, 접속부는 기판 측</p>${packageParts.map((p,i)=>`<div class="part-row"><button data-part="${p.id}" aria-pressed="false"><i style="background:${p.color}"></i><span>${String(i+1).padStart(2,'0')} · ${p.name}</span></button><input type="checkbox" data-part-visible="${p.id}" ${p.id!=='cover'?'checked':''} aria-label="${p.name} 표시"></div>`).join('')}</section><div class="sidebar-note"><span class="tag">BSI CMOS</span><p>빛을 받는 면과 배선이 반대쪽에 있는 이면조사형 구조</p><a href="https://www.sony-semicon.com/en/technology/is/back-illuminated.html" target="_blank" rel="noreferrer">구조 참고 자료 ↗</a></div></aside>
<section class="workspace" aria-label="3D 센서 뷰어"><div class="view-top"><div><span class="eyebrow">LIVE 3D VIEW</span><h2 id="view-title">패키지·회로</h2></div><div class="view-actions"><button id="reset">시점 초기화</button><button id="rotate" aria-pressed="false">자동 회전</button></div></div><div id="package-toolbar"><span>회로면을 펼쳐 본 기능 배치도</span><div><button data-camera="top">상부 회로</button><button data-camera="side">본딩 측면</button><button data-camera="bottom">기판 하부</button></div></div><div id="canvas-wrap"><canvas id="scene" aria-label="회전 및 확대 가능한 이미지 센서 3D 모델"></canvas><div id="part-callout" hidden></div><div id="fallback" hidden>3D 렌더링을 시작할 수 없습니다. 브라우저의 하드웨어 가속을 확인해 주세요. 오른쪽 설명으로 학습을 계속할 수 있습니다.</div><div class="view-caption"><span class="small-cross">+</span> <span id="model-label">8 × 8 PIXEL ARRAY</span><span>개념 모델 · 실제 비율 아님</span></div></div><div class="view-hints"><span>드래그 회전 · 휠 확대 · 우클릭 이동</span><span>부품을 클릭해 탐색하세요</span></div><div class="explode"><div><label for="separation">분해 보기</label><span id="separation-value">48%</span></div><input id="separation" type="range" min="0" max="100" value="48"><div class="range-ends"><span>조립</span><span>분해</span></div></div><section class="timeline"><div class="timeline-head"><span class="section-label">03 — 빛에서 디지털 신호까지</span><button id="play">▶ 동작 재생</button></div><div id="steps">${stages.map((s,i)=>`<button data-stage="${i}" aria-pressed="${i===0}"><span>0${i+1}</span>${s[0]}</button>`).join('')}</div><p id="stage-description">${stages[0][1]}</p></section></section>
<aside class="details"><div class="eyebrow">COMPONENT GUIDE</div><div class="detail-number" id="detail-number">01</div><span class="tag" id="detail-en"></span><h2 id="detail-name"></h2><p id="detail-text"></p><div id="connection-guide" hidden></div><div class="insight"><span>알아두기</span><p id="detail-tip"></p></div><section class="experiment"><div class="section-label">작은 실험</div><h3>빛을 더 모으면?</h3><label for="light">빛의 세기 <output id="light-value">50%</output></label><input id="light" type="range" min="0" max="100" value="50"><label for="exposure">노출 시간 <output id="exposure-value">10 ms</output></label><input id="exposure" type="range" min="1" max="40" value="10"><div class="meter-label"><span>축적 전하량</span><strong id="charge-value"></strong></div><div class="meter"><div id="charge-bar"></div></div><p id="charge-note"></p><span class="fine">교육용 상대값 · 센서 실측값 아님</span></section><section class="quiz"><span class="section-label">CHECK YOUR UNDERSTANDING</span><p>베이어 배열의 픽셀 하나가<br>RGB 세 색을 모두 측정할까요?</p><div><button data-answer="yes">그렇다</button><button data-answer="no">아니다</button></div><p id="quiz-feedback" role="status"></p></section></aside></main><footer><span>SENSOR LAB <span class="muted">/ 구조를 보고, 원리를 이해하다.</span></span><span>일반화한 BSI 구조 · 공정 및 제품별 차이 있음</span></footer><div id="status" role="status" class="status"></div>`;
let renderer:THREE.WebGLRenderer | undefined;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#101a22');
const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
camera.position.set(10,10,13);
let controls:OrbitControls | undefined;
try {
 renderer = new THREE.WebGLRenderer({canvas:$<HTMLCanvasElement>('scene'),antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.setClearColor('#101a22');
 controls = new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true; controls.minDistance=5; controls.maxDistance=32;
 controls.maxPolarAngle=Math.PI*.98; controls.autoRotateSpeed=.7;
} catch(e) { $('fallback').hidden=false; console.error(e); }
scene.add(new THREE.HemisphereLight(0xd7f4ff,0x26303c,2.4));
const key=new THREE.DirectionalLight(0xffffff,3.6); key.position.set(4,10,6); scene.add(key);
const rim=new THREE.DirectionalLight(0x78bfff,2);rim.position.set(-5,3,-4);scene.add(rim);
const model = new THREE.Group(); scene.add(model);
let groups:THREE.Group[]=[];
function box(w:number,h:number,d:number,color:THREE.ColorRepresentation,layer:number,x=0,z=0,y=0){
 const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({color,roughness:.38,metalness:layer===3?.65:.15}));
 mesh.position.set(x,y,z);mesh.userData.layer=layer;groups[layer].add(mesh);return mesh;
}
function rebuild(){
 model.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose(); const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});
 packageRig=undefined;model.clear(); groups=layers.map((_,i)=>{const g=new THREE.Group();g.userData.layer=i;model.add(g);return g;});
 const n=mode===2?2:8, step=mode===2?1.55:.66, width=n*step;
 if(fullPackage())packageRig=buildPackage(groups[3],groups[4]);
 else {box(width+.9,.42,width+.9,'#263948',4);box(width+.3,.22,width+.3,'#455968',3);}
 box(width,.32,width,'#36597a',2);
 for(let x=0;x<n;x++)for(let z=0;z<n;z++){
  const px=(x-(n-1)/2)*step,pz=(z-(n-1)/2)*step;
  const c=z%2===0?(x%2===0?'#e88679':'#93cf78'):(x%2===0?'#93cf78':'#6a9ee8');
  box(step*.91,.12,step*.91,c,1,px,pz);
  const lens=new THREE.Mesh(new THREE.SphereGeometry(step*.46,20,12,0,Math.PI*2,0,Math.PI/2),new THREE.MeshPhysicalMaterial({color:'#b4e6ed',transparent:true,opacity:.48,roughness:.12,metalness:.1,depthWrite:false}));
  lens.position.set(px,0,pz);lens.scale.y=.55;lens.userData.layer=0;groups[0].add(lens);
  box(step*.65,.15,step*.65,'#9cc2cf',2,px,pz,.19);
 }
 if(!fullPackage())for(let k=0;k<n;k++){
  const p=(k-(n-1)/2)*step;
  box(width,.035,.045,'#d8b87a',3,0,p,.135);
  box(.045,.04,width,'#96b4cc',3,p,0,.16);
 }

 model.scale.setScalar(fullPackage()?.82:mode===2?1.35:1);
 positionLayers(); highlight();
}
function positionLayers(){
 const base=fullPackage()?[1.62,1.43,1.07,.75,-.1]:[1.04,.86,.51,.12,-.25];
 groups.forEach((g,i)=>{g.position.y=base[i]+separation*(4-i)*.9-1;g.visible=visibility[i]&&!(mode===3&&i<3);});
 packageRig?.update(separation,groups[3].position.y,groups[4].position.y);
 if(packageRig)for(const [id,value] of partVisibility)packageRig.setVisible(id,value&&(id!=='wires'||visibility[3]));
}
function highlight(){groups.forEach((g,i)=>g.traverse(o=>{if(o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial){const active=selectedPart?o.userData.part===selectedPart:i===selected;o.material.emissive.set(active?'#679652':'#000000');o.material.emissiveIntensity=active?.48:0;}}));}
function select(i:number){selectedPart=null;$('connection-guide').hidden=true;$('part-callout').hidden=true;document.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed','false'));selected=i;const l=layers[i];$('detail-number').textContent=String(i+1).padStart(2,'0');$('detail-en').textContent=l.en;$('detail-name').textContent=l.name;$('detail-text').textContent=l.text;$('detail-tip').textContent=l.tip;document.querySelectorAll<HTMLElement>('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.layer)===i)));highlight();}
function resetCamera(){camera.position.set(fullPackage()?13:mode===2?8:10,fullPackage()?14:10,fullPackage()?17:mode===2?10:13);controls?.target.set(0,.5,0);controls?.update();}
function setMode(i:number){mode=i;document.querySelectorAll<HTMLElement>('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.mode)===i)));$('view-title').textContent=['센서 전체','픽셀 배열','픽셀 단면','패키지·회로'][i];$('model-label').textContent=['SENSOR PACKAGE','8 × 8 PIXEL ARRAY','2 × 2 PIXEL SECTION','CIRCUIT FLOORPLAN + WIRE-BOND PACKAGE'][i];rebuild();resetCamera();$('package-parts').hidden=!fullPackage();$('package-toolbar').hidden=!fullPackage();if(!fullPackage()&&selectedPart)select(3);}
function setStage(i:number){stage=i;elapsed=0;document.querySelectorAll<HTMLElement>('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===i)));$('stage-description').textContent=stages[i][1];select([0,2,3,3][i]);}
function experiment(){const light=Number($<HTMLInputElement>('light').value),exposure=Number($<HTMLInputElement>('exposure').value);const charge=Math.min(100,light*exposure/20);$('light-value').textContent=`${light}%`;$('exposure-value').textContent=`${exposure} ms`;$('charge-value').textContent=`${Math.round(charge)}%`;$('charge-bar').style.width=`${charge}%`;$('charge-note').textContent=charge>=100?'已 포화: 더 많은 빛이 들어와도 전하를 더 저장하지 못합니다.'.replace('已 ',''):`같은 빛에서는 노출 시간이 길수록 더 많은 전하가 쌓입니다.`;}
document.querySelectorAll<HTMLElement>('[data-mode]').forEach(b=>b.onclick=()=>setMode(Number(b.dataset.mode)));
document.querySelectorAll<HTMLElement>('[data-layer]').forEach(b=>b.onclick=()=>select(Number(b.dataset.layer)));
document.querySelectorAll<HTMLInputElement>('[data-visible]').forEach(b=>b.onchange=()=>{visibility[Number(b.dataset.visible)]=b.checked;positionLayers();});
$('separation').oninput=()=>{separation=Number($<HTMLInputElement>('separation').value)/100;$('separation-value').textContent=`${Math.round(separation*100)}%`;positionLayers();};
$('reset').onclick=resetCamera;
$('rotate').onclick=()=>{if(controls){controls.autoRotate=!controls.autoRotate;$('rotate').setAttribute('aria-pressed',String(controls.autoRotate));}};
document.querySelectorAll<HTMLElement>('[data-stage]').forEach(b=>b.onclick=()=>setStage(Number(b.dataset.stage)));
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Ⅱ 일시정지':'▶ 동작 재생';};
$('light').oninput=experiment;$('exposure').oninput=experiment;
document.querySelectorAll<HTMLElement>('[data-answer]').forEach(b=>b.onclick=()=>{$('quiz-feedback').textContent=b.dataset.answer==='no'?'정답입니다. 각 픽셀은 필터를 통과한 한 색 대역의 밝기를 측정합니다.':'다시 생각해 보세요. 픽셀 위의 컬러 필터는 한 색 대역을 선택합니다.';});

function selectPart(id:PartId){
 const p=packageParts.find(p=>p.id===id)!;if(!fullPackage())setMode(3);select(p.layer);selectedPart=id;
 $('detail-number').textContent=String(packageParts.indexOf(p)+1).padStart(2,'0');$('detail-en').textContent=p.en;$('detail-name').textContent=p.name;$('detail-text').textContent=p.text;$('detail-tip').textContent=p.tip;
 $('connection-guide').hidden=false;$('connection-guide').textContent=p.link;
 document.querySelectorAll<HTMLElement>('[data-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.part===id)));highlight();
}
function updateCallout(){
 const anchor=selectedPart&&packageRig?.anchors.get(selectedPart);const callout=$('part-callout');
 if(!anchor||!fullPackage()){callout.hidden=true;return;}let node:THREE.Object3D|null=anchor;while(node){if(!node.visible){callout.hidden=true;return;}node=node.parent;}
 const point=anchor.getWorldPosition(new THREE.Vector3()).project(camera);const r=$('canvas-wrap').getBoundingClientRect();
 callout.hidden=point.z>1||point.z< -1||Math.abs(point.x)>.95||Math.abs(point.y)>.95;if(callout.hidden)return;
 callout.textContent=packageParts.find(p=>p.id===selectedPart)!.name;callout.style.left=Math.max(90,Math.min(r.width-90,(point.x*.5+.5)*r.width))+'px';callout.style.top=Math.max(35,Math.min(r.height-60,(-point.y*.5+.5)*r.height-25))+'px';
}
document.querySelectorAll<HTMLElement>('[data-part]').forEach(b=>b.onclick=()=>selectPart(b.dataset.part as PartId));
document.querySelectorAll<HTMLInputElement>('[data-part-visible]').forEach(b=>b.onchange=()=>{partVisibility.set(b.dataset.partVisible as PartId,b.checked);positionLayers();});
document.querySelectorAll<HTMLElement>('[data-camera]').forEach(b=>b.onclick=()=>{if(controls)controls.autoRotate=false;$('rotate').setAttribute('aria-pressed','false');const v=b.dataset.camera;camera.position.set(...(v==='top'?[0,20,.1]:v==='bottom'?[9,-15,12]:[14,4,15]) as [number,number,number]);controls?.target.set(0,0,0);controls?.update();});

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=[0,0];
$('scene').onpointerdown=e=>{down=[e.clientX,e.clientY];};
$('scene').onpointerup=e=>{if(Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=$('scene').getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(groups.filter(g=>g.visible),true);const hit=hits.find(h=>{let o:THREE.Object3D|null=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});if(hit){const id=hit.object.userData.part as PartId|undefined;if(id)selectPart(id);else select(hit.object.userData.layer);}};
const particles=new THREE.Group();scene.add(particles);
for(let i=0;i<16;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),new THREE.MeshBasicMaterial({color:'#d4fb9f'}));particles.add(p);}
let last=0;
function animate(t:number){requestAnimationFrame(animate);const dt=Math.min((t-last)/1000,.1);last=t;if(playing){elapsed+=dt;if(elapsed>3)setStage((stage+1)%4);}particles.visible=playing;particles.children.forEach((p,i)=>{const a=(elapsed/3+i/16)%1;const scale=model.scale.x;const top=groups[0]?.position.y??1;const diode=groups[2]?.position.y??0;if(stage===0)p.position.set(((i%4)-1.5)*.6*scale,(top+2-a*2)*scale,(Math.floor(i/4)-1.5)*.6*scale);else if(stage===1)p.position.set(((i%4)-1.5)*.5*scale,(diode+.3+Math.sin(t*.003+i)*.06)*scale,(Math.floor(i/4)-1.5)*.5*scale);else p.position.set((-2+a*4)*scale,(groups[3].position.y+.2)*scale,(i%4-1.5)*.5*scale);});controls?.update();updateCallout();renderer?.render(scene,camera);}
new ResizeObserver(()=>{const r=$('canvas-wrap').getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer?.setSize(r.width,r.height,false);}).observe($('canvas-wrap'));
$('export').onclick=async()=>{try{const result=await new GLTFExporter().parseAsync(model,{binary:true});const url=URL.createObjectURL(new Blob([result as ArrayBuffer],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download=`sensor-lab-${['package','array','section','package-circuits'][mode]}.glb`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('status').textContent='현재 모델을 GLB 파일로 다운로드했습니다.';}catch{$('status').textContent='모델 내보내기에 실패했습니다. 다시 시도해 주세요.'}};
setMode(3);selectPart('row');experiment();requestAnimationFrame(animate);

// Optional WebMCP integration uses the same actions as the visible controls.
const modelContext = (document as Document & {modelContext?:{registerTool:(tool:unknown,options:unknown)=>void|Promise<void>}}).modelContext;
if(modelContext?.registerTool){
 const lifecycle=new AbortController();
 const tool={name:'configure_sensor_view',description:'이미지 센서 관찰 범위와 선택 부품, 분해 정도를 설정합니다.',inputSchema:{type:'object',properties:{view:{type:'integer',minimum:0,maximum:3},layer:{type:'integer',minimum:0,maximum:4},separation:{type:'number',minimum:0,maximum:100}},required:['view','layer','separation'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input:unknown)=>{
 const p=input as {view:number,layer:number,separation:number};
 if(!p||!Number.isInteger(p.view)||p.view<0||p.view>3||!Number.isInteger(p.layer)||p.layer<0||p.layer>4||!Number.isFinite(p.separation)||p.separation<0||p.separation>100)throw new Error('관찰 범위, 부품 또는 분해 값이 유효하지 않습니다.');
 setMode(p.view);select(p.layer);$<HTMLInputElement>('separation').value=String(p.separation);$('separation').dispatchEvent(new Event('input'));
 return {view:mode,layer:selected,separation:separation*100};
 }};
 try{Promise.resolve(modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Unsupported experimental API must not prevent learning. */}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}

