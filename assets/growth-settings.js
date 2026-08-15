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
    plan_name: 'Maintain Your Shine Plan',
    cycle_label: 'Every 4 or 8 weeks',
    teaser: 'Keep your vehicle on a repeating clean schedule with priority reminders and simpler rebooking.',
    benefits: [
      'Priority reminder before your preferred date',
      'Faster rebooking using your saved vehicle',
      'Cleaner predictable maintenance cycle'
    ],
    why_title: 'Why add this now',
    why_lines: ['Repeat scheduling | Less back-and-forth','Preferred cycle | Every 4 or 8 weeks','Local planning | Better crew forecasting','Booking path | Still uses the live booking flow'],
    waitlist_intro: 'Leave your preferred cycle and a few details about the vehicles you want covered. We use this to shape the recurring-plan offer while actual reminder timing follows completed service history.',
    self_serve_title: 'How this fits the self-serve direction',
    self_serve_copy: 'Recurring plans should not replace the booking flow. They should make the same booking-led experience easier to repeat with reminder-first scheduling, saved vehicle details, and clearer maintenance timing.',
    good_fit_title: 'Good fit for',
    good_fit_lines: ['Busy households trying to keep vehicles presentable year-round','Repeat clients who already know their package and preferred clean cycle','Work-from-home or driveway-friendly bookings across Oxford and Norfolk areas'],
    reminder_enabled: true,
    reminder_channel: 'email',
    reminder_subject: 'It may be time to book your next Rosie Dazzlers clean',
    reminder_intro: 'Use the booking-led planner to pick your next clean while your preferred timing is still open.',
    reminder_send_hour_local: 9,
    timezone_label: 'America/Toronto'
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
