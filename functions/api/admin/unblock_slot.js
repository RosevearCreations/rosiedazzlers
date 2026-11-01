import { releaseOwnerScheduleBlock738 } from "../_lib/owner-schedule-exception-v738.js";

export async function onRequestPost(context) {
  return releaseOwnerScheduleBlock738(context, "slot");
}
