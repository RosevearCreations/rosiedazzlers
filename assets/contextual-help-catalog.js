// Build 274 — central authenticated-screen contextual help catalogue.
// Keep provider credentials out of this file. Help describes where values come from; it never stores them.
(function attachRosieHelpCatalog(globalScope) {
  const catalog = {
    version: "274.1",
    defaultPage: {
      title: "Rosie Dazzlers workspace",
      what: "This is an authenticated Rosie Dazzlers work screen.",
      changes: "Actions and editable fields on this screen can change the business record or workflow named by the page.",
      why: "Rosie uses this workspace to keep operational data in the application instead of relying on disconnected notes.",
      source: "Use the matching customer, booking, business, provider, accounting, inventory, or operational source record. Do not guess values that affect customers, money, permissions, or integrations."
    },
    pages: {
      "admin-integrations": {
        title: "I.T. Connections",
        what: "This is Rosie's authoritative integration catalogue for application services, payments, messaging, analytics and publishing connections.",
        changes: "This screen is read-only. Refreshing it rechecks whether required server variables, secrets or bindings are present; it does not save credentials.",
        why: "Rosie needs one safe place to see what each external service needs, where configuration belongs, how it is obtained, and how it should be tested.",
        source: "The status comes from server-side runtime configuration presence plus the Build 274 integration registry. Secret values are never returned to the browser.",
        related: ["Cloudflare Pages project settings", "Supabase project/settings", "Provider business/developer consoles", "Development acceptance tests"]
      },
      "admin-site-settings": {
        title: "Editable Site Settings",
        what: "This workspace edits business/site configuration stored in Rosie's application settings, with bundled JSON retained as a recovery fallback.",
        changes: "Saving a setting can change public copy, policies, templates, hours, navigation, analytics labels, media rules or other configuration used by the site.",
        why: "Rosie needs routine business configuration to be editable without changing application source code.",
        source: "Use the current approved business policy/content/configuration as the authority. Provider credentials do not belong in these settings; use I.T. Connections for credential instructions.",
        related: ["app_management_settings", "Bundled fallback JSON", "I.T. Connections for integrations"],
        fields: {
          settingJson: {
            title: "Advanced JSON fallback",
            what: "This is the raw JSON representation of the currently selected editable setting.",
            changes: "Saving valid JSON can replace the selected setting payload and affect every page or workflow that consumes it.",
            why: "Rosie keeps this as an emergency repair and advanced recovery path when the friendly editor cannot express a required change.",
            source: "Start from the currently loaded setting or an approved bundled fallback. Do not paste credentials, tokens or unrelated configuration here.",
            format: "Valid JSON matching the selected setting's expected schema.",
            implications: "A malformed or semantically wrong value can change public content or application behavior. Validate and preview before saving.",
            security: "Do not store API keys, passwords, service-role keys, webhook secrets or access tokens here."
          }
        }
      }
    },
    fields: {
      name: {
        title: "Name",
        what: "The human-readable name for this record.",
        changes: "Changing it changes how the record is identified in Rosie and, where published, what users may see.",
        why: "A clear name lets staff and customers identify the correct item without relying on internal IDs.",
        source: "Use the approved customer, service, product, staff, supplier or business name represented by this record."
      },
      title: {
        title: "Title",
        what: "The display title for this record or content block.",
        changes: "Changing it changes the heading or label shown wherever this record is rendered.",
        why: "Rosie uses titles to make pages and internal records understandable and searchable.",
        source: "Use the approved business/content wording and keep public SEO intent in mind."
      },
      description: {
        title: "Description",
        what: "The explanatory text for this record, service, item or content block.",
        changes: "Changing it changes the descriptive copy saved for this record and may change public-facing text if the record is published.",
        why: "Rosie uses descriptions to explain scope, expectations and value clearly.",
        source: "Use accurate approved business/service details; do not promise work, pricing or outcomes Rosie does not offer."
      },
      email: {
        title: "Email address",
        what: "The email address associated with this person, destination or workflow.",
        changes: "Changing it can change where confirmations, notices or account-related communication are sent.",
        why: "Rosie needs a correct contact destination for the workflow using this record.",
        source: "Use the address supplied or approved by the person/business that owns it.",
        format: "A valid email address, for example name@example.ca.",
        security: "Treat customer/staff contact information as private operational data."
      },
      phone: {
        title: "Phone number",
        what: "The phone number associated with this person, destination or workflow.",
        changes: "Changing it can change where calls or SMS notifications are directed.",
        why: "Rosie needs a reliable contact number for time-sensitive service communication where that channel is permitted.",
        source: "Use the number supplied or approved by the person/business that owns it.",
        security: "Treat customer/staff contact information as private operational data."
      },
      price: {
        title: "Price",
        what: "The customer-facing or quoted monetary amount represented by this field.",
        changes: "Changing it can change estimates, displayed prices, booking totals or downstream accounting depending on the page.",
        why: "Rosie needs controlled prices so public promises and accounting stay aligned.",
        source: "Use the approved pricing catalogue or quote authority for this service/item.",
        implications: "Review tax, deposit, discount and accounting effects before changing a live price."
      },
      cost: {
        title: "Cost",
        what: "Rosie's internal cost associated with this record, item or activity.",
        changes: "Changing it can affect margin, profitability, inventory valuation or accounting analysis.",
        why: "Accurate cost data helps Rosie understand the real economics of a job or item.",
        source: "Use the supplier invoice, purchase record, allocated labour/material rule or approved accounting source.",
        implications: "Do not substitute customer price for internal cost."
      },
      quantity: {
        title: "Quantity",
        what: "The count or amount of this item represented by the record.",
        changes: "Changing it can affect inventory availability, usage, purchasing or job costing.",
        why: "Rosie needs accurate quantities to avoid shortages and incorrect cost calculations.",
        source: "Use a physical count, receiving record, usage record or other approved inventory evidence."
      },
      status: {
        title: "Status",
        what: "The current workflow state of this record.",
        changes: "Changing it can move the record into a different operational stage and may enable or stop downstream actions.",
        why: "Rosie uses statuses to coordinate what is pending, active, complete, blocked or cancelled.",
        source: "Choose the state that matches what has actually happened, not what is merely planned."
      },
      notes: {
        title: "Notes",
        what: "Internal explanatory notes associated with this record.",
        changes: "Changing them changes the context staff will see when reviewing the record later.",
        why: "Notes preserve useful exceptions or reasoning that structured fields cannot capture.",
        source: "Record concise factual information from the current workflow.",
        security: "Do not paste passwords, API secrets, payment-card data or unnecessary sensitive customer information into notes."
      }
    },
    aliases: {
      display_name: "name",
      customer_name: "name",
      business_name: "name",
      service_name: "name",
      product_name: "name",
      page_title: "title",
      seo_title: "title",
      meta_description: "description",
      customer_email: "email",
      contact_email: "email",
      customer_phone: "phone",
      contact_phone: "phone",
      unit_price: "price",
      price_cad: "price",
      amount: "price",
      unit_cost: "cost",
      cost_cad: "cost",
      qty: "quantity",
      on_hand: "quantity",
      internal_notes: "notes"
    }
  };

  globalScope.RosieHelpCatalog = Object.freeze(catalog);
})(window);
