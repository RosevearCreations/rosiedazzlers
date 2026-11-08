// Build 803: fixed-price explanatory breakdown only. Never supplies checkout totals.
const cents=value=>value!==null&&value!==undefined&&value!==''&&
  Number.isFinite(Number(value))&&Number(value)>=0?
  Math.round(Number(value)*100):null;
export const cad803=value=>new Intl.NumberFormat('en-CA',
  {style:'currency',currency:'CAD'}).format(value);
export function quoteBreakdown803({packageName='',packageAmount=null,
  addons=[],vehicleSize='',deposit=0}={}){
  const start=cents(packageAmount);
  if(!vehicleSize||!packageName||start===null||start===0)
    return {ready:false,lines:[],subtotal:null,quoteOnly:[],deposit:null};
  let subtotal=start;const lines=[{label:packageName,amount:start/100}];
  const quoteOnly=[];
  for(const addon of addons){
    const label=String(addon.name||'Optional work');
    if(addon.quoteRequired===true){quoteOnly.push(label);continue;}
    const amount=cents(addon.amount);
    if(amount===null)return {ready:false,lines:[],subtotal:null,quoteOnly:[],deposit:null};
    subtotal+=amount;lines.push({label,amount:amount/100});
  }
  return {ready:true,lines,subtotal:subtotal/100,quoteOnly,
    deposit:cents(deposit)===null?null:cents(deposit)/100};
}
