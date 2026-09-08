---
title:      "Should you harness the harness: what a workflow engine actually is"
part_title: "What a workflow engine actually is"
subtitle:   "The inversion that makes the difference, the machinery that follows from it, and which tools actually qualify."
series:     "Should You Harness the Harness"
part:       2
description: >-
  What separates a workflow engine from an orchestrator skill, what that one inversion
  buys, and how little of what is sold as an engine actually qualifies.
permalink:  /should-you-harness-the-harness-part-2/
date:       2026-09-08 10:00:00
tags:       [ai, agents, workflows, automation, claude-code, harness]
image:      /public/harness-the-inversion.png
banner:     false
image_w:    1024
image_h:    572
---

[Part one](/should-you-harness-the-harness-part-1/) described a procedure that lives inside the
agent session, and the limits that follow from it living there. This part is about the
alternative, and about how little of what is sold as the alternative actually is one.

A **workflow engine** is a program that holds the procedure and calls the coding agent when it
needs intelligence. That is the whole definition. Everything separating an engine from a skill
follows from it, including the two things it will cost you.

*Assumes part one's list of limits, and the vocabulary of the previous series: orchestrator, skill,
sub-agent, gate, run state.*

## The inversion

An orchestrator skill is a document the model reads. The model holds the procedure, decides which
phase comes next, and issues the tool calls. The procedure is a passenger in the conversation.

A workflow engine turns that inside out. The procedure is a program: it runs in its own process, it
holds the control flow, and when it needs intelligence it *invokes* the coding agent, waits, and
moves on.

The agent is no longer the thing running the workflow. It is a subroutine the workflow calls.

![Two panels. On the left, an orchestrator skill: a dashed boundary labelled "the conversation" contains the model, the procedure it reads, and the tool calls it issues. On the right, a workflow engine: an amber box labelled "the program" holds a graph and sits above a smaller separate box labelled "coding agent", with arrows down to it labelled "invokes" and back up labelled "result".]({{ '/public/harness-the-inversion.png' | relative_url }})

*Figure 1: The agent is no longer the thing running the workflow. It is a subroutine the workflow calls.*

|  | Orchestrator skill | Workflow engine |
|---|---|---|
| Who decides the next step | the model, reading prose | the runtime, reading a graph |
| Where the procedure lives | a Markdown file, in the session | a validated file, in its own process |
| Where results accumulate | the conversation | run state on disk |
| Model and provider | whatever the session is running | resolved per node |
| Steps with no model in them | none | `bash` and `script` nodes |
| A run ends when | the process that started it exits | it reaches a terminal state |

Everything below follows from that table. Outside the session, which agent serves a step becomes a
setting, and the run becomes an object: run six at once, restart one that died, hand a paused one
to somebody else.

