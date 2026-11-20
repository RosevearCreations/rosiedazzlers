// Rosie 912: approved sale inventory and quote-only remote specials. Never expose supplier drafts or customer rows.
import {retailRead912,retailResponse912} from './_lib/retail-store-v912.js';
import {publicCatalog912} from '../../assets/build912-retail-contract.mjs';
const denied=()=>retailResponse912({ok:false,error:'Method not allowed'},405);
export const onRequestPost=denied,onRequestPut=denied,onRequestPatch=denied,onRequestDelete=denied,onRequestOptions=denied;
export async function onRequestGet({env}){
 try{
  const [products,locations,specials]=await Promise.all([
   retailRead912(env,'rosie_retail_products_v912?select=id,sku,title,description,category,price_cents,stock_on_hand,active,publish_approved&order=title.asc&limit=200'),
   retailRead912(env,'rosie_retail_locations_v912?select=id,name,mode,service_area,customer_directions,active,starts_at,ends_at&limit=100'),
   retailRead912(env,'rosie_retail_specials_v912?select=id,code,title,location_id,percent_off,quote_required,active,starts_at,ends_at&limit=100')
  ]);
  const catalog=publicCatalog912(products,locations,specials);
  return retailResponse912({ok:true,...catalog,source:'ORIGINAL_ROSIE_SUPABASE',
   price_currency:'CAD',payment_available:false,final_hst_requires_checkout_review:true,
   remote_specials_quote_only:true,stock_not_reserved:true,no_supplier_draft_exposure:true});
 }catch{return retailResponse912({ok:false,error:'Live retail catalog unavailable; try again later',products:[],locations:[],remote_specials:[]},503)}
}
