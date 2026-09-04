---
title:       "Designing agentic development workflows: where it hurts, and what to build first"
part_title:  "Where it hurts, and what to build first"
subtitle:    "The limitations that showed up in real runs, and the short list worth learning from them."
description: >-
  Honest limitations of agentic development workflows, all seen in real runs, and the
  short list of what to build first if you are starting one.
permalink:   /designing-agentic-development-workflows-part-6/
date:        2026-09-03 05:00:00
series:      "Designing Agentic Development Workflows"
part:        6
tags:        [ai, agents, workflows, automation, claude-code]
image:       /public/agentic-workflow-enforcement-gap.jpeg
banner:      false
image_w:     1400
image_h:     560
---

Five parts of design, and design flatters itself. This one does not.

What follows is where the shape described so far still hurts, all of it observed in real runs, and
then the short list of what to build first if you are starting one. If you read nothing else in the
series, read the list.

*Follows on from the whole series, but stands alone: every limitation names the thing it broke.*

## Where it hurts

Honest limitations, all observed in real runs, because a design description without them is marketing.

**Enforcement exists only where the check exists.** Every rule that mattered and was not a script
eventually got skipped: the unchecked gate; the "always write a report" promise that silently covered only
the *enumerated* exits; the "keep going" instruction that lost to an agent's instinct to check in. A single unanswered "shall I carry on?" abandoned a run that was already
green, two phases from the finish. Politeness is indistinguishable from a crash. The uncomfortable
lesson: an instruction to a language model is a strong default, never a guarantee, and anything
load-bearing needs a script behind it.

![A skeleton sitting on a park bench, having waited so long it died. Caption: "Me, returning to the terminal three hours later." The terminal reads: "Shall I carry on?"]({{ '/public/agentic-workflow-meme-shall-i-carry-on.jpg' | relative_url }}){: .meme}

![Five rules in a row. Three are backed by a script and hold. Two are backed only by prose, and both were skipped on a real run.]({{ '/public/agentic-workflow-enforcement-gap.jpeg' | relative_url }})

*Figure 1: Every rule that mattered and was not a script eventually got skipped. The amber columns are the ones that had only an instruction behind them.*

**Uniformity decays.** In a family built over months, one workflow guards every seam and another guards
none; one dispatches its work as tiered agents while another invokes the same steps inline, where they
cannot be tiered, isolated or individually measured. The design stays coherent; the implementations drift
from it at different rates, and nothing notices.

**Adapters disagree at the schema.** One component queried an identifier and never wrote it out; the
component that needed it failed for want of it, and failed *after* the code had already been published.
Two components, one implicit schema, no test at the boundary. If two things share a data shape, make the
shape explicit and validate it, or it will drift.

**History gets overwritten.** A loop that rewrites its verdict file each iteration keeps only the final
state, so the convergence (twelve failing, then three, then zero) is lost. That trajectory is exactly
what you want when asking whether the loop actually works. Append; don't overwrite.

**Signals get confused with their proxies.** A platform flag meaning "this comment's anchor line moved"
was read as "this comment is no longer true". Those are different claims and they came apart badly: items
whose anchor had *not* moved were nonetheless judged against code that no longer existed. Before depending
on a platform signal, ask what it literally measures.

**Concurrency is limited by the target, not the workflow.** Running several instances at once sounds free
until you find that the shared working copy is single-occupancy during publishing, that the test database
is one container which the first run to finish deletes out from under the others, and that container names
are global to the machine. Most of what caps parallelism lives in the system being worked on.

**Improvement is genuinely hard to measure.** Elapsed time is confounded by caching; token counts by model
changes; "number of findings" rewards a noisier reviewer; and an operator who has seen the task before is
faster regardless of the tooling. What survives: whether specific, named frictions recur, and counts of
expensive operations: environment boots, dependency re-locks, full-suite runs, loop iterations, human
waits. Counts cannot be faked by a warm cache.

