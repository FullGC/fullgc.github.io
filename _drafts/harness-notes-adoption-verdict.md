---
title:     "Notes: the good, the bad and the ugly of adopting an engine"
---

*Raw material, not prose. Source: Dani, from the actual Archon evaluation. Not researched, not
verified — see "before publishing" at the bottom.*

The shape of the argument: **Archon worked.** The reasons for not adopting it are not "it was
broken". Two of them are about what harnessing costs the developer, and one is about a risk that
has nothing to do with the tool at all.

---

## The good

It did the job. The engine executed the workflows, the isolation held, the DAG ran. Whatever the
closing article says, it does not get to say the evaluation failed. Everything below is the price
of something that works.

## The bad — engineers do not like not talking to the coding agent

This is the heart of it, and it is a developer-experience objection rather than a capability one.

**The workflow is effectively immutable at run time.** When the harness is the caller, the
developer cannot lean over and tell the agent to skip this gate, or to always ask before that step,
or to try something else this once. Changing behaviour means editing YAML and re-running. In an
orchestrator skill, all of that is one sentence in the chat.

**Do not file this under "bad". Dani's correction: it is both, and which one depends on who you
are.** To a platform or enablement owner, immutability is the entire point: a procedure a developer
can talk their way out of mid-run is a suggestion, not a procedure. To the developer at the
keyboard it is a straitjacket, because the thing that used to be a sentence in the chat is now a
pull request against a YAML file.

Both readings are correct and no tooling resolves it, because it is one property seen from two
sides. Enforceability and steerability are the same thing with opposite signs. It also runs the
other way: the orchestrator skill a developer finds pleasantly steerable is the one a platform
owner cannot rely on.

Useful practical consequence: this predicts who in the room will like the demo. Worth raising in
any adoption conversation before the demo rather than after.

**You see what the harness decided to show you.** Dani's framing, and better than "you lose the
thinking": the view is mediated, not absent. Every window onto the run is a rendering somebody else
designed, and when what you need is not in it you drop to the logs, which are just a lower-level
rendering.

The crisp version: in a coding agent session you are watching a rendering of the *transcript*. With
an engine you are watching a rendering of the *run*, and the transcript is something you go and
fetch.

Be precise here — observability is two axes, and the engine wins one and loses the other:

- *Run-level* observability genuinely improves. That is what an engine is for: an event stream, a
  run history, per-node status and cost, a UI, and adapters that can push state into Slack or a
  dashboard. The orchestrator skill has none of that; Part 4 of the first series had to
  reconstruct progress from artifacts after the fact.
- *Step-level* observability regresses, and that is the one engineers feel. You cannot watch the
  model reason, so the failure mode "it is stuck and I do not know why" costs a trip to the logs
  instead of a glance at the screen.

So the honest sentence is not "you lose observability" — it is that you trade watching one agent
think for watching many runs progress, and the people doing the work preferred the former.

Ties into the extracted spreadsheet, whose first category is Developer Convenience & Debugging and
which rates strongly pro-native. Use those rows as the evidence, not just the anecdote.

**And here is the nuance that makes the arc work: the team was more or less fine with all of it.**
Dani's own words. The friction was real, it was annoying, and it was survivable. Nobody walked away
because the UI was fiddly or because they missed watching the model think. If the vendor risk did
not exist, this section would be a list of things to get used to rather than a reason to stop.

Do not let the article overstate this section. It is the *bad*, and the bad was liveable.

## The ugly: the vendors can close the door

Not a tool problem at all, and the reason it is the ugly rather than the bad: **nothing in the
engineering fixes it.**

The exposure is that Anthropic, OpenAI and their peers have both the ability and an incentive to
make their best models awkward or expensive to reach from a harness that is not their own. A
workflow engine is, by construction, exactly that: headless, third-party, non-interactive use of
somebody else's coding agent. It is the usage pattern a vendor would restrict first.

This is not hypothetical. In May 2026 Anthropic announced a split of the flat-rate subscription
into two pools (per Dani, unverified, see the checklist at the bottom):

- **Interactive pool**: manual, human-in-the-loop use (claude.ai, desktop apps, interactive
  terminal sessions) stays under the standard flat-rate subscription limits.
- **Agent SDK credit pool**: automated headless usage stripped out of the main subscription:
  `claude -p`, the Claude Agent SDK, GitHub Actions, third-party tools (OpenClaw and Zed were
  named).

It was withdrawn. The point is not that it happened, it is that it was drafted: somebody sat down
and drew the line in exactly the place that separates a person typing from an engine calling. That
line can be drawn again, by anyone, at any time, and it need not be about price. A vendor could
equally gate a model tier, a beta, or a rate limit behind its own harness.

### Why it is worse than it first looks

The standard defence of an engine is that the provider becomes a line of configuration, so you can
move when a vendor misbehaves. That argument is sound about **models** and close to worthless about
**access terms**, because every vendor shipping a coding agent has the same incentive to treat
headless third-party use differently. Switching providers does not escape a policy all providers
converge on.

Worse, it can inverse the engine's main selling point. "Best model per node" assumes every vendor's
best is reachable from a neutral caller. If Anthropic's strongest tier is best through Claude Code
and OpenAI's is best through Codex, then a neutral engine is not getting the best of both. It is
getting whatever each vendor is willing to expose to outsiders, which is the worst of both. The
multi-provider promise quietly becomes a multi-provider tax.

That is the argument part two flagged and deferred, and it needs stating plainly here: **an engine
is a bet that the interop stays open.**

### The UI, demoted

Worth one line, not a section. Archon's web UI is nice to look at and was buggy to operate; viewing
was fine, performing operations from it was not. It is a young-tool complaint, it will date, and it
carried more weight in an earlier draft of these notes than it deserves.

## Structural note for the article

Do not write it as a scorecard. The arc is: the tool worked, the friction was real but survivable,
and the thing that actually decided it was a risk nobody in the evaluation controlled.

Good / bad / ugly maps cleanly, as long as the ugly is the vendor risk and not the UI:

| | What | Can engineering fix it? |
|---|---|---|
| **The good** | it worked: the engine ran, isolation held, the DAG executed | n/a |
| **The bad** | engineers lost the conversation: no run-time steering, no visible thinking | partly, and the tools are improving |
| **The ugly** | vendors can restrict headless third-party access to their models | **no** |

That third row is the whole point of the article. The first two are trade-offs a team can weigh.
The third is an exposure a team can only accept or refuse, and refusing it is what happened.

Note the irony to draw out: the engine's flexibility is what creates the exposure. An orchestrator
skill is interactive human-in-the-loop use of one vendor's own harness, which is precisely the
usage pattern every vendor is trying to keep cheap.

## Before publishing

- **Verify the Anthropic announcement and its cancellation.** Dates, exact wording, what was
  actually in scope, and confirm it was withdrawn. This is a factual claim about a named company's
  pricing and it is the load-bearing argument of the article — it needs a source, and it needs
  re-checking at publication time in case the situation moved again. Do not publish it on the
  strength of these notes.
- Confirm "OpenClaw" and "Zed" were in the announcement's named list, or drop the names.
- Pull the concrete Developer Convenience & Debugging rows out of
  `extracted/comparison.md` so the DX section has evidence rather than assertion.
