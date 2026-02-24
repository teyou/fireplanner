import { test, expect } from '@playwright/test'
import { goToStart, selectPathway, expectRoute } from './helpers'

/**
 * Helper to clear and fill an input field.
 */
async function clearAndFill(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator, value: string) {
  await locator.click()
  await locator.selectText()
  await locator.fill(value)
}

test.describe('US-3: Pre-Retiree Onboarding (Already FIRE)', () => {
  test('complete already-fire pathway via CPF stage card and navigate to inputs', async ({ page }) => {
    // Start fresh
    await goToStart(page)

    // Verify we're on the start page
    await expect(page.getByText('Singapore FIRE Planner')).toBeVisible()

    // Click the already-fire pathway card
    await selectPathway(page, 'already-fire')

    // Wait for the inline form to appear
    await expect(page.getByText('Your current situation')).toBeVisible()

    // The already-fire form has 4 fields:
    // Current Age, Annual Income, Annual Expenses, Savings & Investments
    const formInputs = page.locator('main input[inputmode="numeric"]')
    await expect(formInputs).toHaveCount(4, { timeout: 5000 })

    // Fill Current Age = 55
    await clearAndFill(page, formInputs.nth(0), '55')

    // Fill Annual Income = 0
    await clearAndFill(page, formInputs.nth(1), '0')

    // Fill Annual Expenses = 80000
    await clearAndFill(page, formInputs.nth(2), '80000')

    // Fill Savings & Investments = 2000000
    await clearAndFill(page, formInputs.nth(3), '2000000')

    // Blur the last input
    await formInputs.nth(3).blur()

    // The already-fire pathway does NOT show QuickResults; instead it shows CPF stage cards
    // Verify the CPF stage section appears
    await expect(page.getByText("What's your CPF stage?")).toBeVisible({ timeout: 5000 })

    // Click the "55 to 64" phase card
    await page.getByText('55 to 64').click()

    // Verify navigation to /inputs
    await expectRoute(page, '/inputs')

    // Verify the inputs page loaded
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Personal', { exact: false }).first()).toBeVisible({ timeout: 5000 })
  })

  test('shows all three CPF stage options', async ({ page }) => {
    await goToStart(page)
    await selectPathway(page, 'already-fire')
    await expect(page.getByText('Your current situation')).toBeVisible()

    const formInputs = page.locator('main input[inputmode="numeric"]')
    await expect(formInputs).toHaveCount(4, { timeout: 5000 })

    await clearAndFill(page, formInputs.nth(0), '55')
    await clearAndFill(page, formInputs.nth(1), '0')
    await clearAndFill(page, formInputs.nth(2), '80000')
    await clearAndFill(page, formInputs.nth(3), '2000000')
    await formInputs.nth(3).blur()

    // Verify all three CPF phase cards are visible
    await expect(page.getByText('Before 55')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('55 to 64')).toBeVisible()
    await expect(page.getByText('65 and above')).toBeVisible()
  })

  test('can navigate via Before 55 stage card', async ({ page }) => {
    await goToStart(page)
    await selectPathway(page, 'already-fire')
    await expect(page.getByText('Your current situation')).toBeVisible()

    const formInputs = page.locator('main input[inputmode="numeric"]')
    await expect(formInputs).toHaveCount(4, { timeout: 5000 })

    await clearAndFill(page, formInputs.nth(0), '50')
    await clearAndFill(page, formInputs.nth(1), '0')
    await clearAndFill(page, formInputs.nth(2), '60000')
    await clearAndFill(page, formInputs.nth(3), '1500000')
    await formInputs.nth(3).blur()

    await expect(page.getByText("What's your CPF stage?")).toBeVisible({ timeout: 5000 })

    // Click "Before 55"
    await page.getByText('Before 55').click()

    // Verify navigation to /inputs
    await expectRoute(page, '/inputs')
  })
})