---

## If you are building one

The short list, in the order worth learning it:

1. **Put every phase's output in a file, in a run directory, and pass that directory explicitly.**
2. **Guard the seams**: assert an artifact exists before the phase that consumes it.
3. **Make approvals content-addressed.** A gate that trusts a flag is decoration.
4. **Let a script decide when a loop stops.**
5. **Dispatch the judgment, inline the machinery**: and put your strongest model on the decision nobody
   downstream can undo.
6. **Prove the tests, not just the code.**
7. **Enumerate your terminal states and write a record on all of them.**
8. **Forbid the irreversible-in-public actions in code**: history rewrites, resolving someone else's
   thread, merging.
9. **Give "do nothing" a name, a required reason, and a score.**
10. **Build skills that run standalone.** If a component only works inside its workflow, you have a phase,
    not a skill, and you will rewrite it for the next workflow.
11. **Start local, with a human at the gates**, and treat every friction you hit there as a prerequisite
    for running unattended later.
12. **Instrument from the start.** Every retrospective written by hand should have been a structured
    record: which component hurt, what it cost, and what the evidence was.
13. **Put a clean control in every corpus**, and a bait beside every planted defect, otherwise you are
    optimizing for a louder agent, not a better one.
14. **Contract-test each seam, and generate the reverse index** of which workflows use which component.
    The blast radius of a shared component is a graph, and it should not live in anyone's memory.
15. **Measure against a no-component baseline.** "Did the run succeed?" is the wrong question; "was it
    better than not having this at all?" is the right one.
16. **Have every dispatched step report its own friction, against the component it invoked**: and make
    "nothing hurt" an explicit record, or you cannot tell better from quieter.
17. **Pick one deliberately trivial task** alongside the hard ones. It is the only way fixed overhead
    becomes visible.
18. **Measure delivery on the delivery systems, not on the workflow's own opinion of itself**: and never
    report a speed number without its quality guardrails.
19. **Build a negative control**: one metric the workflow cannot possibly affect. If it improves too,
    your groups differ for another reason.
20. **Version anything you intend to trend**, from the first emission. It cannot be backfilled.
21. **Trace three items by hand before publishing any aggregate.** A wrong join produces confident,
    plausible, wrong numbers.
22. **Treat every piece of incoming text as data.** The steps that read external input are the ones
    holding the tools.
23. **Establish provenance before judging**: feedback is a claim about a version, and a platform signal
    is not the thing you actually care about.
24. **Emit one tripwire per phase**: usable output over produced output. Cheapest instrumentation there
    is, and it catches the failures that return exit code zero.
25. **Package the shared parts once, and let workflow packages depend on them.** Duplicating a shared
    component across packages drifts within weeks, and nothing surfaces it.
26. **Never leave a loose copy of something you have packaged.** Same name, same description, different
    body is undetectable from the outside.
27. **Name actions, not tools, in every skill body**: and keep the harness-specific translation in one
    document per harness. It is the difference between one port and fifty rewrites.
28. **Declare each skill's capability requirements and its degradation.** A skill that silently assumes
    sub-agents exist will invent a tool call on a harness that has none.
29. **Feed it small items.** More stories, each narrower: control, comprehension and meaningful gates
    all degrade with size, and a plan you have to rewrite at the gate means the item was too vague.
30. **Encode your conventions into the steps, and check them.** The planning step reads them, validation
    enforces them, and the negative ones ("don't touch this") are stated explicitly.
31. **Name intents, not commands.** The workflow says "run this repository's tests"; the repository
    says how, which is what lets one workflow serve services in different languages, and what stops a
    hardcoded test command from failing silently in the next repo.

None of this is prompt engineering. These are small distributed systems whose components happen
to be language models, and the parts that make them trustworthy are the boring parts: files, hashes, exit
codes, and a refusal to let any single step be the judge of its own success.
