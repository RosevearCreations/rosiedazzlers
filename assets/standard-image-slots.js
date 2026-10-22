/** Standard theme approved static image candidates. Never overwrite authored R2 media.
 * Used only after the original image and its format variants fail.
 */
const SERVICE_IMAGES=Object.freeze({
 "pet-hair-removal":"addon-pet-hair-removal.webp",
 "odor-removal":"addon-odor-treatment.webp",
 "seat-shampoo":"addon-seat-shampoo.webp",
 "carpet-shampoo":"addon-carpet-shampoo.webp",
 "salt-stain-treatment":"addon-salt-stain-treatment.webp",
 "headlight-restoration":"addon-headlight-restoration.webp",
 "windshield-ceramic-coating":"addon-windshield-ceramic-coating.webp",
 "ceramic-spray-wax":"addon-ceramic-spray-wax.webp",
 "trim-restoration":"addon-trim-restoration.webp",
 "bug-tar-removal":"addon-bug-tar-removal.webp",
 "truck-box-wash":"addon-truck-box-wash.webp",
 "fleet-vehicle-add-on":"addon-fleet-vehicle.webp",
 "de-badging":"addon-de-badging.webp",
 "exterior-wax":"addon-exterior-wax.webp",
 "uv-protectant":"addon-uv-protectant.webp",
 "window-tinting":"addon-window-tinting.webp",
 "vinyl-wrapping":"addon-vinyl-wrapping.webp",
 "graphene-finish":"addon-graphene-finish.webp",
 "engine-cleaning":"addon-engine-cleaning.webp",
 "ceramic-coating":"addon-ceramic-coating.webp",
 "two-stage-polish":"addon-two-stage-polish.webp",
 "full-clay-treatment":"addon-full-clay-treatment.webp",
 "de-ionizing-treatment":"addon-de-ionizing-treatment.webp",
 "high-grade-paint-sealant":"addon-high-grade-paint-sealant.webp"
});
// Town banners are owner-managed theme artwork, not employee Photo Studio proof.
const TOWN_IMAGES=Object.freeze({
 "tillsonburg-auto-detailing":"town-tillsonburg.webp",
 "woodstock-ingersoll-auto-detailing":"town-woodstock-ingersoll.webp",
 "simcoe-delhi-auto-detailing":"town-simcoe-delhi.webp",
 "port-dover-auto-detailing":"town-port-dover.webp",
 "norwich-otterville-auto-detailing":"town-norwich-otterville.webp",
 "zorra-thamesford-embro-auto-detailing":"town-zorra-thamesford-embro.webp",
 "waterford-vittoria-auto-detailing":"town-waterford-vittoria.webp",
 "port-rowan-turkey-point-auto-detailing":"town-port-rowan-turkey-point.webp"
});
const PACKAGE_IMAGES=Object.freeze({
 premium_wash:"package-premium-wash.webp",
 basic_detail:"package-basic.webp",
 complete_detail:"package-complete.webp"
});
const BASE="/assets/themes/standard/images/";
export function standardLandingFallback(slug) {
 const normalized=String(slug||"").trim().toLowerCase();
 const filename=SERVICE_IMAGES[normalized]||TOWN_IMAGES[normalized];
 return filename ? BASE+filename : "";
}
export function standardPackageFallback(code){
 const filename=PACKAGE_IMAGES[String(code||"").trim().toLowerCase()];
 return filename ? BASE+filename : "";
}
