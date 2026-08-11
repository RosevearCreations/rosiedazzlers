// Build 250 — public, read-only manifest for already-approved website photos in rosie-assets/CarPhotos/.
// Raw/private DAIP media is deliberately excluded; only the public assets bucket binding is queried.

const IMAGE_KEY = /\.(?:avif|gif|jpe?g|png|webp)$/i;

export async function onRequestGet({ env }) {
  try {
    const bucket = env.ROSIE_PUBLIC_ASSETS_BUCKET || env.PUBLIC_ASSETS_BUCKET || env.R2_PUBLIC_ASSETS_BUCKET || env.ASSETS_BUCKET;
    if (!bucket || typeof bucket.list !== 'function') {
      return reply({ ok:true, build:250, bucket_ready:false, photos:[], warning:'Public R2 asset binding is not configured for Pages Functions.' }, 200);
    }
    const base = String(env.PUBLIC_ASSET_BASE_URL || env.ASSETS_PUBLIC_BASE_URL || 'https://assets.rosiedazzlers.ca/').replace(/\/?$/, '/');
    const photos = [];
    let cursor;
    do {
      const page = await bucket.list({ prefix:'CarPhotos/', cursor, limit:250 });
      for (const object of page.objects || []) {
        const key = String(object?.key || '').trim();
        if (!key || key === 'CarPhotos/' || !IMAGE_KEY.test(key)) continue;
        photos.push({
          key,
          filename:key.split('/').pop() || key,
          url:base + key.split('/').map((part) => encodeURIComponent(part)).join('/'),
          size:Number(object?.size || 0) || null,
          uploaded:object?.uploaded ? new Date(object.uploaded).toISOString() : null
        });
        if (photos.length >= 300) break;
      }
      if (photos.length >= 300 || !page.truncated) break;
      cursor = page.cursor;
    } while (cursor);
    return reply({ ok:true, build:250, bucket_ready:true, prefix:'CarPhotos/', count:photos.length, photos }, 200);
  } catch (error) {
    return reply({ ok:false, build:250, bucket_ready:false, photos:[], error:error?.message || 'Could not list approved CarPhotos assets.' }, 500);
  }
}

export async function onRequestHead({ env }) {
  const bucket = env.ROSIE_PUBLIC_ASSETS_BUCKET || env.PUBLIC_ASSETS_BUCKET || env.R2_PUBLIC_ASSETS_BUCKET || env.ASSETS_BUCKET;
  return new Response(null, { status: bucket && typeof bucket.list === 'function' ? 204 : 503, headers:headers() });
}

function headers(){
  return {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'public, max-age=300, stale-while-revalidate=1800',
    'X-Content-Type-Options':'nosniff'
  };
}
function reply(body,status){ return new Response(JSON.stringify(body), { status, headers:headers() }); }
