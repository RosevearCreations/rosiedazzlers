export const PREVIEW_SCHEMA = 'rosie-owner-theme-preview.v1';
export const STANDARD_PALETTE = Object.freeze({background:'#0b0e11',surface:'#191d20',text:'#f5f6f7',accent:'#dec06d'});
const HEX=/^#[0-9a-f]{6}$/i;
const ID=/^[a-z][a-z0-9-]{2,39}$/;
export function contrastRatio(foreground,background){
  function luminance(hex){const values=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*values[0]+.7152*values[1]+.0722*values[2];}
  if(!HEX.test(foreground)||!HEX.test(background))return 0;
  const a=luminance(foreground),b=luminance(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
export function validateThemeDraft(draft){
  const errors=[];
  if(!draft||!ID.test(String(draft.id||'')))errors.push('Theme ID must be 3–40 lowercase letters, digits or hyphens, starting with a letter.');
  if(!String(draft?.label||'').trim()||String(draft?.label||'').length>80)errors.push('Theme label must be 1–80 characters.');
  if(!Number.isSafeInteger(draft?.version)||draft.version<1)errors.push('Theme version must be a positive integer.');
  for(const [name,value] of Object.entries(draft?.palette||{}))if(!HEX.test(value))errors.push(`${name} must be a six-digit colour.`);
  for(const name of Object.keys(STANDARD_PALETTE))if(!HEX.test(draft?.palette?.[name]||''))errors.push(`Missing valid ${name} colour.`);
  if(!errors.length&&contrastRatio(draft.palette.text,draft.palette.background)<4.5)errors.push('Body text/background contrast must meet 4.5:1.');
  if(draft?.status==='approved'||draft?.status==='active')errors.push('Build 620 drafts cannot approve or activate a public theme.');
  return errors;
}
export function clonePreviewTheme(source,id,label){
  const clone={schema:PREVIEW_SCHEMA,id,label,version:Number(source.version||1)+1,status:'owner_review_draft',parent:{id:source.id,version:source.version},palette:{...source.palette},slots:{static:{...(source.slots?.static||{})},managed:{...(source.slots?.managed||{})}},review:{acknowledged:false,notes:''}};
  const errors=validateThemeDraft(clone);if(errors.length)throw new Error(errors.join(' '));return clone;
}
export function exportReviewReceipt(draft,actor){
  const errors=validateThemeDraft(draft);if(errors.length)throw new Error(errors.join(' '));
  return {schema:PREVIEW_SCHEMA,kind:'owner-theme-review',theme:draft,actor:String(actor||'owner reviewer').slice(0,120),reviewedAt:new Date().toISOString(),decision:draft.review?.acknowledged?'preview_reviewed_only':'draft',publicActivation:false};
}
