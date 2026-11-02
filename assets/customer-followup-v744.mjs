// Build 744: read-only suggestions and consent freshness. No send or booking effect.
import { evaluateConsent743 } from './notification-consent-preview-v743.mjs';

export const INTEREST_KINDS744 = Object.freeze(['rebook', 'maintenance', 'seasonal']);
export const CYCLE_HINTS744 = Object.freeze(['unsure', 'quarterly', 'twice_yearly', 'seasonal']);
const CLOSED = /cancel|refund|failed|void|no_show/i;

export function completedService744(row = {}) {
  return Boolean(row.id && row.package_code && (row.detailing_completed_at || String(row.job_status || '').toLowerCase() === 'completed'))
    && !CLOSED.test(`${row.status || ''} ${row.job_status || ''}`);
}

export function torontoMonth744(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit' }).formatToParts(now);
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`;
}

export function torontoSeason744(now = new Date()) {
  const month = Number(torontoMonth744(now).slice(-2));
  if ([12, 1, 2].includes(month)) return 'winter';
  if ([3, 4, 5].includes(month)) return 'spring';
  if ([6, 7, 8].includes(month)) return 'summer';
  return 'autumn';
}

export function seasonalGuidance744(service, season = torontoSeason744()) {
  if (!completedService744(service)) return null;
  const copy = {
    winter: 'An interior refresh may be worth asking about. Cold weather, ice, driveway access and workable conditions need a separate Rosie review.',
    spring: 'A spring clean-up may be worth discussing after winter road debris. Current service scope and conditions still need review.',
    summer: 'A summer wash or protection service may be worth considering. Check the current catalog and a workable appointment.',
    autumn: 'A fall interior or exterior refresh may be worth discussing before colder weather. Workability depends on current conditions.'
  };
  return { season, label: `${season[0].toUpperCase()}${season.slice(1)} idea`,
    copy: copy[season] || copy.autumn, sourced_from_booking: service.id,
    confirmed_available: false, appointment_created: false, promotional_message_sent: false };
}

export function currentMarketingConsent744({ profile, preference, now = new Date(), maxAgeDays = 180 } = {}) {
  const recorded = preference?.recorded_at ? Date.parse(preference.recorded_at) : NaN;
  const ageMs = now.getTime() - recorded;
  const fresh = Number.isFinite(recorded) && ageMs >= 0 && ageMs <= maxAgeDays * 86400000;
  const channels = {};
  for (const channel of ['email', 'sms', 'phone']) {
    const consent = evaluateConsent743({ profile, preference, channel, purpose: 'marketing' });
    channels[channel] = { allowed: fresh && consent.allowed, reason: !fresh ? 'marketing_consent_missing_or_stale' : consent.reason };
  }
  return { fresh, checked_at: now.toISOString(), preference_recorded_at: preference?.recorded_at || null,
    channels, staff_must_recheck_at_contact: true, automatic_dispatch_authorized: false };
}

export function availabilityReadback744(source, date) {
  if (!source || source.ok !== true || source.date !== date) return { state:'unknown', label:'Availability could not be verified. Choose a date in the booking wizard.' };
  if (source.blocked || (!source.AM && !source.PM)) return { state:'unavailable', label:'No bookable half-day is showing for that date. This is not a booking.' };
  const slots = [source.AM ? 'AM' : null, source.PM ? 'PM' : null].filter(Boolean).join(' / ');
  return { state:'provisional', label:`${slots} appears open in a live snapshot. One-car capacity, travel, weather and checkout must be revalidated. No slot is reserved.` };
}
