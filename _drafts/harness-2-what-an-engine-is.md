---
title:      "Should you harness the harness: what a workflow engine actually is"
part_title: "What a workflow engine actually is"
subtitle:   "The inversion that makes the difference, the machinery that follows from it, and which tools actually qualify."
series:     "Should You Harness the Harness"
part:       2
tags:       [ai, agents, workflows, automation, claude-code]
---

Part one described a procedure that lives inside the agent session, and the limits that follow from
it living there. This part is about the alternative, and about how little of what is sold as the
alternative actually is one.

A **workflow engine** is a program that holds the procedure and calls the coding agent when it
needs intelligence. That is the whole definition. Everything separating an engine from a skill
follows from it, including the two things it will cost you.

Part one also made promises about engines that it never justified: provider resolved per node,
sessions forked rather than mutated, a run that outlives the process which started it. Those get
cashed here.

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
| A run ends when | the process that started it exits | it reaches a terminal state |

Everything below is a consequence of that table rather than a separate thing somebody built. Once
the procedure lives outside the session, the session becomes a parameter: pick which one, run six
at once, restart one that died, hand a paused one to somebody else.

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
sort, and part four walks through one implementation.

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

### A run anything can address

It is worth being careful here, because the obvious version of this claim is wrong. A skill can be
started without a person: non-interactive mode expands a skill invocation in the prompt string,
there is a flag for suppressing permission prompts when nobody is there to answer, and driving the
whole thing from a CI job is documented. Triggering is not the discriminator.

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
protect against at all, which the last part returns to.

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
| A script or CI pipeline you wrote | yes | **yes**, up to a point |

The top row does both by design. The bottom row deserves a pause, because it also does both and is
not an engine: a `Makefile` or a CI job calling the coding agent per step has real control flow,
real model-free steps, and a run with an id and logs anybody can read. What it lacks is anything
that understands coding agents, which is the distinction the last part turns on.

The rest of this section is about the rows in between, and why the near misses miss.

### What the inversion costs

Everything above is the case for. An article that stops there is a brochure, and the two costs
below are not teething problems: one is the same property the whole argument rests on, seen from
the other side, and the other is not about the engineering at all.

### Enforceability and steerability are one thing

The control flow is data, fixed at definition time, not negotiable by a model. That is the reason
to trust it. It is also the reason it is unpleasant to work with.

When the harness is the caller, a developer cannot lean over and say skip this gate, I know exactly
what this diff is, or ask me before you push from now on, or try it the other way. The thing that
was a sentence in a chat becomes a pull request against a YAML file.

Which of those two readings you find obvious depends on where you sit:

| | What they see | What they conclude |
|---|---|---|
| Whoever owns the process | a procedure that cannot be talked out of halfway through | the fixed control flow *is* the product |
| The developer at the keyboard | a procedure that cannot be talked to at all | a straitjacket where a sentence used to do |

Neither is wrong, and no amount of tooling resolves it, because it is one property with two signs.
It also runs backwards: the orchestrator skill a developer finds pleasantly steerable is the one a
platform owner cannot rely on.

### The interop has to stay open

An engine is, by construction, headless third-party non-interactive use of somebody else's coding
agent. That is the usage pattern a model vendor has the clearest incentive to treat differently,
and it is the first one anybody would restrict.

This is not hypothetical. In May 2026 Anthropic announced that programmatic use of Claude, the
Agent SDK, `claude -p`, GitHub Actions and third-party apps, would leave the flat-rate subscription
for a separate metered credit, while use through its own chat apps and CLI stayed where it was. The
change was
[paused](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
on the day it was due to take effect, and paused is the word Anthropic used: a revised plan is
still promised. The point is not what happened to it. The point is where the line was drawn, which
is exactly where a person typing stops and a program calling starts.

The usual reassurance is that the provider is a line of configuration, so you can move. That is
sound about **models** and close to worthless about **access terms**, because every vendor shipping
a coding agent faces the same incentive. Switching does not escape a policy they all converge on.

It can also invert the main selling point. Best model per node assumes every vendor's best is
reachable from a neutral caller. If one vendor's strongest tier works best through its own harness
and another's does too, a neutral engine is not getting the best of both, it is getting whatever
each is willing to expose to outsiders.

None of that is an argument against engines. It is the thing you are accepting when you adopt one,
and it belongs on the same page as the benefits.

## The harness grew one of its own

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

Nothing above argues you should adopt one. It argues that the category is coherent, that its
capabilities follow from a single inversion rather than a pile of features, that it carries two
costs worth naming out loud, and that most of what is marketed alongside it is not in it.

Part three is about Archon specifically: what it is, how you start a run, and what its five claims
for itself actually rest on. Part four goes underneath, into how one real implementation validates
a graph, resolves a provider, forks a session, classifies an error and recovers a failed run. Part
five is the question this series is named for, and it is not a question about Archon.
