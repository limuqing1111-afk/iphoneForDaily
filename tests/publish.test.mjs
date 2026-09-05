import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { publishPage } from '../scripts/publish.mjs';

async function fixture(html = '<h1>训练速查</h1>') {
  const base = await mkdtemp(path.join(tmpdir(), 'quick-ref-'));
  const sourceDir = path.join(base, 'source');
  const siteRoot = path.join(base, 'site');
  await mkdir(sourceDir, { recursive: true });
  await mkdir(siteRoot, { recursive: true });
  await writeFile(path.join(siteRoot, 'content.json'), '[]\n');
  const source = path.join(sourceDir, 'guide.html');
  await writeFile(source, html);
  return { base, sourceDir, siteRoot, source };
}

test('publishes an HTML file and its local dependencies', async () => {
  const f = await fixture('<link rel="stylesheet" href="assets/a.css"><img src="assets/p.png"><h1>训练速查</h1>');
  await mkdir(path.join(f.sourceDir, 'assets'));
  await writeFile(path.join(f.sourceDir, 'assets/a.css'), 'body{}');
  await writeFile(path.join(f.sourceDir, 'assets/p.png'), 'image');

  const result = await publishPage({ source: f.source, siteRoot: f.siteRoot, title: '训练速查', category: '健康', slug: 'training' });

  assert.deepEqual(result, { slug: 'training', path: 'pages/training/', created: true });
  assert.equal(await readFile(path.join(f.siteRoot, 'pages/training/assets/a.css'), 'utf8'), 'body{}');
  const catalog = JSON.parse(await readFile(path.join(f.siteRoot, 'content.json'), 'utf8'));
  assert.equal(catalog[0].title, '训练速查');
  assert.equal(catalog[0].path, 'pages/training/');
});

test('replaces an existing slug without duplicating the catalog entry', async () => {
  const f = await fixture('<h1>第一版</h1>');
  await publishPage({ source: f.source, siteRoot: f.siteRoot, title: '计划', category: '健康', slug: 'plan', now: '2026-09-04T00:00:00.000Z' });
  await writeFile(f.source, '<h1>第二版</h1>');

  const result = await publishPage({ source: f.source, siteRoot: f.siteRoot, title: '新计划', category: '健康', slug: 'plan', now: '2026-09-05T00:00:00.000Z' });

  assert.equal(result.created, false);
  assert.match(await readFile(path.join(f.siteRoot, 'pages/plan/index.html'), 'utf8'), /第二版/);
  const catalog = JSON.parse(await readFile(path.join(f.siteRoot, 'content.json'), 'utf8'));
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].title, '新计划');
  assert.equal(catalog[0].updatedAt, '2026-09-05T00:00:00.000Z');
});

test('rejects missing source files', async () => {
  const f = await fixture();
  await assert.rejects(
    publishPage({ source: path.join(f.sourceDir, 'missing.html'), siteRoot: f.siteRoot, title: '缺失', category: '其他', slug: 'missing' }),
    /源 HTML 不存在/
  );
});

test('rejects dependencies outside the source directory', async () => {
  const f = await fixture('<img src="../secret.png">');
  await writeFile(path.join(f.base, 'secret.png'), 'secret');
  await assert.rejects(
    publishPage({ source: f.source, siteRoot: f.siteRoot, title: '不安全', category: '其他', slug: 'unsafe' }),
    /超出源文件目录/
  );
});

test('rejects missing local dependencies', async () => {
  const f = await fixture('<script src="missing.js"></script>');
  await assert.rejects(
    publishPage({ source: f.source, siteRoot: f.siteRoot, title: '缺资源', category: '其他', slug: 'broken' }),
    /本地资源不存在/
  );
});
