# Design

Tenex design work has two audiences: the CLI user and the end user of the app
Tenex generates. The CLI should feel direct and operational. Generated app
surfaces should feel founder-ready without becoming generic marketing filler.

## CLI Design

- Prefer clear prompts with concrete defaults.
- Keep destructive behavior opt-in and explicit.
- Surface next steps after scaffolding, add-on installation, doctor checks, and
  deploy handoff generation.
- Avoid noisy output when a command succeeds.
- When a command fails, include the smallest useful remediation.

## Generated App Design

- The first screen should be a usable product surface, not a decorative landing
  page unless the selected template is explicitly prelaunch.
- Dashboards should prioritize scanning, comparison, and repeated action.
- Pricing, onboarding, settings, and admin surfaces should be complete enough
  for a founder to continue editing instead of replacing.
- Use restrained visual systems that survive iteration across add-ons.

## Taste Rules

- Prefer domain-specific copy over vague SaaS language.
- Keep generated components easy to inspect and edit.
- Avoid one-off helper patterns when a shared scaffold helper would make future
  generated code more legible.
- Promote repeated review comments into this document, product specs, or checks.
