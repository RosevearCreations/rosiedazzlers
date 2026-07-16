from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
def need(path,*terms):
    text=(ROOT/path).read_text(encoding='utf-8')
    for term in terms:
        assert term in text, f'{path}: missing {term}'
need('sql/2026-07-14_build231_project_profitability_content_planning.sql','project_classification','actual_revenue_cad','creative_project_inventory_reservations','inventory_mutated boolean not null default false check (inventory_mutated = false)','creative_project_shot_plan_items','creative_project_learning_items','creative_project_archive_exports','enable row level security','revoke all privileges')
need('functions/api/admin/creative_project_line_action.js','soft_delete','line_soft_deleted','creative_project_material_lines')
need('functions/api/admin/creative_project_advanced_action.js','generate_content_plan','approved_for_story=eq.true','inventory_mutated:false','archive_export','template_save')
need('functions/api/admin/creative_project_detail.js','booking_comparison','actual_profit','creative_project_archive_exports')
need('admin-creative-projects.html','Planning, learning & profit','Generate draft plans from approved sessions','Ordinary inventory is not mutated','creative_project_profit_learning_workflow')
need('AI_PROJECT_HANDOFF.md','Build 231')
need('MASTER_VALUE_ROADMAP.md','Next 20 project priorities')
need('SUPABASE_SCHEMA.sql','Build 231','creative_project_inventory_reservations')
record=json.loads((ROOT/'data/build231_project_profitability_content_planning.json').read_text())
assert record['standard_booking_unchanged'] is True
assert record['daip']['media_bytes_enabled'] is False
html=(ROOT/'admin-creative-projects.html').read_text()
assert len(re.findall(r'<h1\b',html,re.I))==1
print('Build 231 project profitability/content planning check passed.')
