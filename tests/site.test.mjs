import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { filterEntries, groupEntries } from '../assets/site.js';

test('homepage has iPhone viewport, local assets, search, categories, and recent content', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /name="viewport"/);
  assert.match(html, /assets\/site\.css/);
  assert.match(html, /assets\/site\.js/);
  assert.match(html, /id="search"/);
  assert.match(html, /id="categories"/);
  assert.match(html, /id="recent"/);
});

test('catalog script fetches the local content catalog', async () => {
  const script = await readFile(new URL('../assets/site.js', import.meta.url), 'utf8');
  assert.match(script, /fetch\(['"]content\.json['"]/);
});

test('filters titles and categories case-insensitively', () => {
  const entries = [
    { title: 'AI 产品面试', category: '工作' },
    { title: '公寓健身计划', category: '健康' },
  ];
  assert.deepEqual(filterEntries(entries, 'ai'), [entries[0]]);
  assert.deepEqual(filterEntries(entries, '健康'), [entries[1]]);
});

test('groups entries by category and preserves first-seen order', () => {
  const entries = [
    { title: 'A', category: '工作' },
    { title: 'B', category: '健康' },
    { title: 'C', category: '工作' },
  ];
  assert.deepEqual([...groupEntries(entries).keys()], ['工作', '健康']);
  assert.equal(groupEntries(entries).get('工作').length, 2);
});
