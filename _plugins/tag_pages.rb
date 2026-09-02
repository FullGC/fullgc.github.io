# frozen_string_literal: true

# Generates /tags/<slug>/ for every tag used by a post.
#
# Tags were already in the front matter of all 13 posts but there was nowhere to
# click through to. Each generated page is a keyword-targeted landing page and,
# just as importantly, gives the posts internal links to one another.
module FullGC
  class TagPage < Jekyll::Page
    def initialize(site, tag, posts)
      @site = site
      @base = site.source
      @dir  = File.join("tags", Jekyll::Utils.slugify(tag))
      @name = "index.html"

      process(@name)

      @data = {
        "layout"      => "tag",
        "tag"         => tag,
        "posts"       => posts,
        "title"       => "##{tag}",
        "description" => "#{posts.size} #{posts.size == 1 ? 'post' : 'posts'} " \
                         "about #{tag} — practical engineering write-ups by " \
                         "#{site.config.dig('author', 'name')}.",
        # A tag page listing several posts is a genuine landing page and goes in
        # the sitemap. One listing a single post is thin content that would only
        # compete with that post, so it stays crawlable but unindexed.
        "sitemap"     => posts.size > 1,
        "noindex"     => posts.size < 2
      }
    end

    def url_placeholders
      { path: @dir, basename: basename, output_ext: output_ext }
    end
  end

  class TagPageGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      grouped = {}
      site.posts.docs.each do |post|
        Array(post.data["tags"]).each do |tag|
          (grouped[tag] ||= []) << post
        end
      end

      grouped.each do |tag, posts|
        site.pages << TagPage.new(site, tag, posts.sort_by { |p| -p.date.to_i })
      end

      # Expose an ordered tag index (most used first) to the /tags/ page.
      site.data["tag_index"] = grouped
        .map { |tag, posts| { "name" => tag, "slug" => Jekyll::Utils.slugify(tag), "count" => posts.size } }
        .sort_by { |t| [-t["count"], t["name"]] }
    end
  end
end
