import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setClientSession, clearClientSession } from '../../dist/auth/session.js';
import { retainedDraftKey, readRetainedDraft, writeRetainedDraft, clearRetainedDraft } from '../../dist/lib/retained-draft.js';
import { csvCell } from '../../dist/lib/csv.js';
test('retained drafts survive refresh and storage rereads while separating issuer, actor, workspace and impersonation',()=>{
  const stored=new Map(),tab=new Map();globalThis.window=new EventTarget();window.sessionStorage={getItem:key=>tab.get(key)||null,setItem:(key,value)=>tab.set(key,value),removeItem:key=>tab.delete(key)};
  globalThis.localStorage={getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)};
  const session=(iss='local',id=1,workspace='one',effective=id,nonce='first')=>({user:{id},tokens:{accessToken:'header.'+Buffer.from(JSON.stringify({iss,nonce})).toString('base64url')+'.signature'},workspaceContext:{workspace:{id:workspace},actor:{effectiveUserId:effective}}});
  setClientSession(session());const original=retainedDraftKey('catalog');assert.ok(writeRetainedDraft(original,{title:'Unsaved'}));
  setClientSession(session('local',1,'one',1,'refresh'));assert.equal(retainedDraftKey('catalog'),original);assert.deepEqual(readRetainedDraft(original),{title:'Unsaved'});
  for(const value of [session('other'),session('local',2),session('local',1,'two'),session('local',1,'one',2)]){setClientSession(value);assert.notEqual(retainedDraftKey('catalog'),original);assert.equal(readRetainedDraft(retainedDraftKey('catalog')),undefined);}
  assert.ok(![...stored.values()].join('').includes('accessToken'));
  setClientSession(session());clearRetainedDraft(original);assert.equal(readRetainedDraft(original),undefined);
  localStorage.setItem=()=>{throw Error('Quota exceeded');};assert.equal(writeRetainedDraft(original,{title:'Keep editing'}),false);
  localStorage.removeItem=()=>{throw Error('Private storage');};assert.doesNotThrow(()=>clearRetainedDraft(original));
  clearClientSession();assert.equal(retainedDraftKey('catalog'),null);delete globalThis.window;delete globalThis.localStorage;
});
test('browser and server CSV implementations have the same safe cell behavior',async()=>{
  const {createRequire}=await import('node:module');const server=createRequire(import.meta.url)('../../../../mock/lib/csv.js');
  for(const value of ['=formula','\t+formula',' \uFEFF@formula','منى, "quoted"',-20,null])assert.equal(csvCell(value),server.csvCell(value));
});
