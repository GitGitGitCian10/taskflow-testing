// mobile/wdio.conf.ts
// Configuración de WebdriverIO + Appium (driver UIAutomator2) para la
// WDIO Native Demo App (com.wdiodemoapp) corriendo en el emulador Android.
import type { Options } from '@wdio/types'

export const config: Options.Testrunner = {
  runner: 'local',

  // Appium debe estar corriendo (npx appium) en este puerto
  hostname: '127.0.0.1',
  port: 4723,
  path: '/',

  specs: ['./tests/**/*.test.ts'],
  maxInstances: 1,

  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UIAutomator2',
      'appium:deviceName': 'emulator-5554',
      'appium:appPackage': 'com.wdiodemoapp',
      'appium:appActivity': '.MainActivity',
      'appium:noReset': true,
    },
  ],

  logLevel: 'info',
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
}
