import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Store, publicPaper } from '../lib/store.mjs';
import { Harness, evidenceFor, validateCitations } from '../lib/harness.mjs';
import { DemoBridge, DemoProvider } from '../lib/demo.mjs';
import { Provider, baseURL, inferProvider, providerRequest } from '../lib/provider.mjs';
import { createApp } from '../server.mjs';
import { parseCollections, parseItems } from '../lib/zotero.mjs';
import { textFromPdfItems } from '../lib/pdf.mjs';
import http from 'node:http';

async function fixture(t, provider = new DemoProvider()) {
  const root = await mkdtemp(path.join(os.tmpdir(),'zr-test-'));
  t.after(() => rm(root,{recursive:true,force:true}));
  const store = new Store(root), bridge = new DemoBridge();
  const harness = new Harness({store,bridge,provider});
  await harness.load('DEMO0001',1);
  return {root,store,harness};
}
async function finished(harness, store) {
  for (let i=0;i<300;i++) {
    if (!harness.active.size) return store.paper('DEMO0001');
    await new Promise(resolve=>setTimeout(resolve,10));
  }
  throw new Error('Task did not finish');
}
test('real tool loop persists cited answers, separate study memory and editable drafts',async t=>{
  const {store,harness,root}=await fixture(t);
  await harness.start('DEMO0001',{question:'Does this generalize?',page:1});
  const paper=await finished(harness,store);
  assert.equal(paper.job.status,'complete'); assert.equal(paper.messages.length,1);
  assert.ok(paper.messages[0].evidence.some(e=>e.page===2));
  assert.equal(paper.cards[0].status,'draft'); assert.ok(paper.memory);
  assert.equal(publicPaper(paper).memory,undefined); assert.equal(publicPaper(paper).revisions,undefined);
  assert.equal((await new Store(root).paper('DEMO0001')).memory,paper.memory);
});
test('store serializes repeated Windows-safe replacements without orphan temp files',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'zr-store-'));t.after(()=>rm(root,{recursive:true,force:true}));const store=new Store(root);
  await Promise.all(Array.from({length:20},(_,index)=>store.write('papers/TEST0001.json',{index,text:'x'.repeat(index)})));
  const saved=await store.read('papers/TEST0001.json',null);assert.equal(typeof saved.index,'number');
  assert.deepEqual((await readdir(path.join(root,'papers'))).filter(name=>name.endsWith('.tmp')),[]);
});
test('Zotero markdown is projected into collection and item rows',()=>{
  const collections=parseCollections('# Zotero Collections\n\n- **Work** (Key: ABCD1234)\n  - **Methods** (Key: EFGH5678)');
  assert.deepEqual(collections,[{key:'ABCD1234',name:'Work',depth:0,parentKey:null},{key:'EFGH5678',name:'Methods',depth:1,parentKey:'ABCD1234'}]);
  const items=parseItems('# Items\n\n## 1. Paper title\n**Type:** journalArticle\n**Item Key:** ZXCV1234\n**Date:** 2026\n**Authors:** Doe, Jane\n**Attachments:** PDF, 1 attachment\n');
  assert.equal(items[0].title,'Paper title');assert.equal(items[0].hasPdf,true);assert.equal(items[0].authors,'Doe, Jane');
});
test('PDF text items are reconstructed into readable lines',()=>{
  const text=textFromPdfItems([
    {str:'A reliable',transform:[1,0,0,1,10,700]},
    {str:'reader',transform:[1,0,0,1,80,700]},
    {str:'preserves',transform:[1,0,0,1,10,680]},
    {str:'hyphen-',transform:[1,0,0,1,80,680]},
    {str:'ation.',transform:[1,0,0,1,10,660]},
  ]);
  assert.equal(text,'A reliable reader\npreserves hyphenation.');
});
test('fabricated citations and tools outside the scope are rejected without accepting notes',async t=>{
  const {store,harness}=await fixture(t,{async complete(){return {tokens:1,message:{content:JSON.stringify({answer:'A made-up claim [E0000000000000000]',memory:'bad',card:null})}};}});
  await harness.start('DEMO0001',{question:'A question',page:1});
  let paper=await finished(harness,store); assert.equal(paper.job.status,'failed'); assert.equal(paper.messages.length,0); assert.equal(paper.memory,'');
  harness.provider={async complete(){return {tokens:1,message:{tool_calls:[{id:'x',type:'function',function:{name:'delete_item',arguments:'{}'}}]}};}};
  await harness.start('DEMO0001',{question:'Try again',page:1});
  paper=await finished(harness,store); assert.equal(paper.job.status,'failed'); assert.match(paper.job.step,/outside/); assert.equal(paper.cards.length,0);
});
test('structured final-answer tool works across compatible providers',async t=>{
  let submitted=false;
  const provider={async complete(messages,tools){
    const evidence=JSON.stringify(messages).match(/E[a-f0-9]{16}/)?.[0];
    assert.ok(tools.some(tool=>tool.function.name==='submit_research_answer'));
    submitted=true;
    return {tokens:3,message:{tool_calls:[{id:'final',type:'function',function:{name:'submit_research_answer',arguments:JSON.stringify({answer:`Supported [${evidence}]`,memory:'Checked evidence.',card:null})}}]}};
  }};
  const {store,harness}=await fixture(t,provider);await harness.start('DEMO0001',{question:'Question',page:1});
  const paper=await finished(harness,store);assert.equal(submitted,true);assert.equal(paper.job.status,'complete');assert.equal(paper.messages.length,1);
});
test('tool arguments cannot select another paper',async t=>{
  const {store,harness}=await fixture(t,{async complete(){return {tokens:1,message:{tool_calls:[{id:'x',type:'function',function:{name:'read_page',arguments:'{"page":1,"item_key":"OTHER001"}'}}]}};}});
  await harness.start('DEMO0001',{question:'Question',page:1});
  const paper=await finished(harness,store); assert.equal(paper.job.status,'failed'); assert.match(paper.job.step,/out-of-scope/);
});
test('preparation checkpoints resume without repeating completed pages',async t=>{
  const demo=new DemoProvider();let calls=0;
  const provider={async complete(...args){calls++;if(calls===2)throw new Error('Temporary test failure');return demo.complete(...args);}};
  const {store,harness}=await fixture(t,provider);
  await harness.start('DEMO0001',{prepare:true,page:1});
  let paper=await finished(harness,store);assert.equal(paper.job.status,'failed');assert.deepEqual(Object.keys(paper.prepared),['1']);
  await harness.start('DEMO0001',{prepare:true,page:1});
  paper=await finished(harness,store);assert.equal(paper.job.status,'complete');assert.equal(calls,4);assert.equal(Object.keys(paper.prepared).length,3);assert.equal(paper.messages.length,0);
});
test('switching from legacy MCP extraction to a versioned local text layer preserves study state',async t=>{
  const {store,harness}=await fixture(t);const data=await store.paper('DEMO0001');
  data.memory='Keep this study record.';data.prepared[1]=data.pages[1].hash;await store.savePaper(data);
  harness.bridge={async metadata(){return {key:'DEMO0001',title:'Demo paper'};},async page(){return {page:1,text:'Reformatted but locally versioned page text.',totalPages:3,extraction:'text-layer',sourceVersion:'ATTACH01:100:200'};}};
  await harness.load('DEMO0001',1);const migrated=await store.paper('DEMO0001');
  assert.equal(migrated.memory,'Keep this study record.');assert.equal(migrated.prepared[1],migrated.pages[1].hash);assert.equal(migrated.warning,undefined);
});
test('cancelled model request cannot commit an answer or private memory',async t=>{
  let entered;const ready=new Promise(resolve=>entered=resolve);
  const {store,harness}=await fixture(t,{async complete(_m,_t,signal){entered();await new Promise((_r,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));}});
  await harness.start('DEMO0001',{question:'Question',page:1}); await ready; harness.cancel('DEMO0001');
  const paper=await finished(harness,store);assert.equal(paper.job.status,'paused');assert.equal(paper.memory,'');assert.equal(paper.messages.length,0);
});
test('citations identify an exact evidence version and missing citations fail',()=>{
  const a=evidenceFor('DEMO0001',{page:1,text:'first'}), b=evidenceFor('DEMO0001',{page:1,text:'changed'});
  assert.notEqual(a.id,b.id);assert.throws(()=>validateCitations({answer:'Uncited',card:null},[a]));
});
test('HTTP endpoints hide secrets and private study records and protect mutations',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'zr-http-'));
  const app=await createApp({demo:true,root,port:0});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await app.close();await rm(root,{recursive:true,force:true});});
  const url=`http://127.0.0.1:${app.server.address().port}`;
  const boot=await fetch(`${url}/api/bootstrap`).then(r=>r.json());
  const post=(route,body)=>fetch(`${url}/api/${route}`,{method:'POST',headers:{'Content-Type':'application/json','X-Research-Token':boot.token},body:JSON.stringify(body)});
  assert.equal((await fetch(`${url}/api/open`,{method:'POST',body:'{}'})).status,403);
  const opened=await (await post('open',{key:'DEMO0001',page:1})).json();assert.equal(opened.totalPages,3);assert.equal(opened.memory,undefined);
  const library=await fetch(`${url}/api/library`,{headers:{'X-Research-Token':boot.token}}).then(r=>r.json());assert.equal(library.collections[0].key,'DEMOCLL1');assert.equal(library.items[0].key,'DEMO0001');
  const pdfInfo=await fetch(`${url}/api/pdf-info?key=DEMO0001`,{headers:{'X-Research-Token':boot.token}}).then(r=>r.json());assert.equal(pdfInfo.available,false);
  const search=await (await post('search',{query:'retrieval'})).json();assert.equal(search.items[0].key,'DEMO0001');
  await post('run',{key:'DEMO0001',page:1,question:'Evidence?'});const paper=await finished(app.harness,app.store);
  const publicState=await fetch(`${url}/api/paper?key=DEMO0001`,{headers:{'X-Research-Token':boot.token}}).then(r=>r.json());
  assert.equal(publicState.memory,undefined);assert.equal(publicState.messages.length,1);
  const card=paper.cards[0];assert.equal((await post('card',{key:'DEMO0001',id:card.id,title:'My note',body:'Edited conclusion'})).status,200);
  assert.equal((await app.store.paper('DEMO0001')).cards[0].status,'accepted');
});
test('provider sends tool results, retries temporary failures, and never forwards key errors',async t=>{
  let calls=0;
  const mock=http.createServer(async(req,res)=>{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks));
    assert.equal(body.model,'test');assert.equal(req.headers.authorization,'Bearer test-key');calls++;
    res.setHeader('content-type','application/json');
    if(calls===1){res.writeHead(503);res.end('{}');}else res.end(JSON.stringify({choices:[{message:{role:'assistant',content:'ok'}}],usage:{total_tokens:12}}));
  });await new Promise(resolve=>mock.listen(0,'127.0.0.1',resolve));t.after(()=>mock.close());
  const provider=new Provider({baseUrl:`http://127.0.0.1:${mock.address().port}/v1`,model:'test',apiKey:'test-key'});
  const result=await provider.complete([{role:'user',content:'test'}],[],new AbortController().signal);assert.equal(calls,2);assert.equal(result.tokens,12);
  assert.equal(baseURL('https://generativelanguage.googleapis.com/v1beta'),'https://generativelanguage.googleapis.com/v1beta/openai');
  assert.throws(()=>baseURL('http://untrusted.example/v1'));
});
test('provider templates select safe structured-output modes',()=>{
  const messages=[{role:'user',content:'Return JSON'}],tools=[{type:'function',function:{name:'x',strict:true,parameters:{type:'object'}}}];
  const deepseek=providerRequest({provider:'deepseek',model:'deepseek-flash',baseUrl:'https://api.deepseek.com'},messages,tools);
  assert.equal(deepseek.response_format.type,'json_object');assert.equal(deepseek.thinking.type,'disabled');assert.equal(deepseek.tools[0].function.strict,undefined);
  const openai=providerRequest({provider:'openai',model:'gpt-test',baseUrl:'https://api.openai.com/v1'},messages,tools);
  assert.equal(openai.response_format.type,'json_schema');assert.equal(openai.tools[0].function.name,'x');assert.equal(openai.tools[0].function.strict,true);
  const claude=providerRequest({provider:'anthropic',model:'claude-test',baseUrl:'https://api.anthropic.com/v1'},messages,tools);
  assert.equal(claude.response_format,undefined);assert.equal(inferProvider('https://openrouter.ai/api/v1'),'openrouter');
});
