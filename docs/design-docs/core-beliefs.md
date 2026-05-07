# Core Beliefs

## Agents Need Maps More Than Manuals

The root agent files should stay short. Durable detail belongs in targeted docs
that agents can open only when relevant.

## Knowledge Must Be Versioned

If a decision matters to future work, put it in the repository. External chat
threads, memory, or one-off comments should be converted into docs, tests, or
scripts.

## Checks Beat Reminders

Repeated review guidance should become a mechanical check where practical. When
a check is not practical yet, document the rule and track the gap.

## Generated Code Must Be Legible

Tenex creates code that users and agents inherit. Generated files should be
explicit, conventionally structured, and easy to modify.

## Idempotency Compounds

Commands and add-ons should be safe to retry. Retry-safe behavior lowers the
cost of agent-driven iteration and user recovery.
