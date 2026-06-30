# Entregables — Testing y Calidad de Software 2026

Índice de entregables por clase. Integrantes: Santiago Aurrecochea · Ignacio Villarreal.

---

## Clase 2 — Workshop: De Épicas a Gherkin (BDD)

📁 `clase2-bdd-gherkin/`

| Archivo | Descripción |
|---|---|
| `cucumber-output.png` | Captura del output de `npx cucumber-js` con los escenarios en verde (entregable requerido) |
| `cucumber-report.html` | Reporte HTML generado por Cucumber (evidencia complementaria) |

- **Features y steps** (en el repo): `taskflow-bdd/features/` — 3 `.feature` con 14 escenarios (happy path + errores) y sus step definitions.
- Estado: **14 scenarios / 96 steps passing**.

---

## Clase 3 — Práctica TDD (Red-Green-Refactor)

📁 `clase3-tdd/`

| Archivo | Descripción |
|---|---|
| `BUG-05.md` | Descripción del bug de bloqueo de cuenta, el fix aplicado y el ciclo RED→GREEN |

- **Ejercicio 1** (`validateTitle`) y **Ejercicio 2** (`validateStatusTransition`): implementados en `apps/api/src/services/task.service.ts`, tests en `apps/api/tests/unit/`.
- **Ejercicio 3** (BUG-05): bug corregido en `apps/api/src/services/auth.service.ts` (`>` → `>=`).
- Estado unit tests: **31 passing**.

---

## Clase 4 — Testing de APIs REST (Postman / Newman / Supertest)

📁 `clase4-api-rest/`

| Archivo | Descripción |
|---|---|
| `taskflow-api.collection.json` | Colección Postman exportada (carpetas Autenticación · Proyectos · Tareas) |
| `taskflow-local.env.json` | Environment de Postman (`base_url`, `token`, `project_id`, `task_id`) |
| `newman-report.html` | Reporte HTML de la corrida de Newman |
| `actividad-5.4-respuestas.md` | Respuestas a la actividad de análisis del Paso 5.4 |

- **Tests Supertest** (en el repo): `apps/api/tests/integration/` — `auth.routes.spec.ts` + `tasks.routes.spec.ts`.
- Estado:
  - **Newman**: 10 requests / 20 assertions, **0 fallos**.
  - **Supertest**: **13 tests passing** (supera el mínimo de 3).

### Cobertura pendiente de la colección (para completar a futuro)
- US-04 — Listar proyectos (`GET /projects`)
- US-08 — Comentar en una tarea (carpeta *Comentarios* vacía)

---

## Clase 5 — Testing Web: Playwright y Page Object Model (Hito 2)

📁 `clase5-playwright-pom/`

| Archivo | Descripción |
|---|---|
| `hito2-resumen.md` | Verificación de los criterios mínimos del Hito 2 (unit/integration/E2E) |
| `matriz-trazabilidad.md` | Matriz de trazabilidad US × capa de test, con estado real verificado |
| `playwright-output.png` | Captura de los 4 tests E2E (chromium) en verde |

- **Bloque A — Supertest tareas** (en el repo): `apps/api/tests/integration/tasks.routes.spec.ts` → 5 tests.
- **Bloque B — Playwright POM** (en el repo): `e2e/playwright/pages/` (LoginPage, ProjectListPage) + `e2e/playwright/tests/` (auth, projects).
- Estado:
  - **Supertest tareas**: 5 passing (integración total: 13 passing).
  - **E2E Playwright**: **4 tests passing** (chromium).
  - **Unit US-01/02**: 17 passing · **Integration US-01/02**: 8 passing.

---

## Clase 6 — Elección del Stack y Architecture Decision Record (ADR)

📁 `clase6-adr/`

| Archivo | Descripción |
|---|---|
| `workshop-clase6-stack-y-adr.md` | Documento del workshop completo: tablas de evaluación (Parte 1), ADR (Parte 2), checklist de presentación y reflexión (Parte 3) |

- **ADR canónico** (en el repo): `docs/decisions/ADR-001-stack-testing.md` — revisado en el Hito 3, estado *Aceptado*.
- Stack elegido: **Vitest** (unit/integration) · **Supertest + Postman/Newman** (API, conviven) · **Playwright** (E2E).

