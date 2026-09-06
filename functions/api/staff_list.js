// Build 350 — legacy Staff list route delegates to the canonical Staff & Access authority.
import { handleStaffListRequest } from "./_lib/staff-list-handler.js";

export async function onRequestPost(context) {
  return handleStaffListRequest(context);
}
