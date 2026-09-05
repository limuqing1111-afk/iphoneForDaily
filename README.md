# 手机速查

这是 Eric 的 HTML 手机发布库。原始文件保留在各自项目，本库只保存供 GitHub Pages 展示的发布副本。

## 日常使用

向 Codex 明确说明：

> 把这个 HTML 发布到手机速查，标题为“……”，分类沿用现有分类。

Codex 应完成复制、目录更新、检查、提交和推送；未明确要求“发布”时，不对外推送。

## 本地命令

准备或更新页面：

```bash
node scripts/publish.mjs "/绝对路径/原文件.html" --title "页面标题" --category "分类" --slug "stable-english-slug"
```

发布前检查：

```bash
node scripts/check.mjs
node --test
```

`slug` 首次确定后应保持不变。删除页面需要单独、明确的指令。

## iPhone

GitHub Pages 上线后，用 Safari 打开首页，点“分享”→“添加到主屏幕”。以后只需点击“手机速查”图标。
