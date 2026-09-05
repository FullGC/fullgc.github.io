---
title:    "Should you harness the harness: what the orchestrator skill cannot do"
subtitle: "The limits that are not defects, and do not go away however well you write."
series:   "Should You Harness the Harness"
part:     1
tags:     [ai, agents, workflows, automation, claude-code]
---

[Part six of the previous series](/designing-agentic-development-workflows-part-6/) lists the things
that hurt. Every one of them is a mistake: a gate described in prose instead of enforced by a
script, packaged copies that drifted, two components sharing a schema nobody validated.

All of them are fixable without changing the shape of the design. Write the missing check, delete
the duplicate, add the contract test, and the limitation goes away.

This is the other list.

These are the things that do not go away, because they follow from running the procedure *inside*
the agent session rather than around it. The test for whether something belongs here is one
question: **could a sufficiently disciplined author fix it by writing better skills?** If yes, it is
a defect and belongs in part six's list. If no, it belongs here.

That line is a judgment call, and someone else would draw it slightly differently. The last section
shows the four cases I had to argue myself out of.

## What better skills cannot reach

| The limit | Why no skill reaches it |
|---|---|
| Model, effort, provider | only a dispatched sub-agent can declare a tier; the orchestrator runs on whatever the session runs |
| Its own context window | the thing that would prune the conversation *is* the conversation |
| Two things at once | one conversation, one turn in flight |
| Detached, and triggered | the run is a terminal session, and nothing outside it has a handle to start one |
| Steps that need no intelligence | every step is a tool call some model chose to make |
| The order itself | phase order is prose, followed because the model is inclined to follow it |

### Model, effort, and provider

The first principle in [part two](/designing-agentic-development-workflows-part-2/) states this as a
fact of the runtime rather than a design choice: model and reasoning effort can only be set when a
step is dispatched as a sub-agent. A skill's own metadata does not change what serves it.

That is why the orchestrator is thin. Not because thin is elegant, but because it runs on whatever
model the developer's session happens to be using, and the only way to say "this decision deserves
the strongest model" is to push the decision out into a dispatched agent that can declare a tier.

Turning that constraint into a principle is the right thing to do with a constraint you cannot
remove. It remains a constraint. The orchestrator is the one component whose cost and capability
you cannot specify.

The larger version is the provider, not the model. An orchestrator skill runs inside one harness
and is married to it. Every step is served by whichever vendor's agent the developer happened to
open, and if a step would be better served by a different one there is no way to say so, because
the thing that would have to say it is a guest in the session it would need to replace.

Once the procedure lives outside the session, the coding agent becomes a parameter. Archon resolves
a provider per node and can run planning on Claude and implementation on Codex in the same
workflow, handing context between them explicitly because sessions do not cross providers.
Conductor does the same across Copilot and Claude.

Whether mixing vendors mid-run is a good idea is a separate question, and mostly it will not be.
What matters is that it stops being an architectural impossibility and becomes a line of
configuration.

### Its own context window

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

None of that is expressible from inside the conversation, because the thing that would have to do
the expressing is the conversation.

### Two things at once

The orchestrator issues one prompt at a time. One conversation, one turn in flight, so phases with
no dependency on each other still run in sequence.

The previous series hides this well, because most of the skeleton genuinely is a straight line: you
cannot implement before you plan. The review workflow is the exception that shows the cost. Its
distinctive move is to fan out several reviewer lanes in parallel, and inside an orchestrator skill
that fan-out is sequential underneath. The design describes a parallel shape and executes a serial
one.

An engine computes topological layers from the dependency edges and fires every independent node in
a layer at once. That is not a feature somebody bolted on. It falls out of the control flow being a
graph rather than a sequence of prompts.

### Detached, and triggered

The run occupies the developer's terminal for its duration. It cannot be backgrounded, and nothing
else has a handle to start it. A ticket moving to "ready" cannot begin a run. A pull request
opening cannot begin a run. A person typing into a session is the only available trigger.

[Part five](/designing-agentic-development-workflows-part-5/) describes autonomy as the destination
and treats the remaining distance as a matter of enforcement and classification. That is true of
the *gates*, and it understates the problem. Even with every gate replaced by a policy, an
orchestrator skill still has nobody to invoke it.

Autonomy is not only about removing the human from the approvals. It is about something other than
a human starting the work at all, and that needs a process outliving a terminal session.

### Steps that need no intelligence

The guarantee table in [part one](/designing-agentic-development-workflows-part-1/) promises
*scripts over inference*: anything decidable deterministically is decided by a script. That
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
because the graph says so: no prompt constructed, no tokens spent, no inference, and no way to skip
the step because nothing in the path is capable of deciding to skip it. Microsoft's phrasing is
exact, that the orchestration layer consumes zero tokens and the structure is fixed at definition
time.

That changes what **deterministic** can mean. In an orchestrator skill it means *the commands are
deterministic*. In an engine it means *the commands are deterministic and so is the decision to run
them*.

