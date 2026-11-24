import { db } from './db.js';
import { esc, renderMarkdown, parseLinks } from './content.js';

const app = document.getElementById('app');
const TABLES = { projects: 'projects', posts: 'blog_posts' };
const STATUS_LABEL = { live: 'Live', in_progress: 'In development', paused: 'Paused', archived: 'Archived' };
const SECTION_LABEL = { portfolio: 'Finished projects', current: 'Currently working on' };
const SLUG_RE = /^[a-z0-9-]{1,80}$/;
const state = { tab: 'projects', rows: [], editingId: null, user: null };

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const today = () => new Date().toISOString().slice(0, 10);
const options = (values, selected, labels = {}) =>
  values.map((v) => `<option value="${v}" ${v === selected ? 'selected' : ''}>${esc(labels[v] || v)}</option>`).join('');

init();

async function init() {
  const { data } = await db.auth.getSession();
  state.user = data.session?.user ?? null;
  db.auth.onAuthStateChange((_event, session) => {
    const next = session?.user ?? null;
    if ((next?.id ?? null) !== (state.user?.id ?? null)) {
      state.user = next;
      boot();
    }
  });
  boot();
}

async function boot() {
  if (!state.user) return renderSignIn();
  const { data, error } = await db.from('admins').select('user_id').eq('user_id', state.user.id).maybeSingle();
  if (error) return renderMessage(`Could not check admin access: ${error.message}`, true);
  if (!data) return renderMessage('This Google account does not have admin access.', true);
  renderShell();
  await loadRows();
}

function renderSignIn() {
  app.innerHTML = `
    <div class="panel">
      <h1>Admin</h1>
      <p class="muted" style="margin:10px 0 18px">Sign in with the Google account that manages this portfolio.</p>
      <button id="signin">Sign in with Google</button>
    </div>`;
  document.getElementById('signin').onclick = () =>
    db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] } });
}

function renderMessage(text, isError) {
  app.innerHTML = `
    <div class="panel">
      <p class="${isError ? 'error' : 'muted'}">${esc(text)}</p>
      ${state.user ? '<p style="margin-top:14px"><button id="signout" class="ghost">Sign out</button></p>' : ''}
    </div>`;
  wireSignOut();
}

function wireSignOut() {
  const button = document.getElementById('signout');
  if (button) button.onclick = () => db.auth.signOut();
}

function renderShell() {
  app.innerHTML = `
    <div class="bar">
      <div class="tabs">
        <button data-tab="projects">Projects</button>
        <button data-tab="posts">Blog posts</button>
      </div>
      <button id="signout" class="ghost">Sign out</button>
    </div>
    <div id="status"></div>
    <div id="content"></div>`;
  app.querySelectorAll('[data-tab]').forEach((b) => {
    b.onclick = () => {
      state.tab = b.dataset.tab;
      state.editingId = null;
      loadRows();
    };
  });
  wireSignOut();
}

function syncTabs() {
  app.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));
}

function setStatus(text, isError = false) {
  const el = document.getElementById('status');
  if (el) el.innerHTML = text ? `<p class="${isError ? 'error' : 'ok'}">${esc(text)}</p>` : '';
}

function setContent(html) {
  document.getElementById('content').innerHTML = html;
}

async function loadRows() {
  syncTabs();
  const query = db.from(TABLES[state.tab]).select('*');
  const { data, error } = state.tab === 'projects'
    ? await query.order('sort_order', { ascending: true }).order('created_at', { ascending: false })
    : await query.order('post_date', { ascending: false });
  if (error) return setStatus(error.message, true);
  state.rows = data ?? [];
  renderList();
}

function publicHref(row) {
  return state.tab === 'projects' ? `projects.html#${row.slug}` : `blog/post.html?slug=${row.slug}`;
}

