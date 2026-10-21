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
export function standardLandingFallback(slug) {
 const normalized=String(slug||"").trim().toLowerCase();
 const filename=SERVICE_IMAGES[normalized];
 return filename ? "/assets/themes/standard/images/"+filename : "";
}