One native mechanism escapes this and is worth naming: hooks fire on runtime events without the
model choosing to fire them. But hooks intercept a run, they do not sequence one. They can stop
something happening. They cannot make the next thing happen.

### The order itself

This is the deep one, and part six states it plainly without drawing the full conclusion: an
instruction to a language model is a strong default, never a guarantee, and anything load-bearing
needs a script behind it.

The design responds by putting scripts behind the load-bearing parts. The gate check is a script.
The loop referee is a script. The seam guards are scripts. Each converts one instruction into an
enforced rule.

But the *order* is prose. The list of phases, which one follows which, what happens on a failure:
all of it lives in a Markdown file and gets followed because the model is inclined to follow it.
You can guard every seam and still have no guarantee the phases ran in the order the document
describes, because nothing outside the model is tracking which phase comes next.

The scripts are patches over individual holes in a surface made of prose.

An engine inverts this. The graph is data, parsed and schema-validated and checked for cycles
before anything runs. The runtime decides which node executes next, and the model is invoked *by* a
node rather than being the thing that decides there is a next node at all. Enforcement stops being
a set of patches and becomes the default state of the medium.

## The one that decides it

A workflow run is a state machine whether or not anyone writes one. It is pending, then running.
It pauses at a gate and has to still be paused tomorrow. It completes, or fails, or is cancelled,
or is abandoned halfway and resumed on Thursday.

Something has to know which of those is true. That something has to survive the process that
started it, and be trustworthy enough that two runs cannot both believe they own the same working
directory.

The previous series does implement this, and that is worth noticing rather than defending:

- a run directory per run;
- a small JSON state file written atomically, temp file then rename, so a crash cannot leave a
  half-written record;
- a phase cursor, so an interrupted run can resume;
- terminal states enumerated deliberately, including awkward ones like done-but-unproven, with a
  principle requiring a report on every one.

That is a state machine. It is also hand-rolled, maintained by the same people trying to write the
workflows, and every gap in it gets discovered in production.

Part six's concurrency limitation is exactly such a gap. Nothing arbitrates two runs against one
checkout, because arbitrating that needs a lock with an owner and an expiry, which needs a store,
which needs something to stay authoritative when the process holding it dies.

Now look at what a real one contains. Archon's runs live in a database rather than a file,
precisely so more than one process can observe and act on the same run. From that, four things
follow that a file cannot give you:

- **The pending row doubles as a lock** on the working directory, with a five-minute stale window
  to clear rows orphaned by a crashed dispatch.
- **Paused runs resume from another process entirely**, which is what makes a gate answerable from
  Slack.
- **Failed runs replay completed nodes from an event log** rather than trusting a cursor.
- **Ambiguity gets surfaced, not guessed.** When the system cannot tell "running elsewhere" from
  "orphaned by a crash", a deliberate rule says it refuses to decide and tells a person.

None of that is unusual. All of it is the ordinary content of a workflow engine, and none of it is
reachable from a Markdown file.

**The choice is not between having a lifecycle and not having one.** It is between adopting one and
writing one, and writing one well means writing a workflow engine badly, incrementally, in the
margins of doing something else.

## What is merely harder

Some things look structural and are not. Saying so is what keeps the list above credible, and these
are the four I had to argue myself out of.

| Looks structural | What it actually is |
|---|---|
| **Isolation** | a skill can create a worktree, and the previous series does. What it lacks is a *lock*, and it could shell out to one |
| **Resume** | a run directory and a phase cursor are enough. An engine replaying from an event log is better, not different in kind |
| **Observability** | artifacts are readable after the fact. What is missing is a live event stream: a gap in convenience, not capability |
| **Per-step cost** | no breakdown by phase, only the provider console. Worth having, not worth changing architecture for |

Isolation is the one I kept wanting to promote. It feels structural, because a second run entering
the same worktree is exactly the kind of failure a skill cannot see coming. But the guard is a
script, and a skill can call a script. What a skill cannot do is *own* the lock, which is the
lifecycle problem again rather than an isolation problem.

The per-step cost row comes with a caveat worth carrying forward: Archon counts node cost and not
the overhead of the coding agent that invoked it, and that gap can reach forty percent.

## What follows

Two of these are the same fact seen from either end. Every step runs through the model because the
model holds the control flow, and the control flow is advisory because the thing holding it is a
model. Provider selection, context, parallelism and triggering all trace back to the same root: the
orchestrator is a participant in the conversation rather than the thing running it.

The lifecycle is different in kind, and it is the one that decides things. The others say what an
orchestrator skill cannot do. That one says what it will make you do instead.

Which is the honest summary. An orchestrator skill is a procedure a model has agreed to follow.
That is worth a great deal, and it is not the same as a procedure that runs.

All of which is a case for looking at a workflow engine, not for adopting one. Before that question
can be answered, the category needs a definition, because "engine" has been doing a lot of
unexamined work above and most of what is sold under the name is something else.
