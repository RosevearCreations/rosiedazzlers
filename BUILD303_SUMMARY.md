# Build 303 — Finance Tax-support Maintainability Extraction

**Build 302 parent:** `9ec950384124644d1176a01d381745a3d8f7cfb9`

Build 303 externalizes the retained Build 273 Tax Support & Accountant Readiness browser controller from `admin-tax-support.html` into the versioned classic asset `assets/admin-tax-support-v303.js`.

The release guard reconstructs the accepted Build 302 page and proves the extracted controller is byte-for-byte identical to the previous inline runtime. The backend authority remains `functions/api/admin/accounting_tax_support.js` plus `functions/api/_lib/accounting-tax-support.js` unchanged.

Retained surfaces include business-use mileage, home-office factual allocation, capital-asset/CCA support, year-end inventory/COGS support, T2125/accountant readiness, tax evidence manifest, and accountant JSON package generation. Build 303 adds no tax judgment, no schema/database change, no accounting-policy change and no payment-provider mutation.

Development acceptance is read-only: it verifies the deployed admin tax-support page and versioned asset without posting tax-support data.

**Next planned release after Build 303:** Build 304 — Accountant export integrity. Build 304 is not part of this release.
