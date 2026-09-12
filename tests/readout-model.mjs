import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('src/readout.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/readout-test-module.mjs',code);
const {frameAt,timing,duration,keyframes,codeFor,voltageFor}=await import('../.sites-runtime/readout-test-module.mjs');
for(const exposure of [2,4,8]){
 const global=Array.from({length:8},(_,i)=>timing('global',exposure,i));
 assert.ok(global.every(t=>t.start===global[0].start&&t.end===global[0].end));
 const stored=frameAt('global',exposure,.2+exposure+.05);assert.ok(stored.globalTransfer);assert.ok(stored.rows.every(r=>r.stored&&!r.exposing));assert.equal(stored.activeRow,null);
 for(let r=0;r<8;r++){
  const g=timing('global',exposure,r),rs=timing('rolling',exposure,r);
  assert.ok(Math.abs(rs.start-(.2+r))<1e-8);assert.ok(Math.abs(rs.end-rs.start-exposure)<1e-8);
  for(const [offset,phase] of [[.1,'reference'],[.25,'transfer'],[.4,'cds'],[.65,'adc'],[.9,'output']])for(const shutter of ['rolling','global']){
   const t=timing(shutter,exposure,r),s=frameAt(shutter,exposure,t.readStart+offset);assert.equal(s.phase,phase);assert.equal(s.activeRow,r);assert.equal(s.completed,r);
   if(shutter==='rolling'&&phase==='reference')assert.equal(s.rows[r].exposing,true);
   if(shutter==='global'&&phase==='reference')assert.ok(s.rows.slice(r).every(row=>row.stored));
   if(shutter==='global'&&phase==='transfer')assert.equal(s.rows[r].stored,false);
  }
  const transfer=frameAt('global',exposure,g.readStart+.25);assert.ok(transfer.rows.slice(r+1).every(row=>row.stored));
 }
 for(const shutter of ['rolling','global']){
  let previousCompleted=0;
  for(let time=0;time<=duration(shutter,exposure)+.01;time+=.007){const s=frameAt(shutter,exposure,time);assert.ok(s.completed>=previousCompleted);previousCompleted=s.completed;assert.ok(s.rows.filter(r=>time>=r.readStart&&time<r.readEnd).length<=1);for(let c=0;c<s.codes.length;c++){assert.ok(s.codes[c]>=0&&s.codes[c]<=255);assert.equal(s.latched[c],s.phase==='output'||s.phase==='adc'&&s.counter>=s.codes[c]);}}
  assert.equal(frameAt(shutter,exposure,duration(shutter,exposure)).completed,8);assert.equal(frameAt(shutter,exposure,999).phase,'done');
  for(const t of keyframes(shutter,exposure))assert.doesNotThrow(()=>frameAt(shutter,exposure,t));
 }
}
const overlap=frameAt('rolling',4,4.05);assert.equal(overlap.activeRow,0);assert.deepEqual(overlap.resetRows,[4]);
for(let r=0;r<8;r++)for(let c=0;c<8;c++){const code=codeFor(r,c,4),v=voltageFor(r,c,4);assert.ok(code/255>=v-1e-10);assert.ok(code===0||(code-1)/255<v+1e-10);}
assert.throws(()=>frameAt('global',NaN,0));
console.log('Readout verified: aligned global exposure, staggered rolling windows, preserved memory, ordered row/CDS/ADC/output phases, reset/read overlap and comparator latching.');
