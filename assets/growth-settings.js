export const GROWTH_DEFAULTS = {
  quote_booking_settings: {
    prominent_cta: true,
    show_exact_total: true,
    show_time_expectation: true,
    teaser_text: 'Start with the live booking planner to see service-area restrictions, 21-day availability windows, package choices, add-ons, and deposit-ready details before checkout.'
  },
  gift_delivery_settings: {
    enabled: true,
    manual_review: false,
    automation_enabled: true,
    default_message: 'Choose a recipient, add a message, and pick the day you want us to send the gift.',
    default_send_hour_local: 9,
    timezone_label: 'America/Toronto',
    send_copy_to_purchaser: true
  },
  membership_plan_settings: {
    enabled: false,
    waitlist_enabled: true,
    plan_name: 'Maintenance Plan Interest',
    cycle_label: 'Cadence selected after service review',
    teaser: 'Tell us what recurring schedule would be useful after a completed reset or detail. This is an interest list; no subscription, fixed cadence, price, discount, or perk is promised.',
    benefits: [
      'Recurring service starts from current vehicle condition and completed service history',
      'Rebooking continues through the live booking flow',
      'Cadence is confirmed around use, season, condition, and service area'
    ],
    why_title: 'What the waitlist helps us learn',
    why_lines: [
      'Preferred cadence | Tell us what schedule would be useful',
      'Vehicle mix | One vehicle or several',
      'Season and use | Salt, pets, mileage and work use matter',
      'Booking path | Final appointments still use the live booking flow'
    ],
    waitlist_intro: 'Leave the cadence you would prefer and a few vehicle details. We use this as demand and planning evidence; it does not create a membership or lock in pricing, discounts, perks, or appointment frequency.',
    self_serve_title: 'How recurring service should fit booking',
    self_serve_copy: 'Recurring service should make the existing booking flow easier to repeat, not replace current availability, vehicle review, service scope, price, add-on, deposit, or site-access rules.',
    good_fit_title: 'Good fit for the interest list',
    good_fit_lines: [
      'Repeat customers who want a more predictable cleaning routine',
      'Vehicles affected by seasonal salt, pets, frequent use, or work activity',
      'Households or small businesses exploring repeat service without committing to a fixed membership'
    ],
    reminder_enabled: true,
    reminder_channel: 'email',
    reminder_subject: 'It may be time to book your next Rosie Dazzlers clean',
    reminder_intro: 'Use the booking-led planner to pick your next clean while your preferred timing is still open.',
    reminder_send_hour_local: 9,
    timezone_label: 'America/Toronto'
  }
};

function normalizePublicMembershipSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  // Build 275 public safety boundary: retained database/admin experiments must
  // not publish unapproved recurring pricing, cadence, discounts or perks.
  return {
    ...GROWTH_DEFAULTS.membership_plan_settings,
    enabled: source.enabled === true,
    waitlist_enabled: source.waitlist_enabled !== false
  };
}

export async function loadGrowthSettings() {
  try {
    const res = await fetch('/api/growth_settings_public', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load growth settings.');
    const out = await res.json().catch(() => ({}));
    return {
      quote_booking_settings: { ...GROWTH_DEFAULTS.quote_booking_settings, ...(out.quote_booking_settings || {}) },
      gift_delivery_settings: { ...GROWTH_DEFAULTS.gift_delivery_settings, ...(out.gift_delivery_settings || {}) },
      membership_plan_settings: normalizePublicMembershipSettings(out.membership_plan_settings)
    };
  } catch {
    return JSON.parse(JSON.stringify(GROWTH_DEFAULTS));
  }
}
