import * as THREE from 'three';
export const packageParts = [
 {id:'row',name:'Row driver · 행 선택',en:'ROW DECODER & DRIVER',layer:3,color:'#e6a361',text:'행 주소를 해석해 선택한 행의 리셋·전하 전달·선택 제어 신호를 구동합니다. 픽셀에서 읽은 영상 데이터는 별도의 열 신호선을 따라 이동합니다.',tip:'행 제어선은 가로, 열 신호선은 세로로 표시했습니다. 실제 신호 수와 타이밍은 픽셀 회로마다 다릅니다.',link:'타이밍 제어 → 행 드라이버 → 픽셀 제어 게이트'},
 {id:'column',name:'열 신호선 · CDS / PGA',en:'COLUMN READOUT / CDS / PGA',layer:3,color:'#6dc7bf',text:'선택된 행의 픽셀 출력은 열 신호선을 통해 읽힙니다. CDS는 서로 관련된 리셋·신호 샘플의 차이를 이용해 일부 잡음과 오프셋을 줄이고, PGA는 아날로그 이득을 조절합니다.',tip:'CDS가 모든 잡음을 제거하는 것은 아닙니다. 회로 순서와 열당 공유 구조는 센서별로 다릅니다.',link:'픽셀 출력 → 열 신호선 → CDS / PGA → ADC'},
 {id:'adc',name:'열 ADC 뱅크',en:'COLUMN ADC BANK',layer:3,color:'#8b9cfa',text:'열 읽기 회로의 아날로그 신호를 디지털 코드로 변환하는 ADC 뱅크입니다. 여기서는 여러 열을 병렬로 읽는 구조를 개념적으로 표현했습니다.',tip:'ADC는 패키지 기판 위의 별도 부품이 아니라 센서의 회로 영역에 표시했습니다. 열마다 하나씩 있다는 뜻은 아닙니다.',link:'CDS / PGA → ADC → 디지털 데이터 경로'},
 {id:'timing',name:'타이밍 · 레지스터 · PLL',en:'TIMING / REGISTERS / PLL',layer:3,color:'#b6a1d9',text:'외부 기준 클록과 설정값을 바탕으로 노출과 읽기 순서를 제어합니다. 레지스터는 노출·이득 등의 설정을 보관하고, PLL은 내부 동작에 필요한 클록을 만듭니다.',tip:'제어용 직렬 인터페이스와 영상 데이터 출력은 역할이 다릅니다.',link:'외부 제어 / 기준 클록 → 레지스터 / PLL → 행·열 타이밍'},
 {id:'bias',name:'전원 · 바이어스',en:'POWER & ANALOG BIAS',layer:3,color:'#e7bd64',text:'픽셀과 아날로그 읽기 회로에 필요한 기준 전압·전류를 생성하고 분배하는 영역입니다. 전원과 접지 연결을 영상 데이터 배선과 구분해 표시했습니다.',tip:'아날로그·디지털·I/O 전원 영역은 센서에 따라 구분됩니다. 금색 선 전체가 영상 신호는 아닙니다.',link:'전원 / 접지 패드 → 전원 분배·바이어스 → 픽셀 / 읽기 회로'},
 {id:'output',name:'디지털 경로 · 출력 I/O',en:'DIGITAL DATA PATH & I/O',layer:3,color:'#6eaee2',text:'변환된 픽셀 코드를 정렬하고 출력 버퍼를 통해 외부로 전달합니다. 출력 규격은 센서마다 다르므로 이 모델에서는 특정 MIPI 또는 병렬 핀 배열을 지정하지 않았습니다.',tip:'영상의 최종 색 복원과 화질 처리는 외부 ISP에서 수행될 수도 있습니다.',link:'ADC → 데이터 경로 / 출력 버퍼 → I/O 패드'},
 {id:'ob',name:'광학 블랙 영역',en:'OPTICAL BLACK REFERENCE',layer:3,color:'#74869d',text:'빛을 차단한 기준 픽셀 영역을 도식화했습니다. 검은색 기준 레벨을 추정하고 보정하는 데 사용할 수 있습니다.',tip:'실제로는 차광된 픽셀 구조입니다. 여기서는 위치를 보여주기 위해 회로 배치도 가장자리에 어두운 띠로 표시했습니다.',link:'차광 기준 픽셀 → 블랙 레벨 추정 / 보정'},
 {id:'pads',name:'다이 패드 · ESD',en:'DIE BOND PADS & ESD',layer:3,color:'#f1cb76',text:'다이 가장자리의 금속 패드는 외부와 연결하는 접점입니다. 작은 인접 블록은 I/O의 정전기 방전 보호 회로를 나타냅니다.',tip:'패드와 ESD 회로는 다이 측 구조입니다. 핀 수·크기·배열·금속 재질은 실물 규격을 재현하지 않았습니다.',link:'칩 내부 금속 배선 ↔ 다이 패드 ↔ 본딩 와이어'},
 {id:'wires',name:'본딩 와이어',en:'BOND WIRES',layer:4,color:'#f0c675',text:'곡선 형태의 와이어가 다이 패드와 패키지 기판의 본딩 핑거를 전기적으로 연결합니다. 확대된 굵기와 높이로 표현했습니다.',tip:'와이어 본딩 패키지를 예로 들었습니다. 모든 BSI 센서가 이 방식은 아니며, 분해 시 늘어나는 곡선은 연결 관계를 유지하기 위한 표현입니다.',link:'다이 패드 ↔ 본딩 와이어 ↔ 기판 본딩 핑거'},
 {id:'routing',name:'기판 배선 · 비아',en:'SUBSTRATE TRACES & VIAS',layer:4,color:'#d5a765',text:'기판의 본딩 핑거에서 시작하는 금속 배선과 수직 비아가 신호와 전원을 하부 접점으로 연결합니다. 비아 단면을 보기 위해 가장자리 연결을 크게 표현했습니다.',tip:'실제 기판은 여러 배선층을 사용할 수 있습니다. 이 모델은 경로를 읽기 쉽도록 하나의 대표 배선층과 관통 비아로 단순화했습니다.',link:'본딩 핑거 ↔ 기판 배선 ↔ 비아 ↔ 하부 접점'},
 {id:'lands',name:'하부 접점 · LGA',en:'BOTTOM CONTACT LANDS',layer:4,color:'#dcc999',text:'기판 아래의 평평한 금속 접점이 메인 보드와 연결되는 부분입니다. 하부 보기로 바꾸면 접점 배열과 비아의 연결을 볼 수 있습니다.',tip:'이 예시는 LGA형 평면 접점입니다. BGA 솔더 볼이나 리드형 패키지와는 다릅니다.',link:'기판 비아 ↔ 하부 랜드 ↔ 외부 보드'},
 {id:'support',name:'지지체 · 다이 접착층',en:'SUPPORT & DIE ATTACH',layer:4,color:'#8499ac',text:'센서 다이 아래의 지지체와 접착층을 구분했습니다. 다이를 고정하고 기계적 안정성과 열 전달 경로를 제공합니다.',tip:'지지체는 행 드라이버나 ADC와 같은 논리 회로층을 뜻하지 않습니다. BSI 공정별 지지체 구성은 다릅니다.',link:'센서 다이 → 지지체 → 다이 접착층 → 패키지 기판'},
 {id:'substrate',name:'패키지 기판',en:'PACKAGE SUBSTRATE',layer:4,color:'#628b7b',text:'다이와 본딩 연결부를 지지하는 절연 기판입니다. 내부 또는 표면의 금속 배선으로 칩의 좁은 접점 간격을 외부 연결 간격으로 바꿉니다.',tip:'색은 식별을 위한 표현입니다. 세라믹 또는 유기 기판 등 실제 재료와 층 구성은 제품에 따라 다릅니다.',link:'다이 지지 + 전기 연결 + 패키지 구조 유지'},
 {id:'seal',name:'실링 프레임',en:'SEAL FRAME',layer:4,color:'#99a7b7',text:'센서 주변을 둘러싸며 커버를 지지하고 접합하는 프레임입니다. 빛을 받는 중앙 개구와 본딩 공간을 구분합니다.',tip:'이 모델의 프레임 표현만으로 실제 제품의 기밀·방수 성능을 의미하지 않습니다.',link:'패키지 기판 → 프레임 / 접합부 → 광학 커버'},
 {id:'cover',name:'광학 커버',en:'OPTICAL COVER WINDOW',layer:4,color:'#a1d9ea',text:'빛을 통과시키면서 센서 표면과 내부 연결부를 보호하는 창입니다. 내부를 쉽게 관찰하도록 기본적으로 숨겨 두었습니다.',tip:'광학 커버가 항상 IR 차단 필터인 것은 아닙니다. 표시 스위치를 켜면 분해된 위치에 나타납니다.',link:'입사광 → 커버 → 마이크로렌즈 / 컬러 필터'}
] as const;
export type PartId = typeof packageParts[number]['id'];
export interface PackageRig {update:(separation:number,circuitY:number,baseY:number)=>void;setVisible:(id:PartId,visible:boolean)=>void;anchors:Map<PartId,THREE.Object3D>;}
export function buildPackage(circuit:THREE.Group,base:THREE.Group):PackageRig {
 const partGroups=new Map<PartId,THREE.Group>();const anchors=new Map<PartId,THREE.Object3D>();
 for(const p of packageParts){const g=new THREE.Group();g.name=p.en;g.userData.part=p.id;(p.layer===3?circuit:base).add(g);partGroups.set(p.id,g);}
 const mat=(color:THREE.ColorRepresentation,metalness=.25)=>new THREE.MeshStandardMaterial({color,metalness,roughness:.36});
 function mesh(id:PartId,geometry:THREE.BufferGeometry,color:THREE.ColorRepresentation,x:number,y:number,z:number,metalness=.25){const m=new THREE.Mesh(geometry,mat(color,metalness));m.position.set(x,y,z);m.name=id;m.userData={part:id,layer:packageParts.find(p=>p.id===id)!.layer};partGroups.get(id)!.add(m);if(!anchors.has(id))anchors.set(id,m);return m;}
 function box(id:PartId,w:number,h:number,d:number,color:THREE.ColorRepresentation,x=0,y=0,z=0){return mesh(id,new THREE.BoxGeometry(w,h,d),color,x,y,z,['pads','wires','routing','lands'].includes(id)?.78:.25);}
 function trace(id:PartId,from:THREE.Vector3,to:THREE.Vector3,color:string,r=.023){const length=from.distanceTo(to);const m=mesh(id,new THREE.CylinderGeometry(r,r,length,6),color,0,0,0,.7);m.position.copy(from).add(to).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.clone().sub(from).normalize());return m;}
 function block(id:PartId,w:number,d:number,x:number,z:number){const p=packageParts.find(p=>p.id===id)!;const b=box(id,w,.16,d,p.color,x,.22,z);anchors.set(id,b);return b;}
 // Functional circuit floorplan, not an additional stacked logic die.
 const die=new THREE.Mesh(new THREE.BoxGeometry(8.9,.17,8.9),mat('#324352'));die.name='Circuit-side functional floorplan';die.position.y=.015;die.userData.layer=3;circuit.add(die);
 for(let x=0;x<8;x++)for(let z=0;z<8;z++){const m=new THREE.Mesh(new THREE.BoxGeometry(.61,.055,.61),mat('#355965'));m.position.set((x-3.5)*.66,.13,(z-3.5)*.66);m.userData.layer=3;m.name='Pixel readout footprint';circuit.add(m);}
 block('row',.62,5.22,-3.14,0);block('column',5.3,.43,0,2.97);block('adc',5.3,.43,0,3.53);
 block('timing',.96,1.28,3.32,-1.95);block('bias',.96,1.0,3.32,-.49);block('output',.96,1.32,3.32,1.03);
 block('ob',5.28,.24,0,-2.9);
 for(let k=0;k<8;k++){
  const v=(k-3.5)*.66;
  box('row',5.55,.028,.036,'#d9a15c',-.2,.19,v);
  box('column',.027,.026,5.56,'#70c9c2',v,.225,.2);
  box('adc',.045,.025,.18,'#acaefa',v,.24,3.24);
  box('row',.4,.035,.11,'#ffcc87',-3.14,.32,v);
  box('adc',.07,.045,.29,'#b3befa',v,.32,3.53);
 }
 trace('timing',new THREE.Vector3(3.32,.34,-2.67),new THREE.Vector3(-3.14,.34,-2.67),'#b6a1d9');
 trace('timing',new THREE.Vector3(-3.14,.34,-2.67),new THREE.Vector3(-3.14,.34,-2.35),'#b6a1d9');
 trace('output',new THREE.Vector3(2.65,.28,3.53),new THREE.Vector3(3.32,.28,3.53),'#6eaee2');
 trace('output',new THREE.Vector3(3.32,.28,3.53),new THREE.Vector3(3.32,.28,1.7),'#6eaee2');
 box('bias',.065,.025,6.5,'#e7bd64',3.93,.16,0);
 box('support',8.8,.27,8.8,'#485b70',0,.48,0);box('support',9.03,.065,9.03,'#907e68',0,.285,0);
 box('substrate',11.5,.42,11.5,'#305849',0,0,0);
 for(const sign of [-1,1]){box('seal',.18,.24,11.2,'#8497a5',sign*5.61,.37,0);box('seal',11.05,.24,.18,'#8497a5',0,.37,sign*5.61);}
 const cover=box('cover',11.36,.075,11.36,'#9ad5e6',0,2.8,0);(cover.material as THREE.MeshStandardMaterial).transparent=true;(cover.material as THREE.MeshStandardMaterial).opacity=.12;(cover.material as THREE.MeshStandardMaterial).depthWrite=false;
 const wires:{object:THREE.Mesh;start:THREE.Vector3;end:THREE.Vector3}[]=[];
 for(let side=0;side<4;side++)for(let k=0;k<10;k++){
  const along=(k-4.5)*.79;const coords=(rad:number):[number,number]=>side===0?[along,-rad]:side===1?[rad,along]:side===2?[along,rad]:[-rad,along];
  const [dx,dz]=coords(4.2),[fx,fz]=coords(4.98),[vx,vz]=coords(5.35);
  box('pads',.25,.05,.25,'#f1cd80',dx,.16,dz);
  const [ex,ez]=coords(3.98);box('pads',.14,.055,.14,'#a2a2be',ex,.17,ez);
  const [ix,iz]=coords(3.83);trace('pads',new THREE.Vector3(ix,.135,iz),new THREE.Vector3(dx,.135,dz),'#caab72',.014);
  box('routing',.28,.035,.28,'#e8bd6d',fx,.23,fz);
  trace('routing',new THREE.Vector3(fx,.24,fz),new THREE.Vector3(vx,.24,vz),'#d1a668',.025);
  mesh('routing',new THREE.CylinderGeometry(.061,.061,.5,10),'#b48a49',vx,0,vz,.75);
  box('lands',.34,.045,.34,'#ead7aa',vx,-.255,vz);
  const start=new THREE.Vector3(dx,.2,dz),end=new THREE.Vector3(fx,.25,fz);
  const curve=new THREE.QuadraticBezierCurve3(start,new THREE.Vector3((dx+fx)/2,1.2,(dz+fz)/2),end);
  const wire=mesh('wires',new THREE.TubeGeometry(curve,14,.018,6,false),'#efd094',0,0,0,.82);wires.push({object:wire,start,end});
 }
 const wireAnchor=new THREE.Object3D();wireAnchor.position.set(4.65,1,0);partGroups.get('wires')!.add(wireAnchor);anchors.set('wires',wireAnchor);
 partGroups.get('cover')!.visible=false;
 return {anchors,setVisible(id,visible){partGroups.get(id)!.visible=visible;},update(separation,circuitY,baseY){
  for(const w of wires){const start=w.start.clone();start.y+=circuitY-baseY;const control=start.clone().lerp(w.end,.5);control.y=Math.max(start.y,w.end.y)+.65;const curve=new THREE.QuadraticBezierCurve3(start,control,w.end);w.object.geometry.dispose();w.object.geometry=new THREE.TubeGeometry(curve,14,.018,6,false);}
  cover.position.y=2.8+separation*4;wireAnchor.position.y=circuitY-baseY+.45;
 }};
}
