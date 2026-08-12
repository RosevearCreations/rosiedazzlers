// Build 252 — public, read-only manifest for approved website imagery in rosie-assets.
// Only the public website prefixes are listed. Private DAIP media is never queried.

const IMAGE_KEY = /\.(?:avif|gif|jpe?g|png|webp)$/i;
const PREFIXES = Object.freeze([
  { key: 'packages', prefix: 'packages/' },
  { key: 'landing_pages', prefix: 'landing_pages/' },
  { key: 'car_photos', prefix: 'CarPhotos/' }
]);

function headers(){
  return {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'public, max-age=300, stale-while-revalidate=1800',
    'X-Content-Type-Options':'nosniff'
  };
}

function reply(body,status=200){
  return new Response(JSON.stringify(body), { status, headers:headers() });
}

function publicBucket(env){
  return env.ROSIE_PUBLIC_ASSETS_BUCKET ||
    env.PUBLIC_ASSETS_BUCKET ||
    env.R2_PUBLIC_ASSETS_BUCKET ||
    env.ASSETS_BUCKET;
}

function publicBase(env){
  return String(env.PUBLIC_ASSET_BASE_URL || env.ASSETS_PUBLIC_BASE_URL || 'https://assets.rosiedazzlers.ca/')
    .replace(/\/?$/, '/');
}

function publicUrl(base,key){
  return base + String(key || '').split('/').map((part) => encodeURIComponent(part)).join('/');
}

async function listPrefix(bucket, base, prefix, cap=350){
  const images = [];
  let cursor;
  do {
    const page = await bucket.list({ prefix, cursor, limit:250 });
    for (const object of page.objects || []) {
      const key = String(object?.key || '').trim();
      if (!key || key === prefix || !IMAGE_KEY.test(key)) continue;
      images.push({
        key,
        prefix,
        filename:key.split('/').pop() || key,
        url:publicUrl(base,key),
        size:Number(object?.size || 0) || null,
        uploaded:object?.uploaded ? new Date(object.uploaded).toISOString() : null
      });
      if (images.length >= cap) break;
    }
    if (images.length >= cap || !page.truncated) break;
    cursor = page.cursor;
  } while (cursor);
  return images;
}

export async function onRequestGet({ env }) {
  try {
    const bucket = publicBucket(env);
    if (!bucket || typeof bucket.list !== 'function') {
      return reply({
        ok:true,
        build:252,
        bucket_ready:false,
        prefixes:Object.fromEntries(PREFIXES.map((item) => [item.key, []])),
        images:[],
        warning:'Public R2 asset binding is not configured for Pages Functions.'
      });
    }

    const base = publicBase(env);
    const groups = {};
    for (const item of PREFIXES) {
      groups[item.key] = await listPrefix(bucket, base, item.prefix);
    }
    const images = PREFIXES.flatMap((item) => groups[item.key] || []);

    return reply({
      ok:true,
      build:252,
      bucket_ready:true,
      base_url:base,
      allowed_prefixes:PREFIXES.map((item) => item.prefix),
      counts:Object.fromEntries(PREFIXES.map((item) => [item.key, (groups[item.key] || []).length])),
      prefixes:groups,
      images
    });
  } catch (error) {
    return reply({
      ok:false,
      build:252,
      bucket_ready:false,
      prefixes:Object.fromEntries(PREFIXES.map((item) => [item.key, []])),
      images:[],
      error:error?.message || 'Could not list approved website images.'
    }, 500);
  }
}

export async function onRequestHead({ env }) {
  const bucket = publicBucket(env);
  return new Response(null, {
    status: bucket && typeof bucket.list === 'function' ? 204 : 503,
    headers:headers()
  });
}
