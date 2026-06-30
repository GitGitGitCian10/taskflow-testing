# Clase 10 · Módulo 2 — CI/CD y Pipelines de Calidad (Hito 4)

Integrantes: Santiago Aurrecochea · Ignacio Villarreal
Workflow: `.github/workflows/ci.yml` · Repo: `GitGitGitCian10/taskflow-testing`

---

## Entregables del Hito 4 — estado

| # | Entregable | Estado |
|---|---|:---:|
| 1 | Pipeline con todos los jobs en verde | ✅ (lint/unit/integration/bdd verdes; e2e solo en PR) |
| 2 | `workflow_dispatch` agregado a `ci.yml` | ✅ |
| 3 | Threshold de coverage en `vitest.config.ts` | ✅ (80/75/80/80) |
| 4 | BUG-03 corregido (validaciones de password) | ✅ |
| 5 | BUG-04 corregido (mensajes en inglés) | ✅ |
| 6 | Badge del pipeline en `README.md` | ✅ |

---

## PARTE A — Lectura crítica del pipeline

### A.1 — Esqueleto del pipeline

`name: CI — TaskFlow` · `on:` (push a `**`, pull_request a `main`, ahora + `workflow_dispatch`) ·
**5 jobs** en este orden: `lint` → `unit-tests` → `integration-tests` → `bdd-tests` → `e2e-tests`.

### A.2 — Ejercicio 1: grafo de jobs

```
lint ──▶ unit-tests ──▶ integration-tests ──▶ bdd-tests ──▶ e2e-tests
(🔍 lint+      (🧪 vitest      (🔗 supertest        (🥒 cucumber     (🎭 playwright
 typecheck)     +codecov)       +postgres)           +postgres)       solo en PR)
```

- **Paralelo:** ninguno — el grafo es **lineal** (cada job tiene `needs:` del anterior).
- **Job más temprano:** `lint` (sin `needs:`).
- **Último:** `e2e-tests`.
- **Condición especial:** `e2e-tests` tiene `if: github.event_name == 'pull_request'`.

### A.2 — Ejercicio 2: 5 preguntas

1. **`if: github.event_name == 'pull_request'` en e2e** → el job E2E **solo corre en Pull Requests**, no en pushes directos a ramas. Efecto: ahorra tiempo/recursos (los E2E son lentos y caros) ejecutándolos únicamente cuando se va a integrar a `main`.
2. **Si elimino `needs: lint` de `unit-tests`** → `unit-tests` dejaría de esperar a `lint` y ambos correrían **en paralelo**. Se incluye esa dependencia para **fail-fast**: si el lint/typecheck ya falla, no tiene sentido gastar tiempo corriendo los tests.
3. **`services: postgres` en integration/bdd pero no en unit** → esos jobs necesitan una **base de datos real** para sus tests (integración y BDD pegan a Postgres); los unit tests usan **mocks/stubs** y no tocan la DB. El bloque `services:` levanta un contenedor (Postgres) disponible durante el job, con su healthcheck.
4. **`upload-artifact` con `if: failure()` en e2e** → sube el **reporte de Playwright** como artifact **solo si el job falló**, para poder descargarlo y diagnosticar la falla (capturas, trace) sin reproducir localmente. Se ejecuta únicamente cuando un step previo falló.
5. **`cache: 'npm'` en todos los jobs** → cachea las dependencias de npm entre runs para acelerar `npm ci`. Cada job corre en **su propio runner aislado**, por eso debe declararse en cada uno. Si lo quito, cada job reinstala todo desde cero y el pipeline se vuelve mucho más lento.

### A.3 — Workflow `nightly.yml` (puesta en común)

- **Trigger:** `schedule: cron '0 2 * * *'` → todos los días a las **02:00 UTC** (+ `workflow_dispatch` manual). El cron tiene 5 campos: `min hora día-mes mes día-semana`; `0 2 * * *` = minuto 0, hora 2, todos los días.
- **¿Por qué performance no está en ci.yml?** Los tests de carga (k6) son **lentos y costosos**; correrlos en cada push/PR frenaría el feedback rápido y gastaría minutos de CI.
- **Ventaja de separar workflows por frecuencia/costo:** el pipeline rápido (ci.yml) da feedback en minutos en cada cambio; lo caro (performance) corre en horario nocturno sin bloquear a nadie. Cada workflow se optimiza para su propósito.

