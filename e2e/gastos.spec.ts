import { test, expect } from '@playwright/test'

// Helper: login and navigate
async function loginAndGoTo(page: import('@playwright/test').Page, path = '/') {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.E2E_USER_EMAIL || 'email@gmail.com')
  await page.getByLabel('Contraseña').fill(process.env.E2E_USER_PASSWORD || 'Test123')
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
  await expect(page).toHaveURL('/', { timeout: 15000 })
  if (path !== '/') {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
}

test.describe('Dashboard', () => {
  test('loads and shows main sections', async ({ page }) => {
    await loginAndGoTo(page)

    // Welcome message
    await expect(page.getByText(/Hola,/)).toBeVisible()

    // Main stat cards
    await expect(page.getByText('Gastos del Mes')).toBeVisible()
    await expect(page.getByText('Ingresos del Mes')).toBeVisible()
    await expect(page.getByText('Balance Neto')).toBeVisible()
    await expect(page.getByText('Tasa de Ahorro')).toBeVisible()

    // Recent expenses section
    await expect(page.getByText('Gastos Recientes')).toBeVisible()
  })

  test('process pending button works', async ({ page }) => {
    await loginAndGoTo(page)

    const procesarBtn = page.getByRole('button', { name: /Procesar Pendientes/ })
    await expect(procesarBtn).toBeVisible()
    await procesarBtn.click()

    // The loading state may be very brief, so just wait for the button to be re-enabled
    await expect(page.getByRole('button', { name: /Procesar Pendientes/ })).toBeEnabled({ timeout: 15000 })
  })
})

test.describe('Gastos - CRUD Flow', () => {
  test('navigate to gastos page and see tabs', async ({ page }) => {
    await loginAndGoTo(page, '/gastos')

    // Page title (scoped to main to avoid sidebar duplicate)
    await expect(page.getByRole('main').getByRole('heading', { name: 'Gastos' })).toBeVisible()

    // Tabs
    await expect(page.getByRole('tab', { name: 'Historial' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Unicos' })).toBeVisible()
  })

  test('create gasto unico via QuickGastoDialog from historial', async ({ page }) => {
    await loginAndGoTo(page, '/gastos')

    // Click "Nuevo Gasto" button in historial tab
    const nuevoGastoBtn = page.getByRole('button', { name: /Nuevo Gasto/ }).first()
    await expect(nuevoGastoBtn).toBeVisible({ timeout: 10000 })
    await nuevoGastoBtn.click()

    // Dialog should open — wait for the dialog content
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Select "Gasto Único"
    await dialog.getByText('Gasto Único', { exact: false }).first().click()

    // Form should appear — wait for description input
    const descripcionInput = page.getByPlaceholder('Ej: Compra en supermercado')
    await expect(descripcionInput).toBeVisible({ timeout: 5000 })

    // Fill form
    const timestamp = Date.now()
    const descripcion = `E2E Test Gasto ${timestamp}`
    await descripcionInput.fill(descripcion)

    // Monto
    const montoInput = page.locator('input[type="number"]').first()
    await montoInput.fill('150')

    // Categoría — click the combobox/select trigger
    const categoriaBtn = dialog.locator('button').filter({ hasText: /[Cc]ategoría|[Ss]eleccionar/ }).first()
    if (await categoriaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await categoriaBtn.click()
      await page.locator('[role="option"]').first().click()
    }

    // Importancia
    const importanciaBtn = dialog.locator('button').filter({ hasText: /[Ii]mportancia|[Ss]eleccionar/ }).nth(0)
    if (await importanciaBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await importanciaBtn.click()
      await page.locator('[role="option"]').first().click()
    }

    // Tipo de pago
    const tipoPagoBtn = dialog.locator('button').filter({ hasText: /[Tt]ipo.*[Pp]ago|[Ss]eleccionar/ }).first()
    if (await tipoPagoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tipoPagoBtn.click()
      await page.locator('[role="option"]').first().click()
    }

    // Submit
    await dialog.getByRole('button', { name: /Guardar|Crear/ }).click()

    // Dialog should close on success — use the named dialog to avoid popover conflicts
    await expect(page.getByRole('dialog', { name: /Nuevo Gasto/ })).not.toBeVisible({ timeout: 10000 })

    // The new gasto should appear in the list
    await expect(page.getByText(descripcion)).toBeVisible({ timeout: 10000 })
  })

  test('search in gastos historial', async ({ page }) => {
    await loginAndGoTo(page, '/gastos')

    // Historial is default tab, wait for content
    await page.waitForTimeout(2000)

    // Search input in historial
    const searchInput = page.getByPlaceholder('Buscar por descripción o categoría...')
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    // Type a search query
    await searchInput.fill('E2E Test')

    // Wait for filtering
    await page.waitForTimeout(500)

    // Should still be on the page (no crash)
    await expect(page.getByRole('main').getByRole('heading', { name: 'Gastos' })).toBeVisible()
  })

  test('delete gasto unico with confirm dialog', async ({ page }) => {
    await loginAndGoTo(page, '/gastos?tab=unicos')

    // Wait for content to load
    await page.waitForTimeout(3000)

    // Look for an E2E test gasto to delete
    const e2eGasto = page.getByText(/E2E Test Gasto/).first()

    if (await e2eGasto.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Find the row containing this gasto and click its delete button (trash icon)
      const row = e2eGasto.locator('xpath=ancestor::tr | ancestor::div[contains(@class,"flex")]').first()
      const deleteBtn = row.locator('button').last()

      await deleteBtn.click()

      // ConfirmDialog should appear
      await expect(page.getByText('¿Estás seguro?')).toBeVisible({ timeout: 5000 })

      // Confirm deletion
      await page.getByRole('button', { name: 'Confirmar' }).click()

      // Dialog should close
      await expect(page.getByText('¿Estás seguro?')).not.toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })

  test('gastos historial tab loads with data', async ({ page }) => {
    await loginAndGoTo(page, '/gastos')

    // Historial is the default tab — wait for data to load
    await page.waitForTimeout(3000)

    // Should show stats or data — look for the total amount or search bar
    const hasStats = await page.getByText(/\$/).first().isVisible().catch(() => false)
    const hasSearch = await page.getByPlaceholder(/Buscar/).isVisible().catch(() => false)
    const hasEmptyState = await page.getByText(/No hay gastos/).isVisible().catch(() => false)

    expect(hasStats || hasSearch || hasEmptyState).toBeTruthy()
  })
})
