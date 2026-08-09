# Behavioral Guidelines for PetFeliz Project

## Autonomy and Approval Scope

- **High Autonomy**: Apply small, low-risk changes automatically without asking for step-by-step confirmation. This includes:
  - UI/UX tweaks and layout adjustments.
  - CSS styling and visual polish.
  - Component improvements and minor refactoring.
  - Simple bug fixes.
  - Frontend feature enhancements.
- **Request Approval Only When**:
  - Modifying project architecture.
  - Changing database schemas, tables, or running structural migrations.
  - Deleting files or overwriting existing core structures.
  - Modifying authentication, permissions, or security logic.
  - Making breaking changes that impact other system modules.
- **Workflow**: For normal frontend and low-risk improvements, apply the changes directly and provide a summary of accomplishments upon completion.

## Typography & Design System Rules

- **No Compressed Text**: Never use compressed/condensed text, `transform: scaleX(...) < 1`, or negative `letter-spacing` on any component.
- **Font Families**: Always use `Sora` for Headings and `Inter` for Body text in standard width.
- **Font Weight Balance**:
  - Main H1/H2 titles: Use `font-weight: 700`.
  - Secondary headers, cards, labels, buttons, and inline bolds: Use `font-weight: 600` (SemiBold) instead of heavy `700` or `800` to maintain clean visual balance.