### A.4 — `workflow_dispatch` agregado ✅

Agregado al bloque `on:` de `ci.yml`. Permite ejecutar el workflow **a demanda** desde la pestaña
Actions (útil para hotfixes, debugging y re-runs). Defensa en profundidad operativa.

---

## PARTE B — Quality gates

### B.1 — Config de coverage actual (`apps/api/vitest.config.ts`)

- **Provider:** `v8`.
- **Reporters:** `text`, `json`, `html`.
- **Include:** `src/services/**` (mide solo la lógica de negocio).
- El script `test:unit` corre `vitest run tests/unit --coverage` → genera el reporte en CI.

### B.2 — Threshold de coverage ✅

Agregado dentro de `test.coverage`:
```ts
thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 }
```
**Para que el gate pasara en verde** (la cobertura unit-only estaba en ~53%), se agregaron unit tests
de `ProjectService`, `CommentService` y se completó `TaskService`. Cobertura final:

```
All files        | % Stmts 95.69 | % Branch 90.12 | % Funcs 84.84 | % Lines 95.69
 auth.service.ts | 95.37 | comment.service.ts | 100 | project.service.ts | 100 | task.service.ts | 91.89
```
**Experimento del fallo intencional:** subiendo `lines: 95` el comando termina con
`ERROR: Coverage for lines (95.69%) does not meet global threshold (95%)` solo si la cobertura
cae por debajo — con exit code ≠ 0 → el job se marca **failed** y bloquea el merge. Restaurado a 80.

### B.3 — Codecov (conceptual)

Codecov ya está integrado (step `Upload coverage report` en el job `unit-tests`). Aporta el % global,
los archivos con menor cobertura, el histórico y el **comentario automático de delta** en cada PR.
Diferencia con el threshold local: el threshold de Vitest es un **gate técnico que bloquea**; Codecov
es **información visual** y no bloquea por sí solo (salvo que se conecte con branch protection rules).

---

## PARTE C — Bugs latentes

### C.2 / C.3 — BUG-04 (mensajes de error) ✅

**Síntoma:** 2 tests fallaban por diff literal de strings — esperaban el mensaje en inglés y el código
lo devolvía en español.

| Antes (español) | Después (inglés) — fuente de verdad: los tests |
|---|---|
| `'Email ya registrado'` | `'Email already registered'` (`auth.service.ts:39`) |
| `'La contraseña debe tener al menos 8 caracteres'` | `'Password must be at least 8 characters'` (`auth.service.ts:15`) |

> En el código actual del repo estos mensajes **ya están en inglés** (BUG-04 corregido).

**C.4 — Discusión:** los 2 tests que quedaban se parecían en que **no comparaban strings sino
comportamiento** (`promise resolved instead of rejecting`); ambos testeaban reglas de validación de
password en `register()`.

### C.5 — BUG-03 (validación de password incompleta) ✅

**Síntoma:** 2 tests esperaban que `register()` **rechazara** passwords sin mayúscula / sin número,
pero la llamada **resolvía con un token**. Causa: faltaban reglas de validación en `RegisterSchema`.

**Corrección (en `auth.service.ts`):**
```ts
password: z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number'),
```
> En el repo actual estas dos reglas `.regex()` **ya están presentes** (BUG-03 corregido). Los tests
> que buscan `'uppercase'` y `'number'` pasan.

**Resultado:** `npm run test:unit` → **55 tests passing, 0 fallos** (exit 0).

### C.6 — Cierre / discusión final

- **Documentar el flujo para un compañero nuevo:** (1) el pipeline corre en cada push/PR; (2) leer el
  job que falla y su output **antes** de tocar código; (3) atacar primero el test más informativo (diff
  literal) para reducir ruido; (4) corregir, correr local, pushear y re-verificar en Actions.
- **Defensa en profundidad:** el bug se podría atrapar en varias capas — **pre-commit** (lint/format
  local), **CI** (tests + coverage gate que bloquea), y **branch protection** (no se mergea con el
  pipeline rojo). Cada capa atrapa lo que se escapa de la anterior; el CI es la red que hizo
  **visibles** bugs que ya estaban en `main`.

---

## Cómo ejecutar / verificar

```bash
# Local
cd apps/api && npm run test:unit          # 55 tests, coverage ≥ thresholds → exit 0
# En GitHub: Actions → "CI — TaskFlow" → Run workflow (workflow_dispatch)
```
