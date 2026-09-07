---
title:      "Should you harness the harness: what the orchestrator skill cannot do"
part_title: "What the orchestrator skill cannot do"
subtitle:   "The limits that are not defects, and do not go away however well you write."
description: >-
  Six limits an orchestrator skill cannot write its way out of, because they follow from
  where the procedure runs rather than from how well it was written.
permalink:  /should-you-harness-the-harness-part-1/
date:       2026-09-07 09:00:00
series:     "Should You Harness the Harness"
part:       1
tags:       [ai, agents, workflows, automation, claude-code, harness]
image:      /public/harness-order-is-prose.png
banner:     false
image_w:    1024
image_h:    572
---

A development workflow can be written as a set of skills the coding agent reads and follows: phases
in order, artifacts between them, gates that check rather than promise, a script deciding when a
loop stops. One skill holds the phase order and dispatches the rest, and that one is the
**orchestrator**. The [previous series](/designing-agentic-development-workflows-part-1/) is a long
description of building exactly this.

It works. It also runs *inside* the agent session, and that is what this series is about.

The harness is the agent runtime itself: the thing that loads the skills, dispatches the sub-agents
and runs the tools. Harnessing it means taking the procedure out of the session and putting it in a
program that *calls* the coding agent, rather than a document the coding agent reads.

Whether that trade is worth making is the question these five parts work through. This one
establishes why it is a question at all.

## A defect, or a limit

[Part six of the previous series](/designing-agentic-development-workflows-part-6/) already lists
the things that hurt, and every one of them is a mistake: a gate described in prose instead of
enforced by a script, packaged copies that drifted, two components sharing a schema nobody
validated. All of them are fixable without changing the shape of the design. Write the missing
check, delete the duplicate, add the contract test, and the limitation goes away.

This is the other list. These do not go away, because they follow from *where the procedure runs*
rather than from how well it was written.

The test for whether something belongs here is a single question: **could a sufficiently
disciplined author fix it by writing better skills?** If yes, it is a defect and belongs in part
six's list. If no, it belongs here.

That line is a judgment call, and someone else would draw it differently. A later section shows
the cases I had to argue myself out of.

## What better skills cannot reach

| The limit | Why no skill reaches it |
|---|---|
| Model, effort, provider | only a dispatched sub-agent can declare a tier; the orchestrator runs on whatever the session runs |
| Its own context window | the thing that would prune the conversation *is* the conversation |
| Two phases at once | sub-agents fan out inside a turn, but the conversation itself is serial |
| Steps that need no intelligence | every step is a tool call some model chose to make |
| The order itself | phase order is prose, followed because the model is inclined to follow it |
| A run another process can address | a session id is not a run: nothing else can find it, watch it, pause it or resume it |

The first five get a section each below. The sixth gets one of its own further down, because it is
the one that decides the question.

### Model, effort, and provider

The first principle in [part two of the previous series](/designing-agentic-development-workflows-part-2/)
states this as a fact of the runtime rather than a design choice: model and reasoning effort can only be set
when a step is dispatched as a sub-agent. A skill's own metadata does not change what serves it.

That is why the orchestrator is thin. It runs on whatever model the developer's session happens to
be using, and the only way to say "this decision deserves the strongest model" is to push the
decision out into a dispatched agent that can declare a tier.

Turning that into a principle is the right thing to do with a constraint you cannot remove. It
remains a constraint. The orchestrator is the one component whose cost and capability you cannot
specify.

The larger version is the provider, not the model. An orchestrator skill runs inside one harness
and is married to it. Every step is served by whichever vendor's agent the developer happened to
open, and if a step would be better served by a different one there is no way to say so, because
the thing that would have to say it is a guest in the session it would need to replace.

Once the procedure lives outside the session, the coding agent becomes a parameter. An engine
resolves a provider per node, so planning can run on one vendor's agent and implementation on
another's, with context handed between them explicitly because sessions do not cross providers.

Whether mixing vendors mid-run is a good idea is a separate question, and mostly it will not be.
What matters is that it stops being an architectural impossibility and becomes a line of
configuration.

### Its own context window

![The Spider-Man pointing meme. Two identical Spider-Men point at each other, one labelled "the thing that would prune the conversation" and the other labelled "the conversation".]({{ '/public/harness-meme-prune-itself.png' | relative_url }}){: .meme}

A run is one conversation. Everything every phase reads or writes accumulates in it, and the
orchestrator has no programmatic control over the wrapper it runs in. When context needs pruning
between phases, the only available move is to stop and ask the developer to type `/compact`.