function renderList() {
  const isProjects = state.tab === 'projects';
  const rows = state.rows.map((r) => `
    <div class="row">
      <div>
        <strong>${esc(r.title)}</strong><br>
        <span class="muted">${esc(isProjects ? `${SECTION_LABEL[r.section]} · ${STATUS_LABEL[r.status]}` : r.post_date)} · ${r.published ? 'published' : 'hidden'}</span>
      </div>
      <div class="row-actions">
        <a href="${esc(publicHref(r))}" target="_blank" rel="noopener">View ↗</a>
        <button class="ghost" data-edit="${r.id}">Edit</button>
        <button class="danger" data-delete="${r.id}">Delete</button>
      </div>
    </div>`).join('') || '<p class="muted">Nothing here yet.</p>';

  setContent(`
    <div class="bar"><span></span><button id="new">New ${isProjects ? 'project' : 'post'}</button></div>
    ${rows}`);
  document.getElementById('new').onclick = () => renderForm(null);
  document.querySelectorAll('[data-edit]').forEach((b) =>
    b.onclick = () => renderForm(state.rows.find((r) => r.id === b.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach((b) =>
    b.onclick = () => remove(b.dataset.delete));
}

async function remove(id) {
  const row = state.rows.find((r) => r.id === id);
  if (!row || !confirm(`Delete "${row.title}"? This can't be undone.`)) return;
  const { error } = await db.from(TABLES[state.tab]).delete().eq('id', id);
  if (error) return setStatus(error.message, true);
  setStatus('Deleted.');
  loadRows();
}

function renderForm(row) {
  state.editingId = row?.id ?? null;
  const isProjects = state.tab === 'projects';
  const v = (key, fallback = '') => esc(row?.[key] ?? fallback);
  const published = row ? row.published : true;
  const linkText = (row?.links || []).map((l) => `${l.label} | ${l.url}`).join('\n');
  const tagText = (row?.tags || []).join(', ');

  const projectFields = `
    <div class="grid2">
      <label>Section<select name="section">${options(['portfolio', 'current'], row?.section ?? 'portfolio', SECTION_LABEL)}</select></label>
      <label>Status<select name="status">${options(['live', 'in_progress', 'paused', 'archived'], row?.status ?? 'live', STATUS_LABEL)}</select></label>
      <label>Small label above the title<input name="kicker" value="${v('kicker')}" placeholder="e.g. IN DEVELOPMENT · UNITY"></label>
      <label>Sort order (lower shows first)<input name="sort_order" type="number" value="${v('sort_order', 0)}"></label>
    </div>
    <label>Video (YouTube link, or a file path such as assets/videos/clip.mp4)<input name="video_url" value="${v('video_url')}"></label>
    <label>Links, one per line as "Label | https://…"<textarea name="links" rows="3">${esc(linkText)}</textarea></label>
    <label>Tags, comma separated<input name="tags" value="${esc(tagText)}"></label>`;

  const postFields = `
    <label>Date<input name="post_date" type="date" value="${v('post_date', today())}"></label>`;

  setContent(`
    <form id="editor" class="panel">
      <h2 style="margin-top:0;border:none;padding:0">${state.editingId ? 'Edit' : 'New'} ${isProjects ? 'project' : 'post'}</h2>
      <div class="grid2">
        <label>Title<input name="title" required maxlength="160" value="${v('title')}"></label>
        <label>URL slug (optional, made from the title if empty)<input name="slug" maxlength="80" value="${v('slug')}"></label>
      </div>
      ${isProjects ? projectFields : postFields}
      <label>Summary<textarea name="summary" rows="2">${v('summary')}</textarea></label>
      <div class="body-grid">
        <label>Body (Markdown)<textarea name="body" rows="14">${v('body')}</textarea></label>
        <div>
          <div class="muted" style="font-size:12px;margin-bottom:4px">Preview</div>
          <div class="preview" id="preview"></div>
        </div>
      </div>
      <div class="grid2">
        <label>Cover image URL<input name="cover_url" value="${v('cover_url')}"></label>
        <label>…or upload one (max 5 MB)<input name="cover_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label>
      </div>
      <label class="checkbox"><input type="checkbox" name="published" ${published ? 'checked' : ''}> Published</label>
      <div class="row-actions" style="margin-top:16px">
        <button type="submit">Save</button>
        <button type="button" class="ghost" id="cancel">Cancel</button>
      </div>
    </form>`);

  const body = document.querySelector('[name=body]');
  const preview = document.getElementById('preview');
  const update = () => { preview.innerHTML = renderMarkdown(body.value); };
  body.oninput = update;
  update();

  document.getElementById('cancel').onclick = () => { state.editingId = null; loadRows(); };
  document.getElementById('editor').onsubmit = (e) => {
    e.preventDefault();
    save(e.currentTarget);
  };
}

async function uploadCover(file) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const path = `covers/${Date.now()}-${safeName}`;
  const { error } = await db.storage.from('portfolio').upload(path, file, { contentType: file.type });
  if (error) throw error;
  return db.storage.from('portfolio').getPublicUrl(path).data.publicUrl;
}

async function save(form) {
  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  setStatus('Saving…');
  try {
    const get = (name) => (form.elements[name]?.value ?? '').trim();
    const title = get('title');
    if (!title) throw new Error('Title is required.');
    const slug = slugify(get('slug') || title);
    if (!SLUG_RE.test(slug)) throw new Error('The URL slug can only contain lowercase letters, numbers and hyphens.');

    let coverUrl = get('cover_url');
    const file = form.elements.cover_file?.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) throw new Error('The cover image must be 5 MB or smaller.');
      coverUrl = await uploadCover(file);
    }

    const common = {
      title,
      slug,
      summary: get('summary') || null,
      body: form.elements.body.value.trim() || null,
      cover_url: coverUrl || null,
      published: form.elements.published.checked,
    };
    const row = state.tab === 'projects'
      ? {
          ...common,
          section: get('section'),
          status: get('status'),
          kicker: get('kicker') || null,
          video_url: get('video_url') || null,
          links: parseLinks(get('links')),
          tags: get('tags').split(',').map((t) => t.trim()).filter(Boolean),
          sort_order: Number(get('sort_order')) || 0,
        }
      : { ...common, post_date: get('post_date') || today() };

    const table = TABLES[state.tab];
    const { error } = state.editingId
      ? await db.from(table).update(row).eq('id', state.editingId)
      : await db.from(table).insert(row);
    if (error) throw error;

    state.editingId = null;
    await loadRows();
    setStatus('Saved.');
  } catch (err) {
    const message = err.code === '23505' ? 'That URL slug is already used. Choose another.' : err.message;
    setStatus(message, true);
    button.disabled = false;
  }
}
