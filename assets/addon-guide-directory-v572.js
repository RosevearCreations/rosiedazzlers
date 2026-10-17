import {ADDON_CODES_572,ADDON_GUIDES_572} from "./addon-guides-v572.js";
const list=document.getElementById("addon-directory");
if(list){for(const code of ADDON_CODES_572){const d=ADDON_GUIDES_572[code],a=document.createElement("a");a.href="/preview/addons/"+code;const title=document.createElement("strong"),sub=document.createElement("span");title.textContent=d.name;sub.textContent=d.category;a.append(title,sub);list.append(a);}}
