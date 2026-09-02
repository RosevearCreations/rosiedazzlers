from pathlib import Path
import re

path = Path('my-account.html')
text = path.read_text(encoding='utf-8')
original = text

MARKER = 'data-build295-account-source-authority'
if MARKER in text:
    print('Build 295 account source patch already applied.')
    raise SystemExit(0)


def sub_exact(pattern, replacement, expected=1, flags=0, label='replacement'):
    global text
    text, count = re.subn(pattern, replacement, text, flags=flags)
    if count != expected:
        raise SystemExit(f'{label}: expected {expected} replacement(s), got {count}')

# Remove staff-private controls from the static customer source.
sub_exact(r'<label>Admin-only notes<textarea id="acctAdminNotes".*?</textarea></label>\s*', '', label='account admin notes control')
sub_exact(r'<label>Admin-only notes<textarea id="vehAdminNotes".*?</textarea></label>\s*', '', label='vehicle admin notes control')

# Remove customer scheduling/recurrence controls from the static vehicle form.
for control_id, label in [
    ('vehNextDue', 'next due control'),
    ('vehNextServiceMileage', 'next service mileage control'),
    ('vehIntervalDays', 'service interval control'),
]:
    sub_exact(rf'<label>[^<]*<input id="{control_id}"[^>]*\s*/></label>\s*', '', label=label)
sub_exact(r'<label class="checkbox"><input id="vehAutoSchedule"[^>]*\s*/><span>.*?</span></label>\s*', '', label='auto schedule control')

# Replace stale commercial maintenance copy with the retained interest-only authority.
maintenance_section = '''<section class="section" data-build295-account-source-authority><div class="panel maintenance-panel"><div class="section-head"><div><h2>Maintenance interest</h2><p class="muted">If repeat detailing may be useful, tell Rosie your preferred timing. We review the request against current vehicle condition, service scope and availability before any booking decision.</p><p class="muted">This does not create a fixed cadence, price, discount, priority, appointment, subscription or recurring billing.</p></div><a class="btn ghost" href="/maintenance-plan">Open maintenance interest</a></div><div id="maintenanceConversion" class="grid"></div></div></section>'''
sub_exact(
    r'<section class="section"><div class="panel maintenance-panel"><div class="section-head">.*?<div id="maintenanceConversion" class="grid"></div></div></section>',
    maintenance_section,
    flags=re.S,
    label='maintenance section'
)

# Replace the obsolete completed-Complete-Detail commercial conversion renderer.
safe_renderer = '''function renderMaintenanceConversion(){ const wrap=$('#maintenanceConversion'); if(!wrap) return; wrap.innerHTML = `<article class="maintenance-offer" data-build295-maintenance-interest-only><div class="badge">Maintenance interest</div><h3>Tell Rosie when repeat detailing may be useful</h3><p class="muted">Maintenance timing is an interest preference reviewed after service context is known. Your account does not set a due date, service-mileage target, recurring cadence or automatic schedule.</p><p class="muted">No fixed cadence, price, discount, priority, appointment, subscription or recurring billing is created here.</p><div class="actions"><a class="btn ghost" href="/maintenance-plan">Open maintenance interest</a></div></article>`; }
const VEHICLE_MAKES_URL'''
sub_exact(
    r'function hasCompletedCompleteDetail\(rows\).*?\nconst VEHICLE_MAKES_URL',
    safe_renderer,
    flags=re.S,
    label='maintenance renderer'
)

# Remove staff-owned recurrence data from the customer garage card source.
for snippet, label in [
    (r'<div class="garage-field"><span>Next due</span><strong>\$\{esc\(v\.next_cleaning_due_at \|\| \'not set\'\)\}</strong></div>', 'garage next due'),
    (r'<div class="garage-field"><span>Cadence</span><strong>\$\{v\.service_interval_days \? esc\(String\(v\.service_interval_days\)\+\' days\'\) : \'not set\'\}</strong></div>', 'garage cadence'),
    (r'<div class="garage-field"><span>Next service mileage</span><strong>\$\{v\.next_service_mileage_km \? esc\(String\(v\.next_service_mileage_km\)\+\' km\'\) : \'not set\'\}</strong></div>', 'garage next mileage'),
]:
    sub_exact(snippet, '', label=label)

# Remove legacy fill assignments that depend on controls no longer present.
for pattern, label in [
    (r"; \$\('#vehNextDue'\)\.value=v\?\.next_cleaning_due_at\|\|''", 'fill next due'),
    (r"; \$\('#vehIntervalDays'\)\.value=v\?\.service_interval_days\|\|''", 'fill interval'),
    (r"; \$\('#vehNextServiceMileage'\)\.value=v\?\.next_service_mileage_km\|\|''", 'fill mileage'),
    (r"; \$\('#vehAdminNotes'\)\.value=v\?\.admin_private_notes\|\|''", 'fill vehicle admin notes'),
    (r"; \$\('#vehAutoSchedule'\)\.checked=!!v\?\.auto_schedule_opt_in", 'fill auto schedule'),
    (r"; \$\('#acctAdminNotes'\)\.value=profile\?\.admin_private_notes\|\|''", 'fill account admin notes'),
]:
    sub_exact(pattern, '', label=label)

# Remove dead/staff-private keys from browser payloads. Server APIs already reject/ignore them;
# Build 295 makes the browser source match that authority directly.
for pattern, label in [
    (r", admin_private_notes:\$\('#acctAdminNotes'\)\.value", 'account admin payload'),
    (r", next_cleaning_due_at:\$\('#vehNextDue'\)\.value", 'vehicle next due payload'),
    (r", next_service_mileage_km:\$\('#vehNextServiceMileage'\)\.value", 'vehicle next mileage payload'),
    (r", service_interval_days:\$\('#vehIntervalDays'\)\.value", 'vehicle interval payload'),
    (r", auto_schedule_opt_in:\$\('#vehAutoSchedule'\)\.checked", 'vehicle auto schedule payload'),
    (r", admin_private_notes:\$\('#vehAdminNotes'\)\.value", 'vehicle admin payload'),
]:
    sub_exact(pattern, '', label=label)

# Assert that the unsafe source authority is actually gone.
for forbidden in [
    'acctAdminNotes', 'vehAdminNotes', 'vehNextDue', 'vehNextServiceMileage', 'vehIntervalDays', 'vehAutoSchedule',
    'unlock maintenance pricing', 'reduced maintenance pricing', 'reduced repeat-clean pricing',
    'Maintenance eligible', 'Recurring maintenance scheduling only starts', 'Your account can move into recurring maintenance'
]:
    if forbidden in text:
        raise SystemExit(f'Forbidden Build 295 source token remains: {forbidden}')

for required in [
    MARKER, 'Maintenance interest', 'Open maintenance interest', 'maintenanceConversion',
    'No fixed cadence, price, discount, priority, appointment, subscription or recurring billing',
    '/api/client/profile_update', '/api/client/vehicles_save', 'bookingHistory', 'vehicleForm'
]:
    if required not in text:
        raise SystemExit(f'Required Build 295 source token missing: {required}')

if text == original:
    raise SystemExit('Patch made no changes.')

path.write_text(text, encoding='utf-8')
print('Build 295 my-account source patch: PASS')
