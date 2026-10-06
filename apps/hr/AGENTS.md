# IDE Rules & Coding Standards

As IDE, you must adhere to the following architectural and coding standards for this project:

## 1. Component Separation
- **Rule**: Do not implement multiple components in the same file.
- **Exception**: Small, internal-only helper elements that are not reused can remain if they are extremely minimal, but preference is always separate files for components.

## 2. Type Management
- **Rule**: Do not implement types/interfaces in the same file as the logic or components.
- **Location**: All resource types must be located in `@/types/{resource}.ts`.
- **Example**: Student types should be in `a:\Projects\centerplus\types\students.ts`.

## 3. Table Column Definitions
- **Rule**: Do not implement table column definitions (e.g., `ColumnDef`) within the page or component file.
- **Location**: Columns should be in a `columns.ts` file within the same directory as the route/page.
- **Example**: 
  - Page: `a:\Projects\centerplus\app\students\page.tsx`
  - Columns: `a:\Projects\centerplus\app\students\columns.ts`

## 4. Page Structure
- **Rule**: For all routes, do not create a separate "Component" for the entire page (e.g., avoiding a `PlaceOrder` component being imported into `page.tsx`).
- **Implementation**: Keep the main page logic, form handling, or layout directly in the `page.tsx` file of the route. Sub-components should still be imported from the `@/components` directory.
- **Example**: `a:\Projects\aff-shopmart\app\dashboard\orders\place-order\page.tsx` should contain the page logic directly.

## Reference Sample (To be refactored)
The file `a:\Projects\centerplus\components\dashboard\pages\students\StudentsPage\index.tsx` is a sample that currently violates these rules and should be used as a reference for what to avoid/refactor.

## 5. Component Directory Structure
- **Rule**: Implement components inside their own directories with an `index.tsx` for the component logic.
- **Rule**: Do not implement a `components` directory inside another component directory. All related sub-components must be siblings in the parent feature/page directory.
- **Location**: `@/components/.../{ComponentName}/index.tsx`.
- **Note**: Maintain an additional `index.ts` in the parent directory for cleaner bulk exports if necessary.

## 6. Mock Data Management
- **Rule**: Do not define mock data within page or component files.
- **Location**: All mocked data must be located in `@/mock/{resource}.ts` or `@/mock/{resource}.tsx`.
- **Example**: Student mock data should be in `a:\Projects\centerplus\mock\students.ts`.

## 7. Form Management & Validation
- **Rule**: Never use bare states to handle forms. Instead, use `react-hook-form` with `zod`.
- **Location (Schemas)**: Always place schemas in `@/schemas/{resource}/...schemas.ts`.
- **Components**: Always use the inputs located in `@/components/ui/form`.

## 8. Dialogs & Sheets Management
- **Location (Dialogs)**: Implement dialogs at `@/components/dialogs/{ComponentName}/index.tsx`.
- **Location (Sheets)**: Implement sheets at `@/components/sheets/{ComponentName}/index.tsx`.
- **Trigger Pattern**: Dialogs and Sheets must receive `children` which acts as the trigger for opening the component.
- **Data Management**:
  - For update operations, the component should receive the `id` of the resource.
  - The component must be independent and handle its own data fetching and updating internally based on the provided `id`.

## 9. TypeScript Checks
- **Rule**: You MUST run TypeScript checks (`npx tsc --noEmit`) after generating or modifying code to ensure no type errors were introduced.

## 10. No 'as any' for Type Issues
- **Rule**: Do not use `as any` or `any` casting as a solution for TypeScript errors. Investigate and implement proper typing or interfaces instead.

## 11. Follow User Message Instruction
- **Rule**: In every user message, apply the instruction: `use this`.

## 12. Inner Titles Management
- **Rule**: For inner page titles (headers within the dashboard), always use the `InnerHeader` component located at `@/components/layout/InnerHeader/index.tsx`.
- **Props**: Pass `title` and `description` to the component.

## 13. Localization Rules
- **Rule**: When asked to localize, ensure every single field and column in the entire flow is localized.
- **Process**: Loop through the complete flow provided and do not miss any key.
- **Internal Components**: Ensure that all internal components within the flow are also localized for full coverage.
- **Verification**: After finishing, you MUST verify every single key you used in the code against ALL translation files (e.g., `en.json`, `de.json`, `fr.json`, `it.json`). Ensure that the keys exist in all files to avoid `MISSING_MESSAGE` errors in different locales. **CRITICAL: Do not miss any language file present in the `messages` directory.** If you are only updating one file, you must at least add the keys to others with fallback values or English strings to prevent build/runtime errors. Check the console for any issues related to messages or localization.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
