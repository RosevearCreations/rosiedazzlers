# Rosie Build 917 — Admin Workspace Visual Repair (implementation slice)

The original `/admin` dashboard has **40 text-only workspace cards**. This implementation provides one independently stored, original 640×360 SVG asset for every card under `assets/themes/standard/admin/workspaces-917/`, linked through the already loaded `assets/build648-admin-operator.js` and styled in `assets/build648-admin-operator.css`. Both `/admin.html` and `/admin/index.html` share that boot logic; no duplicate page markup is edited.

All illustrations are decorative. Existing owner-generated before/after, testimonial, supplier custody, customer proof, source documents and provider receipts remain real-data workflows and are **not** replaced by invented evidence. Art is lazy-loaded without outside hosts or credentials, and generated files are pinned by the Build 917 asset manifest. Existing navigation, role permissions, filters and responsive dashboard cards are unchanged.

**Scope limitation:** This visual repair is one component of the requested Build 917. Provider-native deletion receipts, independent mirror/CDN recall, two-person authenticated original device signoff, original causal financial reconciliation, associated migrations, provider account enrollment, customer consent and source-verified acceptance require separate genuine operational proof. Do not call those business outcomes GREEN based on these images.

Run `node tests/build917_admin_card_art.test.mjs` and the protected development/source/Preview CI before any production promotion.
