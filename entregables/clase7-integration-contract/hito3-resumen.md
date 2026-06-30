# Hito 3 — Integration Testing + Contract Testing con Pact

**Clase 7 · Módulo 2**
Integrantes: Santiago Aurrecochea · Ignacio Villarreal
Tema: integration tests reales (Supertest + PostgreSQL) + primer contrato Pact consumer/provider.

---

## Parte 0 — Setup del entorno ✅

- `apps/api/.env.test` creado (`DATABASE_URL` → `taskflow_test`, `JWT_SECRET`, `NODE_ENV=test`).
- Scripts agregados a `apps/api/package.json`:
  - `test` → `dotenv -e .env.test --override -- vitest run --no-file-parallelism`
  - `test:integration` → corre los integration tests reales contra la BD de test
  - `test:pact` → verificación del provider
  - `db:migrate:test` → `prisma migrate deploy` sobre `taskflow_test`
- `dotenv-cli` instalado. Base `taskflow_test` creada y migrada (`All migrations have been successfully applied`).

> **Nota de adaptación a la API real:** el guión usa rutas `/api/projects` y `list.body.projects`,
> pero la API de TaskFlow monta las rutas en `/projects` y `listProjects` devuelve un **array directo**.
> Los tests se escribieron contra la API real.

---

## Ejercicios 1 y 2 — Integration tests (US-03, US-04, US-05) ✅

Archivos: `apps/api/tests/projects.integration.test.ts` y `apps/api/tests/tasks.integration.test.ts`
(aislamiento con `beforeEach`/`afterAll` + `deleteMany` en orden por foreign keys).

| Test | US | Resultado |
|---|---|---|
| crea un proyecto y devuelve 201 con id | US-03 | ✅ |
| rechaza nombre vacío con 400 | US-03 | ✅ |
| rechaza petición sin token con 401 | US-03 | ✅ |
| solo devuelve los proyectos del usuario autenticado | US-04 | ✅ |
| crea una tarea con prioridad válida | US-05 | ✅ |
| rechaza prioridad inválida con 400 | US-05 | ✅ |
| rechaza crear tarea sin token con 401 | US-05 | ✅ |

**7 integration tests reales pasando** contra PostgreSQL.

---

## Ejercicio 3 — Contrato Pact: consumer (frontend) ✅

- Cliente: `apps/web/src/api/projects.ts` (`createProject`).
- Test consumer: `apps/web/tests/pact/createProject.consumer.pact.test.ts`.
- Contrato generado: `pacts/taskflow-frontend-taskflow-api.json` (copiado en esta carpeta).

**Pregunta: ¿por qué `MatchersV3.uuid()` en lugar de un string exacto como `'abc-123'`?**
Porque un contrato no debe atarse a un **valor** concreto sino al **tipo/forma** del campo: el id real
cambia en cada creación, así que fijar `'abc-123'` haría fallar la verificación siempre. Un matcher de tipo
verifica que el provider devuelve *un* identificador con el formato esperado, no uno puntual.

> **Salvedad aplicada en TaskFlow:** los IDs de TaskFlow son **cuid** (`@default(cuid())`), no UUID v4.
> Si usáramos `MatchersV3.uuid()`, la verificación del provider fallaría porque los cuid no matchean el
> regex de UUID. Por eso usamos `MatchersV3.string(...)` (type matcher) para `id`, `name` y `ownerId`:
> mismo principio (validar tipo, no valor), pero compatible con el formato real.

---

## Ejercicio 4 — Verificación del provider (backend) ✅

- Helper: `apps/api/tests/helpers/auth.helper.ts` (`generateTestJWT`).
- Test provider: `apps/api/tests/pact/projects.provider.pact.test.ts` (corrige los typos del guión:
  `@prisma/client`, `new PrismaClient()`, imports de vitest).
- Resultado de `npm run test:pact`:

```
Verifying a pact between taskflow-frontend and taskflow-api
  una petición para crear proyecto TaskFlow MVP
    Given usuario autenticado con token válido
    returns a response which
      has status code 201 (OK)
      includes headers "Content-Type" with value "application/json" (OK)
      has a matching body (OK)
Verification successful
```

**Pregunta: ¿qué pasa si cambiás `id` por `projectId` en la respuesta del controller?**
La verificación del provider **falla**: el contrato exige el campo `id` y, al renombrarlo, el provider ya
no lo devuelve. Pact reporta algo como `has a matching body (FAILED)` con un error del estilo *"Expected
body to have key 'id' but it was missing"* (1 interaction, 1 failure). Es exactamente el valor del contract
testing: detecta una ruptura del contrato frontend↔backend sin necesidad de levantar ambos a la vez.

---

## Ejercicio 5 — Gherkin US-01..05 en verde ✅

Ejecutado desde `taskflow-bdd/` (donde viven las features):

```
14 scenarios (14 passed)
96 steps (96 passed)
```

**¿Cuántos escenarios quedaron en pending o undefined?** **0 pending, 0 undefined.** Cubren US-01..06.

> Se corrigió además el wiring del script: `npm run test:bdd` (raíz) apuntaba a `apps/api` (0 escenarios,
> defecto señalado en el feedback del Hito 3). Ahora ejecuta los escenarios reales de `taskflow-bdd/`.

---

## Ejercicio 6 — Matriz de Trazabilidad (Hito 3)

✅ pasa · — sin cobertura aún

| US | CA clave | Unit | Integration | Gherkin | Contrato Pact |
|---|---|:---:|:---:|:---:|:---:|
| **US-01** | registro + email único | ✅ | ✅ | ✅ | — |
| **US-02** | login → JWT / credenciales inválidas | ✅ | ✅ | ✅ | — |
| **US-03** | crear proyecto (auth, 3-100 chars) | — | ✅ | ✅ | ✅ |
| **US-04** | listar solo mis proyectos | — | ✅ | ✅ | — |
| **US-05** | crear tarea + prioridad válida | ✅¹ | ✅ | ✅ | — |

¹ US-05 a nivel unit está cubierto por las validaciones (`validateTitle` en `task.service.spec.ts`).
Pendiente para próximas clases: unit de `ProjectService` (US-03/04) y más interacciones Pact.

---

## Checklist de entrega — Hito 3

| Ítem | Estado |
|---|:---:|
| POST /projects con auth JWT → 201 | ✅ |
| GET /projects → solo proyectos del usuario | ✅ |
| POST /projects/:id/tasks → 201 con prioridad válida | ✅ |
| Al menos 2 tests de error por endpoint | ✅ |
| `cucumber-js` sin errors ni warnings | ✅ |
| 0 scenarios pending o undefined | ✅ |
| US-01..05 en verde | ✅ |
| `pacts/taskflow-frontend-taskflow-api.json` generado | ✅ |
| Provider verification: 0 failures | ✅ |
| ESLint: 0 errores (14 warnings menores) | ✅ |
| TypeScript compila (`tsc --noEmit`) | ✅ |
| Coverage de líneas ≥ 70% | ✅ (74.83%) |
| Matriz actualizada con US-03/04/05 | ✅ |
| Tests etiquetados con @US-03 / @US-04 / @US-05 | ✅ |

### Resumen de ejecución (`npm test` en apps/api)

```
Test Files  8 passed (8)
     Tests  52 passed (52)
```
(31 unit + 13 integration mockeada + 7 integration real + 1 pact provider)
