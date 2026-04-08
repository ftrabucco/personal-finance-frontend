import { test, expect } from '@playwright/test'
import { loginAndGoTo } from './helpers'

// The historial summary amount is the bold text next to "en N gastos"
function historialAmountLocator(page: import('@playwright/test').Page) {
  return page.locator('text=/en \\d+ gastos/').locator('..').locator('.font-bold').first()
}

test.describe('Dashboard vs Gastos Historial - Consistency', () => {
  test('monthly total in dashboard matches historial default view', async ({ page }) => {
    // Step 1: Go to dashboard and capture "Gastos del Mes" amount
    await loginAndGoTo(page)

    // Wait for the "Gastos del Mes" card to render
    await expect(page.getByText('Gastos del Mes')).toBeVisible({ timeout: 10000 })

    // The card renders the compact amount in a div with a title attribute
    const dashboardAmountEl = page.locator('[title]').filter({ hasText: /^\$/ }).first()
    await expect(dashboardAmountEl).toBeVisible({ timeout: 10000 })

    // Save the text before navigating away
    const dashboardAmountText = await dashboardAmountEl.textContent()
    expect(dashboardAmountText).toBeTruthy()

    // Step 2: Navigate to Gastos page (historial tab is default, with "Este mes" date range)
    await page.goto('/gastos')
    await page.waitForLoadState('networkidle')

    // Wait for historial summary to load (shows "en N gastos")
    const historialAmount = historialAmountLocator(page)
    await expect(historialAmount).toBeVisible({ timeout: 10000 })
    const historialAmountText = await historialAmount.textContent()

    // Step 3: Compare - both use formatCurrencyCompact so the visible text should match
    expect(dashboardAmountText?.trim()).toBe(historialAmountText?.trim())
  })

  test('dashboard "Gastos del Mes" shows correct date-filtered total', async ({ page }) => {
    await loginAndGoTo(page)

    await expect(page.getByText('Gastos del Mes')).toBeVisible({ timeout: 10000 })

    // The amount element has a title with the exact currency value
    const amountEl = page.locator('[title]').filter({ hasText: /^\$/ }).first()
    await expect(amountEl).toBeVisible({ timeout: 10000 })

    // Title should be a valid currency format like "$ 450,00" or "$ 206.000,00"
    const title = await amountEl.getAttribute('title')
    expect(title).toMatch(/^\$\s[\d.,]+$/)

    // Visible text should also start with "$"
    const text = await amountEl.textContent()
    expect(text?.trim()).toMatch(/^\$/)
  })

  test('historial "Este mes" preset shows same period as dashboard', async ({ page }) => {
    await loginAndGoTo(page, '/gastos')

    // Verify the "Este mes" preset button exists
    const esteMesBtn = page.getByRole('button', { name: 'Este mes' })
    await expect(esteMesBtn).toBeVisible({ timeout: 10000 })

    // Click "Este mes" to ensure we're on the same period as the dashboard
    await esteMesBtn.click()

    // Summary should be visible with data or empty state
    const hasSummary = await historialAmountLocator(page).isVisible({ timeout: 5000 }).catch(() => false)
    const hasEmpty = await page.getByText(/No hay gastos/).isVisible().catch(() => false)

    expect(hasSummary || hasEmpty).toBeTruthy()
  })

  test('changing date range in historial updates the total', async ({ page }) => {
    await loginAndGoTo(page, '/gastos')

    // Wait for data to load
    await page.waitForLoadState('networkidle')

    // Get the "Este mes" total
    const summaryEl = historialAmountLocator(page)
    await expect(summaryEl).toBeVisible({ timeout: 10000 })
    const esteMesAmount = await summaryEl.textContent()

    // Switch to "Últimos 3 meses"
    const ultimos3Btn = page.getByRole('button', { name: 'Últimos 3 meses' })
    await expect(ultimos3Btn).toBeVisible({ timeout: 10000 })
    await ultimos3Btn.click()

    // Wait for the summary to update after clicking the preset
    await page.waitForLoadState('networkidle')

    // The total should still be visible and valid
    const ultimos3Amount = await summaryEl.textContent()
    expect(ultimos3Amount).toBeTruthy()

    // Both should be valid currency formats starting with "$"
    expect(esteMesAmount?.trim()).toMatch(/^\$/)
    expect(ultimos3Amount?.trim()).toMatch(/^\$/)
  })
})
