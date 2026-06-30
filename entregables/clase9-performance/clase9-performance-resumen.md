# Clase 9 · Módulo 2 — Performance Testing con k6

Integrantes: Santiago Aurrecochea · Ignacio Villarreal
API: TaskFlow (`http://localhost:3001`) · Script: `performance/scenarios/api-load.k6.js` · k6 v2.0.0

---

## PARTE 0 — Setup y verificación del entorno

- API levantada en `http://localhost:3001` (`npm run dev`). ✅
- Seed OK: login de `alice@taskflow.dev` devuelve token. ✅
- k6 instalado (`k6 version` → v2.0.0). ✅
- Script `performance/scenarios/api-load.k6.js` revisado. ✅

> **Aclaración de rutas:** la API de TaskFlow **no usa el prefijo `/api`** (las rutas son
> `/auth/...`, `/projects`, `/projects/:id/tasks`). El guión escribe `/api/...`, pero la base
> correcta confirmada en la Clase 4 es `http://localhost:3001` **sin** `/api`.

---

## PARTE 1 — Smoke test: diagnosticar el script inicial

### 1.2 — Errores / checks fallidos observados (con el script buggy)

- Requests a `/api/...` devuelven **404 Not Found** (la ruta correcta no lleva `/api`).
- `check 'projects status 200'` y `'tasks status 200'` **fallan** (status ≠ 200).
- `projectId` queda **undefined** → el paso de tareas pega a `/projects/undefined/tasks`.
- `error_rate` muy por encima del SLO.

### 1.3 — Los tres bugs del script

| Descripción del problema | Línea(s) afectada(s) |
|---|---|
| **Bug 1 — URL:** todas las URLs usaban el prefijo `/api`, que no existe en esta API. **Fix:** usar `/auth/register`, `/projects`, `/projects/:id/tasks` (sin `/api`). | todas las llamadas `http.*` |
| **Bug 2 — Login:** el `default function` (VU) hacía un login aparte con credenciales hardcodeadas en vez de usar el token de `setup()`. **Fix:** el VU usa `data.token` en los headers. | `default function` (headers) |
| **Bug 3 — Datos:** `setup()` registraba un usuario nuevo sin proyectos, así que `GET /projects` devolvía `[]` y `projectId` era `undefined`. **Fix:** `setup()` crea proyecto (`POST /projects`) y tarea (`POST /projects/:id/tasks`) y retorna `{ token, projectId }`. | `setup()` |

### 1.4 — Corrección aplicada

El script del repo ya implementa las tres correcciones: URLs correctas, el VU usa `data.token`,
y `setup()` registra usuario → crea proyecto → crea tarea → retorna `{ token, projectId }`.

### 1.5 — Verificación del smoke test (1 VU, 15s) ✅

```
✓ login status 200        ✓ projects status 200       ✓ tasks status 200
✓ error_rate          rate=0.00%
✓ http_req_duration   p(95)=443.54ms (<500)   p(99)=743.81ms (<1000)
✓ list_duration       p(95)=14.8ms            ✓ tasks_duration p(95)=12.56ms
checks 100.00% (25/25)
```
**error_rate = 0.00% → criterio de aprobación cumplido.**

---

## PARTE 2 — Load test con thresholds (SLOs)

### 2.2 — Métricas del reporte (50 VUs, 90s)

| Métrica | Valor obtenido | Threshold (SLO) | ¿Cumple? |
|---|---|---|:---:|
| http_req_duration p95 | 62.05 ms | < 500 ms | **SÍ** |
| http_req_duration p99 | 120.87 ms | < 1000 ms | **SÍ** |
| error_rate | 0.00% | < 1% | **SÍ** |
| list_duration p95 | 54.48 ms | < 400 ms | **SÍ** |
| tasks_duration p95 | 67.29 ms | < 400 ms | **SÍ** |
| throughput (http_reqs/s) | 72.52 req/s | — | — |

### 2.3 — Análisis del reporte

**1. ¿En qué orden leyeron las métricas? ¿Qué concluyen primero?**
Primero **error_rate** (0.00% → el sistema responde correctamente, no hay fallas funcionales);
luego los **percentiles** (p95=62ms, muy por debajo del SLO de 500ms → latencia holgada); por
último el **throughput** (72.5 req/s). Conclusión primaria: bajo carga normal el sistema **cumple
todos los SLOs con amplio margen**.

**2. Si algún threshold falló, describir el síntoma.**
En el load test **ningún threshold falló** (todas las líneas en verde, exit code 0). No hay síntoma
que reportar en esta fase.

