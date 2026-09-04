---
title:       "Designing agentic development workflows: the cost of control"
part_title:  "The cost of control"
subtitle:    "Item size, what a gate really costs in attention, which decisions deserve the expensive model, and what the machinery buys."
description: >-
  Item size, what a gate really costs in human attention, which decisions deserve the
  expensive model, and what the whole apparatus buys you.
permalink:   /designing-agentic-development-workflows-part-3/
date:        2026-09-03 04:00:00
series:      "Designing Agentic Development Workflows"
part:        3
tags:        [ai, agents, workflows, automation, claude-code]
image:       /public/agentic-workflow-gate-fatigue.jpeg
banner:      false
image_w:     1024
image_h:     572
---

Two parts in, the machinery is settled: phases in order, artifacts between them, gates that
check rather than promise, a script deciding when the loop stops. What is not settled is the
arithmetic around it, and the arithmetic decides whether any of the machinery matters.

How large should the item handed to a run be? How many approvals can one person give before
approving stops meaning anything? Which steps deserve the strongest model, and which decisions
can never be recovered downstream if that choice is wrong? This part is short because the
answers are short. They are also the answers most often got wrong, because each one is a place
where doing the efficient thing costs you the control the workflow was built for.

*Assumes only that gates and loops exist and are enforced, which is
[part two](/designing-agentic-development-workflows-part-2/).*

## Sizing the work

The most consequential decision about a run happens before it starts: how big is the thing you handed
it?

The recommendation is deliberately smaller than feels efficient: **more items, each narrower.** Not
because the workflow cannot handle a large one, but because everything that makes a run trustworthy
degrades with size:

- **Control.** A small change is one a person can actually review. You can hold the whole diff in your
  head, which is the only state in which "approved" means anything.
- **Comprehension.** With a narrow item you can tell what was written and why. With a sprawling one you
  approve a *summary* of what was written, which is a different and much weaker act.
- **Gates become real.** A gate on a focused plan is a decision. A gate on a plan spanning nine files and
  three concerns is a rubber stamp, and the attention arithmetic in the next section only gets worse as items grow.
- **Plans get concrete.** A narrow ask produces a plan naming files and tests. A broad ask produces a
  plan of *intentions*, which is unreviewable and unfalsifiable.
- **Failure gets cheap.** A run that ends stuck costs you one small item, not a week.

The cost is real and worth stating: more items means more runs, more gate touches, and more fixed
overhead per unit of delivered work (part four argues for measuring exactly that). Accept it deliberately. The
alternative is not less work: it is the same work with less control over it.

A usable rule of thumb: **if you cannot state the acceptance criteria in a few lines, the item is too
big.** Split it before running anything.

### Plan quality is bounded by input quality

The single largest lever on what a workflow produces is not the workflow. It is the description of the
work handed to it.

A vague item produces a confident, vague plan, and then the gate has nothing to push back on, because
there is no specific claim to disagree with. Three things make the difference:

- **Acceptance criteria specific enough that the plan cannot invent scope.** If two people would build
  different things from the description, the plan is a coin flip.
- **The context the agent cannot discover for itself**: why this is wanted, which constraints apply,
  which decisions are already settled and not up for reconsideration.
- **Pointers into the codebase**: the module this concerns, the convention it must follow, the thing
  nearby that already does something similar.

A good diagnostic: **if you find yourself rewriting the plan at the gate, the item was underspecified.**
The fix belongs in the description, not in the plan, otherwise the next run makes the same mistake.

## Human gates and the economics of attention

![Oprah Winfrey pointing at her audience, giving things away, saying "You get a gate! You get a gate! You get a gate! EVERYBODY gets a gate!"]({{ '/public/agentic-workflow-meme-everybody-gets-a-gate.jpg' | relative_url }}){: .meme}

Gates are the product, not the overhead. Everything downstream faithfully implements whatever a gate
approves, so an error at a gate cannot be recovered later.

Which is also why gate *placement* is not a free choice: put them where the process already stopped for a human. A gate somewhere the process never had one gets treated as ceremony and rubber-stamped; a
missing gate where the process always had one is the one people notice, loudly, after something ships.

The shape worth aiming for, stated as a promise to whoever runs it: two stops. Everything between them
is unattended, however many retries it takes. And it never merges. That is a claim a person can hold in
their head, which matters more than the exact number: they need to know when they will be needed and
what the workflow will never do behind their back.

Which is precisely why the *number* of gates matters. Three gates in one run is defensible. Twenty-eight
across a batch of parallel runs is not. Attention is the scarce resource, and a human asked to approve
twenty-eight artifacts approves them without reading.

