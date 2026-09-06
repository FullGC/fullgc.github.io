---
title:      "Should you harness the harness: so, should you?"
part_title: "So, should you?"
subtitle:   "What actually crosses the line, what it costs to live with, and the risk that decided it for us."
series:     "Should You Harness the Harness"
part:       5
tags:       [ai, agents, workflows, automation, claude-code]
---

Four parts of machinery. This one is the decision, and it seems only fair to say up front how ours
went: the engine worked, and we did not adopt it.

That reads like a bad review. It is not one. Nothing broke, the isolation held, the graph executed.
The friction was real and survivable. What decided it was a risk nobody in the room controlled, and
that risk has almost nothing to do with which engine you pick.

Which is why this part names no winner. Tools change every few months. Where a procedure should
live does not.

The line is a yes or no. Either the agent runs your procedure, or your procedure runs the agent.

What sits on each side is not, and I have been unfair about it: one specific thing on the left, a
whole category on the right. An orchestrator skill is just the pattern the previous series happened
to use, and agent teams and dynamic workflow scripts live on that side too. On the right, a
`Makefile` that calls the coding agent at each step is already harnessing the harness. Control flow
in code, shell for the steps in between, a run with an id and a log. Nobody sells it, and it works.

So there are two questions here, not one. Whether to cross, and if you cross, whether to buy.

*Assumes parts one and two. Three and four are a worked example, and are optional.*

## What actually crosses the line

First, the honest ledger. Four parts of enthusiasm about engines, and most of what they buy is a
nicer version of something you already had.

| What you gain | What it really is |
|---|---|
| Parallel nodes | the same work, sooner |
| Run history, per-node cost | reporting you did not have |
| Worktree isolation with a real lock | a script you did not get round to writing |
| Provider and model per node | an option you will rarely exercise |
| **Steps with no model in them** | **a guarantee you could not previously make** |
| **A run other processes can reach** | **something that did not exist before** |

The top four are good reasons to want an engine and bad reasons to change architecture. The bottom
two are different in kind, and between them they decide the first question.

### Steps that nothing can skip

Inside a session there is no such thing as a step the model sits out. Running the test suite means
the model reads the procedure, decides this is the moment, and issues the call. The command that
finally runs is exact. The decision to reach it is a judgment, and judgments have a failure rate.

Outside, a shell step runs because the program says so. No prompt, no inference, no chance of the
step being skipped, because nothing in the path is capable of skipping it.

So count your steps. Run the migration. Boot the environment. Post the comment. Tag the release. If
most of your procedure needs no intelligence at all, you are paying a round trip and a small
probability of omission for every one of them, and the omissions are the expensive part, because a
step quietly skipped leaves nothing behind that says so.

This is the cheap problem. Crossing the line fixes it and buying something does not, so if it is
the only thing pushing you across, that `Makefile` is the entire answer.

### A run somebody else can reach

I had this one wrong for most of the time I spent writing the series, and the wrong version is the
one you will hear most often: a skill needs a person to start it, so autonomy needs an engine.

It is false. `claude -p` expands a skill invocation in the prompt string, there is a documented flag
for suppressing permission prompts when nobody is there to answer them, and running the whole thing
from CI has its own page in the manual. Getting past the gates is cheaper still. Write the workflow
without them, or just tell the agent not to stop, and accept that the instruction is a strong
default rather than a guarantee. Either way a cron entry drives the procedure end to end.

What is missing is not the trigger. It is that the thing you started is a *session*, and a session
is addressable by whoever holds its id on the machine that has it. A run is addressable by anyone.

That sounds like a distinction without a difference until you list what it buys:

- a colleague approving a gate from Slack, on work executing on somebody else's laptop;
- a board showing what is in flight without interrogating each process;
- a second run discovering that a working directory is already taken;
- a failed run picked up days later by a process that did not start it.

**So: does anyone except the person who started a run need to see it, stop it, or answer it?** If
no, cross the line with a shell script and stop thinking about it. If yes, you need runs kept
somewhere durable, and the second question starts.

## Adopt, or write one by accident

A CI runner gets you a long way. Run ids, readable logs, approval gates, retries, artifacts. What
it lacks is the half that knows what a coding agent is: a session threaded from one step to the
next, forked rather than mutated on a retry, a worktree lock with an owner and an expiry, a
provider resolved per step.

You can write all of that. Part one already said what happens next, and it is worth repeating
because it is the whole of the second decision: **writing that lifecycle well means writing a
workflow engine badly, in the margins of doing something else.**

