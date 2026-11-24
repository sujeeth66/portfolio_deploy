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


## Admin and database

Projects and blog posts can be added from `/admin.html`, which uses Supabase.

1. Create a Supabase project and run `portfolio_setup.sql` in its SQL Editor.
2. Put the project URL and anon key in `assets/config.js`. The anon key is public; the database rules protect the data.
3. In Supabase, add `https://www.sujeethmadhav.com/admin.html` and `http://localhost:8000/admin.html` to Authentication → URL Configuration → Redirect URLs. Enable the Google provider.
4. Open `/admin.html`, sign in with Google once, then make yourself an admin with the SQL at the end of `portfolio_setup.sql`.

Videos are played from the repo, for example `assets/videos/bixzy.mp4`. Keep video files small, because every change to a file stays in the Git history.
