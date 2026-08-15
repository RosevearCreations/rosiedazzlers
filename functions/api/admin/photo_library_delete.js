import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { getPublicAssetsBucket, isApprovedImageKey, photoSchemaStatus, safeText } from '../_lib/photo-library.js';

export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = await request.json(); } catch {}
  const access = await requireStaffAccess({ request, env, body, capability:'manage_bookings', allowLegacyAdminFallback:true });
  if (!access.ok) return access.response;
  try {
    const schema = await photoSchemaStatus(env);
    if (!schema.ready) return json({ ok:false, migration_required:true, migration:'sql/2026-08-12_build253_photo_management_studio.sql', error:'Apply the Build 253 photo-management migration before deleting managed photos.', schema },409);
    const id = safeText(body.id,80);
    if (!id) return json({ ok:false, error:'Photo id is required.' },400);
    const headers = serviceHeaders(env);

    // Current usage is authoritative for delete safety. Any active placement blocks deletion.
    const activeResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?select=id,target_key,target_label,is_active&media_id=eq.${encodeURIComponent(id)}&is_active=eq.true&limit=25`, { headers });
    if (!activeResponse.ok) return json({ ok:false, error:`Could not verify active image assignments: ${await activeResponse.text()}` },500);
    const activeRows = await activeResponse.json().catch(()=>[]);
    if (Array.isArray(activeRows) && activeRows.length) {
      return json({ ok:false, assigned:true, error:'This image is currently assigned and cannot be deleted. Remove its active placement(s) first.', assignments:activeRows.map((row)=>({target_key:row.target_key,target_label:row.target_label,is_active:true})) },409);
    }

    const [photoResponse, historyResponse] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?select=*&media_id=eq.${encodeURIComponent(id)}&is_active=eq.false&limit=200`, { headers })
    ]);
    if (!photoResponse.ok) return json({ ok:false, error:`Could not load the managed photo: ${await photoResponse.text()}` },500);
    if (!historyResponse.ok) return json({ ok:false, error:`Could not verify inactive assignment history: ${await historyResponse.text()}` },500);
    const photos = await photoResponse.json().catch(()=>[]);
    const photo = Array.isArray(photos) ? photos[0] : null;
    if (!photo) return json({ ok:false, error:'The managed photo was not found.' },404);
    const inactiveHistory = await historyResponse.json().catch(()=>[]);
    const r2Key = safeText(photo.r2_key,500);
    if (!isApprovedImageKey(r2Key)) return json({ ok:false, error:'Only approved public R2 image keys can be deleted from Photo Studio.' },400);
    const bucket = getPublicAssetsBucket(env);
    if (!bucket || typeof bucket.delete !== 'function') return json({ ok:false, error:'Public R2 bucket binding is not configured for deletion.' },501);

    const restoreHistory = async()=>{
      if(!Array.isArray(inactiveHistory)||!inactiveHistory.length)return;
      await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?on_conflict=id`, {method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(inactiveHistory)});
    };
    if(Array.isArray(inactiveHistory)&&inactiveHistory.length){
      const historyDelete=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?media_id=eq.${encodeURIComponent(id)}&is_active=eq.false`,{method:'DELETE',headers:{...headers,Prefer:'return=minimal'}});
      if(!historyDelete.ok)return json({ok:false,error:`Could not clear inactive placement history before deletion: ${await historyDelete.text()}`},500);
    }

    // Delete the DB record before R2. The FK restrict remains the final race-condition guard against a new active assignment.
    const deleteResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?id=eq.${encodeURIComponent(id)}`, { method:'DELETE', headers:{...headers, Prefer:'return=representation'} });
    if (!deleteResponse.ok) {
      try { await restoreHistory(); } catch {}
      return json({ ok:false, error:`The photo became referenced or could not be removed from the managed library: ${await deleteResponse.text()}` },409);
    }

    try {
      await bucket.delete(r2Key);
    } catch (r2Error) {
      // Compensate both the media row and its inactive placement history if storage deletion fails.
      try {
        await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library`, { method:'POST', headers:{...headers, Prefer:'resolution=merge-duplicates,return=minimal'}, body:JSON.stringify(photo) });
        await restoreHistory();
      } catch {}
      return json({ ok:false, error:`R2 deletion failed, so the managed record was restored. ${r2Error?.message || r2Error}`, restored:true, r2_key:r2Key },502);
    }
    return json({ ok:true, build:258, deleted:true, id, r2_key:r2Key, inactive_history_removed:Array.isArray(inactiveHistory)?inactiveHistory.length:0, label:photo.label || photo.filename || r2Key });
  } catch (err) {
    return json({ ok:false, error:err?.message || 'Could not delete the photo.' },500);
  }
}
