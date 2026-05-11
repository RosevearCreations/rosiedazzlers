# Images and Media Guide

**Reset date:** 2026-05-10

## General sizes

- Hero/banner images: 1600×900 or larger, landscape.
- Service/add-on cards: 1200×900 or 1200×1200.
- Before/after gallery pairs: same orientation and similar crop; 1200px wide minimum preferred.
- Gear/consumable product cards: 1200×1200 square preferred.
- Review/proof images: 1200×900 landscape or 1200×1200 square.
- Logos/icons/SVG outlines: use only when an illustrative placeholder is intended, not as the primary real service image.

## Add-on images

Add-ons should prefer real PNG/JPG/R2 image URLs as the primary image. SVG outlines are acceptable as fallback only.

Admin editors should show:

- current image preview,
- primary image URL,
- fallback image URL,
- alt text,
- recommended dimensions,
- keep/replace choice.

## Before/after gallery JSON format

Use one object per gallery item inside the same `items` array:

```json
{
  "items": [
    {
      "title": "Engine Cleaner",
      "location": "Tillsonburg, ON",
      "before_kind": "image",
      "before_url": "https://assets.rosiedazzlers.ca/CarPhotos/MitsubishiLancerEngineDirty.PNG",
      "after_kind": "image",
      "after_url": "https://assets.rosiedazzlers.ca/CarPhotos/MitsubishiLancerEngineClean.PNG",
      "note": "We love to clean engines.",
      "consent_status": "Engines",
      "customer_name": "",
      "vehicle_label": "2015 Mitsubishi"
    },
    {
      "title": "Pet Hair Interior Detail",
      "location": "Woodstock, ON",
      "before_kind": "image",
      "before_url": "https://assets.rosiedazzlers.ca/gallery/pet-hair-before.jpg",
      "after_kind": "image",
      "after_url": "https://assets.rosiedazzlers.ca/gallery/pet-hair-after.jpg",
      "note": "Interior pet hair removal proof.",
      "consent_status": "Approved",
      "customer_name": "",
      "vehicle_label": "SUV interior"
    }
  ]
}
```

Do not create `items2` or a second top-level array.

## Long-term media direction

Move images/videos into a shared DB-backed media library so add-ons, landing pages, gallery entries, services, gear, and consumables all reuse one media source.
