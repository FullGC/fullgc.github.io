---
title:      "Should you harness the harness: what a workflow engine actually is"
part_title: "What a workflow engine actually is"
subtitle:   "The inversion that makes the difference, the machinery that follows from it, and which tools actually qualify."
series:     "Should You Harness the Harness"
part:       2
tags:       [ai, agents, workflows, automation, claude-code]
---

Part one asserted a good deal about "an engine". That provider resolves per node. That sessions get
forked rather than mutated. That independent nodes fire at the same time. That a run is a row in a
database with a lock on it.

Every one of those was a claim the reader had to take on trust. This part pays that debt.

*Assumes part one's list of limits, and the vocabulary of the previous series: orchestrator, skill,
sub-agent, gate, run state.*

## The inversion

An orchestrator skill is a document the model reads. The model holds the procedure, decides which
phase comes next, and issues the tool calls. The procedure is a passenger in the conversation.

A workflow engine turns that inside out. The procedure is a program: it runs in its own process, it
holds the control flow, and when it needs intelligence it *invokes* the coding agent, waits, and
moves on.

The agent is no longer the thing running the workflow. It is a subroutine the workflow calls.

|  | Orchestrator skill | Workflow engine |
|---|---|---|
| Who decides the next step | the model, reading prose | the runtime, reading a graph |
| Where the procedure lives | a Markdown file, in the session | a validated file, in its own process |
| Where results accumulate | the conversation | run state on disk |
| Model and provider | whatever the session is running | resolved per node |
| Steps with no model in them | none | `bash` and `script` nodes |
| A run ends when | the terminal closes | it reaches a terminal state |

Everything below is a consequence of that table rather than a separate thing somebody built. Once
the procedure lives outside the session, the session becomes a parameter: pick which one, run six
at once, restart one that died, start one when nobody is at a keyboard.

