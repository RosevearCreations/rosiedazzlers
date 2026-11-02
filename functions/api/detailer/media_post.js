// Build 264 Detailer namespace facade. Completed media record remains booking-scoped.
import { onRequestPost as post } from '../admin/progress_media_post.js';
export { onRequestOptions, onRequestGet } from '../admin/progress_media_post.js';
export const onRequestPost=context=>post({...context,detailerCapture747:true});
