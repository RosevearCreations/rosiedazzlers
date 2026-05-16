#!/usr/bin/env python3
"""Match Amazon Business CSV rows against Rosie Dazzlers gear/consumable catalogs.

Usage:
  python scripts/amazon_catalog_match.py \
    --csv /path/to/orders.csv \
    --root .

Outputs sanitized, admin-review files under data/:
  - amazon_catalog_matches.json
  - amazon_inventory_enrichment_preview.json
  - amazon_inventory_match_review.csv

Privacy note: the generated files intentionally omit payment identifiers, account emails,
and full seller addresses. Re-run locally if deeper accounting evidence is needed.
"""
from __future__ import annotations
from pathlib import Path
import argparse, csv, json, re
from collections import Counter, defaultdict
try:
    from rapidfuzz import fuzz
except Exception:  # fallback for basic Python installs
    from difflib import SequenceMatcher
    class _Fuzz:
        @staticmethod
        def ratio(a,b): return int(SequenceMatcher(None,a,b).ratio()*100)
        @staticmethod
        def partial_ratio(a,b): return _Fuzz.ratio(a,b)
        @staticmethod
        def token_set_ratio(a,b):
            sa=' '.join(sorted(set(a.split()))); sb=' '.join(sorted(set(b.split())))
            return _Fuzz.ratio(sa,sb)
    fuzz=_Fuzz()
STOP=set('the and for with inch inches pcs piece pieces set kit pack packs of to a an on in by from cm mm ft foot feet heavy duty black white blue red green gray grey car auto detailing detailer tool tools product products'.split())
def norm(value):
    value=str(value or '').lower().replace('&',' and ')
    value=re.sub(r'[^a-z0-9]+',' ',value)
    return re.sub(r'\s+',' ',value).strip()
def tokens(value): return [t for t in norm(value).split() if len(t)>2 and t not in STOP]
def make_key(value): return re.sub(r'[^a-z0-9]+','_',norm(value)).strip('_')[:100] or 'item'
def money(value):
    value=str(value or '').replace('N/A','').replace('$','').replace(',','').strip()
    try: return float(value) if value else None
    except Exception: return None
def clean_formula(value): return str(value or '').replace('="','').replace('"','').strip()
def load_catalog(root: Path):
    rows=[]
    for rel, default_type in [('data/rosie_products_catalog.json','consumable'),('data/systems_catalog.json','tool')]:
        path=root/rel
        if not path.exists(): continue
        for row in json.loads(path.read_text(encoding='utf-8')):
            item=dict(row)
            item['item_key']=item.get('item_key') or make_key(item.get('name') or item.get('title') or item.get('filename'))
            item['item_type']='tool' if item.get('type')=='gear' or default_type=='tool' else 'consumable'
            item['_catalog_file']=rel
            rows.append(item)
    return rows
def load_amazon_rows(csv_path: Path):
    raw=list(csv.DictReader(csv_path.open('r',encoding='utf-8-sig',newline='')))
    rows=[]
    for r in raw:
        asin=str(r.get('ASIN','')).strip()
        title=str(r.get('Title','')).strip()
        if not title: continue
        qty=money(r.get('Item Quantity')) or 0
        subtotal=money(r.get('Item Subtotal')) or 0
        ppu=money(r.get('Purchase PPU'))
        if ppu is None and qty: ppu=subtotal/qty
        rows.append({
            'asin':asin,
            'title':title,
            'title_norm':norm(title),
            'title_tokens':set(tokens(title)),
            'amazon_url':f'https://www.amazon.ca/dp/{asin}' if asin else '',
            'order_date':r.get('Order Date',''),
            'quantity':qty,
            'purchase_ppu':ppu,
            'item_subtotal':subtotal,
            'item_net_total':money(r.get('Item Net Total')) or 0,
            'item_tax_total':(money(r.get('Item Federal Tax')) or 0)+(money(r.get('Item Provincial Tax')) or 0),
            'brand':r.get('Brand','') or r.get('Manufacturer',''),
            'manufacturer':r.get('Manufacturer',''),
            'model_number':r.get('Item model number',''),
            'part_number':r.get('Part Number',''),
            'seller_name':r.get('Seller Name',''),
            'amazon_category':r.get('Amazon-Internal Product Category',''),
            'unspsc':clean_formula(r.get('UNSPSC','')),
            'segment':r.get('Segment',''),
            'family':r.get('Family',''),
            'class':r.get('Class',''),
            'commodity':r.get('Commodity',''),
            'currency':r.get('Currency','CAD') or 'CAD'
        })
    aggregated=defaultdict(lambda:{'quantity_total':0,'net_total':0,'subtotal_total':0,'tax_total':0,'orders':[],'latest_date':'','weighted_cost_total':0,'weighted_cost_qty':0})
    for row in rows:
        key=row['asin'] or row['title_norm']
        bucket=aggregated[key]
        bucket['quantity_total']+=row['quantity']
        bucket['net_total']+=row['item_net_total']
        bucket['subtotal_total']+=row['item_subtotal']
        bucket['tax_total']+=row['item_tax_total']
        bucket['orders'].append(row)
        if row['purchase_ppu'] is not None:
            bucket['weighted_cost_total']+=row['purchase_ppu']*(row['quantity'] or 1)
            bucket['weighted_cost_qty']+=(row['quantity'] or 1)
        if row['order_date']>bucket['latest_date']: bucket['latest_date']=row['order_date']
    out=[]
    for _key,bucket in aggregated.items():
        latest=max(bucket['orders'], key=lambda x:x['order_date'])
        avg=(bucket['weighted_cost_total']/bucket['weighted_cost_qty']) if bucket['weighted_cost_qty'] else (bucket['subtotal_total']/bucket['quantity_total'] if bucket['quantity_total'] else None)
        item=dict(latest)
        item.update({
            'quantity_total':round(bucket['quantity_total'],2),
            'item_net_total':round(bucket['net_total'],2),
            'item_subtotal_total':round(bucket['subtotal_total'],2),
            'tax_total':round(bucket['tax_total'],2),
            'order_count':len(bucket['orders']),
            'latest_order_date':bucket['latest_date'],
            'purchase_ppu':round(avg,2) if avg is not None else None
        })
        out.append(item)
    return raw, out
