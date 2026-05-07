#!/usr/bin/env node
require('dotenv').config();
const { spawn } = require('child_process');
const http = require('http');

// comparison.cjs will derive metrics from titles, so no local parsing required here

const PORT = process.env.PORT || 3000;
// Spawn the server using the local `node_modules/.bin/tsx` so TypeScript files load
const path = require('path');
const localTsx = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
const SERVER_CMD = localTsx;
const SERVER_ARGS = ['src/backend/server.cjs'];

function waitForServerReady(proc, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout waiting for server start'));
    }, timeout);

    proc.stdout.on('data', (data) => {
      const s = data.toString();
      if (s.includes('Server is running')) {
        clearTimeout(timer);
        resolve();
      }
    });

    proc.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Server exited early with code ${code}`));
    });
  });
}

async function fetchPrices(product, zip, maxRetries = 3) {
  const url = `http://localhost:${PORT}/api/prices?product=${encodeURIComponent(product)}${zip ? `&zipCode=${encodeURIComponent(zip)}` : ''}`;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const req = http.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (e) {
              reject(e);
            }
          });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });
    } catch (err) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  if (!process.env.SERPAPI_KEY) {
    console.error('SERPAPI_KEY not set in environment.');
    process.exit(1);
  }

  const serverProc = spawn(SERVER_CMD, SERVER_ARGS, {
    env: { ...process.env, NODE_ENV: 'test', PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProc.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  serverProc.stderr.on('data', (d) => process.stderr.write(`[server-err] ${d}`));

  try {
    await waitForServerReady(serverProc, 20000);
    // Give server a moment to stabilize
    await new Promise(r => setTimeout(r, 1000));
    
    // Hadley, MA ZIP
    const zip = '01035';
    console.log(`\nRequesting prices for Hadley, MA (${zip})...`);
    const res = await fetchPrices('Driscoll Strawberries', zip);
    const items = (res && res.data) || [];
    console.log(`Fetched ${items.length} items from server\n`);
    // Prepare to call comparison module which will derive metrics from titles itself
    const { getBestItems } = require('../comparison.cjs');

    // Ensure each item has a product_id, and ensure price extracted
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (!item.product_id) item.product_id = String(idx);
      if (!item.extracted_price) {
        const priceField = item.price || item.product_price || item.inline_price || item.lprice || item.price_string || '';
        if (typeof priceField === 'string' && priceField.length > 0) {
          const numStr = priceField.replace(/[^\d.]/g, '');
          const price = parseFloat(numStr);
          if (!Number.isNaN(price)) item.extracted_price = price;
        }
      }
    }

    // Prepare fake express req/res to use getBestItems for 'unit price'
    const fakeReq = { query: { criteria: 'unit price', k: String(items.length) } };
    const fakeRes = {
      json: (d) => { console.log('\nComparison (unit price) result:'); console.log(JSON.stringify(d, null, 2)); },
      status: (code) => ({ json: (obj) => console.error('Error', code, obj) })
    };

    getBestItems(items, fakeReq, fakeRes, [], {});
  } catch (err) {
    console.error('Error during fetch/parse:', err);
  } finally {
    serverProc.kill();
    // Allow a brief moment for output to flush before exiting
    await new Promise(resolve => setTimeout(resolve, 100));
    process.exit(0);
  }
}

main();
