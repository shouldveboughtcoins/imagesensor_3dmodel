import {test,expect} from '@playwright/test';
test('shutter readout can be compared, stepped and paused',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/');
 await expect(page.locator('#view-title')).toHaveText('셔터·읽기 동작');await expect(page.locator('#fallback')).toBeHidden();
 await expect(page.locator('#readout-controls')).toHaveAttribute('data-shutter','rolling');
 await page.locator('#readout-time').fill('4.05');await expect(page.locator('#readout-controls')).toHaveAttribute('data-active-row','0');await expect(page.locator('#readout-control-state')).toContainText('PD 리셋: R5');
 await page.locator('[data-shutter="global"]').click();await page.locator('#readout-time').fill('4.25');await expect(page.locator('#readout-controls')).toHaveAttribute('data-phase','store');await expect(page.locator('#readout-title')).toContainText('전체 픽셀');
 await page.locator('#readout-next').click();await expect(page.locator('#readout-controls')).toHaveAttribute('data-phase','reference');await expect(page.locator('#readout-controls')).toHaveAttribute('data-active-row','0');
 await page.locator('[data-timing-mode="global"][data-timing-row="2"]').click();await expect(page.locator('#readout-row')).toHaveText('선택 행 R3');
 await page.locator('#readout-time').fill('7');await expect(page.locator('#readout-controls')).toHaveAttribute('data-phase','adc');await expect(page.locator('#adc-0')).toHaveClass(/latched/);await expect(page.locator('#adc-7')).not.toHaveClass(/latched/);await expect(page.locator('#cds-diff')).toHaveText('0.418 V');
 await page.locator('#readout-play').click();await page.waitForFunction(()=>Number(document.querySelector('#readout-time').value)>7.03);await page.locator('#readout-play').click();const time=await page.locator('#readout-time').inputValue();await page.waitForTimeout(250);expect(await page.locator('#readout-time').inputValue()).toBe(time);
 await page.locator('#readout-time').fill('12.35');await expect(page.locator('#readout-controls')).toHaveAttribute('data-phase','done');await expect(page.locator('#readout-complete')).toHaveText('8 / 8행 출력');await expect(page.locator('#frame-grid .complete')).toHaveCount(64);
 await page.locator('#readout-exposure').selectOption('8');await expect(page.locator('#readout-controls')).toHaveAttribute('data-phase','reset');await page.locator('#readout-exposure').selectOption('4');
 await page.locator('#readout-time').fill('6.75');await page.locator('#readout-controls').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/readout-desktop.png'});
 await page.locator('[data-mode="3"]').click();await expect(page.locator('#readout-controls')).toBeHidden();await page.locator('[data-part="wires"]').click();await expect(page.locator('#detail-name')).toHaveText('본딩 와이어');
 await page.locator('[data-mode="4"]').click();await expect(page.locator('#readout-controls')).toBeVisible();await expect(page.locator('#readout-play')).toHaveText('▶ 재생');
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;await download.saveAs('test-results/readout.glb');
 expect(errors).toEqual([]);
});
test('readout controls work on a narrow screen',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5173/');await page.locator('[data-shutter="global"]').click();await page.locator('#readout-next').click();
 await expect(page.locator('#readout-controls')).toHaveAttribute('data-phase','integrating');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/readout-mobile.png',fullPage:true});
});
