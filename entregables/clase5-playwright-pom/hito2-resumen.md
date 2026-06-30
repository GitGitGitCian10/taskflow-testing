# Hito 2 — Resumen de entregables

**Clase 5 · Módulo 2 — Testing Web: Playwright y Page Object Model**
Integrantes: Santiago Aurrecochea · Ignacio Villarreal
Repositorio: https://github.com/GitGitGitCian10/taskflow-testing (rama `main`)

---

## Criterios mínimos del Hito 2 — verificación

| Criterio | Requerido | Real | Estado |
|---|---|---|---|
| Unit tests US-01 / US-02 | ≥ 5 | 17 (`auth.service.spec.ts`) | ✅ |
| Integration tests US-01 / US-02 | ≥ 3 | 8 (`auth.routes.spec.ts`) | ✅ |
| Rama `main` actualizada | sí | — | ⏳ pendiente de commit/push |
| README con instrucciones de tests | sí | `README.md` (sección "Correr los tests") | ✅ |
| Tests E2E de la clase | los del documento | 4 (auth + projects) pasando | ✅ |

---

## Bloque A — Supertest: tests de tareas

Archivo: `apps/api/tests/integration/tasks.routes.spec.ts`

- `POST /projects/:projectId/tasks`: 201 (crea), 400 (título vacío), 401 (sin token)
- `GET /projects/:projectId/tasks`: 200 (array de 2 tareas), 401 (sin token)
- **Resultado: 5 tests pasando.**

> Nota: durante la verificación se corrigieron 2 fallas preexistentes en los tests de
> integración (`auth.routes.spec.ts` leía el mock dentro de cada test pese al
> `clearAllMocks` global; el caso "400 título vacío" no seteaba `statusCode`). Total
> integración: **13 tests pasando**.

---

## Bloque B — Playwright + Page Object Model

Estructura creada en `e2e/playwright/`:

```
e2e/playwright/
├── pages/
│   ├── LoginPage.ts          ← goto, register, login, expectRedirect*, expectErrorMessage
│   └── ProjectListPage.ts    ← goto, createProject, expectFormVisible, expectProjectVisible/Count
└── tests/
    ├── auth.e2e.spec.ts       ← US-01/US-02 (registro+login, login inválido)
    └── projects.e2e.spec.ts   ← US-03 (crear proyecto, nombre vacío)
```

- `playwright.config.ts` → `testDir: './e2e'`, webServer auto-levanta API (`:3001`) y web (`:5173`).
- Flujo completo automatizado: **registro → login → crear proyecto → verificar lista**.

### Resultado de la corrida (chromium)

```
Running 4 tests using 4 workers
  ✓ auth.e2e.spec.ts     › registro exitoso y posterior inicio de sesión
  ✓ auth.e2e.spec.ts     › falla inicio de sesión con credenciales incorrectas
  ✓ projects.e2e.spec.ts › crear proyecto aparece en la lista
  ✓ projects.e2e.spec.ts › nombre vacío no crea el proyecto
  4 passed (17.2s)
```

Evidencia: `playwright-output.png`