def score(item, order):
    candidate=' '.join([str(item.get('title','')),str(item.get('name','')),str(item.get('amazon_query','')),str(item.get('filename','')).rsplit('.',1)[0]])
    cn=norm(candidate); on=order['title_norm']
    if not cn or not on: return 0, {}
    item_tokens=set(tokens(candidate)); order_tokens=order['title_tokens']; shared=item_tokens & order_tokens
    ratio=fuzz.ratio(cn,on)/100
    partial=fuzz.partial_ratio(cn,on)/100
    token_set=fuzz.token_set_ratio(cn,on)/100
    coverage=len(shared)/(len(item_tokens) or 1)
    jacc=len(shared)/(len(item_tokens|order_tokens) or 1)
    exact=0.12 if cn in on or on in cn else 0
    value=min(1,0.26*ratio+0.24*partial+0.24*token_set+0.18*coverage+0.08*jacc+exact)
    return value, {'ratio':round(ratio,3),'partial':round(partial,3),'token_set':round(token_set,3),'token_coverage':round(coverage,3),'jaccard':round(jacc,3),'shared_tokens':sorted(shared)[:24]}
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--csv', required=True, help='Amazon Business order CSV')
    parser.add_argument('--root', default='.', help='Repo/build root')
    parser.add_argument('--strong-threshold', type=float, default=0.80)
    parser.add_argument('--review-threshold', type=float, default=0.50)
    args=parser.parse_args()
    root=Path(args.root)
    raw_orders, amazon=load_amazon_rows(Path(args.csv))
    catalog=load_catalog(root)
    matches=[]
    for item in catalog:
        ranked=[]
        for order in amazon:
            value, detail=score(item,order)
            ranked.append((value,order,detail))
        ranked.sort(key=lambda x:x[0], reverse=True)
        best_value,best_order,best_detail=ranked[0]
        status='strong' if best_value>=args.strong_threshold else 'review' if best_value>=args.review_threshold else 'unmatched'
        suggestions=[]
        for value, order, detail in ranked[:5]:
            suggestions.append({
                'match_score':round(value,3), 'asin':order['asin'], 'title':order['title'], 'amazon_url':order['amazon_url'],
                'purchase_ppu':order['purchase_ppu'], 'quantity_total':order['quantity_total'], 'latest_order_date':order['latest_order_date'],
                'seller_name':order['seller_name'], 'brand':order['brand'], 'score_detail':detail
            })
        matches.append({
            'item_key':item['item_key'],
            'catalog_name':item.get('name') or item.get('title') or item.get('filename'),
            'catalog_type':item.get('item_type'),
            'catalog_category':item.get('category') or 'general',
            'catalog_image_url':item.get('image_url') or item.get('r2_url') or '',
            'match_status':status,
            'match_score':round(best_value,3),
            'score_detail':best_detail,
            'apply_recommendation':'auto_apply' if status=='strong' else ('review_before_apply' if status=='review' else 'manual_search_required'),
            'amazon': {
                'asin':best_order['asin'], 'title':best_order['title'], 'amazon_url':best_order['amazon_url'],
                'order_date':best_order['latest_order_date'], 'quantity_total':best_order['quantity_total'],
                'purchase_ppu':best_order['purchase_ppu'], 'item_net_total':best_order['item_net_total'],
                'item_subtotal_total':best_order['item_subtotal_total'], 'tax_total':best_order['tax_total'],
                'brand':best_order['brand'], 'manufacturer':best_order['manufacturer'], 'model_number':best_order['model_number'], 'part_number':best_order['part_number'],
                'seller_name':best_order['seller_name'], 'amazon_category':best_order['amazon_category'], 'unspsc':best_order['unspsc'],
                'segment':best_order['segment'], 'family':best_order['family'], 'class':best_order['class'], 'commodity':best_order['commodity'],
                'order_count':best_order['order_count'], 'currency':best_order['currency']
            },
            'top_suggestions':suggestions
        })
    enriched=[]
    for match in matches:
        if match['match_status']=='unmatched': continue
        amazon_row=match['amazon']
        enriched.append({
            'item_key':match['item_key'], 'item_type':match['catalog_type'], 'name':match['catalog_name'], 'category':match['catalog_category'],
            'image_url':match['catalog_image_url'], 'amazon_url':amazon_row['amazon_url'], 'cost_cad':amazon_row['purchase_ppu'],
            'qty_on_hand':amazon_row['quantity_total'], 'preferred_vendor':'Amazon', 'vendor_sku':amazon_row['asin'] or amazon_row['part_number'] or amazon_row['model_number'],
            'purchase_date':str(amazon_row['order_date']).replace('/','-') if amazon_row.get('order_date') else None,
            'amazon_asin':amazon_row['asin'], 'amazon_title':amazon_row['title'], 'amazon_match_status':match['match_status'], 'amazon_match_score':match['match_score'],
            'amazon_seller_name':amazon_row['seller_name'], 'amazon_brand':amazon_row['brand'], 'amazon_category':amazon_row['amazon_category'],
            'amazon_quantity_total':amazon_row['quantity_total'], 'amazon_net_total_cents':round((amazon_row['item_net_total'] or 0)*100),
            'notes':f"Amazon CSV {match['match_status']} match score {match['match_score']}; ASIN {amazon_row['asin']}; seller {amazon_row['seller_name']}"
        })
    summary={
        'generated_by':'scripts/amazon_catalog_match.py',
        'source_csv_name':Path(args.csv).name,
        'amazon_csv_rows':len(raw_orders),
        'unique_amazon_products':len(amazon),
        'catalog_rows':len(catalog),
        'status_counts':dict(Counter(m['match_status'] for m in matches)),
        'auto_apply_count':sum(1 for m in matches if m['match_status']=='strong'),
        'review_count':sum(1 for m in matches if m['match_status']=='review'),
        'unmatched_count':sum(1 for m in matches if m['match_status']=='unmatched'),
        'enrichment_rows':len(enriched),
        'privacy_note':'Generated files omit payment identifiers, account emails, and full seller addresses. Keep the source CSV out of public deployments.',
        'review_rule':'Import strong matches first. Review matches should be opened in the editor and checked against the item image/name before saving.'
    }
    data_dir=root/'data'; data_dir.mkdir(exist_ok=True)
    (data_dir/'amazon_catalog_matches.json').write_text(json.dumps({'summary':summary,'matches':matches},indent=2,ensure_ascii=False),encoding='utf-8')
    (data_dir/'amazon_inventory_enrichment_preview.json').write_text(json.dumps({'summary':summary,'items':enriched},indent=2,ensure_ascii=False),encoding='utf-8')
    with (data_dir/'amazon_inventory_match_review.csv').open('w',encoding='utf-8',newline='') as f:
        fields=['item_key','catalog_type','catalog_name','match_status','match_score','asin','amazon_title','amazon_url','purchase_ppu','quantity_total','item_net_total','order_date','seller_name','brand','amazon_category']
        writer=csv.DictWriter(f,fieldnames=fields); writer.writeheader()
        for m in matches:
            a=m['amazon']
            writer.writerow({'item_key':m['item_key'],'catalog_type':m['catalog_type'],'catalog_name':m['catalog_name'],'match_status':m['match_status'],'match_score':m['match_score'],'asin':a['asin'],'amazon_title':a['title'],'amazon_url':a['amazon_url'],'purchase_ppu':a['purchase_ppu'],'quantity_total':a['quantity_total'],'item_net_total':a['item_net_total'],'order_date':a['order_date'],'seller_name':a['seller_name'],'brand':a['brand'],'amazon_category':a['amazon_category']})
    print(json.dumps(summary,indent=2))
if __name__ == '__main__': main()
