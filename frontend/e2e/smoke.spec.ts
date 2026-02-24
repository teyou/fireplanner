import { test, expect } from '@playwright/test'

test('app loads without crashing', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/fire/i)
  // Start page should have at least one pathway card
  await expect(page.getByText(/retire/i).first()).toBeVisible()
})
