import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/+esm';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/+esm';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Markdown to HTML, with unsafe tags and attributes removed.
export function renderMarkdown(md) {
  return DOMPurify.sanitize(marked.parse(md || ''));
}

// YouTube links become a privacy-enhanced embed; .mp4 and .webm files become a player.
export function embedHtml(url) {
  if (!url) return '';
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Video" loading="lazy" allowfullscreen></iframe>`;
  }
  if (/\.(mp4|webm)(\?|$)/i.test(url)) {
    return `<video src="${esc(url)}" controls playsinline preload="metadata"></video>`;
  }
  return '';
}

// Parses "Label | https://url" lines. Only https links and site-relative assets/ paths are kept.
export function parseLinks(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split('|');
      return { label: label.trim(), url: rest.join('|').trim() };
    })
    .filter((l) => l.label && /^(https:\/\/|assets\/)/.test(l.url));
}
