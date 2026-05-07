# Reviews

Use these checklists for agent-to-agent or local self-review before handoff.

## General Review

- Does the change match the relevant product spec?
- Did it preserve user-owned files and unrelated work?
- Are docs, generated references, and code behavior aligned?
- Is verification appropriate for the blast radius?
- Is any repeated feedback promoted into docs or checks?

## CLI Review

- Are command errors actionable?
- Are generated-file conflicts detected before mutation?
- Is add-on behavior idempotent?
- Are package and env requirements centralized?

## Generated App Review

- Are generated screens usable and accessible?
- Does template copy match the selected product type?
- Are provider secrets kept out of client code?
- Are setup gaps reflected in handoff or doctor output?
