import { test, expect } from '@playwright/test';
test('sensor exploration, simulation and model export', async ({page}) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');
 await expect(page.locator('#fallback')).toBeHidden();
 await expect(page.locator('#detail-name')).toHaveText('마이크로렌즈');
 await page.locator('[data-mode="2"]').click();
 await expect(page.locator('#view-title')).toHaveText('픽셀 단면');
 await page.locator('[data-layer="2"]').click();
 await expect(page.locator('#detail-name')).toHaveText('실리콘 · 포토다이오드');
 await page.locator('[data-visible="0"]').uncheck();
 await expect(page.locator('[data-visible="0"]')).not.toBeChecked();
 await page.locator('#separation').fill('100');
 await expect(page.locator('#separation-value')).toHaveText('100%');
 await page.locator('#light').fill('100');await page.locator('#exposure').fill('40');
 await expect(page.locator('#charge-value')).toHaveText('100%');
 await expect(page.locator('#charge-note')).toContainText('포화');
 await page.locator('#light').fill('0');await expect(page.locator('#charge-value')).toHaveText('0%');
 await page.locator('[data-stage="3"]').click();await expect(page.locator('#stage-description')).toContainText('ADC');
 await page.locator('#play').click();await expect(page.locator('#play')).toHaveText('Ⅱ 일시정지');
 await expect(page.locator('[data-stage="0"]')).toHaveAttribute('aria-pressed','true',{timeout:5000});
 await page.locator('#play').click();
 await page.locator('[data-answer="no"]').click();await expect(page.locator('#quiz-feedback')).toContainText('정답');
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;expect(download.suggestedFilename()).toBe('sensor-lab-section.glb');
 await page.locator('[data-mode="1"]').click();await page.locator('[data-visible="0"]').check();await page.locator('#separation').fill('48');
 await page.screenshot({path:'test-results/desktop.png'});
 expect(errors).toEqual([]);
});
test('mobile layout remains usable',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5173/');
 await expect(page.locator('#scene')).toBeVisible();await page.locator('[data-mode="0"]').click();await expect(page.locator('#view-title')).toHaveText('센서 전체');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/mobile.png',fullPage:true});
});

test('WebMCP validates input and shares visible UI state',async({page})=>{
 await page.addInitScript(()=>{document.modelContext={registerTool(tool){window.sensorTool=tool;}};});
 await page.goto('http://127.0.0.1:5173/');
 await page.waitForFunction(()=>!!window.sensorTool);
 const result=await page.evaluate(()=>window.sensorTool.execute({view:2,layer:3,separation:70}));
 expect(result).toEqual({view:2,layer:3,separation:70});await expect(page.locator('#detail-name')).toHaveText('배선 · 읽기 회로');
 const error=await page.evaluate(async()=>{try{await window.sensorTool.execute({view:9,layer:0,separation:50});return false;}catch{return true;}});
 expect(error).toBe(true);await expect(page.locator('#view-title')).toHaveText('픽셀 단면');
});
