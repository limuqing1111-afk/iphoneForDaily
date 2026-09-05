export function filterEntries(entries, query) {
  const needle = query.trim().toLocaleLowerCase('zh-CN');
  if (!needle) return entries;
  return entries.filter((entry) => `${entry.title} ${entry.category}`.toLocaleLowerCase('zh-CN').includes(needle));
}

export function groupEntries(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const category = entry.category || '其他';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(entry);
  }
  return groups;
}

const palette = ['#e7f0ff', '#e7f7ed', '#fff1dc', '#f1eafd', '#ffe9ed', '#e8f6f7'];

function formatDate(value) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function recentLink(entry) {
  const link = document.createElement('a');
  link.className = 'recent-item';
  link.href = entry.path;
  const main = document.createElement('div');
  main.className = 'recent-main';
  const title = document.createElement('p');
  title.className = 'recent-title';
  title.textContent = entry.title;
  const meta = document.createElement('p');
  meta.className = 'recent-meta';
  meta.textContent = `${entry.category} · ${formatDate(entry.updatedAt)}更新`;
  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.textContent = '›';
  arrow.setAttribute('aria-hidden', 'true');
  main.append(title, meta);
  link.append(main, arrow);
  return link;
}

function startApp() {
  const categoryRoot = document.querySelector('#categories');
  const recentRoot = document.querySelector('#recent');
  const search = document.querySelector('#search');
  const count = document.querySelector('#count');
  const empty = document.querySelector('#empty');
  const error = document.querySelector('#error');
  const showAll = document.querySelector('#show-all');
  let entries = [];
  let selectedCategory = '';

  function render() {
    const searched = filterEntries(entries, search.value);
    const visible = selectedCategory ? searched.filter((entry) => entry.category === selectedCategory) : searched;
    categoryRoot.replaceChildren();
    recentRoot.replaceChildren();

    for (const [category, items] of groupEntries(entries)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `category-card${selectedCategory === category ? ' selected' : ''}`;
      button.style.setProperty('--card-color', palette[categoryRoot.children.length % palette.length]);
      const label = document.createElement('strong');
      label.textContent = category;
      const amount = document.createElement('span');
      amount.textContent = `${items.length} 份内容`;
      button.append(label, amount);
      button.addEventListener('click', () => {
        selectedCategory = selectedCategory === category ? '' : category;
        render();
      });
      categoryRoot.append(button);
    }

    visible.slice(0, selectedCategory || search.value ? 50 : 8).forEach((entry) => recentRoot.append(recentLink(entry)));
    empty.hidden = visible.length !== 0;
    showAll.hidden = !selectedCategory;
    count.textContent = `共 ${entries.length} 份内容`;
  }

  search.addEventListener('input', render);
  showAll.addEventListener('click', () => {
    selectedCategory = '';
    render();
  });

  fetch('content.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((catalog) => {
      entries = catalog;
      render();
    })
    .catch(() => {
      count.textContent = '内容读取失败';
      error.hidden = false;
    });
}

if (typeof document !== 'undefined') startApp();
