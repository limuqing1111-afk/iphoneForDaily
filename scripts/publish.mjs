import { access, copyFile, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCAL_REF_RE = /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;

function isExternal(ref) {
  return /^(?:[a-z]+:|\/\/|#)/i.test(ref) || ref.startsWith('data:');
}

function normalizeSlug(value) {
  const slug = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) throw new Error('slug 必须包含英文字母或数字');
  return slug;
}

function findLocalRefs(html) {
  const refs = new Set();
  for (const match of html.matchAll(LOCAL_REF_RE)) {
    const raw = match[1].trim();
    if (!raw || isExternal(raw)) continue;
    const clean = decodeURIComponent(raw.split(/[?#]/, 1)[0]);
    if (clean) refs.add(clean);
  }
  return [...refs];
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export async function publishPage({ source, siteRoot, title, category = '其他', slug, now = new Date().toISOString() }) {
  const sourcePath = path.resolve(source);
  const root = path.resolve(siteRoot);
  if (!(await exists(sourcePath)) || !(await stat(sourcePath)).isFile() || path.extname(sourcePath).toLowerCase() !== '.html') {
    throw new Error(`源 HTML 不存在或格式不正确：${sourcePath}`);
  }

  const sourceDir = path.dirname(sourcePath);
  const finalSlug = normalizeSlug(slug || path.basename(sourcePath));
  const outputDir = path.join(root, 'pages', finalSlug);
  const html = await readFile(sourcePath, 'utf8');
  const refs = findLocalRefs(html);

  for (const ref of refs) {
    const dependency = path.resolve(sourceDir, ref);
    const relative = path.relative(sourceDir, dependency);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`本地资源超出源文件目录：${ref}`);
    }
    if (!(await exists(dependency)) || !(await stat(dependency)).isFile()) {
      throw new Error(`本地资源不存在：${ref}`);
    }
  }

  const catalogPath = path.join(root, 'content.json');
  const catalog = JSON.parse((await exists(catalogPath)) ? await readFile(catalogPath, 'utf8') : '[]');
  const existingIndex = catalog.findIndex((entry) => entry.slug === finalSlug);

  await mkdir(outputDir, { recursive: true });
  await copyFile(sourcePath, path.join(outputDir, 'index.html'));
  for (const ref of refs) {
    const dependency = path.resolve(sourceDir, ref);
    const destination = path.join(outputDir, path.relative(sourceDir, dependency));
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(dependency, destination);
  }

  const entry = {
    title: title?.trim() || finalSlug,
    category: category?.trim() || '其他',
    slug: finalSlug,
    path: `pages/${finalSlug}/`,
    updatedAt: now,
  };
  if (existingIndex >= 0) catalog[existingIndex] = entry;
  else catalog.push(entry);
  catalog.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  await mkdir(root, { recursive: true });
  const temporaryCatalog = `${catalogPath}.tmp`;
  await writeFile(temporaryCatalog, `${JSON.stringify(catalog, null, 2)}\n`);
  await rename(temporaryCatalog, catalogPath);

  return { slug: finalSlug, path: entry.path, created: existingIndex < 0 };
}

function parseArgs(argv) {
  const options = { source: argv[0], siteRoot: process.cwd() };
  for (let index = 1; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!value) throw new Error(`参数缺少值：${key}`);
    if (key === '--title') options.title = value;
    else if (key === '--category') options.category = value;
    else if (key === '--slug') options.slug = value;
    else if (key === '--site-root') options.siteRoot = value;
    else throw new Error(`未知参数：${key}`);
  }
  if (!options.source) throw new Error('用法：node scripts/publish.mjs <源HTML> --title <标题> --category <分类> --slug <固定地址>');
  return options;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const result = await publishPage(parseArgs(process.argv.slice(2)));
    console.log(`已准备：${result.path}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
