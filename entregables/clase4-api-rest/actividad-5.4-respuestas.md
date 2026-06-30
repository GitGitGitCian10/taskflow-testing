# Actividad 5.4 — Análisis de la salida de Newman

**Clase 4 · Módulo 2 — Testing de APIs REST**
Integrantes: Santiago Aurrecochea · Ignacio Villarreal
Colección: `taskflow-api.collection.json` · Environment: `taskflow-local.env.json`

Corrida de referencia:

```
┌─────────────────────────┬──────────┬──────────┐
│                         │ executed │  failed  │
├─────────────────────────┼──────────┼──────────┤
│ iterations              │    1     │    0     │
│ requests                │   10     │    0     │
│ test-scripts            │   10     │    0     │
│ assertions              │   20     │    0     │
└─────────────────────────┴──────────┴──────────┘
```

---

## 1. ¿Cuántos assertions ejecutó en total?

**20 assertions** (2 `pm.test` por request × 10 requests), distribuidas así:

| Carpeta | Requests | Assertions |
|---|---|---|
| Autenticación | 4 (register, login, login inválido, email no registrado) | 8 |
| Proyectos | 1 (crear proyecto) | 2 |
| Tareas | 5 (crear tarea + 4 transiciones de estado) | 10 |
| **Total** | **10** | **20** |

---

## 2. ¿Alguno falló? ¿Por qué?

**No, los 20 assertions pasaron (0 failed).** El run terminó con *exit code 0*.

Esto se debe a que:
- La API estaba corriendo en `localhost:3001` (el `base_url` del environment).
- El flujo encadenado funcionó: el login guardó el `token` con `pm.environment.set('token', ...)`, y crear el proyecto/tarea guardó `project_id` y `task_id`, que los requests siguientes reutilizan vía `{{token}}`, `{{project_id}}` y `{{task_id}}`.

> Si alguno hubiera fallado, las causas típicas serían: la API apagada o en otro puerto, datos de semilla ausentes, un token expirado, o un orden de ejecución que rompa el encadenado de variables (p. ej. crear la tarea antes de capturar `project_id`).

---

## 3. Diferencia entre una *assertion fallida* y un *error de red*

| | Assertion fallida | Error de red |
|---|---|---|
| **Qué pasó** | El request **sí llegó** y devolvió una respuesta, pero no cumple lo esperado (p. ej. status 500 cuando se esperaba 201) | El request **nunca obtuvo respuesta** (host caído, DNS, timeout, conexión rechazada `ECONNREFUSED`) |
| **Dónde aparece en Newman** | Columna `assertions → failed`; el request se marca como ejecutado | Columna de error del request; el `test-script` ni siquiera corre porque no hay `pm.response` |
| **Qué indica** | Un **defecto funcional** de la API (el comportamiento no coincide con el CA) | Un **problema de entorno/infraestructura**, no necesariamente un bug del código |
| **Cómo se diagnostica** | Mirar response body/status real vs esperado | Verificar que la API esté levantada y el `base_url`/puerto sean correctos |

En resumen: una **assertion fallida** dice *"la API respondió mal"*; un **error de red** dice *"no pude hablar con la API"*. Ambos hacen que Newman devuelva *exit code 1* (útil para que el pipeline de CI falle), pero el origen del problema es distinto.

---

## 4. Criterios de aceptación que todavía NO tienen cobertura

La colección cubre **US-01, US-02, US-03, US-05 y US-06**. Quedan sin cubrir:

| US | Criterio de aceptación sin cobertura | Endpoint |
|---|---|---|
| US-01 | Registro rechaza password < 8 chars → 400 (solo está el happy path) | `POST /auth/register` |
| US-04 | Listar proyectos del usuario autenticado | `GET /projects` |
| US-05 | Crear tarea con `title` vacío → 400 (solo está el happy path) | `POST /projects/:projectId/tasks` |
| US-07 | Filtrar tareas por estado/prioridad/búsqueda | `GET /projects/:projectId/tasks` |
| US-08 | Comentar en una tarea (la carpeta *Comentarios* está vacía) | `POST /projects/:projectId/tasks/:taskId/comments` |

> Nota: algunos casos negativos (password corta, título vacío) **sí** están cubiertos a nivel **Supertest** (`apps/api/tests/integration/`), pero faltan como requests en la colección Postman.
