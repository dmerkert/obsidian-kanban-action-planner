# Custom scheduled and due date properties

> **Status:** Implemented by OpenAI Codex on 2026-09-14. Unit/full tests, lint, formatting, and the
> rule-integrity check pass. TypeScript/build and live-vault validation remain environment-blocked:
> the installed Zod package does not match the lockfile, registry downloads return HTTP 403, and
> this container exposes neither `OBSIDIAN_VAULT_LOCATION` nor the `obsidian` CLI.

## Problem

Changing the global **Scheduled date property** or **Due date property** does not reliably change
the properties used by the plugin. The board-wide resolver still prefers legacy per-view keys and
the selected note type's copied calendar values. Note types created before a global setting change
therefore keep `date_scheduled` and `date_due` ahead of the new names.

The inconsistency is broader than Timeline. The same cached board-wide properties feed Calendar,
Timeline, WBS, card menus, countdowns, filtering, and Agenda, while Ideal week has a second
per-card resolver that can independently fall back to copied note-type values. A partial Timeline
fix would leave reads and writes disagreeing across modes.

## Target behavior

- The two plugin settings are the canonical default scheduled and due property names everywhere.
- Copied historical defaults and stale hidden `.base` keys do not override the global names; the
  current UI exposes no scheduled/due property-name override.
- Every feature must use the same effective property for both reads and writes.
- Changing either global setting refreshes open views immediately without rewriting note
  frontmatter.
- Existing custom properties remain untouched; the fix changes property selection, not user data.

## Configuration model

- Add a pure, shared date-property resolver returning the effective scheduled and due names.
- Stop treating copied `date_scheduled` / `date_due` values in stored note types as overrides.
  Retain the fields for settings compatibility, but do not consult them at runtime.
- Ignore legacy per-view `scheduledDateProperty` and `dueDateProperty` keys because the current
  Configure view UI no longer exposes them and documents the names as plugin settings.
- Document the final precedence in `documentation/Business Rules.md` and
  `documentation/Configuration.md` before wiring consumers to it.

## Affected consumers

### Primary view modes

- **Calendar:** planned/no-deadline classification, scheduled and deadline chips, focused-day
  rendering, drag-to-date writes, and drag-to-panel clears.
- **Timeline:** planned/unplanned classification, bar/square start reads, deadline lines and
  tooltips, panel-to-chart scheduling, bar moves/resizes, date prompts, and clear-start actions.
- **WBS:** start and due chips, needs-planning classification, rollup date calculations, date
  prompts, and start/due writes.
- **Ideal week:** per-card active-window filtering from scheduled/start through due. Route this
  through the shared resolver so it cannot retain a separate legacy fallback.

### Additional affected surfaces found during the audit

- Board card overdue/today emphasis and the optional scheduled/due countdown.
- Standard card-menu scheduling and deadline actions used by every mode.
- `scheduled:` and `due:` filter/search records and availability-related consumers.
- Agenda scheduled placement and due grouping.
- WBS lifecycle-date metadata and any render signatures containing property names.
- Calendar/Timeline render signatures, so a settings change cannot be skipped as unchanged.

## Implementation

- Resolve the effective scheduled/due pair once per rebuild and expose it consistently to all
  controllers and card-display/search builders.
- Replace Ideal week's separate `datePropertiesFor` fallback with the same shared contract while
  retaining only intentionally supported per-type behavior established by the configuration model.
- Ensure every optimistic mutation overlays the exact effective property and drops/re-renders on a
  failed write according to business rules 32 and 49.
- Keep estimate, milestone, progress, defer, time-block, and lifecycle completion properties out of
  scope unless a test proves they accidentally depend on the two affected names.
- Remove or rename misleading comments that claim global-only resolution while calling the legacy
  layered resolver.

## Automated tests

- Unit-test the resolver for defaults, custom global names, whitespace normalization, and invalid
  blank stored values.
- Add regression coverage for each mode:
    - Calendar reads custom dates and drag/drop writes or clears only the custom property.
    - Timeline reads the custom start/due dates and scheduling does not create `date_scheduled`.
    - WBS reads and edits the custom start/due dates.
    - Ideal week applies its active date window from the custom names.
- Cover the additional shared surfaces: card due state/countdown, standard date menu writes,
  `scheduled:`/`due:` search records, and Agenda grouping.
- Verify a live global-setting change invalidates the relevant render signatures and refreshes open
  views.
- Run `bun run format`, `bun run tsc`, `bun run lint`, `bun test`, `bun run build`, and
  `bun run rules:check`.

## Live verification

- In the live vault, set both global date-property settings to temporary custom names.
- Seed fixtures carrying dates only in those custom properties and exercise Calendar, Timeline,
  WBS, Ideal week, Agenda, board countdowns, and the `scheduled:` / `due:` filters.
- In Calendar, Timeline, and WBS, perform one date write and one clear operation; assert that only
  the custom property changes and no `date_scheduled` / `date_due` key is created.
- Change the settings while the Base is open and confirm every mode refreshes without reopening the
  plugin.
- Confirm `obsidian dev:errors` is clean, take screenshots of the affected UI modes, and restore
  settings and fixtures.

## Documentation and completion

- Update README/user documentation wherever scheduled or due defaults are described so global
  customization and any retained explicit override are unambiguous.
- Update this plan as implementation lands; close or remove it only after automated and live-vault
  verification pass.
