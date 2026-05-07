# Product Sense

Tenex exists to help founders get from an empty app to a credible TanStack
Start and Convex product surface quickly. The CLI should save setup time while
leaving behind code the founder can understand, edit, and ship.

## Target User

- Technical founders and small teams building SaaS, AI SaaS, or waitlist
  products.
- Users comfortable editing TypeScript who still want batteries-included
  product scaffolding.
- Users who value component-first add-ons over opaque platform lock-in.

## Product Principles

- Scaffold useful product surfaces, not only plumbing.
- Prefer generated code that is explicit and easy to delete.
- Make optional add-ons additive and idempotent.
- Keep project state discoverable through `tenex.json`.
- Make the next manual setup step obvious when a third-party service requires
  credentials or dashboard configuration.

## Non-Goals

- Tenex is not a hosted platform.
- Tenex should not hide third-party provider concepts from the generated app.
- Tenex should not become a generic starter generator for every frontend stack.
