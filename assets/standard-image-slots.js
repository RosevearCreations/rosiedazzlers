/** Owner-controlled Standard theme marketing artwork, separate from customer
 * evidence and employee Photo Studio media. The image path is a stable slot ID.
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
 "paint-correction":"addon-two-stage-polish.webp",
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
 complete_detail:"package-complete.webp",
 interior_detail:"interior-detail.webp",
 exterior_detail:"service-exterior.webp"
});
// Pricing catalogue codes are stable API identifiers; the public service
// landing slugs are different. Keep the mapping in one place for both booking
// cards and the public pricing catalogue. Never rewrite the saved catalogue:
// its image URLs remain available to operators as historical media records.
const ADDON_SLUGS=Object.freeze({
 full_clay_treatment:"full-clay-treatment",
 two_stage_polish:"two-stage-polish",
 high_grade_paint_sealant:"high-grade-paint-sealant",
 uv_protectant_applied_on_interior_panels:"uv-protectant",
 de_ionizing_treatment:"de-ionizing-treatment",
 de_badging:"de-badging",
 engine_cleaning:"engine-cleaning",
 external_ceramic_coating:"ceramic-coating",
 external_graphene_fine_finish:"graphene-finish",
 external_wax:"exterior-wax",
 vinyl_wrapping:"vinyl-wrapping",
 window_tinting:"window-tinting",
 pet_hair_removal:"pet-hair-removal",
 odor_treatment:"odor-removal",
 seat_shampoo:"seat-shampoo",
 carpet_shampoo:"carpet-shampoo",
 salt_stain_treatment:"salt-stain-treatment",
 headlight_restoration_addon:"headlight-restoration",
 windshield_ceramic_coating:"windshield-ceramic-coating",
 ceramic_spray_wax:"ceramic-spray-wax",
 trim_restoration:"trim-restoration",
 bug_tar_removal:"bug-tar-removal",
 truck_box_wash:"truck-box-wash",
 fleet_vehicle_add_on:"fleet-vehicle-add-on"
});
const BASE="/assets/themes/standard/images/";
export function standardThemeIsActive(){
 return typeof document==='undefined' || (document.documentElement?.dataset?.rosieTheme||'standard')==='standard';
}
export function standardLandingFallback(slug) {
 const normalized=String(slug||"").trim().toLowerCase();
 const filename=SERVICE_IMAGES[normalized]||TOWN_IMAGES[normalized];
 return filename ? BASE+filename : "";
}
export function standardPackageFallback(code){
 const filename=PACKAGE_IMAGES[String(code||"").trim().toLowerCase()];
 return filename ? BASE+filename : "";
}
export function standardAddonFallback(code){
 const key=String(code||"").trim().toLowerCase();
 const slug=ADDON_SLUGS[key]||key.replaceAll('_','-');
 return standardLandingFallback(slug);
}
