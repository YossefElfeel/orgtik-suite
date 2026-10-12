// Cases needed by editor audits are created through the same API as a user's blank entry.
// The original examples are test fixtures only; they never enter the normal website seed.
import fs from 'node:fs';
import {apiUrl} from './suite.mjs';
import {tokenFor} from './session.mjs';
const API=apiUrl('wm')+'/v2';
export async function fixtureCall(email,method,p,body,version) {
 const res=await fetch(API+p,{method,headers:{authorization:`Bearer ${await tokenFor(email)}`,'content-type':'application/json',...(version!=null?{'if-match':String(version)}:{})},body:body?JSON.stringify(body):undefined});
 const data=await res.json();if(!res.ok)throw new Error(`${method} ${p}: ${res.status} ${JSON.stringify(data.error)}`);return data.data;
}
const editor='hoda.ashraf@orgtik.test', approver='karim.hassan@orgtik.test';
export async function caseFixtures() {
 const source=JSON.parse(fs.readFileSync(new URL('./case-fixtures.json',import.meta.url),'utf8'));
 const ids={};
 for(const item of source) {
  let e=await fixtureCall(editor,'POST','/admin/entries/caseStudy',{name:item.locales.en.name,slug:'audit-'+item.slug.en,department:item.department});
  e=await fixtureCall(editor,'PATCH',`/admin/entries/caseStudy/${e.id}`,{locale:'en',fields:item.locales.en,image:item.image,gallery:item.gallery},e.version);
  e=await fixtureCall(editor,'POST',`/admin/entries/caseStudy/${e.id}/transitions`,{action:'submit'},e.version);
  e=await fixtureCall(approver,'POST',`/admin/entries/caseStudy/${e.id}/transitions`,{action:'approve'},e.version);
  e=await fixtureCall(approver,'POST',`/admin/entries/caseStudy/${e.id}/transitions`,{action:'publish'},e.version);
  ids[item.id]=e.id;
 }
 return ids;
}
export async function roadmapFixture() {
 const original=await fixtureCall(editor,'GET','/admin/entries/roadmapItem/rm_04');
 const e=await fixtureCall(editor,'POST','/admin/entries/roadmapItem',{name:original.name,from:original.id});
 return e.id;
}
