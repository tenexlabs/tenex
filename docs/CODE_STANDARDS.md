# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code
quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `npm exec -- ultracite fix`
- **Check for issues**: `npm exec -- ultracite check`
- **Diagnose setup**: `npm exec -- ultracite doctor`

Biome, the underlying engine, provides robust linting and formatting. Most
issues are automatically fixable.

## Core Principles

Write code that is accessible, performant, type-safe, and maintainable. Focus on
clarity and explicit intent over brevity.

## Type Safety And Explicitness

- Use explicit types for function parameters and return values when they enhance
  clarity.
- Prefer `unknown` over `any` when the type is genuinely unknown.
- Use const assertions, `as const`, for immutable values and literal types.
- Leverage TypeScript type narrowing instead of type assertions.
- Use meaningful variable names instead of magic numbers. Extract constants with
  descriptive names.

## Modern JavaScript And TypeScript

- Use arrow functions for callbacks and short functions.
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops.
- Use optional chaining and nullish coalescing for safer property access.
- Prefer template literals over string concatenation.
- Use destructuring for object and array assignments.
- Use `const` by default, `let` only when reassignment is needed, and never
  `var`.

## Async And Promises

- Always `await` promises in async functions when the result matters.
- Use `async` and `await` instead of promise chains for readability.
- Handle errors appropriately in async code with try-catch blocks.
- Do not use async functions as Promise executors.

## React And JSX

- Use function components over class components.
- Call hooks at the top level only, never conditionally.
- Specify all dependencies in hook dependency arrays correctly.
- Use the `key` prop for elements in iterables. Prefer unique IDs over array
  indices.
- Nest children between opening and closing tags instead of passing as props.
- Do not define components inside other components.
- Use semantic HTML and ARIA attributes for accessibility.
- Provide meaningful alt text for images.
- Use proper heading hierarchy.
- Add labels for form inputs.
- Include keyboard event handlers alongside mouse events.
- Use semantic elements such as `button` and `nav` instead of `div` elements
  with roles.

## Error Handling And Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code.
- Throw `Error` objects with descriptive messages, not strings or other values.
- Use try-catch blocks meaningfully. Do not catch errors just to rethrow them.
- Prefer early returns over nested conditionals for error cases.

## Code Organization

- Keep functions focused and under reasonable cognitive complexity limits.
- Extract complex conditions into well-named boolean variables.
- Use early returns to reduce nesting.
- Prefer simple conditionals over nested ternary operators.
- Group related code together and separate concerns.

## Security

- Add `rel="noopener"` when using `target="_blank"` on links.
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary.
- Do not use `eval()` or assign directly to `document.cookie`.
- Validate and sanitize user input.

## Performance

- Avoid spread syntax in accumulators within loops.
- Use top-level regex literals instead of creating them in loops.
- Prefer specific imports over namespace imports.
- Avoid barrel files that re-export everything.
- Use proper image components, such as Next.js `Image`, over raw `img` tags
  when working in a Next.js app.

## Framework-Specific Guidance

Next.js:

- Use Next.js `Image` for images.
- Use `next/head` or App Router metadata API for head elements.
- Use Server Components for async data fetching instead of async Client
  Components.

React 19 and newer:

- Use ref as a prop instead of `React.forwardRef`.

Solid, Svelte, Vue, and Qwik:

- Use `class` and `for` attributes, not `className` or `htmlFor`.

## Testing

- Write assertions inside `it()` or `test()` blocks.
- Avoid done callbacks in async tests. Use async and await instead.
- Do not use `.only` or `.skip` in committed code.
- Keep test suites reasonably flat.

## When Biome Cannot Help

Biome catches most mechanical issues. Spend human and agent attention on:

- Business logic correctness.
- Meaningful naming.
- Architecture decisions.
- Edge cases.
- User experience.
- Documentation for complex logic.

Run `npm exec -- ultracite fix` before committing to ensure compliance.
