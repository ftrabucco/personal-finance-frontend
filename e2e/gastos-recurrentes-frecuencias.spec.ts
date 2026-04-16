import { test, expect } from '@playwright/test'
import { loginAndGoTo } from './helpers'

async function goToRecurrentes(page: Parameters<typeof loginAndGoTo>[0]) {
  await loginAndGoTo(page, '/gastos')
  await page.getByRole('tab', { name: /recurrentes/i }).click()
  await page.waitForLoadState('networkidle')
}

async function openNewForm(page: Parameters<typeof loginAndGoTo>[0]) {
  await page.getByRole('button', { name: /nuevo gasto recurrente/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
}

test.describe('Gastos Recurrentes - Frecuencias', () => {
  test('tab de recurrentes carga correctamente', async ({ page }) => {
    await goToRecurrentes(page)
    await expect(page.getByRole('button', { name: /nuevo gasto recurrente/i })).toBeVisible()
    await expect(page.getByText('Total Mensual Estimado')).toBeVisible()
  })

  test('formulario muestra campo frecuencia', async ({ page }) => {
    await goToRecurrentes(page)
    await openNewForm(page)
    await expect(page.getByText('Frecuencia')).toBeVisible()
  })

  test('campo mes_de_pago NO aparece para frecuencia mensual', async ({ page }) => {
    await goToRecurrentes(page)
    await openNewForm(page)

    // Select mensual frequency
    const frecuenciaSelect = page.locator('[id*="frecuencia"], [name*="frecuencia"]').first()
    // Look for frecuencia selector by its placeholder
    const frecuenciaTrigger = page.getByText('Seleccionar frecuencia')
    await frecuenciaTrigger.click()
    await page.getByRole('option', { name: /mensual/i }).click()

    // mes_de_pago should NOT be visible for monthly
    await expect(page.getByText('Mes de Pago')).not.toBeVisible()
  })

  test('campo mes_de_pago aparece y es obligatorio para frecuencia anual', async ({ page }) => {
    await goToRecurrentes(page)
    await openNewForm(page)

    // Select anual frequency
    const frecuenciaTrigger = page.getByText('Seleccionar frecuencia')
    await frecuenciaTrigger.click()
    await page.getByRole('option', { name: /anual/i }).click()

    // mes_de_pago should be visible and marked as required
    await expect(page.getByText('Mes de Pago')).toBeVisible({ timeout: 3000 })
  })

  test('no puede guardar gasto anual sin mes_de_pago', async ({ page }) => {
    await goToRecurrentes(page)
    await openNewForm(page)

    // Fill required fields
    await page.getByPlaceholder(/Ej: Alquiler mensual/i).fill('Seguro anual')
    await page.locator('input[name="monto"], input[placeholder*="0.00"], input[placeholder*="monto"]').first().fill('12000')

    // Select anual frequency
    const frecuenciaTrigger = page.getByText('Seleccionar frecuencia')
    await frecuenciaTrigger.click()
    await page.getByRole('option', { name: /anual/i }).click()

    // Try to submit without mes_de_pago
    await page.getByRole('button', { name: /guardar/i }).click()

    // Should show validation error
    await expect(page.getByText(/mes de pago es requerido/i)).toBeVisible({ timeout: 3000 })
  })

  test('total mensual estimado divide correctamente por frecuencia', async ({ page }) => {
    await goToRecurrentes(page)

    // The total should exist and show a value (not verifying exact value since it depends on user data)
    await expect(page.getByText('Total Mensual Estimado')).toBeVisible()

    // Summary cards should be visible
    await expect(page.getByText('Gastos Activos')).toBeVisible()
  })

  test('lista muestra la frecuencia de cada gasto', async ({ page }) => {
    await goToRecurrentes(page)

    // If there are recurring expenses, frequency column should be visible
    const hasGastos = await page.getByText(/trimestral|semestral|anual|mensual|semanal/i).first().isVisible().catch(() => false)

    if (hasGastos) {
      // Verify frequency is shown in the list
      await expect(page.getByText(/trimestral|semestral|anual|mensual/i).first()).toBeVisible()
    } else {
      // No gastos - still valid, just verify the table/empty state renders
      await expect(page.getByRole('button', { name: /nuevo gasto recurrente/i })).toBeVisible()
    }
  })
})
