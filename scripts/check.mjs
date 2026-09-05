import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_FIELDS = ['title', 'category', 'slug', 'path', 'updatedAt'];
const LOCAL_REF_RE = /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function localRefs(html) {
  const refs = [];
  for (const match of html.matchAll(LOCAL_REF_RE)) {
    const ref = match[1].trim();
    if (!ref || /^(?:[a-z]+:|\/\/|#)/i.test(ref) || ref.startsWith('data:')) continue;
    refs.push(decodeURIComponent(ref.split(/[?#]/, 1)[0]));
  }
  return refs.filter(Boolean);
}

export async function checkSite(siteRoot) {
  const root = path.resolve(siteRoot);
  const errors = [];
  let catalog;
  try {
    catalog = JSON.parse(await readFile(path.join(root, 'content.json'), 'utf8'));
  } catch (error) {
    return [`content.json 无法读取：${error.message}`];
  }
  if (!Array.isArray(catalog)) return ['content.json 顶层必须是数组'];

  const seen = new Set();
  for (let index = 0; index < catalog.length; index += 1) {
    const entry = catalog[index];
    const invalid = !entry || typeof entry !== 'object' || REQUIRED_FIELDS.some((field) => typeof entry[field] !== 'string' || !entry[field].trim());
    if (invalid) {
      errors.push(`第 ${index + 1} 条记录字段无效`);
      continue;
    }
    if (seen.has(entry.slug)) errors.push(`重复 slug：${entry.slug}`);
    seen.add(entry.slug);
    if (entry.path !== `pages/${entry.slug}/`) errors.push(`路径与 slug 不一致：${entry.slug}`);
    if (Number.isNaN(Date.parse(entry.updatedAt))) errors.push(`更新时间无效：${entry.slug}`);

    const pageDir = path.join(root, 'pages', entry.slug);
    const page = path.join(pageDir, 'index.html');
    if (!(await exists(page))) {
      errors.push(`页面不存在：${entry.path}index.html`);
      continue;
    }
    const html = await readFile(page, 'utf8');
    for (const ref of localRefs(html)) {
      const resource = path.resolve(pageDir, ref);
      if (!(await exists(resource))) errors.push(`资源不存在：${entry.slug}/${ref}`);
    }
  }
  return errors;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const errors = await checkSite(process.cwd());
  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log('速查库检查通过');
  }
}
