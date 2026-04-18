export const GROWTH_DEFAULTS = {
  quote_booking_settings: {
    prominent_cta: true,
    show_exact_total: true,
    show_time_expectation: true,
    teaser_text: 'Start with the live booking planner to see service-area restrictions, 21-day availability windows, package choices, add-ons, and deposit-ready details before checkout.'
  },
  gift_delivery_settings: {
    enabled: true,
    manual_review: true,
    default_message: 'Choose a recipient, add a message, and pick the day you want us to send the gift.'
  },
  membership_plan_settings: {
    enabled: false,
    waitlist_enabled: true,
    plan_name: 'Maintain Your Shine Plan',
    cycle_label: 'Every 4 or 8 weeks',
    teaser: 'Keep your vehicle on a repeating clean schedule with priority reminders and simpler rebooking.',
    benefits: [
      'Priority reminder before your preferred date',
      'Faster rebooking using your saved vehicle',
      'Cleaner predictable maintenance cycle'
    ]
  }
};

export async function loadGrowthSettings() {
  try {
    const res = await fetch('/api/growth_settings_public', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load growth settings.');
    const out = await res.json().catch(() => ({}));
    return {
      quote_booking_settings: { ...GROWTH_DEFAULTS.quote_booking_settings, ...(out.quote_booking_settings || {}) },
      gift_delivery_settings: { ...GROWTH_DEFAULTS.gift_delivery_settings, ...(out.gift_delivery_settings || {}) },
      membership_plan_settings: { ...GROWTH_DEFAULTS.membership_plan_settings, ...(out.membership_plan_settings || {}) }
    };
  } catch {
    return JSON.parse(JSON.stringify(GROWTH_DEFAULTS));
  }
}
