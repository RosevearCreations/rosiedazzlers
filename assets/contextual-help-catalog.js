// Central authenticated-screen contextual help catalogue.
// Keep provider credentials out of this file. Help explains authority and workflow; it never stores secrets.
(function attachRosieHelpCatalog(globalScope) {
  const catalog = {
    version: "2026.09",
    defaultPage: {
      title: "Rosie Dazzlers workspace",
      what: "This is an authenticated Rosie Dazzlers work screen.",
      changes: "Actions and editable fields can change the business record or workflow named by the page.",
      why: "The workspace keeps operational information inside the application instead of disconnected notes and spreadsheets.",
      source: "Use the matching customer, booking, business, accounting, inventory, provider or operational source record. Do not guess values that affect customers, money, permissions or integrations."
    },
    pages: {
      "admin-dashboard": {
        title: "Operations dashboard",
        what: "This is the starting point for current bookings, customers, operational queues and business follow-up.",
        changes: "Dashboard actions can open or advance live records; summary cards themselves are informational unless an action is selected.",
        why: "Use the dashboard to find work that needs attention without relying on remembered tasks.",
        source: "Counts and queues come from the current Rosie application records and authenticated APIs."
      },
      "admin-bookings": {
        title: "Bookings and quotes",
        what: "This workspace manages customer requests, quotes, scheduled work and booking status.",
        changes: "Saving can change dates, services, prices, customer commitments and downstream job/accounting state.",
        why: "Booking records are the operational authority for what Rosie agreed to perform and when.",
        source: "Use the customer's confirmed request, the approved pricing catalogue and actual scheduling availability."
      },
      "admin-photo-studio": {
        title: "Photo and Media Studio",
        what: "This workspace reviews approved media, assignments, galleries and public image placement.",
        changes: "Assignment or publication actions can change which images appear on public pages; deletion should only be used for media that is safe to remove.",
        why: "Rosie needs one controlled path from uploaded evidence to correctly labelled, intentional public proof.",
        source: "Use approved R2 media and the recorded assignment/publication state. Preserve before/after truth and accurate alt text."
      },
      "admin-accounting": {
        title: "Finance and accounting",
        what: "This workspace reviews financial records, reconciliation work, statements and posting queues.",
        changes: "Approval, reconciliation or posting actions can change accounting state and reporting.",
        why: "Financial changes need an auditable source and explicit review rather than silent automation.",
        source: "Use invoices, payment-provider evidence, bank/statement evidence and approved accounting policy. Never invent balancing values."
      },
      "admin-inventory": {
        title: "Inventory and supplies",
        what: "This workspace tracks tools, consumables, quantities, purchasing and job usage.",
        changes: "Receiving, usage, adjustment and reorder actions can change on-hand quantities and job cost information.",
        why: "Accurate stock and cost records prevent shortages and improve job-profitability decisions.",
        source: "Use physical counts, supplier receipts, purchase records and actual job usage."
      },
      "admin-diagnostics": {
        title: "I.T. diagnostics and readiness",
        what: "This workspace reports application readiness, integration configuration and operational health evidence.",
        changes: "Read-only checks do not repair providers automatically; an explicit corrective action may change configuration or application state.",
        why: "Release and provider problems should be diagnosable from current evidence rather than assumptions.",
        source: "Use exact source SHA, current deployment evidence, server-side configuration presence and provider test results. Secret values must remain server-side."
      },
      "admin-integrations": {
        title: "I.T. Connections",
        what: "This is Rosie's authoritative integration catalogue for application services, payments, messaging, analytics and publishing connections.",
        changes: "Refreshing rechecks required server variables, secrets or bindings; it does not save or reveal credentials.",
        why: "Rosie needs one safe place to see what each external service needs, where configuration belongs and how it should be tested.",
        source: "Status comes from server-side runtime configuration presence plus the current integration registry. Secret values are never returned to the browser.",
        related: ["Cloudflare project settings", "Supabase project/settings", "Provider business/developer consoles", "Exact-release acceptance checks"]
      },
      "admin-site-settings": {
        title: "Editable Site Settings",
        what: "This workspace edits business/site configuration stored in Rosie's application settings, with bundled JSON retained as a recovery fallback.",
        changes: "Saving can change public copy, policies, templates, hours, navigation, analytics labels, media rules or other site configuration.",
        why: "Routine business configuration should be editable without changing application source code.",
        source: "Use the current approved business policy/content/configuration. Provider credentials belong in server configuration, not editable site settings.",
        related: ["app_management_settings", "Bundled fallback JSON", "I.T. Connections for integrations"],
        fields: {
          settingJson: {
            title: "Advanced JSON fallback",
            what: "This is the raw JSON representation of the currently selected editable setting.",
            changes: "Saving valid JSON can replace the selected setting payload and affect every page or workflow that consumes it.",
            why: "This is an emergency repair and advanced recovery path when the friendly editor cannot express a required change.",
            source: "Start from the currently loaded setting or an approved bundled fallback. Do not paste credentials, tokens or unrelated configuration here.",
            format: "Valid JSON matching the selected setting's expected schema.",
            implications: "A malformed or semantically wrong value can change public content or application behavior. Validate and preview before saving.",
            security: "Do not store API keys, passwords, service-role keys, webhook secrets or access tokens here."
          }
        }
      }
    },
    fields: {
      name: { title: "Name", what: "The human-readable name for this record.", changes: "Changing it changes how the record is identified and, where published, what users may see.", why: "A clear name lets staff and customers identify the correct item without relying on internal IDs.", source: "Use the approved customer, service, product, staff, supplier or business name represented by this record." },
      title: { title: "Title", what: "The display title for this record or content block.", changes: "Changing it changes the heading or label shown wherever this record is rendered.", why: "Titles make pages and internal records understandable and searchable.", source: "Use approved business/content wording and keep public search intent in mind." },
      description: { title: "Description", what: "The explanatory text for this record, service, item or content block.", changes: "Changing it changes descriptive copy and may change public-facing text if published.", why: "Descriptions explain scope, expectations and value clearly.", source: "Use accurate approved business/service details; do not promise work, pricing or outcomes Rosie does not offer." },
      email: { title: "Email address", what: "The email address associated with this person, destination or workflow.", changes: "Changing it can change where confirmations, notices or account communication are sent.", why: "A correct contact destination is required for the workflow using this record.", source: "Use the address supplied or approved by the person/business that owns it.", format: "A valid email address, for example name@example.ca.", security: "Treat customer/staff contact information as private operational data." },
      phone: { title: "Phone number", what: "The phone number associated with this person, destination or workflow.", changes: "Changing it can change where calls or SMS notifications are directed.", why: "A reliable contact number supports time-sensitive service communication where permitted.", source: "Use the number supplied or approved by the person/business that owns it.", security: "Treat customer/staff contact information as private operational data." },
      price: { title: "Price", what: "The customer-facing or quoted monetary amount represented by this field.", changes: "Changing it can change estimates, displayed prices, booking totals or downstream accounting.", why: "Controlled prices keep public promises and accounting aligned.", source: "Use the approved pricing catalogue or quote authority for this service/item.", implications: "Review tax, deposit, discount and accounting effects before changing a live price." },
      cost: { title: "Cost", what: "Rosie's internal cost associated with this record, item or activity.", changes: "Changing it can affect margin, profitability, inventory valuation or accounting analysis.", why: "Accurate cost data shows the real economics of a job or item.", source: "Use the supplier invoice, purchase record, allocated labour/material rule or approved accounting source.", implications: "Do not substitute customer price for internal cost." },
      quantity: { title: "Quantity", what: "The count or amount of this item represented by the record.", changes: "Changing it can affect inventory availability, usage, purchasing or job costing.", why: "Accurate quantities prevent shortages and incorrect cost calculations.", source: "Use a physical count, receiving record, usage record or other approved inventory evidence." },
      status: { title: "Status", what: "The current workflow state of this record.", changes: "Changing it can move the record into a different operational stage and may enable or stop downstream actions.", why: "Statuses coordinate what is pending, active, complete, blocked or cancelled.", source: "Choose the state that matches what has actually happened, not what is merely planned." },
      notes: { title: "Notes", what: "Internal explanatory notes associated with this record.", changes: "Changing them changes the context staff will see when reviewing the record later.", why: "Notes preserve useful exceptions or reasoning that structured fields cannot capture.", source: "Record concise factual information from the current workflow.", security: "Do not paste passwords, API secrets, payment-card data or unnecessary sensitive customer information into notes." }
    },
    aliases: {
      display_name: "name", customer_name: "name", business_name: "name", service_name: "name", product_name: "name",
      page_title: "title", seo_title: "title", meta_description: "description", customer_email: "email", contact_email: "email",
      customer_phone: "phone", contact_phone: "phone", unit_price: "price", price_cad: "price", amount: "price",
      unit_cost: "cost", cost_cad: "cost", qty: "quantity", on_hand: "quantity", internal_notes: "notes"
    }
  };

  globalScope.RosieHelpCatalog = Object.freeze(catalog);
})(window);
