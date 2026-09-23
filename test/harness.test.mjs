import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Store, publicPaper } from '../lib/store.mjs';
import { Harness, evidenceFor, validateCitations } from '../lib/harness.mjs';
import { DemoBridge, DemoProvider } from '../lib/demo.mjs';
import { Provider, baseURL } from '../lib/provider.mjs';
import { createApp } from '../server.mjs';
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
test('fabricated citations and tools outside the scope are rejected without accepting notes',async t=>{
  const {store,harness}=await fixture(t,{async complete(){return {tokens:1,message:{content:JSON.stringify({answer:'A made-up claim [E0000000000000000]',memory:'bad',card:null})}};}});
  await harness.start('DEMO0001',{question:'A question',page:1});
  let paper=await finished(harness,store); assert.equal(paper.job.status,'failed'); assert.equal(paper.messages.length,0); assert.equal(paper.memory,'');
  harness.provider={async complete(){return {tokens:1,message:{tool_calls:[{id:'x',type:'function',function:{name:'delete_item',arguments:'{}'}}]}};}};
  await harness.start('DEMO0001',{question:'Try again',page:1});
  paper=await finished(harness,store); assert.equal(paper.job.status,'failed'); assert.match(paper.job.step,/outside/); assert.equal(paper.cards.length,0);
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