The previous series works around this rather than solving it. Dispatched sub-agents get fresh
context, which is why "judgment runs in fresh context" is a principle. But the orchestrator's own
conversation grows for the length of the run, and the longer the run, the worse its judgment about
its own procedure gets.

An engine threads sessions deliberately. Sequential nodes on one provider inherit the prior
session, parallel nodes start clean, and a node can opt out with `context: fresh`. When a node
resumes an earlier session it forks it rather than mutating it, so a retry cannot corrupt the
transcript it retried from.

None of that can be arranged from inside the conversation. Whatever did the arranging would be
part of what it was arranging.

### Two phases at once

Parallelism inside a phase works. Dispatch several sub-agents in a single turn and they run
concurrently, which is exactly how the review workflow fans its reviewer lanes out.

What cannot overlap is two phases. The orchestrator is one conversation with one turn in flight, so
it dispatches a fan-out, waits for all of it to come back, and only then does anything else.
Independent phases still run in sequence, and a slow one blocks everything behind it whether or not
anything depends on it.

Most of the skeleton genuinely is a straight line, so this costs less than it sounds: you cannot
implement before you plan.

An engine computes topological layers from the dependency edges and fires every independent node in
a layer at once. That falls out of the control flow being a graph instead of a sequence of
prompts.

### Steps that need no intelligence

The guarantee table in [part one of the previous series](/designing-agentic-development-workflows-part-1/)
promises *scripts over inference*: anything decidable deterministically is decided by a script. That
guarantee is real, and smaller than it sounds.

The script is deterministic. Reaching it is not. In an orchestrator skill there is no such thing as
a step the model sits out. Running the test suite means the model reads the procedure, decides this
is the moment, and issues a tool call. The command that finally runs is exact and repeatable.
Everything upstream of it is a judgment about whether to run it at all.

So a phase requiring no intelligence whatsoever still costs a round-trip, still costs tokens, and
still carries some probability of not happening. Individually that probability is small. Across a
twelve-phase skeleton it compounds, and it compounds invisibly, because a step quietly skipped
leaves nothing behind that says so.

Which is why the previous series ends up recommending a tripwire per phase and a guard on every
seam. Those exist to catch a class of failure that only exists because the model is a mandatory
participant in its own control flow.

An engine removes the model from the steps that never needed it. A `bash` or `script` node runs
because the graph says so: no prompt constructed, no tokens spent, no inference, and no way to
skip the step because nothing in the path is capable of deciding to skip it. The orchestration
layer consumes no tokens at all, and the structure is fixed at definition time.

That changes what **deterministic** can mean. In an orchestrator skill it means *the commands are
deterministic*. In an engine it means *the commands are deterministic and so is the decision to run
them*.

![Two lanes. In the orchestrator lane, the model reads the procedure, then a dashed box marks a judgment about whether this is the moment, then the test suite runs; a dotted branch leaves the lane labelled "or not". In the engine lane, the graph leads straight to the same test suite box with nothing in between.]({{ '/public/harness-reaching-the-script.png' | relative_url }})

*Figure 1: The command is identical in both. What differs is whether anything had to decide to reach it.*

One native mechanism escapes this: hooks fire on runtime events without the model choosing to
fire them. But hooks intercept a run, they do not sequence one. They can stop something happening.
They cannot make the next thing happen.

### The order itself

This is the deep one, and [part six of the previous series](/designing-agentic-development-workflows-part-6/)
states it plainly without drawing the full conclusion: an instruction to a language model is a strong
default, never a guarantee, and anything load-bearing needs a script behind it.

The design responds by putting scripts behind the load-bearing parts. The gate check is a script.
The loop referee is a script. The seam guards are scripts. Each converts one instruction into an
enforced rule.

But the *order* is prose. The list of phases, which one follows which, what happens on a failure:
all of it lives in a Markdown file and gets followed because the model is inclined to follow it.
You can guard every seam and still have no guarantee the phases ran in the order the document
describes, because nothing outside the model is tracking which phase comes next.

The scripts are patches over individual holes in a surface made of prose.

![A wide slab representing the phase order written as prose, punched through by four holes. Three holes are covered by small amber plates labelled gate check, loop referee and seam guard. The fourth and largest hole, labelled "which phase comes next", is left open.]({{ '/public/harness-order-is-prose.png' | relative_url }})

*Figure 2: Each script closes one hole. The surface they are fixed to is still prose.*

An engine inverts this. The graph is data, parsed and schema-validated and checked for cycles
before anything runs. The runtime decides which node executes next, and the model is invoked *by* a
node rather than being the thing that decides there is a next node at all. Enforcement stops being
a set of patches and becomes the default state of the medium.

## The one that decides it

