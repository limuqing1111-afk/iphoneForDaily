import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { checkSite } from '../scripts/check.mjs';

async function site(catalog, html = '<h1>页面</h1>') {
  const root = await mkdtemp(path.join(tmpdir(), 'quick-check-'));
  await writeFile(path.join(root, 'content.json'), `${JSON.stringify(catalog)}\n`);
  if (catalog[0]?.slug) {
    const pageDir = path.join(root, 'pages', catalog[0].slug);
    await mkdir(pageDir, { recursive: true });
    await writeFile(path.join(pageDir, 'index.html'), html);
  }
  return root;
}

const entry = { title: '训练', category: '健康', slug: 'training', path: 'pages/training/', updatedAt: '2026-09-05T00:00:00.000Z' };

test('accepts a valid catalog and page', async () => {
  const root = await site([entry]);
  assert.deepEqual(await checkSite(root), []);
});

test('reports duplicate slugs', async () => {
  const root = await site([entry, { ...entry, title: '重复' }]);
  assert.ok((await checkSite(root)).some((error) => error.includes('重复 slug')));
});

test('reports missing page files', async () => {
  const root = await site([]);
  await writeFile(path.join(root, 'content.json'), `${JSON.stringify([entry])}\n`);
  assert.ok((await checkSite(root)).some((error) => error.includes('页面不存在')));
});

test('reports malformed catalog entries', async () => {
  const root = await site([{ slug: 'broken' }]);
  assert.ok((await checkSite(root)).some((error) => error.includes('字段无效')));
});

test('reports missing local resources referenced by a page', async () => {
  const root = await site([entry], '<img src="assets/missing.png">');
  assert.ok((await checkSite(root)).some((error) => error.includes('资源不存在')));
});
