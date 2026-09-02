---
layout: page
title: About
description: Dani Shemesh — backend and infrastructure engineer. Scala, the JVM, and the systems around them.
image: /img/me-about.jpg
---

<div class="about-grid" markdown="1">

<img class="avatar" src="{{ '/img/me-about.jpg' | relative_url }}"
     width="360" height="360" alt="Dani Shemesh">

<div markdown="1">

I'm **Dani Shemesh**, a backend and infrastructure engineer. I've spent most of my
career on the JVM — Scala and Java services — and on the infrastructure that
keeps them running: Kubernetes, Terraform, HashiCorp Vault and Consul, and the
CI/CD plumbing in between.

**fullgc** is where I write the posts I wish had existed when I was solving
something. That means real configuration, real numbers, and the parts that
didn't work — not a summary of the official docs. The archive covers
[tuning Akka dispatchers under load]({{ '/how-to-tune-akka-to-get-the-most-from-your-actor-based-system-part-1/' | relative_url }}),
[Scala's stackable trait pattern]({{ '/stackable-traits-pattern/' | relative_url }}),
[running Vault at scale]({{ '/overcome-the-secrets-management-challenge-with-hashicorp-vault-and-the-hashi-tools-library/' | relative_url }}),
and [syncing Kubernetes with Consul]({{ '/syncing-kubernetes-and-hashicorp-consul/' | relative_url }}).

Some of that work is open source — the `hashi-tools` library came out of the
Vault rollout described in that post.

### Elsewhere

- **GitHub** — [@{{ site.github_username }}](https://github.com/{{ site.github_username }})
- **LinkedIn** — [dani-shemesh](https://www.linkedin.com/in/{{ site.linkedin_username }})
- **Email** — [{{ site.author.email }}](mailto:{{ site.author.email }})
- **RSS** — [{{ site.url }}/feed.xml]({{ '/feed.xml' | relative_url }})

Corrections and disagreements are welcome — email is fastest.

</div>
</div>
