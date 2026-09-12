/** Educational charge-domain GS / 4T-style RS sequence. Times are Tline units, not device timings. */
export type Shutter='rolling'|'global';
export type Phase='reset'|'integrating'|'store'|'reference'|'transfer'|'cds'|'adc'|'output'|'done';
export const ROWS=8,COLS=8,RESET=.2,STORE=.15;
export interface RowTiming {start:number;end:number;readStart:number;readEnd:number;}
export interface RowState extends RowTiming {row:number;charge:number;stored:boolean;exposing:boolean;complete:boolean;}
export interface Snapshot {shutter:Shutter;time:number;duration:number;exposure:number;phase:Phase;progress:number;activeRow:number|null;resetRows:number[];globalTransfer:boolean;rows:RowState[];codes:number[];counter:number;latched:boolean[];completed:number;}
export const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const precise=(v:number)=>Math.round(v*1e6)/1e6;
export function timing(shutter:Shutter,exposure:number,row:number):RowTiming{
 const start=precise(RESET+(shutter==='rolling'?row:0)),end=precise(start+exposure);
 const readStart=precise(shutter==='rolling'?end-.2:end+STORE+row);
 return {start,end,readStart,readEnd:precise(readStart+1)};
}
export function duration(shutter:Shutter,exposure:number){return timing(shutter,exposure,ROWS-1).readEnd;}
export function voltageFor(row:number,column:number,exposure:number){return clamp(((column+1)/10+row*.009)*exposure/4);}
export function codeFor(row:number,column:number,exposure:number){return Math.ceil(voltageFor(row,column,exposure)*255);}
export function frameAt(shutter:Shutter,exposure:number,time:number):Snapshot{
 if(!['rolling','global'].includes(shutter)||!Number.isFinite(exposure)||exposure<1||!Number.isFinite(time))throw new Error('Invalid readout configuration');
 const total=duration(shutter,exposure);time=precise(clamp(time,0,total));
 const rows=Array.from({length:ROWS},(_,row)=>{const t=timing(shutter,exposure,row);return {...t,row,charge:clamp((time-t.start)/exposure),exposing:time>=t.start&&time<t.end,stored:shutter==='global'&&time>=t.end&&time<t.readStart+.2,complete:time>=t.readEnd};});
 const active=rows.find(r=>time>=r.readStart&&time<r.readEnd),resetRows=rows.filter(r=>time>=r.start-RESET&&time<r.start).map(r=>r.row);
 const globalTransfer=shutter==='global'&&time>=RESET+exposure&&time<RESET+exposure+STORE;
 let phase:Phase='integrating',progress=0;
 if(time>=total)phase='done';
 else if(globalTransfer){phase='store';progress=(time-RESET-exposure)/STORE;}
 else if(active){const local=precise(time-active.readStart);const steps:[number,number,Phase][]=[[0,.2,'reference'],[.2,.32,'transfer'],[.32,.5,'cds'],[.5,.8,'adc'],[.8,1,'output']];const step=steps.find(([a,b])=>local>=a&&local<b)!;phase=step[2];progress=clamp((local-step[0])/(step[1]-step[0]));}
 else if(resetRows.length){phase='reset';progress=(time-(rows[resetRows[0]].start-RESET))/RESET;}
 const activeRow=active?.row??null,codes=activeRow===null?[]:Array.from({length:COLS},(_,col)=>codeFor(activeRow,col,exposure));
 const counter=phase==='adc'?Math.min(255,Math.floor(progress*256)):phase==='output'?255:0;
 const latched=codes.map(code=>(phase==='adc'&&counter>=code)||phase==='output');
 return {shutter,time,duration:total,exposure,phase,progress,activeRow,resetRows,globalTransfer,rows,codes,counter,latched,completed:rows.filter(r=>r.complete).length};
}
export function keyframes(shutter:Shutter,exposure:number){
 const points=[0,RESET,RESET+exposure];
 if(shutter==='global')points.push(RESET+exposure+STORE);
 for(let r=0;r<ROWS;r++){const t=timing(shutter,exposure,r);points.push(t.start-RESET,t.start,t.end,...[0,.2,.32,.5,.8,1].map(v=>t.readStart+v));}
 return [...new Set(points.map(v=>Math.round(v*100000)/100000))].sort((a,b)=>a-b);
}
export function describe(s:Snapshot):{title:string;text:string;control:string}{
 const r=s.activeRow===null?'':`R${s.activeRow+1}`;
 const details:Record<Phase,[string,string,string]>={
 reset:[s.shutter==='global'?'모든 행 리셋':`R${s.resetRows[0]+1} 노출 준비`,s.shutter==='global'?'모든 포토다이오드를 초기화하고 같은 시점에 노출을 시작합니다.':'행 드라이버가 이 행의 포토다이오드를 초기화합니다. 다음 행은 1 Tline 뒤에 같은 과정을 시작합니다.',s.shutter==='global'?'전체 PD 초기화':`PD 리셋: ${s.resetRows.map(r=>'R'+(r+1)).join(', ')}`],
 integrating:['빛 → 포토다이오드 전하',s.shutter==='global'?'모든 행의 노출 창이 같습니다. 녹색은 광전하가 축적되는 픽셀입니다.':'행마다 노출 시작·종료 시점이 다릅니다. 여러 행이 동시에 노출 중일 수 있습니다.','노출 진행'],
 store:['전체 픽셀 → 차광 저장 노드','모든 픽셀의 노출을 동시에 끝내고 전하를 MEM에 보관합니다. 보라색 MEM은 아직 아날로그 전하이며 ADC 변환 결과가 아닙니다.','GLOBAL TX: PD → MEM'],
 reference:[`${r} 선택 · FD 기준 샘플`,`행 드라이버가 ${r}의 SEL을 켭니다. FD(전하-전압 변환 노드)를 리셋한 뒤 기준 전압 Vreset을 열 회로에서 샘플합니다. ${s.shutter==='global'?'영상 전하는 아직 MEM에서 기다립니다.':'포토다이오드의 노출은 TX 직전까지 계속됩니다.'}`,`SEL ${r} + FD RST → 기준 샘플`],
 transfer:[`${r} 전하 전달`,s.shutter==='global'?`${r}의 MEM에서 FD로 전하를 옮깁니다. 다른 행의 MEM은 그대로 신호를 보관합니다.`:`${r}의 PD에서 FD로 전하를 옮겨 이 행의 노출을 끝냅니다. 다음 행의 노출은 계속됩니다.`,s.shutter==='global'?`SEL ${r} + TX: MEM → FD`:`SEL ${r} + TX: PD → FD`],
 cds:[`${r} 신호 샘플 · CDS`,'각 열은 Vsignal을 샘플하고, 이 예시에서는 Vreset − Vsignal을 계산합니다. 청록색 이동은 열 배선의 전압 신호를 나타내며 전자가 다른 픽셀을 거쳐 이동하는 모습이 아닙니다.',`SEL ${r} · 열 S/H → CDS`],
 adc:[`${r} · 8개 열 ADC 병렬 변환`,'CDS 결과를 유지한 상태에서 공통 램프와 카운터가 올라갑니다. 각 열 비교기는 자신의 입력에 도달한 카운트를 래치합니다. 같은 행의 여러 열이 병렬로 변환되고, 전체 프레임을 동시에 ADC로 읽는 것은 아닙니다.','공통 RAMP / COUNT → 열별 비교·래치'],
 output:[`${r} 디지털 코드 출력`,'열별 래치에 저장한 코드를 출력 경로로 모읍니다. 코드 순차 전송을 눈에 보이게 늘려 표현했으며 실제 레인 수·인터페이스·비트 직렬 전송을 재현하지 않습니다.',`${r} 데이터 → 출력 I/O`],
 done:['한 프레임 읽기 완료',s.shutter==='global'?'노출은 모든 행이 동시에 끝났지만, 저장된 신호는 R1부터 R8까지 순서대로 읽혔습니다.':'각 행의 노출 길이는 같아도 노출 창이 1 Tline씩 어긋납니다. R8까지 읽으면 한 프레임이 완성됩니다.','프레임 완료']
 };
 const [title,text,control]=details[s.phase];return {title,text,control};
}
