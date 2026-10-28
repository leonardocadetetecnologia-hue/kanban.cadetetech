const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? { executablePath:process.env.CHROME_PATH } : {})});
 const page=await browser.newPage({viewport:{width:1024,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const html=fs.readFileSync(path.join(root, 'src/kanban-minimal.html'),'utf8');
 await page.setContent(html);
 const card=page.getByRole('button',{name:'PROD-08: Criar protótipo da tela principal',exact:true});
 await card.click();
 const dialog=page.getByRole('dialog');
 const value=()=>dialog.getByRole('progressbar').getAttribute('aria-valuenow');
 if(await value()!=='60')throw Error('Expected 60% initially');
 await dialog.getByLabel('Revisar no celular',{exact:true}).check();
 if(await value()!=='80')throw Error('Expected 80% after check');
 await dialog.getByLabel('Novo passo do checklist').fill('Verificar aprovação visual');
 await dialog.locator('#mk-add-check').getByRole('button',{name:'Adicionar',exact:true}).click();
 if(await value()!=='67')throw Error('Expected rounded 4/6 progress');
 await dialog.getByRole('button',{name:'Comentários · 2'}).click();
 await dialog.getByLabel('Adicionar comentário').fill('Teste <b>sem HTML</b>');
 await dialog.getByRole('button',{name:'Comentar',exact:true}).click();
 if(await dialog.locator('.comment').count()!==3)throw Error('Comment count incorrect');
 if(await dialog.locator('.comment b').count())throw Error('Comment HTML not escaped');
 await dialog.getByRole('button',{name:'Atividade',exact:true}).click();
 if(await dialog.locator('.event').count()<4)throw Error('Missing activity records');
 await page.keyboard.press('Escape');
 if(await card.getByRole('progressbar').getAttribute('aria-valuenow')!=='67')throw Error('Card out of sync');
 fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
 await page.screenshot({path:path.join(root,'test-results/desktop.png'),fullPage:true});
 for(const width of [320,375,768,1024,1366,1920]){
  await page.setViewportSize({width,height:1000});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if(overflow)throw Error('Horizontal overflow at '+width);
 }
 if(errors.length)throw Error(errors.join('; '));
 console.log('PASS: checklist progress, new step, comment escaping, activity, card synchronization, responsive widths.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

