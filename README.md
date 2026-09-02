# fullgc.github.io

Source for **[fullgc.github.io](https://fullgc.github.io)** — engineering write-ups
on Scala, the JVM, Akka, Kubernetes, Consul and HashiCorp Vault.

Jekyll 4, a hand-written theme, no framework, and cookieless analytics.

## Run it locally

```sh
make serve      # → http://localhost:4000
make drafts     # include _drafts/
make check      # build + the link check CI runs
```

Runs in Docker, because this machine's system Ruby (2.6) is older than the 3.0
that Jekyll 4.4 requires. With a modern Ruby installed, `bundle exec jekyll
serve` works directly.

## Writing

**See [MAINTAINING.md](MAINTAINING.md)** for the full front matter reference,
the series fields, the SEO rules, the post-publishing checklist, and the
gotchas worth knowing before you change anything.

A minimal post — `_posts/YYYY-MM-DD-slug.md`:

```yaml
---
title:       "The headline, written for a search result"
description: >-
  One or two sentences. Becomes the meta description and the home page
  excerpt — the highest-leverage field for search traffic.
permalink:   /a-stable-slug/       # never change this once published
date:        2026-09-15 10:00:00
tags:        [scala, akka]
image:       /img/social-card.jpg
---
```

## Layout

| Path | What it is |
|---|---|
| `_sass/` | The whole theme. `_tokens.scss` holds every colour, size and font — change the accent there. |
| `_layouts/` | `default` → `home` / `post` / `page` / `tag` |
| `_includes/` | `head` (all SEO/meta), `header`, `footer`, `entry` (post card), `comments`, `icons` |
| `_plugins/tag_pages.rb` | Generates `/tags/<slug>/` for every tag |
| `assets/js/main.js` | Theme toggle, table of contents, copy buttons, image zoom. No dependencies. |

## Deployment

Pushing to `master` triggers `.github/workflows/pages.yml`, which builds with
Jekyll 4, runs **html-proofer** over the output to catch broken internal links,
and deploys to GitHub Pages. Set Pages source to **GitHub Actions** in repo
settings.