A workflow run is a state machine whether or not anyone writes one. It is pending, then running.
It pauses at a gate and has to still be paused tomorrow. It completes, or fails, or is cancelled,
or is abandoned halfway and resumed on Thursday.

Something has to know which of those is true. That something has to survive the process that
started it, be reachable by a process that did not start it, and be trustworthy enough that two
runs cannot both believe they own the same working directory.

That middle clause is the one that catches people out. A skill run non-interactively has a session,
and a session is addressable by whoever holds its id on the machine that has it. A run is
addressable by anyone: a colleague approving a gate from Slack, a dashboard listing what is in
flight, a second process deciding whether the working directory is free. The difference is not
convenience, it is whether the procedure exists anywhere other than inside the process executing
it.

![Two panels. On the left, a session: a dashed process box holding the run, with Slack, a dashboard, another run and tomorrow each connected by a line that stops short and ends in a cross. On the right, a run: an amber database row that all four reach with arrows.]({{ '/public/harness-session-vs-run.png' | relative_url }})

*Figure 3: The difference is not convenience. It is whether the procedure exists anywhere other than inside the process executing it.*

The previous series does implement this:

- a run directory per run;
- a small JSON state file written atomically, temp file then rename, so a crash cannot leave a
  half-written record;
- a phase cursor, so an interrupted run can resume;
- terminal states enumerated deliberately, including awkward ones like done-but-unproven, with a
  principle requiring a report on every one.

That is a state machine. It is also hand-rolled, maintained by the same people trying to write the
workflows, and every gap in it gets discovered in production.

[Part six's](/designing-agentic-development-workflows-part-6/) concurrency limitation is exactly
such a gap. Nothing arbitrates two runs against one checkout, because arbitrating that needs a
lock with an owner and an expiry, which needs a store, which needs something to stay
authoritative when the process holding it dies.

Now look at what a real one contains. An engine's runs live in a database rather than a file,
precisely so more than one process can observe and act on the same run. A row that outlives the
process holding it can double as a lock on the working directory, be resumed by whoever picks it
up, and record what actually happened instead of what a cursor believed. [Part two](/should-you-harness-the-harness-part-2/) takes each
of those apart.

**The choice is not between having a lifecycle and not having one.** It is between adopting one and
writing one, and writing one well means writing a workflow engine badly, incrementally, in the
margins of doing something else.

## What is merely harder

Some things look structural and are not. Saying so is what keeps the list above credible, and these
are the ones I had to argue myself out of.

| Looks structural | What it actually is |
|---|---|
| **Triggering** | `claude -p "/my-workflow LB-123"` runs a skill non-interactively, so a CI job, a webhook or a cron entry can start one |
| **Isolation** | a skill can create a worktree, and the previous series does. What it lacks is a *lock*, and it could shell out to one |
| **Resume** | a run directory and a phase cursor are enough. An engine replaying from an event log is better, not different in kind |
| **Observability** | artifacts are readable after the fact. What is missing is a live event stream: a gap in convenience, not capability |
| **Per-step cost** | no breakdown by phase, only the provider console. Worth having, not worth changing architecture for |

Triggering needs one clarification, because the missing piece is easy to misplace. It is not the
trigger, it is the *run*. A skill started by a cron entry is still a session, and nothing else can
find it, watch it, pause it at a gate or resume it tomorrow. That is the last row of the table
above.

Isolation is the closest call. A second run entering the same worktree is exactly the kind of
failure a skill cannot see coming, but the guard is a script and a skill can call a script. What it
cannot do is *own* the lock, which is the previous problem again.

The cost row has a caveat of its own, and [part three](/should-you-harness-the-harness-part-3/)
has it: what an engine reports per step is not the same as what the run costs you.

## What follows

![The Office meme. Pam holds up two sheets of paper, one reading "A procedure the model agreed to follow" and the other "A procedure that runs." Caption: "Corporate needs you to find the differences between this picture and this picture." Pam says: "They're the same picture."]({{ '/public/harness-meme-same-picture.png' | relative_url }}){: .meme}

Two of these are the same fact seen from either end. Every step runs through the model because the
model holds the control flow, and the control flow is advisory because the thing holding it is a
model. Provider selection, context and parallelism trace back to the same root: the orchestrator is
a participant in the conversation rather than the thing running it.

The last one is different in kind, and it is the one that decides things. The others say what an
orchestrator skill cannot do. That one says what it will make you do instead: maintain a workflow
engine you never set out to write.

All of which is a case for looking at a workflow engine, not for adopting one. Before that question
can be answered, the category needs a definition, because "engine" has been doing a lot of
unexamined work above and most of what is sold under the name is something else.
