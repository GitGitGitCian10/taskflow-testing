// mobile/tests/login.test.ts
// Tests Appium sobre la pantalla Login de la WDIO Native Demo App (com.wdiodemoapp).
//
// Locators:
//  - Inputs y botón usan ACCESSIBILITY ID (prefijo ~). Son los IDs estándar y
//    documentados de esta app demo; confirmalos con Appium Inspector (Parte 3).
//  - Los MENSAJES DE ERROR no exponen accessibility id propio, así que se
//    localizan por TEXTO (XPath). El texto exacto lo da el guión de la práctica.

describe('WDIO Demo App — Login', () => {
  beforeEach(async () => {
    // La app abre en Home: navegamos a la pestaña Login (bottom nav)
    await browser.$('~Login').click()
  })

  // ── Ejercicio 1: Happy path ────────────────────────────────────
  it('dado formato válido, navega a la pantalla Home', async () => {
    const emailField = await browser.$('~input-email')
    await emailField.setValue('test@taskflow.com')
    await browser.$('~input-password').setValue('Password123!')
    await browser.$('~button-LOGIN').click()

    // La demo app confirma el login con una alerta "You are logged in!"
    const homeElement = await browser.$('//*[@text="You are logged in!"]')
    await expect(homeElement).toBeDisplayed()
  })

  // ── Ejercicio 2: Error paths ───────────────────────────────────
  it('dado email con formato inválido, muestra mensaje de error', async () => {
    await browser.$('~input-email').setValue('esto-no-es-un-email')
    await browser.$('~input-password').setValue('Password123!')
    await browser.$('~button-LOGIN').click()

    const errorMsg = await browser.$('//*[@text="Please enter a valid email address"]')
    await expect(errorMsg).toBeDisplayed()
  })

  it('dado password menor a 8 caracteres, muestra mensaje de error', async () => {
    await browser.$('~input-email').setValue('test@taskflow.com')
    await browser.$('~input-password').setValue('corta') // menos de 8 chars
    await browser.$('~button-LOGIN').click()

    const errorMsg = await browser.$('//*[@text="Please enter at least 8 characters"]')
    await expect(errorMsg).toBeDisplayed()
  })
})
