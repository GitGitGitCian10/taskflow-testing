# TaskFlow E2E

Este directorio contiene la suite de pruebas de flujo completo (End-to-End) para el proyecto **TaskFlow**. Las pruebas aseguran que tanto el front-end como el back-end interactúen correctamente emulando a un usuario real.

---

## Estructura del Directorio

```text
e2e/
├── features/            ← Archivos .feature (Gherkin) para escenarios BDD
├── tests/               ← Implementación de los pasos de Cucumber
└── playwright/
    ├── pages/           ← Clases base del Page Object Model (POM)
    └── tests/           ← Specs de Playwright para flujos E2E puros
```

---

## Playwright

Implementamos Playwright para validar la aplicación desde un entorno real utilizando navegadores Chromium, Firefox o Webkit. Hacemos uso fuerte del patrón **Page Object Model** para encapsular y reutilizar la lógica de cada página.

### Correr los tests de Playwright

> **Importante:** Asegúrate de tener la aplicación local en marcha (API + Web + Base de datos) antes de correr las pruebas E2E.

Para ejecutar todos los tests E2E en modo *headless* (sin interfaz visible), ejecuta desde la raíz:

```bash
npx playwright test e2e/playwright/tests
```

**Si deseas visualizar las ventanas de los navegadores** operando y ver paso a paso lo que sucede, agrega el flag `--headed`:

```bash
npx playwright test e2e/playwright/tests --headed
```

### Comandos útiles opcionales

```bash
npx playwright show-report       # Ver el reporte HTML tras una ejecución
npx playwright test --debug      # Ejecutar con el inspector de Playwright para debugear
```