[**Archon**](https://archon.diy) carries most of the examples below. It is a workflow engine, and
the one we have been evaluating; parts three and four cover it properly. [**Microsoft
Conductor**](https://github.com/microsoft/conductor) was released more recently and looked
suspiciously similar.

## What the inversion buys

### The graph is data, and it is checked before anything runs

A workflow definition describes nodes and the edges between them:

```yaml
- id: implement
  type: command
  command: build-feature
  depends_on: [plan]
```

The engine parses that, validates it against a schema, and topologically sorts it to prove there
are no cycles. A workflow referring to a node that does not exist fails at load time rather than
halfway through a run. The machinery is unremarkable, a schema validator and a standard
topological sort, and [part four](/should-you-harness-the-harness-part-4/) walks through one
implementation.

The equivalent in an orchestrator skill is a numbered list in Markdown. Nothing to validate,
because there is no schema, because it is prose. A phase referring to an artifact no earlier phase
produces reads perfectly well and fails at three in the afternoon.

So the first thing an engine buys is also the least discussed: **the control flow becomes
something a machine can check.**

### Parallelism nobody had to design

Because dependencies are declared rather than narrated, the engine can work out which nodes have
nothing left to wait for and run all of them at once. Archon computes topological layers and fires
each concurrently; Conductor calls the same idea parallel groups.

Parallelism here is a property of having written the dependencies down. An orchestrator skill
runs independent phases one after another because its conversation is serial. An engine runs them
together, for the same reason a build system compiles independent files together: the graph
already says they do not depend on each other.

![Two stages. On the left, six nodes scattered with dependency arrows between them: plan, test, lint, implement, review, publish. On the right, the same six sorted into four layers, with test and lint sharing one amber-banded layer marked "one layer, fired at once".]({{ '/public/harness-topological-layers.png' | relative_url }})

*Figure 2: Nobody designed the parallelism. It is what writing the dependencies down already told you.*

### The nodes with no model in them

Vocabularies differ across tools; the set does not.

| Node kind | What it does | Model in the path |
|---|---|---|
| Command | runs a packaged instruction through the coding agent | yes |
| Prompt | sends an ad-hoc instruction | yes |
| Bash / script | runs a command or a file | **no** |
| Loop | repeats a sub-graph until a check passes | **no** |
| Approval | pauses and waits for a person | **no** |
| Cancel | stops the run | **no** |

That right-hand column is the determinism argument, and it is easy to overclaim.
[Part one of the previous series](/designing-agentic-development-workflows-part-1/) promised
*scripts over inference*: anything decidable deterministically gets decided by a script. That
promise was true and smaller than it sounded. The script was deterministic. **Reaching** it was
not, because reaching it meant a model reading a procedure and choosing to make the call.

An engine closes exactly that gap. A `bash` node runs because the graph says it runs. No prompt, no
inference, no decision, and therefore no chance of the step being skipped, because nothing in the
path is capable of skipping it.

The command is repeatable, and so is the decision to issue it. That is what these tools advertise
about themselves: Conductor keeps [no LLM in the orchestration loop](https://opensource.microsoft.com/blog/2026/05/14/conductor-deterministic-orchestration-for-multi-agent-ai-workflows/),
and **Bernstein**, a fixed pipeline from goal to merge, claims zero LLM tokens spent on coordination
at all.

So **"deterministic" means something stronger here than it can mean in a skill.** In a skill, the
commands are deterministic. In an engine, the commands are deterministic and so is the sequence,
with intelligence confined to the nodes that asked for it.

### The run outlives the session

Part one argued that a workflow run is a state machine whether or not anyone writes one, and that
writing your own means writing a workflow engine badly, in the margins of doing something else.
This is the part an engine has already written.

A run is a record in durable storage with a status on it. What matters is what putting that status
somewhere authoritative allows:

- **The record can be a lock.** A run reserving the working directory it occupies stops a second
  run entering a worktree that is already busy. That is [part six's](/designing-agentic-development-workflows-part-6/) concurrency limitation,
  addressed at the only level where it can be.
- **A paused run outlives its process.** An approval node writes the status and stops; another
  process, a chat command or an HTTP call picks it up later. That is the mechanical reason a gate
  can be answered from a phone.
- **A failed run can replay.** Completed nodes emit an event as they finish, so a restart consults
  what actually happened rather than a cursor recording where the run believed it was.
- **Ambiguity can be surfaced rather than guessed.** When the system cannot tell "running
  elsewhere" from "orphaned by a crash", it can refuse to decide and say so. Easy to state, easy to
  leave out, and hand-rolled state machines leave it out.

None of this is exotic. It is the ordinary content of a workflow engine, and none of it is
reachable from a Markdown file.

### A run anything can address

The obvious version of this claim is wrong. A skill can be started without a person:
non-interactive mode expands a skill invocation in the prompt string, there is a flag for
suppressing permission prompts when nobody is there to answer, and driving the whole thing from a
CI job is documented. Triggering is not the discriminator.

What an engine adds is that the thing started has an identity outside the process running it.
Starting a run hands back an id and an event stream, and from there:

- a colleague can approve a gate from Slack, on a run executing on somebody else's laptop;
- a dashboard can list what is in flight without asking the processes;
- a second run can discover that the working directory is taken;
- a failed run can be resumed by whichever process picks it up.

The platform surface follows from the same fact. Once a run id and an event stream exist, a Slack
adapter, a web dashboard and a GitHub integration are all clients of the same state rather than
separate integrations. That is a real gain in run-level observability: progress, status and cost
per node, history across runs. Whether it is the kind of observability engineers actually missed is
a different question.

### Provider, model and context, per node

An orchestrator skill runs on whatever the developer's session happens to be using. Its only lever
on model choice is pushing work into a dispatched sub-agent that declares its own tier.

An engine settles all three per node:

- **Model** resolves through a priority chain: the node's setting, the workflow's default, then
  config. Archon states the consequence flatly, that the model of the session invoking the engine
  has no influence whatsoever on the model serving a node. Conductor supports per-agent overrides
  across Copilot and Claude.
- **Provider** is the larger version of the same point. Sessions do not cross vendors, so context
  must be handed over explicitly, but nothing stops you planning on one agent and implementing on
  another. Mostly that is a bad idea. What matters is that it stops being architecturally
  impossible and becomes a line of configuration.
- **Context** is threaded deliberately. Sequential nodes on one provider can inherit the previous
  session; parallel nodes start clean; a node can demand a fresh one. The subtle part is resume: a
  node continuing an earlier session should *fork* that transcript rather than mutate it, so a
  retry cannot corrupt the history it retried from.

The provider argument is also the standard reason an engine is said to survive a vendor changing
its terms. It is a real argument about *models*, and there is a kind of vendor change it does not
protect against at all, which the next section opens and [part five](/should-you-harness-the-harness-part-5/) settles.

## What the inversion costs

Neither of these gets better as the tools mature. One is the property the whole argument rests on,
seen from the other side. The other is not about the engineering at all.

### Enforceability and steerability are one thing

![The two buttons meme. A sweating man agonises over two buttons, one labelled "a procedure I can talk out of anything" and the other "a procedure nobody can talk out of anything".]({{ '/public/harness-meme-two-buttons.png' | relative_url }}){: .meme}

The control flow is data, fixed at definition time, not negotiable by a model. That is the reason
to trust it. It is also the reason it is unpleasant to work with.

When the harness is the caller, a developer cannot lean over and say skip this gate, I know exactly
what this diff is, or ask me before you push from now on, or try it the other way. The thing that
was a sentence in a chat becomes a pull request against a YAML file.

It runs backwards too: the orchestrator skill a developer finds pleasantly steerable is the one a
platform owner cannot rely on. One property, two signs, and no amount of tooling resolves it.

Which of the two signs you notice depends on where you sit, which turns out to matter for
adopting an engine more than any feature does. [Part five](/should-you-harness-the-harness-part-5/)
takes it up there, as a decision criterion.

### The interop has to stay open

An engine calls somebody else's coding agent headlessly, from outside, with nobody at the
keyboard. Of every way to use a coding agent, that is the one a vendor has the clearest reason to
price or fence off separately. This is not hypothetical: Anthropic has already drafted a policy
drawing the line in exactly that place, then paused it before it took effect.

That cuts against the section above. Resolving a provider per node is a real answer to a
model being wrong for a step, and no answer at all to a vendor changing who is allowed to call
it. [Part five](/should-you-harness-the-harness-part-5/) has the dates, the amounts, and why
switching does not escape it.

None of that is an argument against engines. It is the thing you are accepting when you adopt one,
and it belongs on the same page as the benefits.

## Where the boundary is

Plenty of things called workflow engines really are workflow engines. **n8n** is one. **LangGraph**
is one. The question is narrower than that, and it has two parts: does the tool **hold the control flow
outside the model**, and can it **run a step in your checkout without a model in the path**?

| Category and examples | Control flow outside the model | Non-model steps in your repo |
|---|---|---|
| Coding-workflow engines: Archon, Conductor, Bernstein | yes | yes |
| In-harness scripting: Claude Code dynamic workflows | yes | no |
| Parallel-session supervisors: Claude Squad, Emdash, Vibe Kanban, Baton | no | not applicable |
| Graph frameworks: LangGraph | yes | only if you build it |
| Agent-loop builders: CrewAI, AutoGen, LangFlow, Flowise, Dify | varies | only if you build it |
| General automation: n8n | yes | no |
| A script or CI pipeline you wrote | yes | **yes**, up to a point |

The top row does both by design. The bottom row also does both, and is not an engine: a
`Makefile` or a CI job calling the coding agent per step has real control flow, real model-free
steps, and a run with an id and logs anybody can read. What it lacks is anything that understands
coding agents, which is the distinction [part five](/should-you-harness-the-harness-part-5/)
turns on.

![A two-by-two chart. The horizontal axis is whether control flow is held outside the model; the vertical is whether a step can run in your checkout with no model in the path. Only the top right quadrant, shaded amber, holds coding-workflow engines and a script or CI pipeline you wrote. In-harness scripting, general automation and graph frameworks sit bottom right; parallel-session supervisors sit bottom left. The top left quadrant is empty.]({{ '/public/harness-two-tests.png' | relative_url }})

*Figure 3: Each near miss fails a different axis, which is why the marketing language cannot tell them apart.*

The rest of this section is about the rows in between, and why the near misses miss.

### The harness grew one of its own

![A screenshot of Anthropic's dynamic workflows announcement, two passages highlighted. The first: "Dynamic workflows are built for parallel and long-running work that can extend into hours and days." The second: "dynamic workflows consume meaningfully more usage than a typical Claude Code session."]({{ '/public/harness-dynamic-workflows.png' | relative_url }}){: .float-right}

Claude Code's [dynamic workflows](https://code.claude.com/docs/en/workflows) are the same inversion
turning up from the inside: a JavaScript script a runtime executes, where the documentation's own
comparison table answers "who decides what runs next" with *the script*, against the *Claude, turn
by turn* it gives for subagents, skills and agent teams. Anthropic names both halves of the trade
itself: built for parallel and long-running work extending into hours and days, and consuming
meaningfully more usage than a typical Claude Code session.

Four things keep it a different animal:

- **The script cannot touch the filesystem or the shell.** Agents read, write and run commands; the
  script only coordinates them. So the control flow became deterministic and the steps did not,
  which is half the argument above, and the half that costs tokens.
- **Nothing but a person can start a run.**
- **The lifecycle is scoped to the session** rather than durable.
- **You do not author it.** Claude writes the script per task, so what you would want to review,
  version and constrain gets generated rather than declared.

That makes it the right tool for what it says it is for, a long one-off audit or migration running
into the hours, with a warning at twenty-five agents or a projected 1.5 million tokens. It is the
wrong one for a pipeline you wrote down, that runs a test suite as a step nothing can skip, and
that starts when a ticket moves.

### Parallel-session supervisors

Run N agents in N git worktrees, show them on a board or in a TUI, let a human decide what to look
at and what to merge. The interface is the only thing that really varies:

- **Claude Squad**: a terminal UI over tmux sessions
- **Emdash**: an Electron app, with ticket intake from Linear, Jira and GitHub
- **Vibe Kanban**: a web board, one worktree per workspace
- **Baton**: a CLI that polls GitHub issues and dispatches

These are genuinely useful, and they are not engines, because there is no pipeline. Coordination is
manual, sequencing is a human choosing which session to click, and one worktree per agent is the
*only* structural thing they share with an engine. Augment's
[survey of nine such tools](https://www.augmentcode.com/tools/open-source-agent-orchestrators)
puts it plainly: coordination is either manual or limited to task-graph scheduling within one
repo, and only two of the nine model a multi-step pipeline as a graph at all.

### Graph frameworks, and agent-loop builders

![The "Is this a pigeon?" meme. A man in a suit, labelled "Is this a workflow engine", gestures at a butterfly labelled "a loop of agents talking in a group chat".]({{ '/public/harness-meme-is-this-an-engine.png' | relative_url }}){: .meme}

[LangGraph](https://github.com/langchain-ai/langgraph) deserves a fairer description than slide
decks usually give it, which cast it as the loose agentic alternative to a rigorous engine. It
has typed state, explicit nodes and edges, conditional routing, checkpointers that persist state
after every node, and an `interrupt` primitive for human review. The same primitives listed
above.

So it passes the first test comfortably, and fails the second. LangGraph is a library for building
a stateful application, with no notion of your repository, your shell, your worktrees, or a coding
agent as a callable step. Its checkpointers persist conversational state to Postgres or Redis and
know nothing about a working copy. You would not adopt it, you would use it to *build* the engine,
and then you would own the engine, which is the outcome part one warned about.

The agent-loop builders are the largest and most confusing group, because the marketing language
is identical. [**CrewAI**](https://github.com/crewAIInc/crewAI), **AutoGen**, **LangFlow**,
**Flowise** and **Dify** all describe themselves in terms of agentic workflows. What they mostly build is a set of
cooperating agents and a loop that runs until something decides it is done: AutoGen is explicit
that its agents interact in a free-form group chat rather than a fixed sequence. Some, CrewAI in
particular, do offer deterministic flows alongside the crews.

But the object under construction is an AI application, and the LangGraph objection lands here too.
If your test suite is a shell command that has to run in a checkout, none of them has anywhere to
put it.

That is the honest shape of the field as of writing, and the part of this article most likely to
age badly. The taxonomy should outlast the names in it.