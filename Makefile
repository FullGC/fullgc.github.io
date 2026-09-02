# fullgc.github.io
#
# The system Ruby on this machine is 2.6 and Jekyll 4.4 needs >= 3.0, so these
# targets run the build in Docker. If you install a modern Ruby, plain
# `bundle exec jekyll serve` works too.

IMAGE  := ruby:3.3
GEMVOL := fullgc-gems
RUN    := docker run --rm -v "$(PWD)":/site -w /site -v $(GEMVOL):/usr/local/bundle
BUNDLE := bundle config set --local path /usr/local/bundle >/dev/null &&

.PHONY: help serve drafts build check deps clean

help:
	@echo "make serve   - live preview on http://localhost:4000"
	@echo "make drafts  - same, including _drafts/"
	@echo "make build   - one-off build into _site/"
	@echo "make check   - build, then the link check CI runs"
	@echo "make clean   - remove _site/ and caches"

deps:
	@docker volume create $(GEMVOL) >/dev/null
	$(RUN) $(IMAGE) sh -c '$(BUNDLE) bundle install'

serve: deps
	$(RUN) -p 4000:4000 -p 35729:35729 $(IMAGE) \
	  sh -c '$(BUNDLE) bundle exec jekyll serve --host 0.0.0.0 --livereload'

drafts: deps
	$(RUN) -p 4000:4000 -p 35729:35729 $(IMAGE) \
	  sh -c '$(BUNDLE) bundle exec jekyll serve --host 0.0.0.0 --livereload --drafts'

build: deps
	$(RUN) $(IMAGE) sh -c '$(BUNDLE) JEKYLL_ENV=production bundle exec jekyll build'

# Mirrors .github/workflows/pages.yml. External links are checked too, so this
# is slower than the build and needs network.
check: build
	$(RUN) $(IMAGE) sh -c 'gem install html-proofer -v "~> 5.0" --no-document --quiet; \
	  htmlproofer ./_site --allow-hash-href --no-enforce-https \
	    --ignore-status-codes "403,429,503,999" \
	    --ignore-urls "/fullgc\\.github\\.io/"'

clean:
	rm -rf _site .jekyll-cache .sass-cache
