import assert from "node:assert/strict";
import {
  classifyNotificationDeliveryEvidence,
  evaluateCustomerCommunicationConsent
} from "../functions/api/_lib/customer-communication-consent.js";

const profile = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "customer@example.ca",
  phone: "519-555-0100",
  sms_phone: "519-555-0100",
  notification_opt_in: true,
  notification_channel: "email",
  detailer_chat_opt_in: true,
  notify_on_progress_post: true,
  notify_on_media_upload: true,
  notify_on_comment_reply: true
};
const emailEvent = {
  event_type: "review_request_invitation",
  channel: "email",
  customer_profile_id: profile.id,
  recipient_email: "customer@example.ca"
};

let result = evaluateCustomerCommunicationConsent({ profile: { ...profile, notification_opt_in: false }, event: emailEvent });
assert.equal(result.dispatch, false);
assert.equal(result.reason, "customer_opted_out");

result = evaluateCustomerCommunicationConsent({ profile: { ...profile, notification_channel: "sms" }, event: emailEvent });
assert.equal(result.dispatch, false);
assert.equal(result.reason, "channel_preference_changed");

result = evaluateCustomerCommunicationConsent({ profile, event: { ...emailEvent, recipient_email: "old-address@example.ca" } });
assert.equal(result.dispatch, false);
assert.equal(result.reason, "recipient_changed");

result = evaluateCustomerCommunicationConsent({ profile, event: emailEvent });
assert.equal(result.dispatch, true);
assert.equal(result.reason, "current_explicit_consent");
assert.equal(result.inferred_consent, false);

result = evaluateCustomerCommunicationConsent({ profile: null, event: { ...emailEvent, customer_profile_id: null } });
assert.equal(result.dispatch, false);
assert.equal(result.reason, "missing_customer_profile_id");

const pushEvent = { event_type: "media_uploaded", channel: "push", customer_profile_id: profile.id };
assert.equal(evaluateCustomerCommunicationConsent({ profile, event: pushEvent, pushActive: false }).reason, "no_active_push_subscription");
assert.equal(evaluateCustomerCommunicationConsent({ profile: { ...profile, notify_on_media_upload: false }, event: pushEvent, pushActive: true }).reason, "event_push_opted_out");
assert.equal(evaluateCustomerCommunicationConsent({ profile, event: pushEvent, pushActive: true }).dispatch, true);

const staffPush = evaluateCustomerCommunicationConsent({
  profile: null,
  event: { channel: "push", recipient_staff_user_id: "33333333-3333-4333-8333-333333333333" }
});
assert.equal(staffPush.applies, false);
assert.equal(staffPush.dispatch, true);

const accepted = classifyNotificationDeliveryEvidence({ status: "sent", sent_at: "2026-09-18T05:00:00Z" });
assert.equal(accepted.state, "provider_accepted");
assert.equal(accepted.provider_dependent, true);
assert.equal(accepted.definitive_delivery, false);

const delivered = classifyNotificationDeliveryEvidence({
  status: "delivered",
  delivered_at: "2026-09-18T05:01:00Z",
  provider_delivery_verified: true
});
assert.equal(delivered.state, "delivered");
assert.equal(delivered.provider_dependent, false);
assert.equal(delivered.definitive_delivery, true);

console.log("CUSTOMER COMMUNICATION CONSENT & DELIVERY EVIDENCE: PASS");
