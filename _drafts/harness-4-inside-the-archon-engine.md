---
title:      "Should you harness the harness: inside the Archon engine"
part_title: "Inside the Archon engine"
subtitle:   "How a run is discovered, routed and executed, and the handful of decisions that took judgment."
series:     "Should You Harness the Harness"
part:       4
tags:       [ai, agents, workflows, automation, claude-code]
---

The surprise, reading a workflow engine from the inside, is how little of it is about graphs.
Topological sorting is a first-year algorithm and it takes maybe fifty lines. Almost everything
else is bookkeeping: who holds the lock, what counts as a fatal error, what happens when a process
dies without saying so.

That turns out to be the honest description of the category. **The DAG is the part you would write
in an afternoon. The rest is the part you would get wrong for a year.**

None of this is required reading. Part three said what Archon is and what it gives you, and that
argument stands without any of what follows. This is here because the parts that took judgment are
not the parts you would guess, and because most of them are worth stealing whether or not you ever
run an engine.

*Continues from part three, and assumes its vocabulary: command, workflow, worktree, node.*

## A run, in four phases

Every execution moves through four phases, and the engine is the same code in every case: the front
door you came through only decides who gets told about it.

![A flowchart of the four phases. Discovery scans three sources, parses YAML, validates nodes and validates the DAG shape. Routing checks for an explicit workflow name and otherwise asks a model, then fuzzy-matches. Setup loads config, resolves provider and model, checks for a prior failed run, creates the run row and takes the path lock. DAG execution computes topological layers and runs each layer, evaluating conditions, substituting variables, executing nodes, and retrying or failing on the outcome.]({{ '/public/archon-pipeline.png' | relative_url }})

*Figure 1: The whole engine on one page. Note how much of it is checks rather than work.*

| Phase | What happens |
|---|---|
| **Discovery** | YAML files are found, parsed and structurally validated |
| **Routing** | the right workflow is selected, by name or by asking a model |
| **Setup** | config loads, a run row is created, the path lock is taken |
| **Execution** | nodes run in topological layers, concurrently within each layer |

### Discovery: three sources, three checks

Every YAML file found across the three scopes goes through three checks before it is allowed to
exist:

- **It parses.** A file that does not is skipped, not fatal.
- **Every node validates** against a schema, for types, required fields and valid enums.
- **The graph validates.** No duplicate node IDs, no `depends_on` pointing at a node that is not
  there, no cycles, and no `$nodeId.output` reference to a node that does not exist.

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

The part that is easy to skip when building this yourself is the other end:

- `archon complete <branch>` removes the worktree, the local branch and the remote one once a
  finished branch has been pushed and merged.
- `archon isolation cleanup` sweeps worktrees older than a week.
- `--merged` takes merged branches too, and `--include-closed` takes abandoned pull requests.

Isolation you cannot clean up is just a slowly filling disk.

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

*Figure 2: The colours are the argument. Only the blue ones put a model in the path.*

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

*Figure 3: The two callouts are the parts you would not write yourself until the day you needed them.*

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

*Figure 4: Error classification, the observability channels, and the two substitution passes.*

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

## What the engineering gets right

Read as a list, the decisions above have something in common: none of them is visible in a demo,
and every one of them is the difference between an engine you trust and one you babysit.

- The lock has an **expiry**, because a dispatch that crashes between writing the row and starting
  work would otherwise poison that working directory permanently.
- Fatal errors are checked **before** transient ones, so an expired credential does not become a
  retry loop billing you for requests that cannot succeed.
- Resume **forks** a session rather than mutating it, so a second attempt does not inherit the
  wreckage of the first.
- The engine does not import an AI SDK **at all**, so the thing that sequences steps has no opinion
  about who executes them.
- When liveness cannot be determined, the system **refuses to decide** and says so.

That last one has nothing to do with AI and is the most transferable idea here. A distributed
system that guesses about liveness eventually kills a healthy run, and nobody finds out why.
Encoding *I cannot tell, so I will ask* as a rule rather than an oversight is a choice somebody had
to make on purpose.

## What follows

Three observability channels exist: event rows in the database as the audit log and the source of
truth for resume, a JSONL file log that survives a database reset, and an in-process emitter the
HTTP server forwards over SSE to the web console. Telemetry is anonymous and opts out with an
environment variable.

That is a genuinely good picture of a *run*. Whether it is a good picture of *your work* is a
different question, and it is the one the series is named for.

The last part answers it, and deliberately does not answer it about Archon. What an engine gives
you that no skill will, what it costs to live with, and how to decide for a team that is not this
one.
