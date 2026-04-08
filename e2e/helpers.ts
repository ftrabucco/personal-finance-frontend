import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function loginAndGoTo(page: Page, path = '/') {
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
