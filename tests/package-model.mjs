import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import * as THREE from 'three';
const source=fs.readFileSync('src/package-model.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
fs.mkdirSync('.sites-runtime',{recursive:true});fs.writeFileSync('.sites-runtime/package-test-module.mjs',compiled);
const {buildPackage,packageParts}=await import('../.sites-runtime/package-test-module.mjs');
const circuit=new THREE.Group(),base=new THREE.Group();const rig=buildPackage(circuit,base);
assert.equal(packageParts.length,15);assert.equal(rig.anchors.size,15);
for(const p of packageParts){const anchor=rig.anchors.get(p.id);assert.ok(anchor,p.id);let root=anchor;while(root.parent)root=root.parent;assert.equal(root,p.layer===3?circuit:base,p.id+' belongs to the correct die/package group');}
const wires=[];base.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.part==='wires')wires.push(o);});assert.equal(wires.length,40);
for(const separation of [0,.48,1]){
 const circuitY=-.25+separation*.9,baseY=-1.1;
 rig.update(separation,circuitY,baseY);
 for(const wire of wires){const curve=wire.geometry.parameters.path;assert.ok(Math.abs(curve.getPoint(0).y-(.2+circuitY-baseY))<1e-9);assert.ok(Math.abs(curve.getPoint(1).y-.25)<1e-9);assert.ok(curve.getPoint(.5).y>Math.min(curve.getPoint(0).y,curve.getPoint(1).y));assert.ok(Array.from(wire.geometry.attributes.position.array).every(Number.isFinite));}
}
const cover=rig.anchors.get('cover');assert.equal(cover.parent.visible,false);rig.setVisible('cover',true);assert.equal(cover.parent.visible,true);rig.setVisible('wires',false);assert.equal(wires[0].parent.visible,false);
const lands=[];base.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.part==='lands')lands.push(o);});assert.equal(lands.length,40);assert.ok(lands.every(o=>o.position.y<0));
console.log('Package model verified: 15 components, 40 wire endpoints at 3 separations, group ownership, visibility and 40 bottom contacts.');
