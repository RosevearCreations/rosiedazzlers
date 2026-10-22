/** Standard theme public marketing artwork loader.
 * Process illustration slots are fallback-only; theme-owned service/town cards
 * always use the selected theme, not unrelated R2 job/gallery photographs.
 */
import { standardLandingFallback } from "./standard-image-slots.js";

function isPublicStandard(){
 return !location.pathname.startsWith("/admin") &&
   (document.documentElement.dataset.rosieTheme || "standard") === "standard";
}

export function hydrateStandardProcessImages(root=document){
 if(!isPublicStandard())return;
 root.querySelectorAll('img[data-standard-filename]').forEach((img)=>{
  if(img.dataset.standardImageChecked==="true")return;
  img.dataset.standardImageChecked="true";
  const name=String(img.dataset.standardFilename||"");
  if(!/^process-[a-z0-9-]+\.webp$/.test(name))return;
  const original="/assets/placeholders/service-photo-needed.svg";
  if(img.getAttribute("src")!==original)return;
  const proposed="/assets/themes/standard/images/"+name;
  const check=new Image();
  check.onload=()=>{
   // Respect any later Photo Studio or client assignment rather than overwriting it.
   if(!img.isConnected||img.getAttribute("src")!==original)return;
   img.src=proposed;
   img.alt=img.dataset.standardAlt||"Rosie Dazzlers detailing process illustration";
   img.dataset.standardImageLoaded="true";
  };
  check.onerror=()=>{}; // Retain correct original placeholder until owner uploads artwork.
  check.src=proposed;
 });
}

/** Theme artwork for fixed public service/town marketing cards.
 * Customer proof, actual job results and reviews do not use these slots.
 */
export function hydrateStandardCardArtwork(root=document){
 if(!isPublicStandard())return;
 root.querySelectorAll(".service-link-card[data-r2-image-href],.local-town-card[data-r2-image-href]").forEach((card)=>{
  const route=String(card.dataset.r2ImageHref||"").split("?")[0].replace(/^\/+|\/+$/g,"");
  const fallback=standardLandingFallback(route);
  if(!fallback)return;
  card.style.setProperty("--standard-card-art",`url("${fallback}")`);
  card.dataset.standardThemeCard="true";
 });
}
