const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require(path.resolve('apps/marketing/node_modules/typescript'));
// Exercise the actual client helper. The native role/source checks are separately
// proved through real HTTP/browser transactions in recovery-authority-report.json.
function client(){
 const entries=new Map(),storage={get length(){return entries.size;},key:i=>[...entries.keys()][i],getItem:key=>entries.get(key)||null,setItem:(key,value)=>entries.set(key,value),removeItem:key=>entries.delete(key)};
 let actor=1,scope='original';
 const session=()=>({user:{id:actor},tokens:{accessToken:'header.'+Buffer.from(JSON.stringify({iss:'owned-local-issuer'})).toString('base64url')+'.signature'},workspaceContext:{realm:'owned-fixture',workspace:{id:'workspace-one'},actor:{userId:actor,effectiveUserId:actor}}});
 const source=fs.readFileSync(path.resolve('apps/marketing/lib/command-recovery.ts'),'utf8'),code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}};
 vm.runInNewContext(code,{module,exports:module.exports,require:name=>name==='@orgtik/ui/auth'?{readClientSession:session,refreshClientSession:async()=>{}}:name==='@/constants'?{API_URL:'http://owned-api/marketing/api'}:name==='@/constants/env'?{SOS_API_URL:'http://owned-api/sos/api'}:name==='./request-scope'?{marketingRequestScope:()=>scope}:require(name),sessionStorage:storage,window:{dispatchEvent(){}},Event,atob,fetch,AbortSignal,console});
 return{helper:module.exports,storage,entries,changeActor(value){actor=value;scope='actor-'+value;},changeProject(){scope='new-project';}};
}
test('original uncertain command blocks changed input and survives later definitive denial',()=>{
 const c=client(),body={body:'Original reply',operationId:'original-operation'},path='/v3/social-inbox/thread-one/replies',first=c.helper.prepareMarketingCommand('native','project-one',path,body);
 c.helper.settleMarketingCommand(first,'FETCH_ERROR');
 assert.throws(()=>c.helper.prepareMarketingCommand('native','project-one',path,{...body,body:'Changed reply',operationId:'new-operation'}),/recover_original_first/);
 c.helper.settleMarketingCommand(first,403);
 const retried=c.helper.prepareMarketingCommand('native','project-one',path,{...body,operationId:'different-client-reference'});
 assert.equal(retried.body.operationId,'original-operation');assert.equal(retried.uncertain,true);assert.equal(c.entries.size,1);
 c.helper.settleMarketingCommand(retried,200);assert.equal(c.entries.size,0);
});
test('saved command is partitioned by current actor, project and source action',()=>{
 const c=client(),body={contactId:'one',state:'opted_in',operationId:'consent-one'},command=c.helper.prepareMarketingCommand('suite','project-one','/crm/consent',body);
 c.helper.settleMarketingCommand(command,'FETCH_ERROR');assert.equal(c.helper.pendingMarketingCommands('project-one').length,1);
 assert.equal(c.helper.pendingMarketingCommands('project-two').length,0);c.changeActor(2);assert.equal(c.helper.pendingMarketingCommands('project-one').length,0);c.changeActor(1);
 const second=c.helper.prepareMarketingCommand('suite','project-one','/crm/consent',{...body,contactId:'two',operationId:'consent-two'});assert.notEqual(second.key,command.key);
 assert.equal(JSON.stringify([...c.entries.values()]).includes('accessToken'),false);
});
test('late suite success after an actor or project switch retains original uncertain request instead of adopting it',async()=>{
 for(const changing of ['actor','project']){
  const c=client(),body={contactId:'one',state:'opted_in',operationId:'late-'+changing};
  await assert.rejects(c.helper.marketingSuiteCommand('project-one','/crm/consent',body,async()=>{if(changing==='actor')c.changeActor(2);else c.changeProject();return {state:'opted_in'};}),/command_scope_changed/);
  const saved=JSON.parse([...c.entries.values()][0]);assert.equal(saved.body.operationId,body.operationId);assert.equal(saved.uncertain,true);
 }
});
