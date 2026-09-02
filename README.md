# fullgc.github.io

Source for **[fullgc.github.io](https://fullgc.github.io)** — engineering write-ups
on Scala, the JVM, Akka, Kubernetes, Terraform and HashiCorp Vault.

Jekyll 4, a hand-written theme, no framework, no trackers.

## Run it locally

```sh
bundle install
bundle exec jekyll serve --livereload
# → http://127.0.0.1:4000
```

## Write a post

Add `_posts/YYYY-MM-DD-slug.md`:

```yaml
---
title:        The full headline, written for a search result
description:  >-
  One or two sentences. This becomes the meta description and the excerpt on
  the home page — it is the single highest-leverage field for search traffic,
  so never leave it out.
permalink:    /a-stable-slug/       # never change this once published
date:         2026-09-02 10:00:00
tags:         [scala, akka]
image:        /img/social-card.jpg  # OpenGraph / Twitter card
---
```

For a multi-part write-up, add `series`, `part` and `part_title`. The home page
then collapses the whole series into a single entry, and each post gets
previous/next navigation within it:

```yaml
series:     Tuning Akka
part:       2
part_title: Measuring dispatchers with Kamon
```

Drafts live in `_drafts/` and appear with `jekyll serve --drafts`.

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

## Still to configure

- `giscus.repo_id` / `giscus.category_id` in `_config.yml` — enable Discussions
  on the repo, install the [giscus app](https://giscus.app), paste the IDs.
- `goatcounter` in `_config.yml` — the subdomain of your GoatCounter site.

Both are inert while blank; nothing third-party loads until they're filled in.
