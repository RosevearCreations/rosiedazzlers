# Build 618 — Admin Inventory Visual & Selection Recovery

## Scope

- Inventory Workflow shows a thumbnail beside each tool/consumable, with a bundled-image fallback for missing or broken URLs.
- Row selections survive inventory filter/sort redraws, including selections temporarily hidden by a filter.
- The select-visible control operates on currently shown rows only, reports partial selection, and no longer registers duplicate handlers on each render.
- Selection counts and a Clear selection control make cross-filter bulk operations explicit.
- Selection keys that disappear from the loaded inventory are removed on refresh.

## Acceptance checks

1. Select two rows, filter to one, sort, and clear the filter: both remain checked.
2. With some but not all visible rows checked, the header checkbox shows an indeterminate state.
3. Select all visible, change the filter, and deselect visible: hidden selections remain until cleared explicitly.
4. Use Clear selection and confirm the count and all checks reset.
5. Confirm working image URLs display thumbnails and invalid URLs display the bundled placeholder.
6. Review a bulk action's selection after changing filters, and ensure no inventory mutation occurs before the existing confirmation/preview flow.

No database migration or new public API is required. Production acceptance requires an authenticated Admin session; static syntax checks alone do not prove live API access or Cloudflare promotion.
