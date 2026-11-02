// Build 264 Detailer namespace facade. Signed storage upload remains server-authorized.
import { onRequestPost as post } from '../admin/progress_upload_url.js';
export { onRequestOptions, onRequestGet } from '../admin/progress_upload_url.js';
export const onRequestPost=context=>post({...context,detailerCapture747:true});
