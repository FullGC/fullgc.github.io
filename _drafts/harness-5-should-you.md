---
title:      "Should you harness the harness: so, should you?"
part_title: "So, should you?"
subtitle:   "What actually justifies moving the procedure out, what it costs to live with, and the one risk no engineering fixes."
series:     "Should You Harness the Harness"
part:       5
description: >-
  Whether to move a development procedure out of the agent session: what actually justifies
  it, what it costs to live with, and the one risk no engineering fixes.
permalink:  /should-you-harness-the-harness-part-5/
date:       2026-09-07 13:00:00
tags:       [ai, agents, workflows, automation, claude-code, harness]
image:      /public/harness-meme-two-chairs.png
banner:     false
image_w:    564
image_h:    500
---

Four parts of machinery. This one is the decision.

It is a yes or no. Either the agent runs your procedure, or your procedure runs the agent.
Neither side is only one thing: an orchestrator skill is just the pattern the previous series
happened to use, and on the other side a `Makefile` that calls the coding agent at each step is
already harnessing the harness. Nobody sells that one, and it works.

This part names no winner. Tools change every few months. Where a procedure should live does not.

*Assumes parts one and two. Three and four are a worked example, and are optional.*

## What actually justifies the move

First, the ledger. Set the gains out plainly and most of them shrink.

| What you gain | What it really is |
|---|---|
| Parallel nodes | the same work, sooner |
| Run history, per-node cost | reporting you did not have |
| Worktree isolation with a real lock | a script you did not get round to writing |
| Provider and model per node | an option you will rarely exercise |
| **Steps with no model in them** | **a guarantee you could not previously make** |
| **Run state that outlives the process** | **something that did not exist before** |

The top four are good reasons to want an engine and bad reasons to change architecture. The bottom
two are different in kind, and between them they decide it.

### Steps that nothing can skip

[Part one](/should-you-harness-the-harness-part-1/) established the limit: inside a session no
step is one the model sits out, and the decision to reach an exact command is itself a judgment
with a failure rate.

Outside, a shell step runs because the program says so. Nothing in the path is capable of skipping
it, so nothing does.

So count your steps. Run the migration. Boot the environment. Post the comment. Tag the release. If
most of your procedure needs no intelligence at all, you are paying a round trip and a small
probability of omission for every one of them, and the omissions are the expensive part, because a
step quietly skipped leaves nothing behind that says so.

This is the cheap problem. Moving the procedure out fixes it and buying something does not, so if
it is the only thing pushing you, that `Makefile` is the entire answer.

### Run state that outlives the process

Autonomy looks like the argument here: a skill needs a person to start it, so anything unattended
needs an engine.

It does not hold. `claude -p` expands a skill invocation in the prompt string, there is a
documented flag for suppressing permission prompts when nobody is there to answer them, and
running the whole thing from CI has its own page in the manual.

The gates are easier still. Tell the agent not to stop at them and it will not, with the usual
caveat that an instruction to a model is a strong default rather than a guarantee. A cron entry
can drive the procedure end to end. Running it unattended may raise subscription and licensing
questions, which the last section of this part deals with, but those are billing problems rather
than missing capabilities.

So the trigger is not what is missing. What is missing is that the thing you started is a
*session*: it lives in one process, on one machine, and dies with it. Write the same procedure's
progress to a database and it becomes an object with a life of its own.

Which buys four different things:

- **It survives the crash.** A failed run resumes from the node that failed, because something
  outside the process recorded which nodes finished.
- **It can hold a lock.** A run that has reserved a worktree stops a second run walking into it,
  including a second run of your own.
- **Anyone can read it.** A colleague approving a gate from Slack, a board showing what is in
  flight, a query asking what ran on Tuesday and what it cost.
- **It can be replayed.** Completed nodes emit events, so a restart consults what actually
  happened rather than a cursor's opinion about where the run had got to.

**So: does anything need to know about a run besides the process executing it?** Another person,
another run, or the same run tomorrow after a crash. If yes, you need that state somewhere
durable, and a `Makefile` stops being enough.

## Adopt, or write one by accident

A CI runner gets you a long way: run ids, readable logs, approval gates, retries, artifacts. What
it lacks is the half that knows what a coding agent is:

- a session threaded from one step to the next, and forked rather than mutated on a retry;
- a worktree lock with an owner and an expiry;
- a provider resolved per step.

You can write all of that. [Part one](/should-you-harness-the-harness-part-1/) already said what
happens next, and it is the whole of the second decision: **writing that lifecycle well means
writing a workflow engine badly, in the margins of doing something else.**

