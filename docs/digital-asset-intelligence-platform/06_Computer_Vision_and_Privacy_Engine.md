# DAIP Computer Vision and Privacy Engine

**Version:** 1.0

---

## 1. Purpose

The Computer Vision and Privacy Engine detects useful media content and protects sensitive customer information before anything is published.

Privacy protection is mandatory because detailing videos can easily show:

- license plates
- faces
- children
- house numbers
- street signs
- neighbour vehicles
- VIN labels
- insurance documents
- parking permits
- phone screens
- reflections

---

## 2. License Plate Detection

The system should detect plates in:

- front vehicle views
- rear vehicle views
- side reflections
- neighbouring vehicles
- trailers
- motorcycles
- temporary permits

Detection output:

- media_asset_id
- timestamp
- bounding box
- confidence
- recommended action

---

## 3. Privacy Actions

Available masking actions:

| Action | Use Case |
|---|---|
| black_box | strongest privacy protection |
| heavy_blur | acceptable for most video |
| pixelate | stylistic alternative |
| manual_review | low confidence or risky frame |
| ignore | false positive approved by admin |

Recommendation: default public exports should use black box or heavy blur for plates.

---

## 4. Tracking Across Frames

Plate detection should not only detect a single frame.

The system should:

1. Detect plate region.
2. Track it across nearby frames.
3. Apply mask consistently.
4. Re-check output after masking.
5. Flag missed or low-confidence spans.

---

## 5. Face Detection

Optional but recommended.

Detect:

- customers
- technicians
- bystanders
- children
- reflections

Faces can be:

- allowed if staff consent exists
- blurred if customer/bystander
- sent to manual review if uncertain

---

## 6. Sensitive Object Detection

Future privacy detections:

- house numbers
- mailboxes
- documents
- VIN labels
- license/ownership papers
- credit cards
- garage codes
- phone screens
- personal photos

---

## 7. Quality Detection

Computer vision should also detect quality issues:

- blur
- darkness
- overexposure
- severe camera shake
- blocked lens
- no useful subject
- duplicate scene
- long static footage

These scores help reject bad footage before editing.

---

## 8. Detailing Object Detection

Objects/classes to detect:

- vehicle
- wheel
- tire
- windshield
- headlight
- seat
- carpet
- floor mat
- dashboard
- door panel
- foam cannon
- pressure washer
- vacuum
- extractor
- steam cleaner
- brush
- microfiber towel
- polisher
- ceramic spray
- wax bottle
- water beads

---

## 9. Review Queue

Any asset with privacy risk should require review before publication.

Review statuses:

- pending_detection
- detection_complete
- masking_applied
- needs_manual_review
- approved_private
- approved_public
- rejected_public

---

## 10. Safety Rule

If the system is uncertain, it should protect privacy first.

Better to over-blur than accidentally expose a customer plate or private information.
