import { test, expect } from '@playwright/test'
import { loginAndGoTo } from './helpers'

test.describe('Balance Acumulado', () => {
  test('dashboard shows Balance Acumulado card', async ({ page }) => {
    await loginAndGoTo(page)

    // Wait for dashboard to load
    await expect(page.getByText('Gastos del Mes')).toBeVisible({ timeout: 10000 })

    // Balance Acumulado card should be visible
    await expect(page.getByText('Balance Acumulado')).toBeVisible({ timeout: 10000 })
  })

  test('dashboard shows Evolución Mensual table', async ({ page }) => {
    await loginAndGoTo(page)

    await expect(page.getByText('Evolución Mensual')).toBeVisible({ timeout: 10000 })

    // Table headers should be present
    await expect(page.getByText('Ingresos', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('Gastos', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('Saldo', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('Acumulado', { exact: false }).first()).toBeVisible()
  })

  test('Ingresos vs Gastos chart is visible', async ({ page }) => {
    await loginAndGoTo(page)

    await expect(page.getByText('Ingresos vs Gastos')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Balance Inicial - Configuración', () => {
  test('configuración page has General tab with balance inicial input', async ({ page }) => {
    await loginAndGoTo(page, '/configuracion')

    // General tab should exist and be active by default
    await expect(page.getByRole('tab', { name: 'General' })).toBeVisible({ timeout: 10000 })

    // Balance Inicial section should be visible
    await expect(page.getByText('Balance Inicial')).toBeVisible()
    await expect(page.getByPlaceholder('0.00')).toBeVisible()
  })

  test('can set balance inicial and save', async ({ page }) => {
    await loginAndGoTo(page, '/configuracion')

    await expect(page.getByRole('tab', { name: 'General' })).toBeVisible({ timeout: 10000 })

    // Fill in the balance inicial
    const input = page.getByPlaceholder('0.00')
    await input.clear()
    await input.fill('500000')

    // Click save
    await page.getByRole('button', { name: 'Guardar' }).click()

    // Should show success toast
    await expect(page.getByText('Balance inicial actualizado')).toBeVisible({ timeout: 5000 })
  })

  test('balance inicial persists after page reload', async ({ page }) => {
    await loginAndGoTo(page, '/configuracion')

    await expect(page.getByRole('tab', { name: 'General' })).toBeVisible({ timeout: 10000 })

    // Set a value
    const input = page.getByPlaceholder('0.00')
    await input.clear()
    await input.fill('750000')
    await page.getByRole('button', { name: 'Guardar' }).click()
    await expect(page.getByText('Balance inicial actualizado')).toBeVisible({ timeout: 5000 })

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Click General tab (it should be default, but just in case)
    await page.getByRole('tab', { name: 'General' }).click()

    // Input should have the saved value
    const savedInput = page.getByPlaceholder('0.00')
    await expect(savedInput).toHaveValue('750000', { timeout: 5000 })
  })
})