So the rule is unglamorous. Build while the missing pieces are ones you can name and would not
miss. Adopt once the list starts to look like a product.

In practice nobody arrives at an engine by evaluating engines. They arrive by noticing that their
pipeline has grown a state file, then a lock, then a retry policy, then a resume, and asking why
they are maintaining all that.

## The conversation you give up

![The two guys on a bus meme. The miserable man on the grey side is labelled "the developer at the keyboard"; the contented man on the sunny side is labelled "whoever owns the process". The caption across both reads "a procedure that cannot be talked out of anything".]({{ '/public/harness-meme-two-chairs.png' | relative_url }}){: .meme}

The friction is one property rather than a list, and [part two](/should-you-harness-the-harness-part-2/)
already named it: enforceability and steerability are the same thing with opposite signs, and the
sentence that used to skip a gate becomes a pull request against a YAML file.
[Part three](/should-you-harness-the-harness-part-3/) is what that felt like day to day.

As a decision criterion it matters more than it sounds, because **whoever staffs the evaluation
tends to determine its outcome.**

| | What they see | What they conclude |
|---|---|---|
| Whoever owns the process | a procedure that cannot be talked out of halfway through | the fixed control flow *is* the product |
| The developer at the keyboard | a procedure that cannot be talked to at all | a straitjacket where a sentence used to do |

Neither is wrong. It is one property seen from two chairs, and no amount of tooling resolves it. An
evaluation staffed by one group produces a confident answer the other will not honor, which is
cheaper to find out before the pilot than after the rollout.

In practice it counted for little. It was annoying and it was liveable. If the next section did not
exist, everything in this one would be a list of things to get used to.

## The part no engineering fixes

An engine is, by construction, headless third-party non-interactive use of somebody else's coding
agent. That is the usage pattern a model vendor has the clearest incentive to price or gate
differently, and the first one anybody would restrict.

On 14 May 2026 Anthropic announced exactly that, to take effect a month later. Use of Claude
through its own first-party surfaces, the chat apps and the Claude Code CLI you type into, would
stay on the flat-rate subscription. Programmatic use would not: the Agent SDK, `claude -p`, GitHub
Actions and third-party apps were to move to a separate monthly credit billed at standard API
rates, worth twenty dollars on Pro and two hundred on the largest Max plan, with no rollover.

On 15 June, the day it was due to start, Anthropic [paused it](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan):
"For now, nothing has changed." Note the wording. Not cancelled, paused, with a revised plan
promised and advance notice offered before anything takes effect. That is still where it stands.

What matters is that somebody sat down and drew the line in exactly the place that separates a
person typing from a program calling, and then said they intend to draw it again somewhere. It
need not be about price next time either. A model tier, a beta, or a rate limit would do.

The usual reassurance is that the provider is a line of configuration, so you can move. That is
sound about **models** and close to worthless about **access terms**, because every vendor shipping
a coding agent faces the same incentive. Switching does not escape a policy they all converge on.

It can also invert the main selling point. Best model per node assumes every vendor's best is
reachable from a neutral caller. If one vendor's strongest tier works best through its own harness
and another's does too, a neutral engine is not getting the best of both, it is getting whatever
each is willing to expose to outsiders.

Vendors draw their boundary between interactive and programmatic, not between skills and engines.
A developer running an orchestrator skill by hand is interactive use of one vendor's own harness,
which is precisely the usage every vendor is trying to keep cheap. An engine is on the other side
permanently, by construction. Fewer capabilities, less exposure, and no way to have both.

If a change in one vendor's terms would strand a process your whole team depends on, nothing inside
the tool helps.

## The answer

The difference is real. A procedure that runs the agent is enforced in a way a procedure the
agent runs can never be, and no amount of careful writing closes that gap.

It is also narrower than it sounds. Part one said what the engine fixes. The price is a
process to run, a schema to maintain, a layer between you and the agent you were talking to five
minutes ago, and a bet that vendors keep letting other people's harnesses call their models.

The teams who should move are the ones already paying for staying put. A procedure that is mostly
mechanical steps is cheaper as a program. Still want to harness? A `Makefile` will do. A team
already maintaining a state file, a lock and a retry policy has written most of an engine and
should stop pretending otherwise.

Everyone else is fine where they are, for now. An orchestrator skill is a procedure a model has
agreed to follow. That is worth a great deal, and it is not the same as a procedure that runs.