### Batch by phase, not by run

If a gate check only asks "is *this* artifact's hash in *this* run's
approval log", then several parallel runs can present their plans together and each still records its own
approval separately. A handful of sittings instead of dozens, with the enforcement unchanged.

### A gate asks exactly one question: approve, or annotate

Never bundle a decision into it. On one run a
gate asked for approval *and* offered a choice between two implementation routes, one of which added a
runtime dependency. The reply was "approved", which answered only the first question, and the right
branch was taken by luck. Discrete choices belong in an explicit question *before* the gate, so a bare
"approved" cannot be ambiguous.

When batching, require an answer per item; a blanket "all approved" against four artifacts is ambiguous,
and ambiguity at a gate should be treated as feedback, not consent.

### Measure the attention, not just the elapsed time

Batching four approvals into one sitting can quarter
the attention each receives, which shows up later as extra loop iterations that *look* like workflow
friction. Record how long a human actually spent per artifact, separately from how long the machine ran.

![A person closely reading the first three of a very long row of documents; the remaining twenty five are already stamped approved, unread.]({{ '/public/agentic-workflow-gate-fatigue.jpeg' | relative_url }})

*Figure 1: Attention is the scarce resource. A human asked to approve twenty eight artifacts approves them without reading.*

---

## Model and effort tiering

Because the tier is chosen per dispatched agent, spend deliberately:

| Where | Tier | Why |
|---|---|---|
| Deciding whether an external claim is correct | strongest model, high effort | the only step that can produce the restraint outcomes, and nothing downstream can recover them |
| Root-cause investigation | strong model, high effort | every later phase inherits its errors |
| Writing the tests that define "correct" | strong model | those tests *are* the specification |
| Building, proving, wording replies | mid tier, medium effort | machinery: the decisions were already made |
| Fetching, parsing, classifying a payload | cheapest tier | near-deterministic, high volume |

Cost and trust are both configuration. The same file that picks the tier also declares the tools the
step may use, and that second field is a trust boundary, not an optimization. A step that writes the
run's report needs to read and write files and nothing else: no shell, no search. Denying it a shell is
how you know it cannot edit code, regardless of what it decides it wants to do. Grant the narrowest set
that lets the step finish, and prefer removing a tool to adding an instruction telling the step not to
use it.

One firm rule: **keep a floor on effort.** Make a step cheaper with a smaller model, never with less
thinking. A small model thinking hard beats a large model thinking barely, and the failure mode of minimal
effort is confident wrongness rather than visible struggle.

Note the asymmetry that justifies the whole table: the cheapest tier is also the most likely to conclude
"the reviewer is right, do what they said": precisely the failure the expensive tier exists to prevent.
Tiering is about where the irrecoverable decisions live, not about average difficulty.

---

## What the design buys

That is the design: the components, the shape of a run, the principles that keep that shape honest, how
work is sized, where the human stands, what each step costs to run, and how failures are classified. Before moving on to how you
know any of it works, it is worth stating what all that machinery is actually for.

The largest claim was made at the very start: what the person invoking it stops having to do. That is
the adoption argument, and it outweighs everything below. What follows is what the engineering buys.

**Interruptibility.** A run can be stopped at any phase and either resumed from its cursor or simply read.
Nothing important lives only in a transcript.

**Attributable failure.** Guards and exit codes mean a failure names the step that caused it, instead of
an agent quietly proceeding on missing input and failing three phases downstream.

**Auditability.** The approval log records what a human approved, by content hash and timestamp. The
publish record says what actually reached the outside world. The report explains the run to someone who
never watched it.

**Composability.** Because phases talk through files, workflows chain, skills stand alone, and any phase
can be replaced by a human doing it by hand.

**Compounding improvement.** Shared skills mean a fix in one place improves every workflow that uses it, and makes it worth knowing which shared component hurts most.

**Bounded cost.** Iteration ceilings, retry caps and escalation limits mean a run cannot grind
indefinitely; the failure mode is a clear stop, not a runaway bill.

**Reviewable output.** One commit per unit of work, messages that reference the originating item, and a
diff confined to the files the plan named. The reviewer's first question, "why is this file in here?", is answered before they ask it.

**The ability to decline.** That is the whole difference between a system that *addresses* feedback and one
that merely *obeys* it.

Every one of those is a claim, and a claim you have not checked is a hope. The rest of this document is
about checking them, shipping them, and being honest about where they fail.

---

---

That is the design, and the case for it. Whether any of it is true of your workflow is a
different question with a different kind of answer: evidence. Part four is the three
independent ways to get it, and the way each one is quietly gamed.