Two tools carry most of the examples below.
[**Archon**](https://github.com/coleam00/Archon) is an open-source harness builder: YAML workflow
graphs over a TypeScript runtime, a git worktree per run, adapters for Slack, GitHub and a web
console. [**Microsoft Conductor**](https://github.com/microsoft/conductor) does the same job in a
smaller MIT-licensed Python CLI, with
[no LLM in the orchestration loop](https://opensource.microsoft.com/blog/2026/05/14/conductor-deterministic-orchestration-for-multi-agent-ai-workflows/).
Archon appears most often because it is the tool this series was written around.

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
halfway through a run. The machinery is unremarkable, a schema validator and a standard topological
sort, and part three walks through one implementation.

The equivalent in an orchestrator skill is a numbered list in Markdown. Nothing to validate,
because there is no schema, because it is prose. A phase referring to an artifact no earlier phase
produces reads perfectly well and fails at three in the afternoon.

So the first thing an engine buys is also the least discussed: **the control flow becomes the kind
of thing that can be wrong in a way a machine can detect.**

### Parallelism nobody had to design

Because dependencies are declared rather than narrated, the engine can work out which nodes have
nothing left to wait for and run all of them at once. Archon computes topological layers and fires
each concurrently; Conductor calls the same idea parallel groups.

Parallelism is not a feature here, it is a property of having written the dependencies down. The
three-reviewer fan-out that runs sequentially inside an orchestrator skill runs in parallel for the
same reason a build system compiles independent files in parallel: the graph already says they are
independent.

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

That right-hand column is the determinism argument, and it is easy to overclaim, so it is worth
making carefully.

Part one of the previous series promised *scripts over inference*: anything decidable
deterministically gets decided by a script. That promise was true and smaller than it sounded. The
script was deterministic. **Reaching** it was not, because reaching it meant a model reading a
procedure and choosing to make the call.

An engine closes exactly that gap. A `bash` node runs because the graph says it runs. No prompt, no
inference, no decision, and therefore no chance of the step being skipped, because nothing in the
path is capable of skipping it.

The command is repeatable, and so is the decision to issue it. That is what these tools advertise
about themselves: Conductor keeps no LLM in the orchestration loop, and Bernstein, a fixed pipeline
from goal to merge, claims zero LLM tokens spent on coordination at all.

So **"deterministic" means something stronger here than it can mean in a skill.** In a skill, the
commands are deterministic. In an engine, the commands are deterministic and so is the sequence,
with intelligence confined to the nodes that asked for it.

### The run outlives the session

Part one argued that a workflow run is a state machine whether or not anyone writes one, and that
writing your own means writing a workflow engine badly, in the margins of doing something else.
This is the part an engine has already written.

A run is a record in durable storage with a status on it. What matters is not that the status
exists but what putting it somewhere authoritative allows:

- **The record can be a lock.** A run reserving the working directory it occupies stops a second
  run entering a worktree that is already busy. That is part six's concurrency limitation,
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

### Detached, and startable by something other than a person

Two more capabilities fall out of the run having its own process, and these change what a workflow
is *for*.

**It can run detached.** Starting one hands back an identifier you can poll, or an event stream you
can subscribe to, and the run proceeds whether or not anyone is watching.

**It can be triggered.** Once a run begins with an API call, a Jira label moving to "ready for AI"
can begin one, so can a pull request opening, so can a cron schedule. That is the tenth
prerequisite from [part five of the previous series](/designing-agentic-development-workflows-part-5/),
the one item on that list better skills cannot supply.

The platform surface follows the same logic. Once a run id and an event stream exist, a Slack
adapter, a web dashboard and a GitHub integration are all clients of the same state. That is a real
gain in run-level observability: progress, status and cost per node, history across runs. Whether
it is the kind of observability engineers actually missed is a different question.

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
protect against at all, which part four returns to.

## Where the boundary is

Plenty of things called workflow engines really are workflow engines. n8n is one. LangGraph is one.
The question is narrower than that, and it has two parts: does the tool **hold the control flow
outside the model**, and can it **run a step in your checkout without a model in the path**?

| Category and examples | Control flow outside the model | Non-model steps in your repo |
|---|---|---|
| Coding-workflow engines: Archon, Conductor, Bernstein | yes | yes |
| In-harness scripting: Claude Code dynamic workflows | yes | no |
| Parallel-session supervisors: Claude Squad, Emdash, Vibe Kanban, Baton | no | not applicable |
| Graph frameworks: LangGraph | yes | only if you build it |
| Agent-loop builders: CrewAI, AutoGen, LangFlow, Flowise, Dify | varies | only if you build it |
| General automation: n8n | yes | no |

Only the top row does both, and the rest of this section is about why the near misses miss.

### The harness grew one of its own

Claude Code's [dynamic workflows](https://code.claude.com/docs/en/workflows) are the same inversion
turning up from the inside: a JavaScript script a runtime executes, where the documentation's own
comparison table answers "who decides what runs next" with *the script*, against the *Claude, turn
by turn* it gives for subagents, skills and agent teams. Results stay in script variables, fan-out
is genuinely concurrent, and a run proceeds in the background.

Three things keep it a different animal:

- **The script cannot touch the filesystem or the shell.** Agents read, write and run commands; the
  script only coordinates them. So the control flow became deterministic and the steps did not,
  which is exactly half of the argument above, and the half that costs tokens.
- **Nothing except a person can start a run.**
- **The lifecycle is scoped to the session** rather than durable.

Two practical objections follow. You do not author the thing: Claude writes a script per task, so
what you would want to review, version and constrain gets generated rather than declared. And it is
expensive by design, up to sixteen agents at once and a thousand per run, with a warning when a run
passes twenty-five agents or a projected 1.5 million tokens.

Useful, then, for a genuinely large one-off: a codebase-wide audit, a five-hundred-file migration.
Not the same tool as a pipeline you wrote down, that runs a test suite as a step nothing can skip,
and that starts when a ticket moves.

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
[survey of nine such tools](https://www.augmentcode.com/tools/open-source-agent-orchestrators) puts
it plainly: coordination is either manual or limited to task-graph scheduling within one repo, and
only two of the nine model a multi-step pipeline as a graph at all.

### Graph frameworks, and agent-loop builders

[LangGraph](https://github.com/langchain-ai/langgraph) deserves a fairer description than slide
decks usually give it. It is not the non-deterministic alternative to a deterministic engine: it
has typed state, explicit nodes and edges, conditional routing, checkpointers that persist state
after every node, and an `interrupt` primitive for human review. The same primitives listed above.

The objection is not that LangGraph is agentic, and not that it fails the first test: it passes
that one comfortably. It fails the second. LangGraph is a library for building a stateful
application, with no notion of your repository, your shell, your worktrees, or a coding agent as a
callable step. Its checkpointers persist conversational state to Postgres or Redis and know
nothing about a working copy. You would not adopt it, you would use it to *build* the engine, and
then you would own the engine, which is the outcome part one warned about.

The agent-loop builders are the largest and most confusing group, because the marketing language is
identical. [CrewAI](https://github.com/crewAIInc/crewAI), AutoGen, LangFlow, Flowise and Dify all
describe themselves in terms of agentic workflows. What they mostly build is a set of cooperating
agents and a loop that runs until something decides it is done: AutoGen is explicit that its agents
interact in a free-form group chat rather than a fixed sequence. Some, CrewAI in particular, do
offer deterministic flows alongside the crews.

But the object under construction is an AI application, and the LangGraph objection lands here too.
If your test suite is a shell command that has to run in a checkout, none of them has anywhere to
put it.

That is the honest shape of the field as of writing, and the part of this article most likely to
age badly. The taxonomy should outlast the names in it.

## What follows

An engine is a real dependency:

- a process to run
- a schema to learn
- YAML to maintain
- a layer between you and the agent you were talking to five minutes ago

Nothing above argues you should adopt one. It argues that the category is coherent, that its capabilities follow from a single
inversion rather than a pile of features, and that most of what is marketed alongside it is not in
it.

Part three is about Archon specifically: how one real implementation validates a graph, resolves a
provider, forks a session, classifies an error and recovers a failed run.
