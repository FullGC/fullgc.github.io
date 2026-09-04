# Maintaining fullgc.github.io

Everything you need to run, write for, and publish this blog.

- **Live:** <https://fullgc.github.io>
- **Analytics:** <https://dani-fullgc.goatcounter.com>
- **Comments:** [repo Discussions](https://github.com/FullGC/fullgc.github.io/discussions) (General category)
- **Search Console:** <https://search.google.com/search-console>

---

## 1. Publishing a new post — the short version

```sh
# 1. write it
vim _posts/2026-09-15-my-new-post.md      # see the front matter reference below

# 2. preview it
make serve                                 # → http://localhost:4000

# 3. ship it
git add _posts/2026-09-15-my-new-post.md
git commit -m "Add post: my new post"
git push origin master                     # deploys automatically, ~90s
```

Pushing to `master` triggers `.github/workflows/pages.yml`, which builds with
Jekyll 4.4, runs **html-proofer** over the output, and deploys to GitHub Pages.
**If html-proofer finds a broken link, the deploy fails and the old site stays
up.** Check the [Actions tab](https://github.com/FullGC/fullgc.github.io/actions)
if a push doesn't appear within a couple of minutes.

Then do the [after-publishing checklist](#6-after-publishing-a-post).

---

## 2. Running it locally

**Your system Ruby is 2.6.10, and Jekyll 4.4 needs Ruby ≥ 3.0.** So either use
Docker (no install needed, this is what was used to build the site) or install a
modern Ruby.

### Docker (recommended, zero setup)

```sh
make serve      # live preview at http://localhost:4000, rebuilds on save
make drafts     # same, but also renders _drafts/
make build      # one-off build into _site/
make check      # build + full link check (what CI runs)
```

### Native Ruby, if you prefer

```sh
brew install ruby
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc && exec zsh
bundle install
bundle exec jekyll serve --livereload
```

---

## 3. Front matter reference

Filename must be `_posts/YYYY-MM-DD-some-slug.md`.

```yaml
---
title:       "The headline, written for a search result"   # ≤ 51 chars — see below
description: >-
  One or two sentences. Becomes the meta description AND the excerpt on the
  home page. Keep it under 160 characters. Never omit it.
permalink:   /a-stable-slug/          # NEVER change this after publishing
date:        2026-09-15 10:00:00
tags:        [scala, akka]            # lowercase; each generates /tags/<tag>/
image:       /img/social-card.jpg     # OpenGraph card + the banner under the title
image_w:     1200                     # real pixel width  (for social scrapers)
image_h:     800                      # real pixel height
image_alt:   "Only if the image conveys meaning; omit for mood photos"
---
```

### Rules worth following

| Field | Rule | Why |
|---|---|---|
| `title` | ≤ 51 chars | The theme appends `" \| fullgc"` (9 chars); Google truncates at ~60 |
| `description` | 150–160 chars | Under 150 wastes space, over 160 gets cut mid-sentence |
| `permalink` | set once, never change | Changing it orphans an indexed URL. GitHub Pages cannot issue a real 301 |
| `tags` | reuse existing ones | A tag used by one post gets `noindex` as thin content |
| `image` | ≥ 1200px wide | Below that, social cards look soft. Cap ~1200; don't ship 6000px originals |

Get the real dimensions for `image_w` / `image_h` with:

```sh
sips -g pixelWidth -g pixelHeight img/your-card.jpg
```

---

## 4. Multi-part series

Add three extra fields and the theme does the rest — the home page collapses the
whole series into **one** entry with its parts nested, and each post gets
prev/next navigation within the series.

```yaml
series:     "Tuning Akka for Actor-based Systems"   # identical string on every part
part:       2                                        # 1, 2, 3…
part_title: "Gathering metrics with Kamon"           # short label for the pager
```

`series` must match **character for character** across parts, or they won't group.
Don't repeat "Part N" as a heading inside the body — the breadcrumb and pager
already say it.

---

## 5. Writing the body

### Headings

Start at `##`. The `#` level is the post title, already rendered.

```markdown
## A main section          ← 2–6 of these per post
### A subsection
```

**Never skip a level** (`##` → `####`). Aim for 2–6 `##` sections: they become the
table-of-contents entries and are what Google reads as your document outline.

### Images

Put files in `img/` (site assets) or `public/` (per-post screenshots).

```markdown
![A real description of what the image shows](/img/thing.png)
```

Always write real alt text describing the content. For a decorative mood photo,
use `![](...)` with empty alt rather than inventing a description.
The theme adds lazy loading, borders and click-to-zoom automatically.

### Code

Fenced blocks with a language tag get syntax highlighting, a language label and
a copy button:

````markdown
```scala
val system = ActorSystem("fullgc")
```
````

Blocks break out wider than the text column and scroll horizontally rather than
wrapping, so wide config samples stay readable.

### Linking to your own posts

```markdown
[the stackable traits pattern]({{ '/stackable-traits-pattern/' | relative_url }})
```

Use `relative_url`, never a full `https://fullgc.github.io/...` URL — absolute
self-links break local previews. Aim for 2–3 in-body links to related posts with
descriptive anchor text.

### Drafts

Anything in `_drafts/` (no date in the filename) is excluded from builds.
Preview with `make drafts`. `_drafts/akka.md` is there from 2019.

---

## 6. After publishing a post

### Confirm it shipped

```sh
gh run list --limit 3                    # green?
gh run watch <run-id> --exit-status      # or wait for it
gh run view  <run-id> --log-failed       # if it went red
```

The whole run takes about 90 seconds. **Red is almost always html-proofer finding
a broken internal link** — a typo in a `relative_url`, or an image you referenced
but never committed. The old site stays up, so nothing is on fire, but nothing
new ships until it's fixed.

### Look at the live page, not the local preview

Some things only break in production:

- [ ] **Images all load.** A path that works locally 404s live if the file wasn't
      `git add`ed — untracked files are invisible to the build.
- [ ] **The banner / social image** resolves.
- [ ] **Code blocks** have their language label and copy button.
- [ ] **The table of contents** lists every `##`.
- [ ] **Dark and light both look right.** Toggle it; the two palettes are separate.
- [ ] **Narrow window or phone:** floats unfloat, wide tables scroll instead of
      pushing the page sideways.
- [ ] **The comment box renders** at the bottom.
- [ ] **It's on the home page** — and if it's a series, nested under the series
      entry rather than listed separately.

### Check the social card *before* you share it

Built from `image`, `image_w`, `image_h`. A post with no `image` silently gets a
text-only card, which is easy to ship by accident and impossible to fix in a link
someone already posted.

```sh
curl -s https://fullgc.github.io/your-post/ | grep -E 'og:(image|title|description)'
```

Then run the URL through a validator — each service caches aggressively, so check
before posting, not after:

- <https://www.linkedin.com/post-inspector/>
- Slack or WhatsApp: paste into a message to yourself
- X: post-composer preview

### Search Console — the highest-value step

Without it Google may take weeks. With it, usually a few days.

1. <https://search.google.com/search-console>, property `https://fullgc.github.io/`
2. Paste the post's full URL into the search bar at the top. That *is* URL Inspection.
3. "URL is not on Google" is the expected answer for something new.
4. **Request Indexing**, wait for the live test, confirm.
5. Re-request `/` as well, so the post is reachable from a page Google already crawls often.

Quota is roughly 10–12 URLs a day, so don't request every part of a series at once.
The new part plus the home page is enough; the older parts get re-crawled anyway
because they now link to it.

**The sitemap needs no action.** It is regenerated on every build, already
submitted, and `robots.txt` points at it.

### If it's part of a series

- [ ] The **prev/next pager** on the neighbouring parts now includes it.
- [ ] The **series entry on the home page** shows the right number of parts.
- [ ] **Forward references still point at the right part.** If an earlier post says
      "part five covers X" and you have since inserted a part, that sentence is now
      wrong and nothing will warn you.

### New tags

Every tag generates `/tags/<slug>/`. A tag used by exactly one post is marked
`noindex` as thin content — deliberate, not a bug. If you introduced a new tag,
either reuse it in the next post or accept that its page won't rank.

### A few days later

- **[GoatCounter](https://dani-fullgc.goatcounter.com)** — pageviews, and more
  usefully *referrers*. Referral traffic is what actually moves a new post; search
  takes weeks to build up.
- **Search Console → Performance** — impressions arrive before clicks. Impressions
  with no clicks usually means a weak `title` or `description`. Both are safe to
  rewrite after publishing, unlike `permalink`.

---

## 7. Where things live

| Path | What |
|---|---|
| `_posts/` | Published posts |
| `_drafts/` | Unpublished; needs `make drafts` to preview |
| `_sass/_tokens.scss` | **Every** colour, size, font. Change the accent here |
| `_sass/` | The rest of the theme (~1,100 lines, no framework) |
| `_layouts/` | `default` → `home` / `post` / `page` / `tag` |
| `_includes/head.html` | All SEO: meta, OpenGraph, JSON-LD, analytics |
| `_includes/entry.html` | A post card on the home page (series-aware) |
| `_plugins/tag_pages.rb` | Generates `/tags/<slug>/` for all 27 tags |
| `assets/js/main.js` | Theme toggle, TOC, copy buttons, lightbox. No dependencies |
| `.github/workflows/pages.yml` | Build, link-check, deploy |
| `img/`, `public/` | Images |

---

## 8. Configuration

In `_config.yml`:

```yaml
goatcounter: "dani-fullgc"                        # blank ⇒ no analytics at all
giscus:
  repo_id:     "MDEwOlJlcG9zaXRvcnkxMTU1MzIwNjg="  # blank ⇒ shows a fallback note
  category:    "General"
  category_id: "DIC_kwDOBuLhJM4DEvf1"
```

Both are inert when blank — the site loads **zero** third-party resources
without them. Comments live as GitHub Discussions in the General category,
keyed by post pathname.

**Changing the accent colour** — two lines in `_sass/_tokens.scss`:

```scss
--accent: #3ddc84;   /* dark theme  */
--accent: #0d7a3e;   /* light theme */
```

If you change these, check contrast: link text needs ≥ 4.5:1 against both the
page and card backgrounds. The current values pass WCAG AA on all 18 pairs.

---

## 9. Things that will bite you

**Pages source must stay "GitHub Actions."** Under Settings → Pages. The legacy
branch builder runs Jekyll in `--safe` mode, which **ignores `_plugins/`** — all
27 tag pages would vanish and the 121 links to them would 404.

**Never change a published `permalink`.** GitHub Pages can't issue an HTTP 301;
`jekyll-redirect-from` only emits a meta-refresh page, which is a weaker signal.
Ugly-but-stable beats pretty-but-moved. This is why
`/stackable-traits-pattern---part-2/` still has its triple hyphen.

**`_site/` is build output.** Gitignored. Never commit it (it used to be, 10 MB of it).

**Don't paste third-party embed scripts into post bodies.** Ten posts had Disqus
blocks pasted in, loading a tracker on pages that appeared clean. Comments are
handled by the layout.

**The link check gates deploys.** A typo'd internal link fails the build rather
than shipping a 404. That's intentional; read the Actions log.
