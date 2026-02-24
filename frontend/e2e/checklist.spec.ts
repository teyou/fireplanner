import { test, expect } from '@playwright/test'

test.describe('US-15: Checklist Progress', () => {
  test('checklist items can be toggled and progress updates', async ({ page }) => {
    // 1. Navigate to /checklist with clean state
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/checklist')
    await page.waitForLoadState('networkidle')

    // 2. Verify checklist heading and items are visible
    await expect(page.getByRole('heading', { name: 'Retirement Checklist' })).toBeVisible()

    // 3. Verify progress shows "0 of N completed" initially
    const progressText = page.getByText(/0 of \d+ completed/)
    await expect(progressText).toBeVisible()

    // Extract the total count
    const progressStr = await progressText.textContent()
    const totalMatch = progressStr?.match(/0 of (\d+) completed/)
    const totalItems = totalMatch ? parseInt(totalMatch[1]) : 0
    expect(totalItems).toBeGreaterThan(0)

    // 4. Verify checklist items are visible (checkboxes)
    const checkboxes = page.locator('input[type="checkbox"]')
    const checkboxCount = await checkboxes.count()
    expect(checkboxCount).toBeGreaterThan(0)

    // 5. Check off the first 3 items
    await checkboxes.nth(0).click()
    await checkboxes.nth(1).click()
    await checkboxes.nth(2).click()

    // 6. Verify progress indicator updates to show 3 completed
    const updatedProgress = page.getByText(`3 of ${totalItems} completed`)
    await expect(updatedProgress).toBeVisible()

    // Verify percentage is correct
    const expectedPct = Math.round((3 / totalItems) * 100)
    await expect(page.getByText(`${expectedPct}%`)).toBeVisible()

    // 7. Verify the first 3 checkboxes are checked
    await expect(checkboxes.nth(0)).toBeChecked()
    await expect(checkboxes.nth(1)).toBeChecked()
    await expect(checkboxes.nth(2)).toBeChecked()

    // 8. Reload the page to verify persistence
    await page.reload()
    await page.waitForLoadState('networkidle')

    // 9. Verify checked items are still checked after reload
    const checkboxesAfterReload = page.locator('input[type="checkbox"]')
    await expect(checkboxesAfterReload.nth(0)).toBeChecked()
    await expect(checkboxesAfterReload.nth(1)).toBeChecked()
    await expect(checkboxesAfterReload.nth(2)).toBeChecked()

    // Progress should still show 3 completed
    await expect(page.getByText(`3 of ${totalItems} completed`)).toBeVisible()
  })

  test('unchecking an item updates progress', async ({ page }) => {
    // 1. Navigate to /checklist with clean state
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/checklist')
    await page.waitForLoadState('networkidle')

    // 2. Check the first 2 items
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.nth(0).click()
    await checkboxes.nth(1).click()

    // Extract total
    const progressStr = await page.getByText(/\d+ of \d+ completed/).textContent()
    const totalMatch = progressStr?.match(/\d+ of (\d+) completed/)
    const totalItems = totalMatch ? parseInt(totalMatch[1]) : 0

    // Should show 2 completed
    await expect(page.getByText(`2 of ${totalItems} completed`)).toBeVisible()

    // 3. Uncheck the first item
    await checkboxes.nth(0).click()

    // 4. Should show 1 completed
    await expect(page.getByText(`1 of ${totalItems} completed`)).toBeVisible()

    // First checkbox should be unchecked
    await expect(checkboxes.nth(0)).not.toBeChecked()
    // Second should still be checked
    await expect(checkboxes.nth(1)).toBeChecked()
  })
})
