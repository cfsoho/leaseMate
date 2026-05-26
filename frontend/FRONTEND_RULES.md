# LeaseMate Frontend Rules

These rules keep the frontend consistent while the app grows across many
tables, forms, and master/detail workflows.

## Stack

- Use Vite, React, TypeScript, Tailwind CSS, React Router, and TanStack Query.
- Do not use Bootstrap.
- Do not add SCSS unless we have a clear need that Tailwind and component
  composition cannot handle.
- Use `lucide-react` for icons when an icon is needed.

## Structure

- Keep app-wide wiring in `src/app`.
- Keep route-level screens in `src/pages`.
- Keep reusable UI and layout components in `src/components`.
- Keep domain-specific API, types, columns, forms, and page config in
  `src/features/<feature>`.
- Keep shared API/auth helpers in `src/lib`.

## Data Screens

- Prefer the shared master/detail framework for CRUD-like table screens.
- Do not create one-off CRUD pages unless the workflow is genuinely special.
- Feature screens should provide TypeScript config files such as:
  - `<feature>.api.ts`
  - `<feature>.types.ts`
  - `<feature>.columns.ts`
  - `<feature>.form.ts`
  - `<feature>.page.ts`
- Keep behavior in typed TypeScript config, not loose untyped objects.
- Shared data components should stay generic and receive feature-specific
  behavior through typed config.

## Forms

- Form field definitions must be typed.
- Use feature-specific config for labels, field type, required state,
  placeholders, validation hints, and option sources.
- Use shared field components for common inputs like text, money, date,
  select, textarea, checkbox, and status fields.

## Tables

- Table columns must be typed.
- Column config should own labels, width hints, sortable flags, value
  formatting, and custom renderers.
- Row selection should be explicit and reusable because master/detail screens
  will use selected rows to show child/slave data.

## Styling

- Use Tailwind utility classes for component styling.
- Keep `src/styles/global.css` limited to Tailwind import and true global
  defaults.
- Promote repeated Tailwind patterns into reusable React components instead of
  copying long class lists everywhere.

## API

- Feature API files should wrap backend endpoints and use shared
  `apiRequest`.
- Authenticated endpoints must pass `auth: true`.
- Route strings belong in feature API files, not inside generic components.
