# Mobile Quick Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish an iPhone-friendly static HTML library with stable per-page links and a low-friction Codex publishing command.

**Architecture:** A dependency-free static homepage renders `content.json`; a Node script copies source HTML and safe relative dependencies into stable slug directories. A separate checker validates the catalog and asset references before Git commit and GitHub Pages publication.

**Tech Stack:** HTML5, CSS, browser JavaScript, Node.js built-in modules, Node test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-05-mobile-quick-reference-design.md`

## Global Constraints

- Original HTML stays in its source project; this repository stores publication copies only.
- Existing entries keep their slug and overwrite the current copy.
- No framework, package installation, database, or external CDN.
- Copy only local dependencies that resolve inside the source HTML directory.
- Publishing to GitHub occurs only after an explicit user publishing instruction.

---

### Task 1: Catalog publishing core

**Files:**
- Create: `scripts/publish.mjs`
- Create: `tests/publish.test.mjs`
- Create: `content.json`

**Interfaces:**
- Consumes: CLI arguments `source`, `--title`, `--category`, and `--slug`.
- Produces: `publishPage(options) -> Promise<{slug, path, created}>` and a normalized `content.json` entry.

- [ ] Write Node tests using temporary source and destination directories for new publication, same-slug replacement, missing source, unsafe dependency, and missing dependency.
- [ ] Run `node --test tests/publish.test.mjs`; confirm the tests fail because the module does not exist.
- [ ] Implement argument parsing, slug normalization, HTML dependency discovery, safe copying, stable-entry replacement, and atomic catalog writing using Node built-ins.
- [ ] Run `node --test tests/publish.test.mjs`; expect all tests to pass.
- [ ] Commit the publishing core.

### Task 2: Catalog and asset validator

**Files:**
- Create: `scripts/check.mjs`
- Create: `tests/check.test.mjs`

**Interfaces:**
- Consumes: repository root and `content.json`.
- Produces: `checkSite(root) -> Promise<string[]>`, returning human-readable errors; CLI exits nonzero when errors exist.

- [ ] Write tests for a valid site, duplicate slugs, missing page files, malformed catalog records, and missing local HTML resources.
- [ ] Run `node --test tests/check.test.mjs`; confirm module-not-found failure.
- [ ] Implement catalog schema checks and local `src`/`href` resource validation, excluding anchors, data URLs, mail, telephone, and HTTP(S) links.
- [ ] Run `node --test tests/check.test.mjs`; expect all tests to pass.
- [ ] Commit the validator.

### Task 3: Mobile homepage

**Files:**
- Create: `index.html`
- Create: `assets/site.css`
- Create: `assets/site.js`
- Create: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `content.json` entries with `title`, `category`, `slug`, `path`, and `updatedAt`.
- Produces: searchable category cards, category result lists, and recent-update links.

- [ ] Write structural tests that require viewport metadata, local CSS/JS, search control, category container, recent container, and a valid catalog fetch.
- [ ] Run `node --test tests/site.test.mjs`; confirm missing-file failures.
- [ ] Implement semantic HTML, iPhone safe-area CSS, accessible controls, category cards, client-side search, empty states, and recent updates without external assets.
- [ ] Run `node --test tests/site.test.mjs`; expect all tests to pass.
- [ ] Commit the mobile homepage.

### Task 4: End-to-end example and operator guidance

**Files:**
- Create: `examples/welcome.html`
- Create: `README.md`
- Modify: `content.json`
- Create: `.gitignore`

**Interfaces:**
- Consumes: the publish and check CLIs.
- Produces: one real catalog entry plus concise generation, update, validation, and publication commands.

- [ ] Publish the welcome example through `scripts/publish.mjs` rather than copying by hand.
- [ ] Run `node scripts/check.mjs` and the full `node --test`; expect success.
- [ ] Start a local static server and verify the homepage and `/pages/welcome/` return HTTP 200.
- [ ] Document the explicit phrase-driven workflow and add `.superpowers/` to `.gitignore`.
- [ ] Commit the usable local site.

### Task 5: GitHub Pages publication

**Files:**
- Modify: `README.md` to record the confirmed final public URL.

**Interfaces:**
- Consumes: the verified local Git repository and the user's existing GitHub browser session.
- Produces: a public GitHub repository, enabled Pages deployment, stable homepage URL, and stable example URL.

- [ ] Initialize Git with branch `main` if it is not already a repository.
- [ ] Create a public GitHub repository with a concise, non-sensitive name through the authenticated browser session.
- [ ] Add the remote and push `main`.
- [ ] Enable Pages from the `main` branch repository root.
- [ ] Poll the published homepage and example URL until both return successfully, then report the exact links.
