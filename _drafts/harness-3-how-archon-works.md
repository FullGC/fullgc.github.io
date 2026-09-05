---
title:      "Should you harness the harness: how Archon works"
part_title: "How Archon works"
subtitle:   "A workflow engine from the inside, and an honest account of why it was not adopted."
series:     "Should You Harness the Harness"
part:       3
tags:       [ai, agents, workflows, automation, claude-code]
---

Part two made a set of claims about engines in general. This part checks them against one real
implementation, because a category argument is worth what its examples are worth.

The surprise, going in, was how little of the code is about graphs. Topological sorting is a
first-year algorithm and it takes maybe fifty lines. Almost everything else is bookkeeping: who
holds the lock, what counts as a fatal error, what happens when a process dies without saying so.

That turns out to be the honest description of a workflow engine. **The DAG is the part you would
write in an afternoon. The rest is the part you would get wrong for a year.**

*Assumes part two's vocabulary: node, layer, run state, provider resolution.*

## What Archon is, and what it used to be

[Archon](https://github.com/coleam00/Archon) calls itself "the command layer for your AI coding
agents". It runs on Bun and TypeScript over SQLite or Postgres, drives the Claude Code and Codex
SDKs, and can be triggered from a terminal, Slack, Telegram, a GitHub comment or a web console.
Workflows are YAML DAGs and each run gets its own git worktree.

One connection is worth naming before going further, because it is not a neutral encounter between
a methodology and a tool. Archon is built by Cole Medin, whose plan-implement-validate loop is the
spine of the skeleton in
[part one of the previous series](/designing-agentic-development-workflows-part-1/), and whose
context-engineering work sits upstream of that. The procedure the first series described and the
engine this one evaluates come from the same person, arriving by different routes.

There is a second piece of history, and knowing it will save you some confusion, because Archon has
not always been this. It started as a Python agent-builder: a tool for constructing Pydantic AI and
LangGraph agents. In April 2026 that codebase was archived and the project rewritten from scratch
in TypeScript as a harness builder, with the original
[spun off into its own repository](https://github.com/Decentralised-AI/Archon-agent-builder). A
good deal of the old vocabulary survived the rewrite, so if you know LangGraph you will keep
expecting semantics that are not there.

Having followed his work since the start of the year, that rewrite reads to me less like a change
of direction than a conclusion. The move is from building agents to constraining them. Once the
methodology was written down as prompts, rules and phases, the next step was to stop asking a model
to follow it.

## How you actually run one

Part two treated "the engine invokes the coding agent" as an abstraction. In practice there are
several front doors, and which one you use changes the experience more than it changes the run.

**Through the coding agent, via the Archon skill.** This is the recommended route and the one that
makes the whole thing palatable. The setup wizard copies an Archon skill into your target
repository, so you keep working in Claude Code from your own project and simply say what you want.
The agent picks a workflow, dispatches it in the background, and reports back. A run I have a
transcript of reads:

![A chat thread. The user types "implement communications system". Archon replies that it is starting archon-comprehensive-pr-review, dispatches it in the background, and later reports the workflow complete: 9 of 9 nodes in 25.5 minutes, with a summary of what the agent did.]({{ '/public/archon-dispatch.png' | relative_url }})

*Figure 1: One prompt, nine nodes, twenty-five minutes, and a session that stayed free the whole time. The worktree path is in the header.*

Note what that is: the coding agent driving the engine that drives coding agents. The session you
are typing in never blocks for twenty-five minutes, and the run survives independently of it.

**Through the CLI.** `archon serve` starts the web console, `archon workflow list` shows what is
available, `archon doctor` runs diagnostics. Install is a Homebrew formula, a shell installer, or a
clone and `bun install`.

**Through the web console.** A Mission Control dashboard with run history filtered by project,
status and date, a capacity indicator, per-run duration, and a source column recording whether each
run came from the CLI, the web, or a chat platform. Workflows appear as cards you can run directly.

**Through a chat platform or a forge.** Slack, Telegram and Discord for conversation; GitHub, Gitea
and GitLab for issues and pull requests. Each is an adapter over the same engine, which is what
part two meant about a run id and an event stream making every surface a client of the same state.

### What ships, and what you can add

Nineteen workflows are bundled, and they are not toys. `archon-fix-github-issue` runs classify,
investigate, implement, validate, PR, review. `archon-idea-to-pr` ends in five parallel reviews.
`archon-piv-loop` is the plan-implement-validate loop with a mandatory human gate.
`archon-comprehensive-pr-review` deploys five parallel reviewers with auto-fix.
`archon-workflow-builder` generates new workflow YAML, which is a nice touch: the engine writes its
own configuration.

![The Archon Workflows tab, showing bundled workflows as cards. Each card has WHEN TO USE, TRIGGERS, DOES and NOT FOR fields, category tags, and a Run button.]({{ '/public/archon-workflows-ui.png' | relative_url }})

*Figure 2: Every bundled workflow declares when to use it and, more unusually, what it is NOT for. That second field is routing metadata: it tells the router when to pick something else.*

Your own live in `.archon/workflows/<pack>/<workflow>/`, keeping a workflow's YAML, commands and
scripts together in one copyable folder. A same-named file in your repository overrides the bundled
default, so customising `archon-piv-loop` means writing your own and leaving the name alone.

### Commands are the unit of reuse

The piece I had underrated. A **command** is a markdown file holding instructions for one AI task,
and Archon's own framing is the useful one: commands are *atoms*, each a single focused task with
no knowledge of what comes before or after it, and workflows are *molecules*, YAML files arranging
commands into a graph with a purpose.

That separation is what makes reuse possible. `archon-investigate-issue` is a command, and any
workflow that needs an investigation phase references it by name rather than restating it. Change
the command once and every workflow using it changes. A workflow, meanwhile, holds no instructions
at all: it holds order, conditions and dependencies.

Commands compose through artifacts rather than through conversation, and the documented pattern is
three lines long: write the important findings to an artifact, start the next node with
`context: fresh`, have that node read the artifact. Which is precisely the discipline the previous
series arrived at by hand, here as the default way the pieces fit together.

Workflows, commands and scripts each resolve across three scopes:

| Scope | Path | Beats |
|---|---|---|
| Bundled | compiled into the binary | nothing |
| Global | `~/.archon/workflows`, `/commands`, `/scripts` | bundled |
| Repo | `.archon/workflows`, `/commands`, `/scripts` | global and bundled |

Same filename at a higher scope wins, which gives you a personal review checklist available in
every project, overridable per repository, without copying anything. It is the packaging problem
from part five of the previous series, solved by convention instead of by a manifest.

### The marketplace

There is also a marketplace at `archon.diy/workflows`. Each entry carries a slug, author,
description, source URL, a **pinned commit SHA**, tags and a compatibility range.

![The Archon workflows marketplace. A prominent amber warning reads: Community-submitted. Archon hasn't audited every workflow, review source before installing. Below it, cards for Archon PIV Loop and Fix GitHub Issue, each by @coleam00, with an install command.]({{ '/public/archon-marketplace.png' | relative_url }})

*Figure 3: The warning is the most important thing on the page.* Pinning to a SHA
rather than a branch is the right call for something that executes in your repository, and the
listing carries a blunt warning that community submissions are not all audited and you should read
the source before installing. That warning is doing real work: a workflow is code that runs with
your credentials in your checkout.

## The five claims, and what is behind each

Archon's documentation makes five claims for itself: repeatable, isolated, portable, composable,
multi-provider. They are the right five, and each one rests on a specific piece of machinery rather
than on good intentions. Taking them in turn is the fastest way to see what an engine actually buys.

### Repeatable

*"Package your best AI coding patterns as shareable YAML workflows."*

The sequence is fixed at definition time and nothing at runtime can renegotiate it. Steps that need
no intelligence, the `bash` and `script` nodes, have no model in the path at all: they run because
the graph says so, which means they cannot be skipped, because nothing there is capable of deciding
to skip them.

Worth being precise about what that does and does not promise. **The procedure is repeatable; the
output is not.** Every AI node is still a language model doing a language model's job, and running
the same workflow twice on the same input gives you two different pull requests. What repeats is
that both of them were planned, implemented, tested, reviewed and gated in that order. That is a
smaller claim than "deterministic AI coding" and it is the one that actually holds.

### Isolated

*"Each workflow runs in its own git worktree, no conflicts, no mess."*

The worktree is the mechanism and the path lock is what makes it trustworthy. Five runs on one
repository are five directories on five branches sharing a single object store, and the lock stops
two runs occupying one worktree.

### Composable

*"Chain nodes into DAGs with dependencies, loops, and conditional logic."*

Two mechanisms under one word, and both matter. **Reuse**: a command is a single-task markdown file
that any workflow references by name, so it is written once and changed once. **Chaining**: every
node type, AI or shell or gate, writes to `$nodeId.output`, so any step can feed any later step,
whole or as one JSON field.

Reuse is why you write fewer instructions. Chaining is why the graph is a graph rather than a
sequence. Lose either and the other stops being worth much.

### Portable

*"Run from CLI, Web UI, Slack, Telegram, GitHub, or Discord."*

Because the run owns its process and its id, every surface is a client of the same state rather
than a separate integration. Note this is portability of *access*, not the portability the previous
series worried about: it does not make your workflows runnable on a different harness, it makes
them reachable from anywhere.

### Multi-provider

*"Works with Claude Code SDK, Codex SDK, and local models via Pi."*

Provider and model resolve per node, and each node gets a fresh provider instance, so nothing is
shared between them. The chain runs node, then workflow, then config, then the SDK default, and
never the model of the session that invoked Archon.

The limit is honest and declared rather than assumed: sessions do not cross providers. Claude
supports session resume, Codex and Pi do not, and the engine checks before trying. Cross-provider
handoff therefore has to pass context explicitly, which is exactly what the output chaining above
is for.

## Under the hood

The rest of this is implementation, and you can stop here with the argument intact. It is worth
reading for one reason: the parts that took judgment are not the parts you would guess.

Every execution moves through four phases, and the engine is the same code in every case: the front
door you came through only decides who gets told about it.

![A flowchart of the four phases. Discovery scans three sources, parses YAML, validates nodes and validates the DAG shape. Routing checks for an explicit workflow name and otherwise asks a model, then fuzzy-matches. Setup loads config, resolves provider and model, checks for a prior failed run, creates the run row and takes the path lock. DAG execution computes topological layers and runs each layer, evaluating conditions, substituting variables, executing nodes, and retrying or failing on the outcome.]({{ '/public/archon-pipeline.png' | relative_url }})

*Figure 4: The whole engine on one page. Note how much of it is checks rather than work.*

| Phase | What happens |
|---|---|
| **Discovery** | YAML files are found, parsed and structurally validated |
| **Routing** | the right workflow is selected, by name or by asking a model |
| **Setup** | config loads, a run row is created, the path lock is taken |
| **Execution** | nodes run in topological layers, concurrently within each layer |

### Discovery: three sources, three checks

Every YAML file found across the three scopes goes through three checks before it is allowed to
exist: it parses, every node validates against a schema for types and required fields and enums,
and the graph itself validates. That last one rejects duplicate node IDs, `depends_on` references
to nodes that are not there, cycles, and `$nodeId.output` references pointing at nodes that do not
exist.

The detail I liked here is the failure mode. A broken YAML file records a `WorkflowLoadError` and
shows up in `/workflow list`. It does not abort the discovery pass or block any other workflow from
loading. One malformed file breaks one workflow.

### Routing: a model that cannot use tools

When a message arrives without an explicit workflow name, the router builds a prompt listing every
available workflow with its description, adds platform context such as the issue title, labels and
thread history, and asks a model to reply with `/invoke-workflow <name>`.

Tool use is disabled at the API level with `tools: []`, so the router **cannot** make a tool call.
It can only emit text. For a component whose entire job is to pick a name out of a list, removing
its ability to do anything else is the right call, and it is the kind of thing that only gets done
deliberately.

The name it emits then goes through a four-tier fuzzy match: exact, case-insensitive, suffix
(`plan` matches `feature-plan`), then substring. If everything fails, the system falls back to a
general assistant workflow rather than guessing.

### Setup and execution

Setup is unglamorous and load-bearing: read config and merge per-project environment variables,
resolve provider and model, check whether a previous failed run on this working directory can be
resumed, create the run row, take the path lock, make the per-run artifacts directory and expose it
to prompts as `$ARTIFACTS_DIR`.

The worktree is created here too, on an auto-generated branch you can override with `--branch`, and
these are git-native worktrees rather than clones. A workflow that does not touch the checkout
declares `mutates_checkout: false` and opts out of both the worktree and the lock guarding it.

The part that is easy to skip when building this yourself is the other end. A finished branch gets
pushed, and `archon complete <branch>` then removes the worktree, the local branch and the remote
one. `archon isolation cleanup` sweeps worktrees older than a week, with `--merged` to take merged
branches and `--include-closed` to take abandoned pull requests too. Isolation you cannot clean up
is just a slowly filling disk.

Two constraints come with it. One branch maps to exactly one worktree, so the same branch cannot be
run twice at once. And a paused sub-run's worktree is reused when it resumes, so cleaning up too
eagerly turns a paused run into a lost one.

From there the executor builds topological layers from the `depends_on` edges and runs every node
in a layer at once. Per node it evaluates
the `when:` condition and the `trigger_rule` join policy, runs two passes of variable substitution,
executes, and on success stores the output in an in-memory map and persists a `node_completed`
event.

On a transient error it retries up to `max_attempts`, twice by default, with a three second
backoff. On a fatal error it stops immediately. Which raises the question of what counts as fatal,
and that is a section of its own.

### The node types

![A fan-out from a DAG node to six node types, colour-coded. Blue for the AI nodes: prompt/command and loop. Orange for the shell nodes: bash and script. Purple for the gates: approval and cancel.]({{ '/public/archon-node-types.png' | relative_url }})

*Figure 5: The colours are the argument. Only the blue ones put a model in the path.*

| Type | Category | How it runs |
|---|---|---|
| `prompt` / `command` | AI | calls `provider.sendQuery()`; a `command` node loads its prompt from a file in `.archon/commands/` |
| `loop` | AI | calls the model repeatedly, scanning each output for a completion tag, until it appears or `max_iterations` is hit |
| `bash` | Shell | `execFileAsync('bash', ['-c', script])`. No model anywhere in the path |
| `script` | Shell | TypeScript via `bun run` or Python via `uv run`, with `deps:` and `timeout:` support |
| `approval` | Gate | writes `status: paused`, messages the user, waits for `/workflow approve` or `/workflow reject` |
| `cancel` | Gate | marks the run cancelled and stops execution, usually on a conditional branch |

Every type captures output the same way, into `$nodeId.output`, which is what lets them compose.
For AI nodes it is the concatenated assistant text; for shell nodes it is stdout; for an approval
node with `capture_response: true` it is whatever the human typed.

Prompt and loop nodes also accept a long list of per-node overrides, currently Claude only:
`model`, `systemPrompt`, `allowed_tools` and `denied_tools`, `mcp`, `hooks`, `skills`, `agents`,
`effort`, `thinking`, `maxBudgetUsd`, `fallbackModel`, `betas`, `sandbox`. Capabilities are checked
at execution time, and anything the provider does not support emits a warning and is ignored rather
than failing the run.

### The model resolution chain

The claim part two leaned on hardest was that the invoking session has no say in what serves a
node. Here is the chain in full:

| Priority | Source |
|---|---|
| 1 | `model:` on the individual node |
| 2 | `model:` at the top of the workflow YAML |
| 3 | `assistants.claude.model` in `.archon/config.yaml` |
| 4 | the SDK default |
| Never | the model of the Claude session that invoked Archon |

Provider identity is validated when the YAML loads, so an unknown `provider:` is a hard error.
Model strings are deliberately *not* validated: they go verbatim to the SDK, which is the actual
source of truth for what model names exist. Refusing to maintain a second list is the right call
and a slightly uncomfortable one, since a typo surfaces at execution rather than at load.

### Context and sessions

Context is threaded rather than accumulated. Sequential nodes on one provider inherit the previous
node's session; a parallel layer resets that, because concurrent nodes cannot share one session;
and any node can opt out with `context: fresh`.

Cross-provider handoff has to pass context explicitly, which is what the second substitution pass
is for:

```yaml
- id: plan
  provider: claude
  prompt: "Analyse the repo and plan: $ARGUMENTS"

- id: implement
  depends_on: [plan]
  provider: codex          # different provider, no shared session
  prompt: |
    Implement according to this plan:
    $plan.output           # full text of the plan node, injected at runtime
```

Pass one substitutes run-scoped variables (`$ARGUMENTS`, `$BASE_BRANCH`, `$ARTIFACTS_DIR`,
`$REJECTION_REASON` and friends). Pass two resolves `$nodeId.output` for the whole text, or
`$nodeId.output.field` to parse the output as JSON and pull one field out, which is how structured
data moves between nodes.

For bash bodies, substituted values are wrapped in single quotes before hitting the shell. Node
output is model-generated text going into a shell command, so this is the injection boundary, and
it is handled where it should be.

### The state machine, and what resume does not restore

![A state diagram. A run is created as pending, becomes running when the dispatcher starts, and from running can reach completed, paused, failed or cancelled. Paused returns to running on approve or reject. Failed returns to pending on resume. Two annotations: a five-minute stale window protects against orphaned rows, and the database is the source of truth across processes.]({{ '/public/archon-state-machine.png' | relative_url }})

*Figure 6: The two callouts are the parts you would not write yourself until the day you needed them.*

| Transition | Trigger |
|---|---|
| → `pending` | run created; the row reserves the working directory |
| `pending` → `running` | dispatcher starts |
| `pending` → `cancelled` | path-lock conflict, or abandoned before it ever ran |
| `running` → `paused` | an approval node is reached |
| `paused` → `running` | `/workflow approve` or `/workflow reject` |
| `running` → `completed` | every layer finished |
| `running` → `failed` | fatal error, or retries exhausted |
| `failed` → `pending` | `/workflow resume` |

The database is authoritative rather than a file, which is what allows more than one process to
observe and act on the same run. That is the mechanical reason an approval can be answered from
Slack while the run itself is on someone's laptop.

Resume replays `node_completed` events to reconstruct prior outputs and skips those nodes. And here
is the honest limitation, documented rather than hidden: **resume does not restore the AI session
context.** Only the `$nodeId.output` values come back. A node that depended on what a previous node
had *read* rather than what it *returned* may need to re-read artifacts, and the resume message
says so explicitly.

Which is the same trade the previous series arrived at from the other direction. Artifacts survive;
conversations do not. An engine does not fix that, it just makes the surviving part durable.

## Where the judgment shows

Everything above is what you would expect a workflow engine to contain. What follows is what
separates one that works from one that mostly works, and none of it would show up in a feature
comparison.

### The lock, and the five-minute window

Part one argued that arbitrating two runs against one checkout needs a lock with an owner and an
expiry. Here is that lock.

The `pending` row **is** the lock token. Before a run starts, the engine checks whether another run
is already `running` or `paused` on the same worktree, and if so the new run is
cancelled immediately with an actionable message rather than queued or silently run anyway.

The expiry is a five-minute stale-pending window, which exists for exactly one situation: a
dispatch that crashed between inserting the row and starting work. Without it, one crash poisons
that working directory forever. Workflows that do not touch the checkout opt out of both the
worktree and the lock with `mutates_checkout: false`.

### Refusing to guess

The rule Archon states most explicitly is a refusal:

> When a process cannot reliably distinguish "actively running elsewhere" from "orphaned by a
> crash", it does not autonomously mark the run as failed.

Instead it surfaces the ambiguity with actionable options. Only heuristic, recoverable operations
(retry backoff, subprocess timeouts) are allowed to bypass this.

This is the single most transferable idea in the codebase, and it has nothing to do with AI. A
distributed system that guesses about liveness will eventually kill a healthy run, and the user
will not know why. Encoding "I cannot tell, so I will ask" as a design rule rather than an
oversight is the difference between an engine you trust and one you babysit.

### Three classes of error

![Three diagrams. Error classification routes a caught error to transient (retry on rate limit or timeout), fatal (abort on auth, credits or permission) or unknown (three strikes then abort). Observability lists four channels: event rows in the database, a JSONL file log, an in-process emitter feeding SSE, and anonymous telemetry. Variable substitution runs in two passes: run-scoped variables first, then cross-node output references.]({{ '/public/archon-error-classification.png' | relative_url }})

*Figure 7: Error classification, the observability channels, and the two substitution passes.*

`classifyError()` sorts every caught error into three buckets:

| Class | Patterns | Action |
|---|---|---|
| **Fatal** | auth failure, permission denied, credit balance, 401, 403 | abort immediately: retrying wastes credits or loops forever |
| **Transient** | rate limit, timeout, process exit, 429, overloaded | retry with exponential backoff |
| **Unknown** | everything else | retry, but count consecutive occurrences and abort after three |

The ordering is the interesting bit. Fatal patterns are checked *before* transient ones, so a
message containing both, like `unauthorized: process exited with code 1`, classifies as fatal. Get
that precedence backwards and an expired credential turns into a retry loop burning money on a
request that cannot succeed.

Note also what the unknown bucket does: it retries, because most unknown errors are transient, but
it keeps a consecutive counter so an unrecognised permanent failure cannot spin forever. That is a
considered answer to "we do not know", rather than picking one of the other two buckets and hoping.

### Forking instead of mutating

Whenever a node resumes an earlier session, the executor sets `forkSession: true`:

```typescript
const shouldForkSession = resumeSessionId !== undefined;
```

Forking copies the transcript before appending rather than mutating the source. The reason is
retries: if node B fails and runs again, the second attempt forks node A's session afresh instead
of appending to a transcript the first attempt already polluted. Without this, a retry inherits the
wreckage of its own previous failure, and nothing in the output would tell you.

### An engine that does not import an AI SDK

`@archon/workflows` imports only from `@archon/providers/types`, a subpath with zero SDK
dependencies. The actual `@anthropic-ai/claude-agent-sdk` and `@openai/codex-sdk` packages live
exclusively in `@archon/providers`.

So the workflow engine can be tested with no AI SDK installed at all. That is the boundary doing
real work: the thing that sequences steps has no opinion about who executes them, which is the same
inversion part two described, enforced at the level of the dependency graph.


## The good, the bad and the ugly

Everything above is description. This is the part that matters, and the buckets are not equally
weighted. One of them is not even a criticism: it is a property whose sign depends on who you are.
One is a nuisance. One cannot be engineered around at all.

### The good

It works, and the engineering is careful in the places that are easy to be careless about. The
lock has an expiry. The error classifier checks fatal before transient. Resume forks instead of
mutating. The engine does not import an AI SDK. None of that is visible in a demo and all of it is
what separates a workflow engine from a script that calls an API in a loop.

The ecosystem is real too: MIT licensed, 23k stars, frequent releases, nineteen usable workflows on
day one, a marketplace with pinned SHAs, adapters for six platforms, three providers. Recent
releases added workflow signatures with declared `inputs:` and `returns:`, packaged workflows, and
a dry-run mode that walks the DAG without spending anything. That last one is the feature of
somebody who has been billed for a mistake.

And the headline result holds. A nine-node comprehensive review, dispatched from a chat box,
running twenty-five minutes in its own worktree, reporting back when done, with the session free
the whole time. That is the thing part two described, working.

### The one that is both

**The workflow is effectively immutable at run time.** When the harness is the caller, you cannot
lean over and tell the agent to skip this gate, or to ask before that step, or to try something
else just this once. Changing behaviour means editing YAML and running again. In an orchestrator
skill, all of that is one sentence in the chat.

Whether that is a defect depends entirely on which chair you are sitting in.

To whoever owns the process, the platform or enablement person accountable for the same review
happening on every branch, immutability *is the point*. A procedure a developer can talk their way
out of halfway through is not a procedure, it is a suggestion with extra steps. Fixing the control
flow at definition time is what turns "we always run the security lane" from an aspiration into a
true sentence.

To the developer at the keyboard it is a straitjacket. You cannot say "skip the gate this once, I
know exactly what this diff is", or "ask me before you push from now on", or "try it the other
way". The thing that would have been a sentence in a chat is now a pull request against a YAML
file.

Both readings are correct, and no amount of tooling resolves the tension, because it is one
property seen from two sides. **Enforceability and steerability are the same thing with opposite
signs.** Which sign you see depends on whether you are the person who wants the process followed or
the person being asked to follow it.

That split is worth carrying into any adoption conversation, because it predicts who in the room
will like the demo. It also runs the other way: the orchestrator skill that a developer finds
pleasantly steerable is the one a platform owner cannot rely on.

### The bad

**You see what the harness decided to show you.** Calling this a loss of observability understates
it, because by one measure observability improves enormously: an event stream, a run history,
status and cost per node, a dashboard, all of which an orchestrator skill lacks entirely. What
changes is that every view of the run is now a rendering somebody else designed.

Archon streams message chunks to the platform, writes a JSONL log and puts node states in a
console. Those are considered choices about what matters, and they are better organised than a
terminal scrollback. They are also a filter. When the thing you need is not in the rendering, you
drop to the logs, and the logs are a lower-level rendering rather than the thing itself.

You are watching a rendering in a coding agent session too. The difference is what is being
rendered: there it is the transcript, and here it is the run, with the transcript demoted to
something you go and fetch. Which produces one specific failure mode, and it is the one engineers
complained about: *it is stuck and I do not know why*. In a session you scroll up. Here you go
looking, and first you have to guess which of three channels recorded the answer.

Two smaller ones. Per-node cost is recorded, but it counts node cost and not the overhead of the
coding agent that invoked the engine, and that gap can reach forty percent, so the number in the
dashboard is not the number on the bill. And the web UI, at the version evaluated, was pleasant to
read and unreliable to operate.

**The honest verdict on this section: all of it was liveable.** The friction was real, it was
annoying, and it was not why anyone stopped. If the next section did not exist, this would be a
list of things to get used to.

### The ugly

Nothing in the engineering fixes this one, which is why it is the ugly rather than the bad.

A workflow engine is, by construction, headless third-party non-interactive use of somebody else's
coding agent. That is precisely the usage pattern a model vendor has both the ability and the
incentive to restrict, and it is the first thing anyone would restrict.

This is not hypothetical. In May 2026 Anthropic announced a split of the flat-rate subscription
into two pools: an interactive pool, where manual human-in-the-loop use through the desktop apps
and interactive terminal sessions stayed under the standard subscription, and an Agent SDK credit
pool, where automated headless usage was stripped out of it. It was withdrawn. The point is not
that it happened, it is that somebody sat down and drew the line in exactly the place that
separates a person typing from an engine calling. That line can be drawn again, by anyone, and it
need not be about price: a vendor could as easily gate a model tier, a beta, or a rate limit behind
its own harness.

And it inverts the engine's best argument. "Best model per node" assumes every vendor's best is
reachable from a neutral caller. If Anthropic's strongest tier is best through Claude Code and
OpenAI's is best through Codex, then a neutral engine is not getting the best of both, it is
getting whatever each vendor is willing to expose to outsiders. The multi-provider promise becomes
a multi-provider tax.

The provider-portability argument is sound about *models* and close to worthless about *access
terms*, because every vendor shipping a coding agent has the same incentive to treat headless
third-party use differently. Switching providers does not escape a policy they all converge on.

**An engine is a bet that the interop stays open.** That is a real bet with a real payoff, and it
is not a bet the engineering can hedge.

## What follows

Three observability channels exist: `WorkflowEvent` rows in the database as the audit log and the
source of truth for resume, a JSONL file log that survives a database reset, and an in-process
event emitter that the HTTP server forwards over SSE to the web console. Telemetry is anonymous and
opts out with `ARCHON_TELEMETRY_DISABLED=1`.

That is a genuinely good picture of a *run*, and it is the last piece of evidence rather than an
answer.

Archon does what it says. The engineering is careful, the parts that look boring are the parts that
took judgment, and the friction of using it is survivable. What is left is not a question about
Archon at all.
