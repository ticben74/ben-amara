
/**
 * هذا الملف مخصص كنموذج لبيئة الاختبار (Playwright)
 * لتنفيذ الاختبارات، يجب تثبيت Playwright وتشغيل: npx playwright test
 */

/*
import { test, expect } from '@playwright/test';

test('يجب أن تفتح الصفحة الرئيسية وتظهر التدخلات', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/التدخلات الإبداعية/);
  const benchButton = page.locator('text=مقعد حكايا');
  await expect(benchButton).toBeVisible();
});

test('يجب أن يعمل منظم الجولات عند اختيار محطات', async ({ page }) => {
  await page.goto('/');
  await page.click('text=منظم الجولات');
  await page.click('text=مسار التراث');
  await page.click('text=تأكيد وانشاء الجولة');
  await expect(page.locator('canvas')).toBeVisible(); // خريطة الجولة
});

test('يجب أن يتمكن الزائر من فتح الـ Preview لكل موقع', async ({ page }) => {
  await page.goto('/');
  await page.click('text=الدليل المكاني');
  const marker = page.locator('.group-hover\\:opacity-100').first();
  await marker.click();
  await expect(page.locator('text=عن المكان والتاريخ')).toBeVisible();
});
*/
