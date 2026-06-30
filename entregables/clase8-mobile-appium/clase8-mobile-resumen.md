# Clase 8 — Testing Mobile (Appium + Android Emulator)

**Módulo 2 — Práctica**
Integrantes: Santiago Aurrecochea · Ignacio Villarreal
App demo: **WDIO Native Demo App v2.2.0** (`com.wdiodemoapp`)

> ⚠️ **Nota de entorno:** los tests mobile requieren emulador Android + Java + Appium + el APK.
> La carpeta `mobile/` y los tests quedaron implementados e integrados al repo; la **ejecución
> contra el emulador se corre en una máquina con el entorno instalado** (ver `mobile/README.md`).

---

## Parte 1 — Verificación del entorno

Completar con la salida real en la máquina con emulador (`java -version`, `adb --version`,
`adb devices`, `appium --version`, `appium driver list --installed`):

| Herramienta | Versión esperada | Notas |
|---|---|---|
| Java (Temurin/OpenJDK) | 17+ | `java -version` |
| ADB | 1.0.41+ | `adb --version` |
| `adb devices` | `emulator-5554   device` | emulador conectado |
| Appium | 2.x | `appium --version` |
| UIAutomator2 Driver | 3.x | `appium driver list --installed` |

---

## Parte 2 — App demo instalada

```bash
adb install android.wdio.native.app.v2.2.0.apk
# Performing Streamed Install
# Success
```
App: *WDIO Native Demo App* — sección **Login** (email + password + botón LOGIN).
La app valida **formato** (email bien formado + password ≥ 8 chars), no contra un backend real.

---

## Parte 3 — Tabla de locators (pantalla Login)

| Elemento UI | Tipo de locator | Valor del locator |
|---|---|---|
| Campo email | Accessibility ID | `~input-email` |
| Campo password | Accessibility ID | `~input-password` |
| Botón LOGIN | Accessibility ID | `~button-LOGIN` |
| Confirmación de login (Home) | Texto (XPath) | `//*[@text="You are logged in!"]` |
| Mensaje error email | Texto (XPath) | `//*[@text="Please enter a valid email address"]` |
| Mensaje error password | Texto (XPath) | `//*[@text="Please enter at least 8 characters"]` |

> Los inputs y el botón exponen **accessibility id** (estándar de la WDIO demo app). Los mensajes
> de error no tienen accessibility id propio, por eso se localizan **por texto**. Confirmar todos
> con **Appium Inspector** (capabilities en `mobile/wdio.conf.ts`).

---

## Parte 4 — Integración al repo TaskFlow ✅

```
mobile/
├── tests/login.test.ts
├── wdio.conf.ts
├── tsconfig.json
├── package.json
└── README.md
```
- Script agregado al `package.json` raíz: `"test:mobile": "cd mobile && npx wdio run wdio.conf.ts"`.

---

## Parte 5 — Tests Appium implementados

Archivo `mobile/tests/login.test.ts` — **3 `it()`** dentro del `describe('WDIO Demo App — Login')`:

1. `dado formato válido, navega a la pantalla Home` — happy path (email válido + password ≥ 8).
2. `dado email con formato inválido, muestra mensaje de error`.
3. `dado password menor a 8 caracteres, muestra mensaje de error`.

Un `beforeEach` navega a la pestaña **Login** (`~Login`) antes de cada test.

**¿Pasó en el primer intento? ¿Qué ajustes?** — La ejecución final se valida en la máquina con
emulador. El ajuste previsible respecto del template del guión: la confirmación de login en esta
app aparece como **alerta "You are logged in!"** (localizada por texto), no como un elemento con
accessibility id en una pantalla Home; y los mensajes de error se localizan por texto, no por id.

---

## Parte 6 — Reflexión

**1. ¿Qué fue lo más difícil del setup comparado con Playwright?**
El setup mobile tiene muchas más piezas externas: JDK, Android Studio + SDK (~2 GB), crear un AVD,
configurar `ANDROID_HOME`/`PATH`, e instalar Appium con su driver UIAutomator2 y, aparte, el server
y el Inspector. Playwright, en cambio, es `npm install` + `npx playwright install` y listo. Además
Appium depende de un emulador corriendo (lento de arrancar), mientras Playwright levanta el browser
solo.

**2. ¿Qué ventaja tiene usar accessibility IDs sobre XPath como locator?**
Los accessibility IDs son **estables y semánticos**: no se rompen si cambia la jerarquía del layout,
son más rápidos de resolver y, además, fuerzan buenas prácticas de accesibilidad. El XPath es frágil
(depende de la estructura del árbol y del texto, que puede cambiar por idioma o rediseño) y más lento.
Por eso se usa XPath solo como *fallback* cuando un elemento no tiene accessibility id.

**3. ¿En qué parte del pipeline CI/CD agregarías estos tests? ¿Por qué?**
En una **etapa tardía, después de unit/integration/contract y, típicamente, en nightly o pre-release**
(no en cada push). Son lentos y caros (requieren emulador o un device farm como BrowserStack/Sauce),
así que conviene ejecutarlos en un job dedicado, paralelo o programado, para no frenar el feedback
rápido del pipeline principal. Idealmente sobre artefactos ya construidos (la APK del build).

---

## Checklist de entrega

| Ítem | Estado |
|---|:---:|
| Java/ADB/Appium verificados (Parte 1) | ⏳ correr en máquina con emulador |
| APK instalada y app corriendo | ⏳ idem |
| Sesión de Appium Inspector iniciada | ⏳ idem |
| Tabla de locators completada | ✅ (IDs documentados de la demo app) |
| Carpeta `mobile/` creada e integrada al repo | ✅ |
| Test login happy path | ✅ implementado · ⏳ ejecución con emulador |
| Al menos 2 casos de error | ✅ (2 implementados) |
| Preguntas de reflexión respondidas | ✅ |
