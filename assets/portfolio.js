import { db } from './db.js';
import { esc, embedHtml, renderMarkdown } from './content.js';

const STATUS_LABEL = { in_progress: 'In development', live: 'Live', paused: 'Paused', archived: 'Archived' };

// Turns DD-MM-YYYY (older posts) and YYYY-MM-DD (new posts) into sortable ISO text.
export function sortKey(date) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (date || '');
}

export function displayDate(date) {
  const d = new Date(`${sortKey(date)}T00:00:00`);
  return isNaN(d) ? (date || '') : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export async function fetchProjects(section) {
  const { data, error } = await db
    .from('projects')
    .select('*')
    .eq('section', section)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function projectCard(p) {
  const media = p.video_url
    ? `<div class="video-wrap">${embedHtml(p.video_url)}</div>`
    : p.cover_url ? `<img class="cover" src="${esc(p.cover_url)}" alt="">` : '';
  const links = (p.links || [])
    .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`)
    .join('');
  const tags = (p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  return `
    <div class="card" id="${esc(p.slug)}">
      <div class="meta">${esc(p.kicker || STATUS_LABEL[p.status] || '')}</div>
      <h3>${esc(p.title)}</h3>
      ${p.summary ? `<p>${esc(p.summary)}</p>` : ''}
      ${media}
      ${p.body ? `<div class="prose-inline">${renderMarkdown(p.body)}</div>` : ''}
      ${links ? `<div class="links">${links}</div>` : ''}
      ${tags ? `<div class="tags">${tags}</div>` : ''}
    </div>`;
}

// Fills `el` with the published projects of one section. Hides the wrapper if asked and empty.
export async function renderSection(el, section, { hideWhenEmpty = false, emptyText = '' } = {}) {
  const wrap = el.closest('[data-section-wrap]') || el;
  try {
    const list = await fetchProjects(section);
    if (!list.length) {
      if (hideWhenEmpty) wrap.hidden = true;
      else el.innerHTML = `<p class="muted">${esc(emptyText)}</p>`;
      return;
    }
    wrap.hidden = false;
    el.innerHTML = list.map(projectCard).join('');
  } catch {
    el.innerHTML = '<p class="muted">Could not load this section right now.</p>';
  }
}

export async function fetchPosts() {
  const { data, error } = await db
    .from('blog_posts')
    .select('slug, title, post_date, summary')
    .eq('published', true);
  if (error) throw error;
  return (data ?? []).map((p) => ({ slug: p.slug, title: p.title, date: p.post_date, summary: p.summary }));
}

export async function fetchPost(slug) {
  const { data, error } = await db
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}