**3. ¿El throughput se aplanó antes de los 50 VUs o creció linealmente?**
Creció de forma **lineal/proporcional**: con ~1.34s por iteración y 2 requests por iteración,
50 VUs ≈ 37 iter/s ≈ 72-74 req/s, que es justo lo medido. Que el throughput escale con los VUs
(sin aplanarse) indica que a 50 VUs el sistema **todavía no está saturado**.

---

## PARTE 3 — Scenario spike (200 VUs)

### 3.2 — Comparativa Load vs Spike

| Métrica | Load (50 VUs) | Spike (200 VUs) |
|---|---|---|
| p95 total | 62.05 ms | 368.47 ms |
| p99 total | 120.87 ms | 443.53 ms |
| error_rate | 0.00% | 0.00% |
| tasks_duration p95 | 67.29 ms | **412.87 ms** (❌ supera 400) |

(Datos completos en `performance/resultados-clase9.md`. Throughput spike: 246.95 req/s.)

### 3.3 — Preguntas de análisis

**1. ¿A qué modo de falla corresponde?**
**"Slow under heavy load"** (lento bajo carga pesada). El sistema **responde sin errores** (0%) tanto
en load como en spike, pero la **latencia se degrada** bajo el pico: `tasks_duration` p95 cruza el SLO
(412.87 ms > 400 ms) solo durante el spike, no en carga normal.

**2. ¿El sistema se recuperó cuando la carga volvió a 0?**
Sí. Se verifica en el reporte de k6 observando que (a) **no hay iteraciones interrumpidas**, (b)
`http_req_failed` se mantiene en 0% durante todo el run, y (c) en el scenario `spike` real (con stage
final `target: 0`) las latencias vuelven al baseline en la fase de ramp-down — la curva temporal de
`http_req_duration` baja al soltar la carga.

**3. ¿Qué threshold p95 elegirían para el spike? Justificar.**
Un umbral **más laxo que el del load**, por ejemplo `p(95) < 800 ms` (o `< 1000 ms`). Un spike es un
evento **transitorio**: aceptamos degradación temporal mientras **no haya errores** y el sistema se
recupere. El SLO estricto de 400 ms aplica a **carga sostenida** (load), no a un pico súbito.

---

## PARTE 4 — Diagnosticar el bug de performance

### 4.1 — Observación del síntoma

`list_duration` p95 pasa de **54.48 ms (load)** a **309.80 ms (spike)**: aumento de **+255 ms (≈+469%, 5.7×)**
con solo **4× de VUs**. El deterioro es **supra-lineal** → mayor al esperable por la diferencia de carga.

### 4.2 — Causa en el código (`project.service.ts` → `listProjects`)

**1. ¿Qué condición de filtro falta?** Falta `archived: false` en el `where` de la query Prisma
(está omitida a propósito — BUG-06).

**2. ¿Qué impacto tiene?** Sin ese filtro, la query devuelve **todos** los proyectos del usuario,
incluidos los **archivados**. Cuantos más proyectos archivados haya en la base, más filas se leen,
serializan y transfieren — y ese costo se amplifica bajo concurrencia (spike).

**3. Tabla de diagnóstico:**

| Campo | Respuesta |
|---|---|
| Síntoma observable | `list_duration` p95 se degrada de forma desproporcionada bajo spike (5.7× con 4× de carga) |
| Causa probable | `listProjects` no filtra `archived: false` → lee/retorna filas de más |
| Dónde mirarían para confirmar | `project.service.ts` (`where` de `listProjects`) + plan de la query / logs SQL de Prisma |
| Tipo de falla (ISTQB §1.5) | Un **defecto (defect)** en el código que se manifiesta como **falla** de performance bajo carga |

### 4.3 — Corrección propuesta

```typescript
// Dentro del where: { ... } de listProjects:
archived: false,
```

**Justificación:** restringe la consulta a proyectos activos, reduciendo las filas leídas y por
ende la latencia bajo carga, y a la vez corrige la correctitud (no se deben listar los archivados).

---

## Cierre — Conexión con CI/CD

El workflow `nightly.yml` ya define el job de k6: **smoke en cada PR** (bloquea merge si falla),
**load en merge a main** (vs baseline) y **spike + load nightly** (artifact, no bloquea).
Para el **Hito 6** se reutiliza este script agregando scenario + threshold específicos para
`POST /projects/:id/tasks` con SLO p95 < 500 ms.

---

## Criterio de aprobación

| Criterio | Estado |
|---|:---:|
| Smoke del script corregido pasa con 0% error rate | ✅ (verificado, real) |
| Los 3 bugs (1.3) descriptos correctamente | ✅ |
| Preguntas de análisis Parte 3 y Parte 4 respondidas | ✅ |
| `performance/resultados-clase9.md` con tablas load + spike | ✅ |
