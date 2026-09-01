const PROFILE_FIELDS = [
  'id','created_at','updated_at','email','full_name','preferred_contact_name','phone','sms_phone',
  'tier_code','customer_tier_code','notes','address_line1','address_line2','city','province','postal_code',
  'alternate_address_label','alternate_address_line1','alternate_address_line2','alternate_city','alternate_province','alternate_postal_code',
  'vehicle_notes','client_private_notes','detailer_visible_notes','notification_opt_in','notification_channel','detailer_chat_opt_in',
  'notify_on_progress_post','notify_on_media_upload','notify_on_comment_reply','has_water_hookup','has_power_hookup',
  'live_updates_enabled','billing_profile_enabled','email_verified_at','is_active'
];

const VEHICLE_FIELDS = [
  'id','created_at','updated_at','customer_profile_id','vehicle_name','model_year','make','model','vehicle_size','body_style',
  'vehicle_category','is_exotic','color','mileage_km','next_service_mileage_km','last_wash_at','next_cleaning_due_at',
  'service_interval_days','auto_schedule_opt_in','last_package_code','last_addons','parking_location','alternate_service_address',
  'notes_for_team','detailer_visible_notes','preferred_contact_name','contact_email','contact_phone','text_updates_opt_in',
  'live_updates_opt_in','has_water_hookup','has_power_hookup','save_billing_on_file','billing_label','is_primary','display_order',
  'garage_display_media_url','garage_display_media_kind'
];

const TIER_FIELDS = ['id','code','name','description','discount_percent'];

const REVIEW_FIELDS = [
  'id','created_at','updated_at','customer_profile_id','booking_id','vehicle_id','review_source','rating','review_title','review_text',
  'is_public','status','google_review_url','reviewer_name'
];

function pick(row, fields) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const out = {};
  for (const key of fields) if (Object.prototype.hasOwnProperty.call(row, key)) out[key] = row[key];
  return out;
}

export function customerSafeProfile(row) { return pick(row, PROFILE_FIELDS); }
export function customerSafeVehicle(row) { return pick(row, VEHICLE_FIELDS); }
export function customerSafeTier(row) { return pick(row, TIER_FIELDS); }
export function customerSafeReview(row) { return pick(row, REVIEW_FIELDS); }
export function customerSafeVehicles(rows) { return (Array.isArray(rows) ? rows : []).map(customerSafeVehicle).filter(Boolean); }
export function customerSafeReviews(rows) { return (Array.isArray(rows) ? rows : []).map(customerSafeReview).filter(Boolean); }

export const STAFF_PRIVATE_CUSTOMER_FIELDS = Object.freeze(['admin_private_notes']);
