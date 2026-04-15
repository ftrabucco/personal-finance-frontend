import { test, expect } from '@playwright/test'
import { loginAndGoTo } from './helpers'

test.describe('Dashboard Personalización', () => {
  test('shows Personalizar button in dashboard header', async ({ page }) => {
    await loginAndGoTo(page)

    await expect(page.getByText('Gastos del Mes')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /personalizar/i })).toBeVisible()
  })

  test('opens personalization panel when clicking Personalizar', async ({ page }) => {
    await loginAndGoTo(page)

    await expect(page.getByText('Gastos del Mes')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /personalizar/i }).click()

    await expect(page.getByText('Personalizar Dashboard')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Elegí qué secciones querés ver')).toBeVisible()
  })

  test('panel shows all dashboard sections as toggles', async ({ page }) => {
    await loginAndGoTo(page)

    await expect(page.getByText('Gastos del Mes')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /personalizar/i }).click()

    await expect(page.getByText('Personalizar Dashboard')).toBeVisible({ timeout: 5000 })

    // All sections should be listed
    await expect(page.getByText('Balance Acumulado')).toBeVisible()
    await expect(page.getByText('Tasa de Ahorro')).toBeVisible()
    await expect(page.getByText('Evolución Mensual')).toBeVisible()
    await expect(page.getByText('Ingresos vs Gastos')).toBeVisible()
    await expect(page.getByText('Gastos por Categoría')).toBeVisible()
    await expect(page.getByText('Gastos Recientes')).toBeVisible()
  })

  test('can hide a section by toggling it off', async ({ page }) => {
    await loginAndGoTo(page)

    await expect(page.getByText('Gastos del Mes')).toBeVisible({ timeout: 10000 })

    // Verify Evolución Mensual is visible before toggling
    await expect(page.getByText('Evolución Mensual')).toBeVisible()

    // Open panel and toggle off Evolución Mensual
    await page.getByRole('button', { name: /personalizar/i }).click()
    await expect(page.getByText('Personalizar Dashboard')).toBeVisible({ timeout: 5000 })

    // Find the switch for Evolución Mensual and toggle it off
    const evolucionSwitch = page.locator('[id="section-evolucion_tabla"]')
    await evolucionSwitch.click()

    // Close the panel
    await page.keyboard.press('Escape')

    // Evolución Mensual table should no longer be visible
    await expect(page.getByRole('heading', { name: 'Evolución Mensual' })).not.toBeVisible({ timeout: 5000 })
  })

  test('section visibility persists after page reload', async ({ page }) => {
    await loginAndGoTo(page)

    await expect(page.getByText('Gastos del Mes')).toBeVisible({ timeout: 10000 })

    // Hide Proyección section
    await page.getByRole('button', { name: /personalizar/i }).click()
    await expect(page.getByText('Personalizar Dashboard')).toBeVisible({ timeout: 5000 })

    const proyeccionSwitch = page.locator('[id="section-proyeccion"]')
    const isChecked = await proyeccionSwitch.isChecked()

    if (isChecked) {
      await proyeccionSwitch.click()
      await page.keyboard.press('Escape')

      // Reload
      await page.reload()
      await page.waitForLoadState('networkidle')
      await expect(page.getByText('Gastos del Mes')).toBeVisible({ timeout: 10000 })

      // Re-open panel and verify it's still toggled off
      await page.getByRole('button', { name: /personalizar/i }).click()
      await expect(page.getByText('Personalizar Dashboard')).toBeVisible({ timeout: 5000 })
      const switchAfterReload = page.locator('[id="section-proyeccion"]')
      await expect(switchAfterReload).not.toBeChecked()

      // Re-enable to avoid affecting other tests
      await switchAfterReload.click()
    }
  })
})
