/* fullgc — progressive enhancements. No dependencies. */
(() => {
  "use strict";

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Theme toggle ────────────────────────────────────────────────────────
     The initial theme is applied by an inline script in <head> to avoid a
     flash; this only wires up the button and keeps the choice. */
  const root = document.documentElement;
  const toggle = document.querySelector(".theme-toggle");

  const activeTheme = () =>
    root.dataset.theme ||
    (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  if (toggle) {
    const sync = () => {
      const next = activeTheme() === "dark" ? "light" : "dark";
      toggle.setAttribute("aria-label", `Switch to ${next} theme`);
      toggle.setAttribute("title", `Switch to ${next} theme`);
    };
    sync();
    toggle.addEventListener("click", () => {
      const next = activeTheme() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch { /* private mode */ }
      sync();
    });
  }

  /* ── Header shadow + reading progress ──────────────────────────────────── */
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".progress");
  const article = document.querySelector(".prose");

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", y > 4);

      if (progress && article) {
        const start = article.offsetTop;
        const span = article.offsetHeight - window.innerHeight + 120;
        const p = span > 0 ? (y - start + 120) / span : 0;
        progress.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
      }
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  onScroll();

  if (!article) return; // everything below is post-page only

  /* ── Heading anchors ───────────────────────────────────────────────────── */
  const headings = [...article.querySelectorAll("h2[id], h3[id]")];
  for (const h of headings) {
    const a = document.createElement("a");
    a.className = "anchor";
    a.href = `#${h.id}`;
    a.setAttribute("aria-label", `Permalink to “${h.textContent.trim()}”`);
    a.textContent = "#";
    h.prepend(a);
  }

  /* ── Table of contents ─────────────────────────────────────────────────── */
  const tocBox = document.querySelector(".toc-rail");
  const tocList = tocBox?.querySelector("ol");

  if (tocList && headings.length >= 3) {
    for (const h of headings) {
      const li = document.createElement("li");
      li.className = `lvl-${h.tagName[1]}`;
      const a = document.createElement("a");
      a.href = `#${h.id}`;
      // Strip the injected "#" anchor from the label.
      a.textContent = [...h.childNodes]
        .filter((n) => !(n.nodeType === 1 && n.classList?.contains("anchor")))
        .map((n) => n.textContent)
        .join("")
        .trim();
      li.append(a);
      tocList.append(li);
    }
    tocBox.hidden = false;

    // Highlight the heading currently nearest the top of the viewport.
    const links = new Map(
      [...tocList.querySelectorAll("a")].map((a) => [a.hash.slice(1), a])
    );
    const seen = new Set();
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target.id);
          else seen.delete(e.target.id);
        }
        const current =
          headings.find((h) => seen.has(h.id)) ??
          headings.filter((h) => h.getBoundingClientRect().top < 120).pop();
        for (const [id, a] of links) a.classList.toggle("is-active", id === current?.id);
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    for (const h of headings) spy.observe(h);
  }

  /* ── Code blocks: language label + copy button ─────────────────────────── */
  for (const block of article.querySelectorAll(".highlight")) {
    const code = block.querySelector("pre code, pre");
    if (!code) continue;

    const lang = [...(block.classList || [])]
      .concat([...(block.parentElement?.classList || [])])
      .map((c) => /^language-(.+)$/.exec(c)?.[1])
      .find(Boolean);
    if (lang) {
      const tag = document.createElement("span");
      tag.className = "code-lang";
      tag.textContent = lang;
      block.append(tag);
    }

    if (!navigator.clipboard) continue;
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText.replace(/\n$/, ""));
        btn.textContent = "copied";
        btn.classList.add("is-copied");
        setTimeout(() => {
          btn.textContent = "copy";
          btn.classList.remove("is-copied");
        }, 1600);
      } catch {
        btn.textContent = "failed";
        setTimeout(() => (btn.textContent = "copy"), 1600);
      }
    });
    block.append(btn);
  }

  /* ── Click-to-zoom for post images ─────────────────────────────────────── */
  const images = [...article.querySelectorAll("img")].filter(
    (img) => !img.closest("a") && img.naturalWidth !== 1
  );
  if (images.length && window.HTMLDialogElement) {
    const dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    const shown = document.createElement("img");
    shown.alt = "";
    dialog.append(shown);
    document.body.append(dialog);

    dialog.addEventListener("click", () => dialog.close());

    for (const img of images) {
      img.classList.add("zoomable");
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("click", () => {
        shown.src = img.currentSrc || img.src;
        shown.alt = img.alt || "";
        dialog.showModal();
      });
    }
  }

  /* Smooth-scroll TOC clicks without fighting reduced-motion preferences. */
  if (prefersReduced) document.documentElement.style.scrollBehavior = "auto";
})();
