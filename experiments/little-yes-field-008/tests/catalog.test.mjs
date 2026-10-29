import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=new URL('../',import.meta.url);
test('eight source-linked chapters with honest execution grades',()=>{
 const c=JSON.parse(readFileSync(new URL('catalog.json',base),'utf8'));
 assert.deepEqual(c.chapters.map(x=>x.number),[1,2,3,4,5,6,7,8]);
 assert.equal(c.chapters.filter(x=>x.availableHere).length,2);
 assert(c.chapters.slice(0,6).every(x=>x.evidenceLevel==='LINKED_ONLY'));
 assert.equal(c.chapters[7].soundRecordingIncluded,false);
});
test('all three local HTML pages are present and self-contained',()=>{
 for(const path of ['index.html','rail/index.html','kingdom/index.html']){
  const html=readFileSync(new URL(path,base),'utf8');
  assert.match(html,/<html/i);
  assert(!/<script[^>]+src=['\"]https?:/i.test(html));
 }
});
