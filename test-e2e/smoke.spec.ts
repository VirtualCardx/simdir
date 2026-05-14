import { test, expect } from '@playwright/test'

test('home page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/eSIM/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('eSIM')
})

test('posts page loads', async ({ page }) => {
  await page.goto('/posts')
  await expect(page).toHaveTitle(/教程|Guides|eSIM/)
})

