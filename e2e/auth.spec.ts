import { test, expect } from '@playwright/test'

test.describe('Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar estado de auth
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      document.cookie = 'token=; path=/; max-age=0'
    })
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')

    // Título de la app (CardTitle, not a heading role)
    await expect(page.locator('text=Finanzas Personales').first()).toBeVisible()
    await expect(page.getByText('Ingresa tus credenciales para acceder')).toBeVisible()

    // Campos del formulario
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Contraseña')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible()

    // Link a registro
    await expect(page.getByText('Regístrate aquí')).toBeVisible()
  })

  test('shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/login')

    // Submit sin completar campos
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()

    // Zod validations should show
    await expect(page.getByText('El email es requerido')).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('wrong@email.com')
    await page.getByLabel('Contraseña').fill('wrongpassword')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()

    // Esperar que el botón vuelva a estar habilitado y mostrar error del backend
    await expect(page.locator('[class*="bg-destructive"]')).toBeVisible({ timeout: 10000 })
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login')

    // Usar credenciales reales del entorno de desarrollo
    await page.getByLabel('Email').fill(process.env.E2E_USER_EMAIL || 'email@gmail.com')
    await page.getByLabel('Contraseña').fill(process.env.E2E_USER_PASSWORD || 'Test123')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()

    // Esperar redirect al dashboard
    await expect(page).toHaveURL('/', { timeout: 15000 })

    // Dashboard debe mostrar saludo
    await expect(page.getByText(/Hola,/)).toBeVisible({ timeout: 10000 })
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Limpiar cookies antes de navegar
    await page.context().clearCookies()

    await page.goto('/')

    // Middleware redirige a /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('navigate to register page', async ({ page }) => {
    await page.goto('/login')

    await page.getByText('Regístrate aquí').click()

    await expect(page).toHaveURL(/\/register/)
  })
})
