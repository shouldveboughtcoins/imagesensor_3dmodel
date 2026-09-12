import * as THREE from 'three';
import type {Snapshot} from './readout';
export interface ReadoutVisual {update:(state:Snapshot)=>void;group:THREE.Group;}
export function createReadoutVisual(parent:THREE.Group):ReadoutVisual{
 const group=new THREE.Group();group.name='Readout teaching overlay';group.userData.transient=true;parent.add(group);
 const box=(w:number,h:number,d:number,color:string,x:number,y:number,z:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85}));m.position.set(x,y,z);m.userData.layer=3;group.add(m);return m;};
 const pixels:THREE.Mesh[][]=[],memories:THREE.Mesh[][]=[],driver:THREE.Mesh[]=[],adcs:THREE.Mesh[]=[];
 function label(text:string,x:number,z:number){const c=document.createElement('canvas');c.width=128;c.height=64;const ctx=c.getContext('2d')!;ctx.fillStyle='#0e1720';ctx.fillRect(0,0,128,64);ctx.fillStyle='#dceff4';ctx.font='bold 36px sans-serif';ctx.textAlign='center';ctx.fillText(text,64,45);const texture=new THREE.CanvasTexture(c);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.position.set(x,.65,z);sprite.scale.set(.46,.23,1);group.add(sprite);}
 for(let r=0;r<8;r++){pixels[r]=[];memories[r]=[];for(let c=0;c<8;c++){
  const x=(c-3.5)*.66,z=(r-3.5)*.66;
  const p=box(.53,.025,.5,'#405360',x,.38,z);p.userData.row=r;pixels[r].push(p);
  const mem=box(.14,.065,.14,'#b693ff',x+.18,.45,z+.18);mem.userData.row=r;memories[r].push(mem);
 }
 const d=box(.5,.04,.33,'#f3a85e',-3.14,.4,(r-3.5)*.66);d.userData.row=r;driver.push(d);label('R'+(r+1),-3.8,(r-3.5)*.66);
 const adc=box(.5,.05,.34,'#8695ba',(r-3.5)*.66,.4,3.53);adcs.push(adc);label('C'+(r+1),(r-3.5)*.66,3.91);
 }
 const rowPaths=Array.from({length:8},(_,r)=>box(5.7,.018,.045,'#ffa84f',-.3,.49,(r-3.5)*.66));
 const columnPaths=Array.from({length:8},(_,c)=>box(.035,.02,5.5,'#60e4d4',(c-3.5)*.66,.51,.22));
 const voltageDots=Array.from({length:8},()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshBasicMaterial({color:'#85fff0'}));group.add(m);return m;});
 const transferDots=Array.from({length:64},()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.046,8,6),new THREE.MeshBasicMaterial({color:'#ffdd83'}));group.add(m);return m;});
 const outputDots=Array.from({length:8},()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshBasicMaterial({color:'#99b8ff'}));group.add(m);return m;});
 const highlightCDS=box(5.3,.02,.46,'#50e8ce',0,.38,2.97),highlightIO=box(1.02,.02,1.34,'#89b6ff',3.32,.38,1.03);
 const color=new THREE.Color();
 return {group,update(s){
  for(let r=0;r<8;r++){
   const row=s.rows[r],isActive=s.activeRow===r,control=s.resetRows.includes(r)||s.globalTransfer||isActive&&['reference','transfer','cds'].includes(s.phase);
   (driver[r].material as THREE.MeshBasicMaterial).color.set(control?'#ffb757':'#70583d');rowPaths[r].visible=control;
   for(let c=0;c<8;c++){
    let tint=row.complete?'#577c9c':row.stored?'#8462b8':row.exposing?'#71d78d':'#344853';
    if(s.resetRows.includes(r))tint='#f2a651';if(isActive&&['reference','transfer','cds'].includes(s.phase))tint='#e4b15d';
    color.set(tint);if(row.exposing&&!isActive)color.multiplyScalar(.5+.5*row.charge);
    (pixels[r][c].material as THREE.MeshBasicMaterial).color.copy(color);
    memories[r][c].visible=s.shutter==='global';(memories[r][c].material as THREE.MeshBasicMaterial).color.set(row.stored?'#c49bff':'#463653');
    const transfer=transferDots[r*8+c];transfer.visible=s.globalTransfer||isActive&&s.phase==='transfer';
    if(transfer.visible){const x=(c-3.5)*.66,z=(r-3.5)*.66,p=s.progress;transfer.position.set(x+(s.globalTransfer?.18*p:s.shutter==='global'?.18*(1-p):-.12*p),.56,z+(s.globalTransfer?.18*p:s.shutter==='global'?.18*(1-p):-.12*p));}
   }
  }
  const columnOn=s.activeRow!==null&&['reference','cds'].includes(s.phase);
  for(let c=0;c<8;c++){
   columnPaths[c].visible=columnOn;voltageDots[c].visible=columnOn;
   if(columnOn){const z=(s.activeRow!-3.5)*.66;columnPaths[c].scale.z=(2.97-z)/5.5;columnPaths[c].position.z=(2.97+z)/2;voltageDots[c].position.set((c-3.5)*.66,.6,z+(2.97-z)*s.progress);}
   (adcs[c].material as THREE.MeshBasicMaterial).color.set(s.phase==='adc'?(s.latched[c]?'#c9a1ff':'#6561a1'):s.phase==='output'?'#a2c8ff':'#435779');
   outputDots[c].visible=s.phase==='output';if(s.phase==='output'){const p=Math.max(0,Math.min(1,s.progress*1.5-c*.065)),x=(c-3.5)*.66;outputDots[c].position.set(p<.6?x+(3.32-x)*(p/.6):3.32,.6,p<.6?3.53:3.53+(1.03-3.53)*((p-.6)/.4));}
  }
  highlightCDS.visible=['reference','cds'].includes(s.phase);highlightIO.visible=s.phase==='output';
 }};
}
