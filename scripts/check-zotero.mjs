import { ZoteroBridge } from '../lib/zotero.mjs';
const bridge = new ZoteroBridge();
try {
  console.log('MCP read tools:', await bridge.connect());
  console.log('MCP connection succeeded; no library writes were requested.');
  if (process.argv[2] === '--search') {
    const text = await bridge.search(process.argv[3] || 'learning');
    const keys = [...text.matchAll(/\*\*Item Key:\*\*\s*([A-Z0-9]{8})/g)].map(match => match[1]);
    console.log(`Search completed: ${keys.length} item keys returned.`);
    if (keys.length) {
      const data = await bridge.metadata(keys[0]);
      console.log(`Metadata read succeeded (${data.type}).`);
      try { const page = await bridge.page(keys[0], 1); console.log(`Page read succeeded: ${page.text.length} characters, ${page.totalPages} total pages.`); }
      catch (error) { console.log(`Attachment read: ${error.message}`); }
    }
  } else if (process.argv[2]) console.log(await bridge.metadata(process.argv[2]));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await bridge.close(); }
