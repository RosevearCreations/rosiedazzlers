from playwright.sync_api import sync_playwright
from pathlib import Path
from shutil import which
module=Path('assets/handover938.mjs').read_text()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=which('google-chrome') or which('chromium'),args=['--no-sandbox'])
 for width in [390,768,1440]:
  page=browser.new_page(viewport={'width':width,'height':900})
  state={'available':True,'report':'r','choices':{},'views':None}
  def endpoint(route):
   b=route.request.post_data_json
   if b['action']=='save':
    state['choices']={k:b[k] for k in ['viewPhotos','maintenance','reminders','promotionContact']}
    state['views']=[{'view':'Cargo area','skipped':'Spare tire installed'}] if b['viewPhotos'] else None
   route.fulfill(json=state)
  page.route('https://fixture.test/',lambda r:r.fulfill(content_type='text/html',body='<section id="handover938"></section><script type="module">import {customerHandover} from "./module.mjs";customerHandover("sample")</script>'))
  page.route('**/module.mjs',lambda r:r.fulfill(content_type='text/javascript',body=module))
  page.route('**/api/progress/handover938',endpoint)
  page.goto('https://fixture.test/'); page.get_by_text('Review my private handover').click()
  box=page.get_by_label('Show the private photos',exact=False)
  box.check();page.get_by_text('Save my choices').click();page.get_by_text('Skipped — Spare tire installed').wait_for()
  assert state['choices']==dict(viewPhotos=True,maintenance=False,reminders=False,promotionContact=False)
  box.uncheck();page.get_by_text('Save my choices').click();page.get_by_text('Skipped — Spare tire installed').wait_for(state='detached')
  print(width,'px: optional photo consent and withdrawal passed');page.close()
 browser.close()
