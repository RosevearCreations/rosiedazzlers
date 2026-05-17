# Sanity Check — Build 148

**Updated:** 2026-05-16

## Completed this pass

- Added regional photos to all current location landing pages.
- Added photo captions and source URLs for location landing pages.
- Added fallback add-on landing-page photo/process/details.
- Added Admin App fields to update landing photo/caption/source details.
- Added landing-photo release validation.
- Updated Markdown and schema notes.
- Removed recurring invalid root API duplicates.

## Checks to run before deployment

```bash
python scripts/release_check.py
```

Also test manually:

1. Open `/tillsonburg-auto-detailing/` and confirm the regional photo appears.
2. Open `/port-dover-auto-detailing/` and confirm the regional photo/caption appears.
3. Open `/ceramic-coating/` and confirm the add-on process/details/photo sections appear.
4. Open Admin App → Landing pages and confirm hero image, gallery, caption, and source fields can be edited.
5. Open the mobile menu on a phone width and confirm it is compact/expandable.
6. Confirm no public page has more than one visible H1.
7. Confirm `/consumables` still shows the full fallback catalog, not just edited DB rows.

## SQL reminders

Apply recent SQL migrations to Supabase dev in order when ready. Build 148 itself adds a no-DDL tracking note only.
