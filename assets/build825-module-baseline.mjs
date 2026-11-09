// Build 825: stable human-reviewed November 8 source baseline; estimates NEVER auto-increase.
// All rows originate from docs/ROSIE_MODULE_COMPLETION_AUDIT_20261108.md.
export const MODULE_BASELINE_825=Object.freeze([
  {
    "id": "customer-experience-desktop",
    "name": "Customer experience — desktop",
    "built": 80,
    "proven": 40,
    "note": "Booking/My Account, worksite self-service; limited observed customer transactions",
    "source": "bookings",
    "role": "customer"
  },
  {
    "id": "customer-experience-mobile",
    "name": "Customer experience — mobile",
    "built": 75,
    "proven": 25,
    "note": "Responsive booking/account code; authenticated real-phone acceptance HOLD",
    "source": "bookings",
    "role": "customer"
  },
  {
    "id": "customer-experience-tablet",
    "name": "Customer experience — tablet",
    "built": 70,
    "proven": 20,
    "note": "Responsive screen foundations; representative tablet testing HOLD",
    "source": "bookings",
    "role": "customer"
  },
  {
    "id": "project-creative-work-tracking",
    "name": "Project / creative work tracking",
    "built": 75,
    "proven": 15,
    "note": "Project sessions, cost lines, outputs and booking linkage; 1 creative project, no field closure cohort",
    "source": "creative",
    "role": "operations"
  },
  {
    "id": "crm-lead-management",
    "name": "CRM / lead management",
    "built": 80,
    "proven": 15,
    "note": "Lead, conversion, customer history and follow-up endpoints; real conversion cohort sparse",
    "source": "bookings",
    "role": "customer"
  },
  {
    "id": "social-integration-publishing",
    "name": "Social integration / publishing",
    "built": 55,
    "proven": 10,
    "note": "Draft/approval, channel tables and dispatch adapters; 0 social dispatch attempts",
    "source": "social",
    "role": "admin"
  },
  {
    "id": "worker-detailer-desktop",
    "name": "Worker / detailer — desktop",
    "built": 75,
    "proven": 20,
    "note": "Job assignments, time, intake, signoffs; no observed time entries",
    "source": "fieldUpdates",
    "role": "detailer"
  },
  {
    "id": "worker-detailer-mobile",
    "name": "Worker / detailer — mobile",
    "built": 70,
    "proven": 15,
    "note": "Detailer workflows and mobile regression contracts; real device field proof HOLD",
    "source": "fieldUpdates",
    "role": "detailer"
  },
  {
    "id": "worker-detailer-tablet",
    "name": "Worker / detailer — tablet",
    "built": 65,
    "proven": 10,
    "note": "Responsive detailer routes; independent tablet field observation HOLD",
    "source": "fieldUpdates",
    "role": "detailer"
  },
  {
    "id": "admin-desktop",
    "name": "Admin — desktop",
    "built": 85,
    "proven": 35,
    "note": "Broad admin actions, role model, dashboard and operations source checks",
    "source": "followups",
    "role": "admin"
  },
  {
    "id": "admin-mobile",
    "name": "Admin — mobile",
    "built": 70,
    "proven": 20,
    "note": "Responsive operations/admin source tests, real authenticated phone acceptance HOLD",
    "source": "followups",
    "role": "admin"
  },
  {
    "id": "admin-tablet",
    "name": "Admin — tablet",
    "built": 70,
    "proven": 15,
    "note": "Shared responsive admin pages; no current independent tablet acceptance",
    "source": "followups",
    "role": "admin"
  },
  {
    "id": "job-preparation",
    "name": "Job preparation",
    "built": 80,
    "proven": 20,
    "note": "Site intake, job checklists, assignments and capacity rules; no completed-job checklist",
    "source": "fieldUpdates",
    "role": "detailer"
  },
  {
    "id": "job-progress-and-signoff",
    "name": "Job progress and signoff",
    "built": 80,
    "proven": 15,
    "note": "Progress/media/signoff history in source; 0 job updates in live database",
    "source": "fieldUpdates",
    "role": "detailer"
  },
  {
    "id": "scheduling-dispatch",
    "name": "Scheduling / dispatch",
    "built": 80,
    "proven": 20,
    "note": "Calendars, assignment, capacity, owner gating; live-field acceptance incomplete",
    "source": "bookings",
    "role": "operations"
  },
  {
    "id": "booking-and-quote-journey",
    "name": "Booking and quote journey",
    "built": 85,
    "proven": 35,
    "note": "Working catalogue, quote/booking routes and protected tests; 1 booking, provider HOLD",
    "source": "bookings",
    "role": "customer"
  },
  {
    "id": "payroll",
    "name": "Payroll",
    "built": 60,
    "proven": 5,
    "note": "Payroll runs and lines with protected APIs; 0 payroll runs and lines",
    "source": "payroll",
    "role": "operations"
  },
  {
    "id": "invoicing-final-balances",
    "name": "Invoicing / final balances",
    "built": 70,
    "proven": 10,
    "note": "Invoice/export and final balance request endpoints; 0 final-balance requests",
    "source": "invoices",
    "role": "operations"
  },
  {
    "id": "accounting-and-reconciliation",
    "name": "Accounting and reconciliation",
    "built": 80,
    "proven": 10,
    "note": "GL, journal, bank reconciliation and month close; 0 posted journals/period closes",
    "source": "accounting",
    "role": "admin"
  },
  {
    "id": "taxation-hst-t2125",
    "name": "Taxation / HST / T2125",
    "built": 65,
    "proven": 5,
    "note": "Tax-support workpapers and HST review; 0 tax workpapers; accountant approval absent",
    "source": "tax",
    "role": "admin"
  },
  {
    "id": "rosevear-application-integration-comms-hub",
    "name": "Rosevear application integration / Comms Hub",
    "built": 65,
    "proven": 10,
    "note": "Manifest, broker and original-receipt intake code; 0 original receipts in Rosie database; independent signed handshake not verified here",
    "source": "integration",
    "role": "admin"
  },
  {
    "id": "storefront-customer-catalogue",
    "name": "Storefront / customer catalogue",
    "built": 75,
    "proven": 30,
    "note": "Services, pricing, gifts, catalogue and public pages; purchase/fulfilment evidence incomplete",
    "source": "bookings",
    "role": "customer"
  },
  {
    "id": "inventory-stock-control",
    "name": "Inventory / stock control",
    "built": 80,
    "proven": 10,
    "note": "Inventory movements, posting, audit and cost sources; 0 stock movements",
    "source": "inventory",
    "role": "operations"
  },
  {
    "id": "supplies-consumables",
    "name": "Supplies / consumables",
    "built": 70,
    "proven": 10,
    "note": "Consumption and job cost allocations; physical usage proof absent",
    "source": "inventory",
    "role": "operations"
  },
  {
    "id": "tools-equipment",
    "name": "Tools / equipment",
    "built": 65,
    "proven": 10,
    "note": "Inventory/equipment catalogues and operations; real asset/service proof absent",
    "source": "inventory",
    "role": "operations"
  },
  {
    "id": "end-products-service-deliverables",
    "name": "End products / service deliverables",
    "built": 65,
    "proven": 15,
    "note": "Service packages, add-ons, gifts and output proof; final quality/fulfilment not observed",
    "source": "creative",
    "role": "operations"
  },
  {
    "id": "job-profitability-financial-tracking",
    "name": "Job profitability / financial tracking",
    "built": 75,
    "proven": 5,
    "note": "Cost, labour, margin and allocation views; no complete job financial source ledger",
    "source": "fieldUpdates",
    "role": "detailer"
  },
  {
    "id": "payments-deposits-and-refunds",
    "name": "Payments, deposits and refunds",
    "built": 75,
    "proven": 5,
    "note": "Stripe/PayPal and webhook/refund source paths; 0 payment webhook events; provider outcome HOLD",
    "source": "payments",
    "role": "customer"
  },
  {
    "id": "security-privacy-rbac",
    "name": "Security / privacy / RBAC",
    "built": 85,
    "proven": 40,
    "note": "Signed sessions, action permission, RLS, privacy-safe UI and CI; independent security/recovery proof missing",
    "source": "followups",
    "role": "admin"
  },
  {
    "id": "advertising-and-paid-campaigns",
    "name": "Advertising and paid campaigns",
    "built": 55,
    "proven": 5,
    "note": "Marketing planning, campaigns and SEO source; no verified ad spend/attribution evidence",
    "source": "social",
    "role": "admin"
  },
  {
    "id": "i-t-cross-module-operations-dashboard",
    "name": "I.T. cross-module operations dashboard",
    "built": 80,
    "proven": 25,
    "note": "Health, launch, recovery, evidence/owner diagnostics routes; provider+operational truth not fully connected",
    "source": "followups",
    "role": "admin"
  },
  {
    "id": "customer-communications-and-consent",
    "name": "Customer communications and consent",
    "built": 70,
    "proven": 10,
    "note": "Consent history, private handoff and notification queues; delivery-provider evidence HOLD",
    "source": "handoffs",
    "role": "operations"
  },
  {
    "id": "media-photo-provenance-and-consent",
    "name": "Media / photo provenance and consent",
    "built": 75,
    "proven": 15,
    "note": "Media library, privacy gates, photo/proof APIs; real asset/consent closure HOLD",
    "source": "creative",
    "role": "operations"
  },
  {
    "id": "local-seo-search-console-gbp",
    "name": "Local SEO / Search Console / GBP",
    "built": 70,
    "proven": 5,
    "note": "Content/local SEO diagnostics and attribution review; current external provider proof HOLD",
    "source": "social",
    "role": "admin"
  },
  {
    "id": "fleet-maintenance-programs",
    "name": "Fleet / maintenance programs",
    "built": 70,
    "proven": 5,
    "note": "Fleet accounts, maintenance and controlled pilot plans; owner approval and field execution HOLD",
    "source": "bookings",
    "role": "operations"
  },
  {
    "id": "backup-disaster-recovery",
    "name": "Backup / disaster recovery",
    "built": 70,
    "proven": 5,
    "note": "Recovery reports and authority checks; independent successful restore/drill HOLD",
    "source": null,
    "role": null
  },
  {
    "id": "analytics-retention-conversion",
    "name": "Analytics / retention / conversion",
    "built": 75,
    "proven": 15,
    "note": "Dashboard, retention and booking funnel readouts; sparse observed business outcomes",
    "source": null,
    "role": null
  },
  {
    "id": "loyalty-referrals-rebooking",
    "name": "Loyalty / referrals / rebooking",
    "built": 60,
    "proven": 10,
    "note": "Customer retention/rebook workflows; repeat-customer acceptance sparse",
    "source": "bookings",
    "role": "customer"
  },
  {
    "id": "legal-policies-tax-compliance-review",
    "name": "Legal, policies, tax compliance review",
    "built": 60,
    "proven": 5,
    "note": "Policy and compliance source screens; owner/legal/accountant signoff unverified",
    "source": "tax",
    "role": "admin"
  },
  {
    "id": "weather-seasonality-and-field-safety",
    "name": "Weather, seasonality and field safety",
    "built": 65,
    "proven": 10,
    "note": "Seasonal eligibility/capacity review rules; actual site/equipment proof held",
    "source": "bookings",
    "role": "operations"
  },
  {
    "id": "customer-support-and-exceptions",
    "name": "Customer support and exceptions",
    "built": 80,
    "proven": 15,
    "note": "Worksite issue/follow-up/escalation source and supervisor notes; 0 live follow-ups",
    "source": "handoffs",
    "role": "operations"
  },
  {
    "id": "staff-management-permissions",
    "name": "Staff management / permissions",
    "built": 80,
    "proven": 30,
    "note": "Staff users/roles/access checks; 2 active staff, field role matrix unobserved",
    "source": "followups",
    "role": "admin"
  },
  {
    "id": "procurement-vendors",
    "name": "Procurement / vendors",
    "built": 60,
    "proven": 10,
    "note": "Vendor/supplies foundation; purchasing and receipt lifecycle not validated",
    "source": "inventory",
    "role": "operations"
  },
  {
    "id": "monitoring-observability-incident-management",
    "name": "Monitoring / observability / incident management",
    "built": 80,
    "proven": 25,
    "note": "System health, release, error/incident reviews; actual ongoing owner/provider evidence incomplete",
    "source": "followups",
    "role": "admin"
  },
  {
    "id": "gift-cards-and-promotions",
    "name": "Gift cards and promotions",
    "built": 75,
    "proven": 10,
    "note": "Gift issuance and audit workflows; payment/provider fulfilment HOLD",
    "source": "payments",
    "role": "customer"
  }
]);