---

## Clase 7 — Integration Testing + Contract Testing con Pact (Hito 3)

📁 `clase7-integration-contract/`

| Archivo | Descripción |
|---|---|
| `hito3-resumen.md` | Documento completo: setup, ejercicios 1-6, respuestas conceptuales, matriz de trazabilidad y checklist del Hito 3 |
| `taskflow-frontend-taskflow-api.json` | Contrato Pact generado por el consumer |
| `hito3-output.png` | Captura de la suite completa en verde (52 tests + Pact + Gherkin) |

- **Integration tests reales** (en el repo): `apps/api/tests/projects.integration.test.ts` + `tasks.integration.test.ts` (contra PostgreSQL `taskflow_test`).
- **Pact**: consumer en `apps/web/tests/pact/`, provider en `apps/api/tests/pact/`, contrato en `pacts/`.
- Estado:
  - **52 tests passing** (31 unit + 13 integration mockeada + 7 integration real + 1 pact provider).
  - **Gherkin US-01..06**: 14 scenarios passing (0 pending/undefined).
  - **Pact provider verification**: 0 failures · **Coverage**: 74.83% · **Lint**: 0 errores.

---

## Clase 8 — Testing Mobile (Appium + Android Emulator)

📁 `clase8-mobile-appium/`

| Archivo | Descripción |
|---|---|
| `clase8-mobile-resumen.md` | Documento completo: tabla de entorno, locators, suite de tests, reflexión y checklist |

- **Carpeta `mobile/`** (en el repo): `tests/login.test.ts` (3 tests: happy path + 2 errores), `wdio.conf.ts`, `tsconfig.json`, `package.json`, `README.md`.
- Script `test:mobile` agregado al `package.json` raíz.
- App demo: **WDIO Native Demo App** (`com.wdiodemoapp`) — locators por accessibility ID (`~input-email`, `~input-password`, `~button-LOGIN`).
- ⚠️ La **ejecución contra el emulador Android** se corre en una máquina con el entorno (Java + Android SDK + Appium); este entorno no tiene emulador.

---

## Clase 9 — Performance Testing con k6

📁 `clase9-performance/`

| Archivo | Descripción |
|---|---|
| `clase9-performance-resumen.md` | Documento completo: cada pregunta y tabla (Partes 0-4), los 3 bugs, diagnóstico del bug de performance y conexión con CI/CD |
| `k6-resultados.png` | Captura de los 3 runs reales (smoke / load / spike) |

- **Script** (en el repo): `performance/scenarios/api-load.k6.js` (3 bugs ya corregidos, `setup()` funcionando).
- **Resultados** (en el repo): `performance/resultados-clase9.md` (tablas load + spike).
- Corrido **de verdad** con k6 v2.0.0 contra la API en `:3001`:
  - **Smoke** (1 VU): error_rate **0.00%**, checks 100% → criterio de aprobación cumplido.
  - **Load** (50 VUs): p95 62 ms, 72.5 req/s, todos los SLOs OK.
  - **Spike** (200 VUs): 0% errores pero `tasks_duration` p95 **412.87 ms > 400 ms** (degradación bajo carga, exit 99).

---

## Clase 10 — CI/CD y Pipelines de Calidad (Hito 4)

📁 `clase10-cicd/`

| Archivo | Descripción |
|---|---|
| `clase10-cicd-resumen.md` | Documento completo: lectura del pipeline (grafo + 5 preguntas), nightly, quality gates, BUG-03/04 y defensa en profundidad |
| `coverage-gate.png` | Captura de `test:unit` con coverage 95.69% y el quality gate en verde |

- **Cambios en el repo:**
  - `ci.yml`: agregado `workflow_dispatch`.
  - `vitest.config.ts`: threshold de coverage **80/75/80/80**.
  - `README.md` raíz: badge del pipeline.
  - **BUG-03** (regex de password) y **BUG-04** (mensajes en inglés): ya corregidos en `auth.service.ts`.
  - **+30 unit tests nuevos** (`ProjectService`, `CommentService`, `TaskService`) para que el gate de 80% pase en verde — cobertura subió de 53.76% → **95.69%**.
- Estado: **55 unit tests passing**, coverage gate OK (exit 0), lint 0 errores, tsc limpio.
