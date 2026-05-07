# Frontend

Tenex generates TanStack Start application surfaces. These rules apply to
generated frontend code and future template changes.

## Structure

- Keep routes thin. Move reusable UI into generated components.
- Keep template configuration in `src/lib/tenex.generated.ts`.
- Use generated app config instead of hard-coded brand and add-on values.
- Prefer explicit props and small components over clever composition.

## Accessibility

- Use semantic elements for navigation, actions, sections, forms, and tables.
- Ensure interactive controls are keyboard reachable.
- Provide visible labels or accessible labels for inputs and icon-only controls.
- Preserve heading order within generated routes.

## Responsive Behavior

- Generated surfaces should work on mobile and desktop without overlapping text.
- Avoid viewport-scaled font sizes.
- Use stable grid, board, and tile dimensions where dynamic content appears.
- Keep critical actions visible without relying on hover.

## Styling

- Follow the existing generated app stack before adding new dependencies.
- Avoid decorative layouts that obscure the actual product state.
- Keep page sections unframed unless the UI element is a repeated item, modal,
  or tool surface.
- Avoid making the whole app read as a single hue palette.
