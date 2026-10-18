import { test, expect } from '@playwright/test';

for (const width of [375, 768, 1440]) {
  test(`question preview preserves card layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('token','preview-test');
      localStorage.setItem('user',JSON.stringify({id:'preview-teacher',_id:'preview-teacher',role:'teacher',name:'Öğretmen',token:'preview-test'}));
      localStorage.setItem('loginTime',String(Date.now()));
    });
    const questions=Array.from({length:4},(_,i)=>({_id:`preview-${i}`,text:`Örüntü sorusu ${i}`,subject:'Matematik',topic:'Sayı Örüntüleri',classLevel:'9. Sınıf',difficulty:'Orta',type:'multiple-choice',options:['Uzun bir seçenek metni '.repeat(12),'2','3','4'],correctAnswer:'2',solution:'Çözüm',assessmentMeta:{}}));
    await page.route('**/api/**',async route => {
      const url=route.request().url();
      let data={};
      if (url.includes('/users/profile')) data={role:'teacher',branch:'Matematik',branchApproval:'approved'};
      else if (url.includes('/questions')) data={data:questions,total:4,totalPages:1};
      else if (url.includes('/topics')) data=['Sayı Örüntüleri'];
      await route.fulfill({json:data});
    });
    await page.goto('/teacher/questions');
    const cards=page.getByRole('button',{name:/Soru detayını (göster|gizle)/});
    await expect(cards).toHaveCount(4);
    await cards.first().scrollIntoViewIfNeeded();
    const before=await cards.nth(1).boundingBox();
    await cards.first().click();
    const dialog=page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const after=await cards.nth(1).boundingBox();
    expect(Math.abs(before.x-after.x)).toBeLessThan(2);
    expect(Math.abs(before.y-after.y)).toBeLessThan(2);
    const box=await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(width);
    expect(box.height).toBeLessThanOrEqual(900);
    expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(cards.first()).toBeFocused();
    expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
  });
}
