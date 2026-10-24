// Build 629 — pure customer package comparison from the live, editable catalog.
// Never create, cache or override package prices; checkout is the sole payment authority.
export const PACKAGE_COMPARISON_SCHEMA_629 = "rosie-service-package-comparison.v1";
export const PACKAGE_COMPARE_LIMIT_629 = 3;
const SIZES = new Set(["small","mid","oversize"]);
const txt = value => String(value == null ? "" : value).trim();
const valueCad = value => typeof value === "number" && Number.isFinite(value) && value >= 0
  && Number.isSafeInteger(Math.round(value * 100)) && Math.abs(value*100 - Math.round(value*100)) < 0.000001
    ? Math.round(value*100) : null;
function includedNames(pkg) {
  const rows = Array.isArray(pkg?.included_services) ? pkg.included_services : [];
  const seen = new Set();
  return rows.map(item => txt(typeof item==="string"?item:item?.name)).filter(name=>{
    if(!name || seen.has(name.toLowerCase())) return false;
    seen.add(name.toLowerCase());
    return true;
  });
}
export function normalizePackageComparisonSelection629(codes=[],max=PACKAGE_COMPARE_LIMIT_629) {
  const result=[], seen=new Set();
  if(!Array.isArray(codes)) return [];
  for(const candidate of codes) {
    const code=txt(candidate);
    if(!code||seen.has(code))continue;
    seen.add(code);
    result.push(code);
    if(result.length >= max)break;
  }
  return result;
}
export function buildServiceComparison629({catalog={},codes=[],vehicleSize=""}={}) {
  const packages=Array.isArray(catalog?.packages)?catalog.packages:[];
  const ids=normalizePackageComparisonSelection629(codes);
  const selected=ids.map(code=>packages.find(row=>row?.code===code)).filter(Boolean);
  const size=SIZES.has(vehicleSize)?vehicleSize:null;
  const services=[],keys=new Set();
  for(const pkg of selected)for(const name of includedNames(pkg)){
    if(!keys.has(name.toLowerCase())){keys.add(name.toLowerCase());services.push(name);}
  }
  const serviceRows=services.map(name=>({
    name,
    included:selected.map(pkg=>includedNames(pkg).some(row=>row.toLowerCase()===name.toLowerCase()))
  }));
  const columns=selected.map(pkg=>{
    const priceCents=size?valueCad(pkg?.prices_cad?.[size]):null;
    const depositCents=valueCad(pkg?.deposit_cad);
    return {
      code:txt(pkg.code),name:txt(pkg.name)||txt(pkg.code),
      alias:txt(pkg.display_alias),goal:txt(pkg.customer_goal),
      best_for:txt(pkg.best_for||pkg.chooser_prompt||pkg.subtitle),
      price_cents:priceCents,deposit_cents:depositCents,
      photo_estimate_recommended:pkg.photo_estimate_recommended===true,
      quote_required:pkg.quote_required===true,
      included_services:includedNames(pkg)
    };
  });
  return {
    schema:PACKAGE_COMPARISON_SCHEMA_629,vehicle_size:size,
    requested_codes:ids,selected_codes:columns.map(pkg=>pkg.code),
    selection_limit:PACKAGE_COMPARE_LIMIT_629,
    columns,service_rows:serviceRows,
    price_authority:"Catalog display only. Actual price, add-ons, taxes, deposit and availability are revalidated at checkout.",
    is_checkout:false,booking_created:false,deposit_taken:false
  };
}