So the rule is unglamorous. Build while the missing pieces are ones you can name and would not
miss. Adopt once the list starts to look like a product.

In practice nobody arrives at an engine by evaluating engines. They arrive by noticing that their
pipeline has grown a state file, then a lock, then a retry policy, then a resume, and asking why
they are maintaining all that.

## The conversation you give up

The friction is one property rather than a list, and part two already named it: enforceability
and steerability are the same thing with opposite signs. When the harness is the caller, a
developer cannot lean over and say skip this gate, I know exactly what this diff is. The sentence
that used to do the job becomes a pull request against a YAML file. Part three is what that felt
like day to day.

As a decision criterion it matters more than it sounds, because **whoever staffs the evaluation
tends to determine its outcome.**

| | What they see | What they conclude |
|---|---|---|
| Whoever owns the process | a procedure that cannot be talked out of halfway through | the fixed control flow *is* the product |
| The developer at the keyboard | a procedure that cannot be talked to at all | a straitjacket where a sentence used to do |

Neither is wrong. It is one property seen from two chairs, and no amount of tooling resolves it. An
evaluation staffed by one group produces a confident answer the other will not honour, which is
cheaper to find out before the pilot than after the rollout.

For us it counted for little. It was annoying and it was liveable. If the next section did not
exist, everything in this one would be a list of things to get used to.

## The part no engineering fixes

An engine is, by construction, headless third-party non-interactive use of somebody else's coding
agent. That is the usage pattern a model vendor has the clearest incentive to price or gate
differently, and the first one anybody would restrict.

In May 2026 Anthropic announced a split of the flat-rate subscription into two pools: an
interactive pool where human-in-the-loop use through the apps and terminal sessions stayed under
the standard subscription, and a separate credit pool for automated headless usage. It was
withdrawn. The point is not that it happened. The point is that somebody sat down and drew the line
in exactly the place that separates a person typing from an engine calling, which means the line
can be drawn again, by anyone, and it need not be about price. A model tier, a beta, a rate limit
would all do.

The usual reassurance is that the provider is a line of configuration, so you can move. That is
sound about **models** and close to worthless about **access terms**, because every vendor shipping
a coding agent faces the same incentive. Switching does not escape a policy they all converge on.

It can also invert the main selling point. Best model per node assumes every vendor's best is
reachable from a neutral caller. If one vendor's strongest tier works best through its own harness
and another's does too, a neutral engine is not getting the best of both, it is getting whatever
each is willing to expose to outsiders.

There is an irony in this worth sitting with. The orchestrator skill, the weaker pattern, the one
this whole series has been listing the limits of, is interactive human-in-the-loop use of one
vendor's own harness, which is precisely the usage every vendor is trying to keep cheap. Fewer
capabilities, less exposure.

If a change in one vendor's terms would strand a process your whole team depends on, nothing inside
the tool helps.

## What we chose

The orchestrator skill, with part one's limits accepted rather than solved.

Two facts decided it, and neither is about engines. Most of our work needed judgment at every step,
so model-free steps would not have bought much. And nobody except the person who started a run ever
needed to reach it. Neither gain paid for itself, which left the vendor exposure with nothing to
weigh against.

Three things would change that:

- **A release that closes the gap.** Dynamic workflows arrived while this was being written and
  took several of part one's limits off the table without leaving Claude Code. They did not take
  the step with no model in it. If a later release does, most of the case for crossing goes away.
- **More people needing to reach a run.** Team growth, an on-call rotation, a queue of mechanical
  tickets, or one quarter of wanting a pull request waiting on Monday morning. This is the one most
  likely to move, and it is the one that would push us across.
- **Vendors settling the terms.** A public commitment to treating headless use like interactive use
  removes the veto. A reintroduced split makes it permanent.

## The answer

Yep, as you've probably guessed, it depends.

The line is real. A procedure that runs the agent is enforced in a way a procedure the agent runs
can never be, and no amount of careful writing closes that gap.

It is also narrower than it sounds. We've already mentioned what the engine fixes. The price is a process to run, a schema to maintain, a layer between you and the agent you were talking to five
minutes ago, and a bet that vendors keep letting other people's harnesses call their models.

The teams who should cross are the ones already paying for staying put. A procedure that is mostly
mechanical steps is cheaper as a program. Still want to harness? a `Makefile` will do. A team already maintaining a
state file, a lock and a retry policy has written most of an engine and should stop pretending
otherwise.

Everyone else is fine where they are, for now. An orchestrator skill is a procedure a model has
agreed to follow. That is worth a great deal, and it is not the same as a procedure that runs.
