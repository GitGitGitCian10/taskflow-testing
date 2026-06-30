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

---

## Clase 11 — Test Management, Métricas y Reporting (Allure)

📁 `clase11-allure-reporting/`

| Archivo | Descripción |
|---|---|
| `clase11-allure-resumen.md` | Config de Allure, tabla de los 5 tests anotados, y el Reporte Ejecutivo de Testing completo (secciones A–F) |
| `allure-overview.png` | Dashboard de Allure (Overview): 55 test cases, 100% |
| `allure-behaviors.png` | Vista Behaviors con las features anotadas (Autenticación, Proyectos, Tareas) |

- **Cambios en el repo:**
  - `apps/api/vitest.config.ts`: reporter `allure-vitest` + setup.
  - `package.json` raíz: scripts `allure:generate` / `allure:open` / `allure:report`.
  - `.gitignore`: `allure-results/` + `allure-report/`.
  - 5 tests unit anotados con `feature`/`story`/`severity`/`link` (`bindAllureApi`).
  - Shim de tipos `apps/api/tests/types/allure-vitest.d.ts`.
- Estado: **55 unit tests passing**, `allure-results/` generado con metadata verificada, tsc/lint OK.
- ⚠️ Se usó **allure-vitest v2** (compat. Vitest 1.6). El **HTML de Allure requiere Java** (el guión dice lo contrario, pero es falso: `allure-commandline` no trae JRE). Se instaló Temurin JRE 21 y se generó el dashboard real (ver capturas).

---

## Clase 12 — Testing con Inteligencia Artificial (Módulo 2 — Práctica)

📁 `clase12-testing-con-ia/`

| Archivo | Descripción |
|---|---|
| `clase12-testing-con-ia-resumen.md` | Documento completo de las 3 partes: prompts (Chaining/Few-Shot/Meta) con outputs, evaluación (métricas, alucinaciones, consistencia, sesgos) y reflexión + refinamiento |

- **Práctica conceptual** sobre US-05 y US-07: el LLM se usa en doble rol (herramienta que genera test cases y sistema bajo prueba que evaluamos).
- **Anclado a la spec real** del repo (`apps/api/src/services/task.service.ts`, `routes/project.routes.ts`) para distinguir comportamiento real vs alucinado.
- Alucinaciones detectadas y documentadas: `status=PENDING → 400` (inexistente), `search=""→todas`, ordenamiento `createdAt` inventado, y **CA-05d inexistente** inducido por el enunciado.
- Incluye refinamiento antes/después del prompt del Paso 1 (la alucinación desaparece al cerrar los huecos del prompt).

---

## Clase 12 — Testing de Seguridad y Accesibilidad (Módulo 2)

📁 `clase12-seguridad-accesibilidad/`

| Archivo | Descripción |
|---|---|
| `clase12-seguridad-accesibilidad-reporte.md` | Reporte completo: setup, análisis de seguridad (npm audit + curl), auditoría a11y (axe-core), plantillas de hallazgos, User Stories de remediación y checklist |
| `a11y.spec.ts` | Test de accesibilidad WCAG 2.1 AA (axe-core + Playwright) para Login y Proyectos |

- **Seguridad** (anclado a `apps/api/src/app.ts`): **SEC-01** ausencia de cabeceras de seguridad (sin `helmet`: falta CSP/HSTS/X-Frame-Options/X-Content-Type-Options) y **SEC-02** CORS permisivo (`Access-Control-Allow-Origin: *`). IDOR sobre `GET /projects/:projectId` **probado y descartado** (membership check → 403, `project.service.ts:68`).
- **Accesibilidad** (anclado a `LoginPage.tsx` / `ProjectsPage.tsx`): **ACC-01** labels sin asociar (SC 1.3.1/4.1.2, A), **ACC-02** contraste insuficiente en botones teal-600 (SC 1.4.3, AA), **ACC-03** tarjeta `<li>` clickeable no operable por teclado (SC 2.1.1, A). Fix aplicado: asociación `htmlFor`/`id` en el login.
- **2 User Stories** de remediación (seguridad + accesibilidad) con 3 CA testables cada una.
- ⚠️ El entorno no levanta DB/dev server: comandos `curl`/`npx playwright` documentados para correr con el stack arriba; los hallazgos estructurales (headers, CORS, labels, contraste) se afirman leyendo el fuente.
