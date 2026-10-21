// Local stand-in for POST /v1/messages, used only to test faro-server without real credentials.
// Streams a canned answer in the documented SSE format and logs each request to fake-anthropic.log.
// Message containing "REFUSE" -> stop_reason "refusal"; containing "RATE" -> HTTP 429.
// node fake-anthropic.cjs [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2] || 5199);
const logFile = path.join(__dirname, 'fake-anthropic.log');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', async () => {
    const body = JSON.parse(raw || '{}');
    const last = (body.messages || []).at(-1);
    fs.appendFileSync(logFile, JSON.stringify({
      path: req.url,
      beta: req.headers['anthropic-beta'],
      hasKey: Boolean(req.headers['x-api-key']),
      model: body.model,
      stream: body.stream,
      max_tokens: body.max_tokens,
      fallbacks: body.fallbacks,
      output_config: body.output_config,
      system_chars: (body.system || []).map((b) => b.text.length),
      system_cache: (body.system || []).map((b) => b.cache_control && b.cache_control.type),
      roles: (body.messages || []).map((m) => m.role),
      last_user: last && last.content,
    }) + '\n');

    if (last && String(last.content).includes('RATE')) {
      res.writeHead(429, { 'Content-Type': 'application/json', 'retry-after': '0' });
      res.end(JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'fake rate limit' } }));
      return;
    }

    const refuse = last && String(last.content).includes('REFUSE');
    const parts = refuse ? [] : ['El **PER** compara ', 'el precio con el beneficio.\n\n', '- Fórmula: precio / BPA\n', '- Mira el [glosario](/glosario.html#per)'];
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    send('message_start', { type: 'message_start', message: { id: 'msg_fake', type: 'message', role: 'assistant', model: body.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } });
    if (!refuse) {
      send('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
      for (const p of parts) {
        await sleep(120);
        send('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: p } });
      }
      send('content_block_stop', { type: 'content_block_stop', index: 0 });
    }
    send('message_delta', { type: 'message_delta', delta: { stop_reason: refuse ? 'refusal' : 'end_turn', stop_sequence: null }, usage: { output_tokens: 20 } });
    send('message_stop', { type: 'message_stop' });
    res.end();
  });
}).listen(port, '127.0.0.1', () => console.log(`fake Anthropic API on http://127.0.0.1:${port}`));
