# Portfolio: G. Sujeeth Madhav

Static site for GitHub Pages. No build step.

## Structure

- `index.html`: home page
- `projects.html`: project details
- `3d-work.html`: 3D modeling and animation
- `blog/index.html`: blog list
- `blog/post.html?slug=...`: single post viewer
- `blog/posts/index.json`: post list (title, date, summary, slug, draft)
- `blog/posts/<slug>.md`: post content in Markdown
- `assets/`: stylesheet and small script

## Before publishing

Search for `[` and `todo` in the files and fill in the placeholders:
- YouTube and Instagram links (`3d-work.html`)
- GitHub repo links for each project (`projects.html`)
- Anything marked `[confirm]`

## Adding a blog post

1. Create `blog/posts/your-slug.md` and write the post in Markdown.
2. Add an entry to `blog/posts/index.json`:
   `{"slug": "your-slug", "title": "...", "date": "YYYY-MM-DD", "summary": "...", "draft": false}`
3. Commit and push. GitHub Pages updates in about a minute.

Set `"draft": true` to hide a post while you're still writing it.

## Testing locally

Browsers block `fetch` from `file://`, so run a local server from this folder:

    python -m http.server 8000

Then open http://localhost:8000.

## Deploying

Push this folder's contents to a repository (for example `yourusername.github.io`), then in Settings → Pages set the source to the `main` branch, root folder.
