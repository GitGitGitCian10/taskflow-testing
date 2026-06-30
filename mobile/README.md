# Mobile Testing — Appium + WebdriverIO

Tests mobile sobre la **WDIO Native Demo App** (`com.wdiodemoapp`) corriendo en un emulador Android.

## Requisitos (una sola vez)

- **Java** (Temurin/OpenJDK), **Android Studio** + SDK, un **AVD** (Pixel 6, API 33).
- Variables de entorno: `ANDROID_HOME` + `platform-tools` y `emulator` en el `PATH`.
- **Appium** global + driver UIAutomator2:
  ```bash
  npm install -g appium
  appium driver install uiautomator2
  ```

## Cómo correr

```bash
# 1. Levantar el emulador Android (Android Studio → Device Manager → ▶)

# 2. Instalar la APK demo en el emulador
adb install android.wdio.native.app.v2.2.0.apk

# 3. En una terminal, dejar Appium corriendo
appium                       # http://0.0.0.0:4723

# 4. Instalar deps y correr los tests
cd mobile
npm install
npm test                     # = wdio run wdio.conf.ts
```

También desde la raíz del repo: `npm run test:mobile`.

## Estructura

```
mobile/
├── tests/login.test.ts   # happy path + 2 casos de error
├── wdio.conf.ts          # config Appium/UIAutomator2 (puerto 4723)
├── tsconfig.json
├── package.json
└── README.md
```

## Locators de la pantalla Login

| Elemento | Tipo | Locator |
|---|---|---|
| Campo email | Accessibility ID | `~input-email` |
| Campo password | Accessibility ID | `~input-password` |
| Botón LOGIN | Accessibility ID | `~button-LOGIN` |
| Confirmación de login | Texto (XPath) | `//*[@text="You are logged in!"]` |
| Mensaje error email | Texto (XPath) | `//*[@text="Please enter a valid email address"]` |
| Mensaje error password | Texto (XPath) | `//*[@text="Please enter at least 8 characters"]` |

> Los inputs y el botón usan **accessibility id** (estándar de esta app). Los mensajes de
> error no exponen accessibility id propio, por eso se localizan **por texto**. Confirmá
> todos los locators con **Appium Inspector** antes de la corrida final.
