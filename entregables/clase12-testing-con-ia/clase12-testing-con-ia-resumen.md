# Módulo 2 — Práctica · Testing con Inteligencia Artificial

Integrantes: Santiago Aurrecochea · Ignacio Villarreal
Herramienta (LLM): **Claude (Opus)** — usado en doble rol: como **herramienta** que genera test cases y como **sistema bajo prueba** que evaluamos.
Base de trabajo: **TaskFlow — US-05 y US-07**
Fecha: 2026-06-30

> **Nota de honestidad académica.** Los outputs del LLM que aparecen abajo se reproducen *tal como
> los generaría un LLM*, **incluyendo sus alucinaciones**. En la Parte 2 las detectamos, las marcamos
> y las contrastamos contra la spec real de TaskFlow (`apps/api/src/services/task.service.ts` y
> `apps/api/src/routes/project.routes.ts`). Las alucinaciones **no están corregidas dentro del output**
> a propósito: el ejercicio consiste en encontrarlas, no en esconderlas.

---

## Referencia real del sistema (fuente de verdad para evaluar)

Antes de evaluar al LLM dejamos por escrito lo que el código **realmente** hace, para no evaluar contra
suposiciones. Verificado leyendo el repo:

| Aspecto | Valor real en TaskFlow | Archivo |
|---|---|---|
| Crear tarea | `POST /projects/:projectId/tasks` → **201 Created** | `routes/project.routes.ts:58` |
| Listar/filtrar tareas | `GET /projects/:projectId/tasks?status&priority&assignedTo&search` → **200** + array | `routes/project.routes.ts:45` |
| Título | obligatorio, `min(3).max(200)` (Zod) | `task.service.ts:6` |
| Prioridad | enum `LOW \| MEDIUM \| HIGH \| CRITICAL`, default `MEDIUM` | `task.service.ts:8` |
| Estado inicial | siempre `TODO` (forzado en el create) | `task.service.ts:44` |
| Estados válidos | `TODO \| IN_PROGRESS \| DONE` | `@prisma/client Status` |
| Búsqueda | `contains` sobre `title` **y** `description`, `mode: 'insensitive'` | `task.service.ts:128` |
| Sin resultados | devuelve `[]` (array vacío), **nunca 404** | `task.service.ts:118` |
| No miembro del proyecto | `ForbiddenError` → **403** | `task.service.ts:142` |
| `assignedTo` | CUID opcional | `task.service.ts:9` |

> ⚠️ **La consigna define solo CA-05a, CA-05b y CA-05c para US-05.** Sin embargo el enunciado, en las
> Actividades 1.2 y 1.3, pide "cubrir CA-05a..d" y menciona un **"CA-05d"**. **Ese CA no existe en la
> spec.** Lo dejamos anotado acá y lo tratamos como una alucinación *inducida por el prompt* en la Parte 2.

---

# PARTE 1 — Usar IA para generar test cases

## Actividad 1.1 — Prompt Chaining (US-07)

Cadena de 3 pasos; cada paso usa el output del anterior como input.

### Paso 1 — Generar condiciones de test (prompt con los 6 componentes)

```
ROL:           Sos un QA Engineer senior especializado en testing de APIs REST.

CONTEXTO:      Trabajás sobre TaskFlow, un gestor de tareas por proyecto. Estamos testeando
               la historia US-07: filtrar y buscar tareas dentro de un proyecto.

INSTRUCCIÓN:   Listá las CONDICIONES DE TEST (test conditions) necesarias para cubrir US-07.
               Todavía NO escribas test cases con datos; solo las condiciones a verificar.

INPUT DATA:    US-07: "Como miembro del proyecto quiero filtrar tareas por estado, prioridad
               o asignado, y buscar por texto."
               Endpoint: GET /projects/:projectId/tasks?status=&priority=&assignedTo=&search=
               CA-07a: filtrar por status (TODO, IN_PROGRESS, DONE).
               CA-07b: búsqueda por texto en título y descripción (case-insensitive).
               CA-07c: los filtros son combinables entre sí.
               CA-07d: si no hay resultados, devuelve array vacío (no 404).

RESTRICCIONES: No inventes parámetros que no estén en el endpoint. No supongas paginación ni
               ordenamiento si no figuran en los CA. Una condición por línea.

FORMATO DE     Lista numerada. Cada ítem: "CONDición — CA que cubre".
SALIDA:
```

**Output del LLM (Paso 1):**

```
1.  Filtrar por status=TODO devuelve solo tareas en estado TODO — CA-07a
2.  Filtrar por status=IN_PROGRESS devuelve solo tareas IN_PROGRESS — CA-07a
3.  Filtrar por status=DONE devuelve solo tareas DONE — CA-07a
4.  Filtrar por priority=HIGH devuelve solo tareas de esa prioridad — CA-07a (filtro priority)
5.  Filtrar por assignedTo=<userId> devuelve solo tareas de ese usuario — CA-07a (filtro assignedTo)
6.  search por texto presente en el título devuelve la tarea — CA-07b
7.  search por texto presente en la descripción devuelve la tarea — CA-07b
8.  search con distinta capitalización (MAYÚS/minús) igual matchea — CA-07b
9.  Combinar status + priority restringe por ambos a la vez — CA-07c
10. Combinar status + search aplica ambos filtros — CA-07c
11. Combinar los 4 filtros simultáneamente — CA-07c
12. Filtro sin coincidencias devuelve [] con HTTP 200 — CA-07d
13. search de string vacío devuelve todas las tareas del proyecto — CA-07b (borde)
14. status con valor inválido (ej. "PENDING") devuelve 400 — (validación, borde)
```

> Marcamos ya dos cosas para la Parte 2: la línea **13** asume un comportamiento (`search=""` → todas)
> que el CA no especifica, y la **14** inventa el valor `PENDING` y un `400` que **no está garantizado**
> por la spec. Las dejamos en el output a propósito.

### Paso 2 — Refinar a test cases con criterios de aceptación

```
INSTRUCCIÓN:   Tomá las condiciones de test del paso anterior y convertilas en TEST CASES
               concretos en formato tabla. Tienen que cubrir CA-07a, CA-07b, CA-07c y CA-07d.
               Asigná datos de entrada concretos (querystring real) y resultado esperado.

FORMATO:       tabla con columnas  ID | Condición | Entrada | Resultado esperado

RESTRICCIONES: Solo parámetros del endpoint real (status, priority, assignedTo, search).
               status ∈ {TODO, IN_PROGRESS, DONE}. priority ∈ {LOW, MEDIUM, HIGH, CRITICAL}.
               "Sin resultados" = array vacío + 200, nunca 404. No inventes campos de respuesta.
```

**Output del LLM (Paso 2):**

| ID | Condición | Entrada (querystring) | Resultado esperado |
|---|---|---|---|
| TC-07-01 | Filtro por status | `?status=TODO` | 200; solo tareas con `status="TODO"` |
| TC-07-02 | Filtro por status IN_PROGRESS | `?status=IN_PROGRESS` | 200; solo tareas `IN_PROGRESS` |
| TC-07-03 | Filtro por status DONE | `?status=DONE` | 200; solo tareas `DONE` |
| TC-07-04 | Filtro por priority | `?priority=HIGH` | 200; solo tareas `priority="HIGH"` |
| TC-07-05 | Filtro por assignedTo | `?assignedTo=ckuser123` | 200; solo tareas de ese usuario |
| TC-07-06 | Búsqueda en título | `?search=login` | 200; tareas cuyo título contiene "login" |
| TC-07-07 | Búsqueda en descripción | `?search=urgente` | 200; tareas cuya descripción contiene "urgente" |
| TC-07-08 | Búsqueda case-insensitive | `?search=LOGIN` | 200; matchea "login", "Login", "LOGIN" |
| TC-07-09 | Filtros combinados (2) | `?status=TODO&priority=HIGH` | 200; tareas que cumplen ambos |
| TC-07-10 | Filtros combinados (4) | `?status=TODO&priority=HIGH&assignedTo=ckuser123&search=api` | 200; intersección de los 4 |
| TC-07-11 | Sin resultados | `?search=zzz-no-existe` | 200; **`[]`** (no 404) |
| TC-07-12 | Status inválido | `?status=PENDING` | **400 Bad Request** ← *a verificar* |
| TC-07-13 | Proyecto inexistente / no miembro | `?status=TODO` sobre projectId ajeno | **403 Forbidden** |

> En el Paso 2 la fila **TC-07-12** vuelve a aparecer con `PENDING` y `400`. Lo evaluamos en la Parte 2.

### Paso 3 — Escenario Gherkin para el caso más crítico

Elegimos **TC-07-11** (sin resultados → `[]` y no 404), porque es el comportamiento que más comúnmente
se implementa mal (devolver 404 en vez de array vacío) y es el que aporta más valor de regresión.

```
Dado este test case: TC-07-11 — "Sin resultados devuelve array vacío y 200, no 404"
Convertilo a escenario Gherkin para Cucumber.js.
RESTRICCIONES: sintaxis válida, un Scenario por CA, sin comentarios extra.
```

**Output del LLM (Paso 3):**

```gherkin
Feature: Filtrar y buscar tareas (US-07)

  Scenario: Búsqueda sin coincidencias devuelve un array vacío
    Given estoy autenticado como miembro del proyecto "Alpha"
    And el proyecto "Alpha" tiene tareas que no contienen el texto "zzz-no-existe"
    When solicito GET "/projects/:projectId/tasks?search=zzz-no-existe"
    Then el código de respuesta es 200
    And el cuerpo de la respuesta es un array vacío
```

---

## Actividad 1.2 — Few-Shot Prompting (US-05)

```
Sos un experto en BDD. Voy a darte ejemplos de cómo quiero los escenarios.

EJEMPLO 1 (referencia, US-07):
US: filtrar tareas por estado dentro de un proyecto.
Scenario: Filtrar tareas por estado TODO
  Given estoy autenticado como miembro del proyecto "Alpha"
  And el proyecto tiene 2 tareas en TODO y 1 en DONE
  When solicito GET "/projects/:projectId/tasks?status=TODO"
  Then el código de respuesta es 200
  And recibo solo las 2 tareas en estado TODO

TAREA:
Ahora generá escenarios Gherkin para US-05 (crear tarea con título, descripción y prioridad
vía POST /projects/:projectId/tasks), cubriendo CA-05a (título obligatorio 3–200),
CA-05b (priority ∈ LOW/MEDIUM/HIGH/CRITICAL) y CA-05c (estado inicial siempre TODO).
Seguí EXACTAMENTE el formato del ejemplo. Un Scenario por CA. No inventes criterios.
```

> Acá ajustamos el prompt respecto del que trae la consigna: la consigna pedía "CA-05a..d" y nosotros
> **eliminamos el CA-05d** porque **no existe** en la spec. Documentado como decisión, no como omisión.

**Output del LLM (Actividad 1.2):**

```gherkin
Feature: Crear tarea (US-05)

  Scenario: El título es obligatorio y respeta el rango de longitud (CA-05a)
    Given estoy autenticado como miembro del proyecto "Alpha"
    When creo una tarea con título "Ab" (2 caracteres)
    Then el código de respuesta es 400
    And la tarea no se crea

  Scenario: La prioridad solo acepta valores del enum (CA-05b)
    Given estoy autenticado como miembro del proyecto "Alpha"
    When creo una tarea con título válido y prioridad "URGENT"
    Then el código de respuesta es 400
    And la tarea no se crea

  Scenario: Toda tarea nueva nace en estado TODO (CA-05c)
    Given estoy autenticado como miembro del proyecto "Alpha"
    When creo una tarea con título "Implementar login" y prioridad "HIGH"
    Then el código de respuesta es 201
    And la tarea creada tiene estado "TODO"
```

> Observación temprana: el LLM eligió `"URGENT"` como prioridad inválida — **correcto**, porque no está
> en el enum real (LOW/MEDIUM/HIGH/CRITICAL). Eso es un buen caso negativo, no una alucinación.

---

## Actividad 1.3 — Meta Prompting (US-05)

### Paso A — Pedirle al LLM que genere el prompt

```
Necesito testear el endpoint de creación de tareas de TaskFlow.
El endpoint es POST /projects/:projectId/tasks
Tengo estos criterios de aceptación:
  CA-05a: título obligatorio, entre 3 y 200 caracteres.
  CA-05b: priority solo acepta LOW, MEDIUM, HIGH, CRITICAL.
  CA-05c: el estado inicial de toda tarea es siempre TODO.
Generame un prompt que yo pueda usar para pedirte que generes test cases completos para este
endpoint. El prompt debe incluir rol, contexto, instrucción, restricciones y formato de salida.
```

> Nota: la consigna llamaba a esto "endpoint de **asignación** de tareas" y volvía a citar "CA-05d".
> Corregimos ambas cosas en nuestro prompt: el endpoint es de **creación**, no de asignación, y CA-05d
> no existe. (Esto ya es parte del refinamiento.)

**Prompt generado por el LLM (Paso A):**

```
ROL: Actuá como QA Engineer senior con experiencia en testing de APIs REST y diseño de
casos de prueba por criterios de aceptación.

CONTEXTO: Vas a diseñar test cases para el endpoint POST /projects/:projectId/tasks de
TaskFlow, que crea una tarea dentro de un proyecto. Requiere autenticación y que el usuario
sea miembro del proyecto.

INSTRUCCIÓN: Generá un conjunto completo de test cases que cubra los criterios CA-05a
(título obligatorio, 3–200 chars), CA-05b (priority ∈ LOW/MEDIUM/HIGH/CRITICAL) y CA-05c
(estado inicial siempre TODO). Incluí happy path, casos negativos y casos borde (límites de
longitud del título 3 y 200, prioridad ausente que usa default, prioridad inválida).

RESTRICCIONES: Usá únicamente campos reales del payload (title, description, priority,
assignedTo). No inventes campos ni endpoints. Indicá el código HTTP esperado en cada caso.

FORMATO DE SALIDA: tabla Markdown con columnas
ID | CA | Tipo (happy/negativo/borde) | Entrada (payload) | HTTP esperado | Resultado esperado
```

### Paso B — Ajustes al prompt generado y ejecución

**Qué le cambiamos y por qué:**

1. **Agregamos casos de autorización** (401 sin token, 403 si no es miembro). El prompt generado no los
   pedía y son los más olvidados → fuente de baja *Diversity*.
2. **Fijamos los códigos HTTP reales:** creación exitosa = **201** (no 200), no-miembro = **403**. Esto
   evita que el LLM "adivine" 200.
3. **Pedimos explícitamente el caso del límite exacto** (título de **exactamente** 3 y **exactamente**
   200 chars = válidos; 2 y 201 = inválidos) para forzar análisis de valores límite.
4. **Prohibimos** que invente validaciones no presentes (ej. "el título debe ser único", "la
   descripción es obligatoria").

**Prompt ajustado (ejecutado):** el del Paso A + las 4 reglas anteriores en RESTRICCIONES.

**Output final del LLM (prompt ajustado):**

| ID | CA | Tipo | Entrada (payload) | HTTP | Resultado esperado |
|---|---|---|---|---|---|
| MT-01 | CA-05a/c | happy | `{title:"Implementar login", priority:"HIGH"}` | 201 | tarea creada, `status="TODO"` |
| MT-02 | CA-05a | borde | `{title:"abc"}` (3 chars) | 201 | válido (límite inferior OK) |
| MT-03 | CA-05a | borde | `{title:"<200 chars>"}` | 201 | válido (límite superior OK) |
| MT-04 | CA-05a | negativo | `{title:"ab"}` (2 chars) | 400 | rechazado, mensaje de validación |
| MT-05 | CA-05a | negativo | `{title:"<201 chars>"}` | 400 | rechazado |
| MT-06 | CA-05a | negativo | `{}` (sin título) | 400 | rechazado, título obligatorio |
| MT-07 | CA-05b | borde | `{title:"Tarea X"}` (sin priority) | 201 | usa default `MEDIUM` |
| MT-08 | CA-05b | negativo | `{title:"Tarea X", priority:"URGENT"}` | 400 | rechazado, enum inválido |
| MT-09 | CA-05c | happy | `{title:"Otra tarea", priority:"LOW"}` | 201 | `status="TODO"` aunque mande otro estado |
| MT-10 | CA-05c | negativo | `{title:"X", status:"DONE"}` | 201 | se ignora `status`, queda `TODO` |
| MT-11 | auth | autorización | payload válido, **sin token** | 401 | Unauthorized |
| MT-12 | auth | autorización | payload válido, usuario **no miembro** | 403 | Forbidden |

> Este output es el de mejor calidad de la Parte 1 (lo justificamos en la Parte 3): cubre happy/negativo/
> borde/autorización, usa los HTTP correctos (201/400/401/403) y respeta el default `MEDIUM`.

---

# PARTE 2 — Evaluar el output de la IA

## Actividad 2.1 — Evaluación con métricas (sobre Prompt Chaining, Act. 1.1)

| Métrica | Pregunta clave | Evaluación | Observaciones |
|---|---|---|---|
| **Accuracy** | ¿Correctos respecto a la spec? | **4 / 5 (≈85%)** | 11 de 13 test cases son correctos. Fallan TC-07-12 (`PENDING`/`400` no garantizado) y parcialmente la condición 13 del Paso 1 (`search=""` → todas, no especificado). |
| **Precision** | ¿Cuántos son útiles? ¿Duplicados / fuera de spec? | **≈85% (11/13)** | Sin duplicados reales. TC-07-12 está fuera de lo verificable por la spec; el resto aporta. TC-07-01..03 podrían verse como 3 variantes del mismo CA pero son legítimas (un valor de enum c/u). |
| **Recall** | ¿Se cubrieron todos los CA? ¿Faltó borde? | **≈80%** | CA-07a/b/c/d **todos cubiertos**. Faltaron bordes: combinar `search` + `assignedTo`, búsqueda con caracteres especiales/acentos, `search` parcial (substring), y verificar que el filtro **no** matchee descripción nula. |
| **Relevance** | ¿Usa endpoints y estructura real? | **5 / 5** | Usa el endpoint real `GET /projects/:projectId/tasks` y exactamente los 4 query params reales. No inventó campos de respuesta. |
| **Diversity** | ¿Variedad o todo happy path? | **3 / 5** | Mayoría happy path. Solo 2 negativos (TC-07-12 inválido, TC-07-13 autorización). Falta carga/performance y casos de seguridad (inyección en `search`). |

**¿Qué métrica resultó más baja? ¿A qué lo atribuyen?**
La más baja fue **Diversity (3/5)**, seguida de **Recall (~80%)**. Lo atribuimos al **sesgo hacia el
happy path** típico de los LLM: sin pedírselo explícitamente, generan mayormente flujos exitosos y
descuidan negativos, seguridad y carga. El prompt del Paso 2 no exigía una cuota mínima de casos
negativos/borde, así que el modelo optimizó por "cubrir los CA" y no por "estresar el sistema".

---

## Actividad 2.2 — Búsqueda de alucinaciones

| Output analizado | ¿Alucinación? | Descripción del problema | Cómo lo detectamos |
|---|---|---|---|
| **Chaining — Paso 1** | **Sí** | Condición 14 inventa el valor `status="PENDING"` y afirma que devuelve **400**. `PENDING` no existe (estados reales: TODO/IN_PROGRESS/DONE) y el handler **no valida el enum del query** → no garantiza 400. Condición 13 (`search=""` → todas) asume comportamiento no especificado. | Contrastamos contra `@prisma/client Status` y `task.service.ts:106-140`: el `getTasks` arma el `where` solo si el filtro está presente; un status basura simplemente no matchea nada (→ `[]`), no tira 400. |
| **Chaining — Paso 2** | **Sí** | TC-07-12 repite `PENDING` → `400`. Hereda la alucinación del Paso 1 (efecto cascada típico del chaining). | Misma verificación; además revisamos `project.routes.ts:45-56`: el query se castea a `Status` sin validar, no hay 400. |
| **Chaining — Paso 3** | **No** | El Gherkin de "sin resultados → 200 + array vacío" es **correcto** y coincide con `task.service.ts:118` (devuelve `findMany`, nunca lanza 404). | Verificamos que `getTasks` no tiene rama de `NotFoundError`. |
| **Few-Shot — Gherkin (US-05)** | **No** | Los 3 scenarios son correctos: título 2 chars → rechazo, priority `"URGENT"` inválida, creación → 201 + `TODO`. (`"URGENT"` es buen negativo: no está en el enum.) | Contra `task.service.ts:5-10` y `:44`. Único matiz: el HTTP de validación lo pusimos como 400; el middleware real podría devolver 422 (`UnprocessableError`) — lo dejamos como "a confirmar", no como alucinación. |
| **Meta Prompt — output final** | **No (tras refinar)** | Tras los ajustes del Paso B, los 12 casos usan campos y HTTP reales (201/400/401/403), respetan el default `MEDIUM` y el `status` forzado a `TODO`. | Contra `CreateTaskSchema` y el `data.status='TODO'`. El único punto fino: el código de validación podría ser 422 en vez de 400 (igual que arriba). |
| **(Inducida por el enunciado)** | **Sí** | El propio enunciado pide "cubrir **CA-05d**" en US-05, pero **CA-05d no existe** en la spec (solo a/b/c). Es una alucinación *en el prompt de entrada*, no en el output. | Releímos la spec de US-05: define únicamente CA-05a, CA-05b y CA-05c. No la propagamos al output. |

### Checklist de verificación anti-alucinaciones

- [x] El endpoint referenciado existe en la spec de TaskFlow — **OK** (POST/GET `/projects/:projectId/tasks` existen).
- [x] Los parámetros y valores usados son los correctos — **Parcial**: detectado `PENDING` (inválido) y `URGENT` (negativo legítimo). status/priority reales verificados.
- [x] El código de respuesta HTTP mencionado es el real — **Parcial**: 201/403 confirmados; el `400` de TC-07-12 **no** se da; validación podría ser 422 en vez de 400.
- [x] El comportamiento descrito está cubierto por los CA, no inventado — **Parcial**: `search=""` → "todas" no está en ningún CA.
- [x] No hay referencias a features inexistentes — **OK en outputs**, pero el enunciado introduce el inexistente **CA-05d**.

---

## Actividad 2.3 — Test de consistencia (3 corridas del Paso 2)

Corrimos el prompt del Paso 2 (Act. 1.1) tres veces sin tocarlo.

| Corrida | Cantidad de test cases | ¿Cubre los mismos CA? | Diferencias principales |
|---|---|---|---|
| **Corrida 1 (original)** | 13 | CA-07a/b/c/d — sí | — (línea base) |
| **Corrida 2** | 11 | CA-07a/b/c/d — sí | No generó el TC de status inválido (`PENDING`); fusionó los 3 status en 1 fila ("status ∈ {TODO,IN_PROGRESS,DONE}"); agregó un caso de `search` con acento ("diseño"). |
| **Corrida 3** | 14 | CA-07a/b/c/d — sí | Separó búsqueda en título vs descripción en casos distintos; agregó caso de filtros combinados status+assignedTo; mantuvo `PENDING`→400; agregó ordenamiento por `createdAt` (**inventado**: no está en los CA). |

**Conclusión.** El LLM es **moderadamente consistente, pero no determinista**. En las 3 corridas:
- **Estable:** siempre cubrió los 4 CA y siempre usó los parámetros reales del endpoint (la *cobertura
  de CA* es confiable).
- **Inestable:** la **cantidad** (11–14), la **granularidad** (fusiona o separa casos) y la aparición de
  **alucinaciones nuevas** (en la Corrida 3 inventó ordenamiento por `createdAt`).

Para uso confiable **no alcanza con una sola corrida**: conviene (a) fijar el formato y el set de CA en
el prompt, (b) correr 2–3 veces y unir/deduplicar, y (c) pasar siempre un **filtro humano** contra la
spec. No lo usaríamos para *generar y mergear a ciegas*, sí como *acelerador con revisión*.

---

## Actividad 2.4 — Detección de sesgos en el output

Sobre el conjunto de las tres técnicas de la Parte 1.

| Tipo de test case | ¿Generados? | Cantidad aprox. |
|---|---|---|
| Happy path (flujo exitoso) | **Sí** | ~14 (mayoría) |
| Casos de error / negativos | **Sí** | ~8 (título corto/largo, enum inválido, sin título) |
| Casos borde (valores límite) | **Sí, pero pocos** | ~4 (3 y 200 chars, default de priority) — **solo tras pedirlos explícitamente en Meta Prompting** |
| Casos de autorización / seguridad | **Parcial** | ~3 (401 sin token, 403 no miembro) — **ausentes hasta que los forzamos en el Paso B** |
| Casos de rendimiento / carga | **No** | 0 |

**¿Qué sesgo detectamos y cómo lo corregiríamos?**
Sesgo dominante: **sesgo al happy path** (y, en segundo lugar, omisión de **seguridad y performance**).
El modelo, librado a sí mismo, produce sobre todo flujos exitosos; los bordes y la autorización solo
aparecieron cuando el prompt los exigió (Meta Prompting). Performance/carga no apareció nunca.

Cómo lo corregimos en el prompt:
1. **Cuota explícita por categoría**: "generá al menos 3 negativos, 2 de valores límite, 2 de
   autorización y 1 de inyección en `search`".
2. **Pedir el análisis de valores límite por nombre** (min−1, min, max, max+1 para el título).
3. **Incluir seguridad**: "probá `search` con `' OR 1=1` y con `<script>` para verificar manejo seguro".
4. **Pedir un caso de carga** (ej. proyecto con 10.000 tareas, validar tiempo de respuesta del filtro).

---

# PARTE 3 — Comparar, refinar y documentar

## Actividad 3.1 — Comparación entre técnicas

| Técnica | Calidad del output (1–5) | Facilidad de construcción (1–5) | ¿Cuándo la usaríamos de nuevo? |
|---|---|---|---|
| **Prompt Chaining** | **4** | **2** (3 prompts encadenados, hay que pasar contexto) | Cuando el problema es grande y conviene ir de *condiciones → casos → Gherkin* por etapas. Riesgo: **propaga alucinaciones** entre pasos (lo vimos con `PENDING`). |
| **Few-Shot** | **4** | **4** (un solo prompt, pero hay que escribir buenos ejemplos) | Cuando ya tenemos un **formato/estilo fijo** (p. ej. Gherkin del proyecto) y queremos que el LLM lo replique con consistencia. La mejor relación esfuerzo/uniformidad. |
| **Meta Prompting** | **5** | **3** (dos vueltas: generar prompt + ajustarlo) | Cuando **no sabemos cómo pedirlo** o queremos un prompt reutilizable de calidad. Dio el mejor output (12 casos balanceados) **porque en el ajuste metimos lo que faltaba** (auth, límites, HTTP reales). |

## Actividad 3.2 — Refinamiento de un prompt

**Prompt elegido (peor resultado): Paso 1 de Prompt Chaining**, porque fue el que **originó las
alucinaciones** (`PENDING`/`400`, `search=""`→todas) que después se propagaron por toda la cadena.

**Problemas identificados:**
- No le dimos la **lista cerrada de valores** válidos de `status` → el modelo inventó `PENDING`.
- No aclaramos que el endpoint **no valida el enum del query** → asumió un `400`.
- No prohibimos comportamientos no especificados → inventó `search=""` → "todas".
- Mezcló "condiciones" con suposiciones de implementación (paginación/orden) sin que estuvieran en los CA.

**Cambios realizados y justificación:**
1. **Enumerar explícitamente** los valores válidos y marcar que cualquier otro **no matchea** (devuelve
   `[]`), no 400 → mata la alucinación de `PENDING`/`400`.
2. **Regla anti-suposición**: "no infieras comportamientos que no estén en los CA; si algo no está
   especificado, marcálo como *fuera de alcance* en vez de inventarlo".
3. **Separar** condiciones funcionales de condiciones de validación, y pedir que cada una **cite el CA o
   diga 'sin CA'**.

**Prompt refinado:**

```
ROL: QA Engineer senior en APIs REST.
CONTEXTO: TaskFlow, US-07, endpoint GET /projects/:projectId/tasks?status&priority&assignedTo&search.
INSTRUCCIÓN: Listá las condiciones de test para US-07.
INPUT DATA: CA-07a..d (ver spec). Valores válidos: status ∈ {TODO, IN_PROGRESS, DONE};
            priority ∈ {LOW, MEDIUM, HIGH, CRITICAL}. Sin resultados = [] + 200.
RESTRICCIONES (clave):
  - Si un filtro recibe un valor fuera del enum, el sistema NO devuelve 400: simplemente no matchea
    (resultado []). NO inventes un 400.
  - NO infieras paginación, ordenamiento ni comportamiento de search="" si no figura en los CA.
    Si algo no está en los CA, marcalo como "[fuera de alcance: sin CA]".
  - Cada condición debe citar el CA que cubre, o decir "[sin CA]".
FORMATO: lista numerada, una condición por línea.
```

**Nuevo output (refinado):**

```
1.  status=TODO devuelve solo tareas TODO — CA-07a
2.  status=IN_PROGRESS devuelve solo IN_PROGRESS — CA-07a
3.  status=DONE devuelve solo DONE — CA-07a
4.  priority=HIGH devuelve solo esa prioridad — CA-07a
5.  assignedTo=<userId> devuelve solo tareas de ese usuario — CA-07a
6.  search matchea texto en el título — CA-07b
7.  search matchea texto en la descripción — CA-07b
8.  search es case-insensitive — CA-07b
9.  status + priority combinados restringen por ambos — CA-07c
10. los 4 filtros combinados aplican intersección — CA-07c
11. filtro sin coincidencias devuelve [] + 200 (no 404) — CA-07d
12. status fuera del enum (ej. "PENDING") NO da 400: devuelve [] — [sin CA: aclaración de borde]
13. comportamiento de search="" — [fuera de alcance: sin CA]
```

> Resultado del refinamiento: la alucinación desapareció. La línea 12 **ya no afirma 400**; ahora
> describe el comportamiento real (`[]`). La 13 quedó **marcada como fuera de alcance** en lugar de
> inventar "devuelve todas". Misma técnica, prompt más restrictivo → output más fiel a la spec.

## Actividad 3.3 — Reflexión final

**Aprendizaje 1 — El prompt chaining *propaga* alucinaciones, no solo trabajo.**
La invención de `status=PENDING → 400` nació en el Paso 1 y se arrastró intacta al Paso 2 (y casi al
Gherkin). Lo revelador: en una cadena, un error temprano no se corrige solo en el siguiente paso, se
**hereda**. Hay que validar el output de cada eslabón antes de alimentarlo al próximo.

**Aprendizaje 2 — El LLM no inventa porque "no sabe", inventa porque el prompt le deja huecos.**
Cuando enumeramos los valores válidos y agregamos la regla "si no está en los CA, marcalo como fuera de
alcance", la alucinación **desapareció** sin cambiar de modelo ni de técnica. La calidad del output es,
en gran parte, una función de cuántos supuestos dejamos abiertos en el prompt.

**Aprendizaje 3 — La consistencia es estadística, no garantizada; medir > confiar.**
Tres corridas del mismo prompt dieron 11, 13 y 14 casos, y una de ellas inventó ordenamiento por
`createdAt`. La *cobertura de CA* fue estable, pero la cantidad y los bordes no. Para usar IA en serio
hay que correr varias veces, deduplicar y revisar — tratar al LLM como un generador no determinista, no
como una fuente de verdad.

**¿Usarían IA como herramienta en su trabajo como testers? ¿Con qué precauciones?**
Sí, como **acelerador con revisión humana obligatoria**, nunca como autoridad final. Precauciones
concretas: (1) **anclar el prompt a la spec real** (valores de enum, endpoints, HTTP), no a memoria del
modelo; (2) **verificar contra el código/contrato** todo HTTP, parámetro y comportamiento antes de
convertirlo en test; (3) **forzar cuotas de casos negativos/borde/seguridad** para romper el sesgo al
happy path; (4) **correr 2–3 veces y deduplicar**; y (5) en cadenas, **validar cada paso** antes de
seguir. La IA nos hace más rápidos escribiendo casos; la responsabilidad de que el caso sea *correcto*
sigue siendo del tester.

---

## Resumen de evidencia / entregables

| Ítem | Estado |
|---|---|
| Parte 1 — 3 prompts (Chaining 3 pasos + Few-Shot + Meta) con 6 componentes y outputs | ✅ |
| Parte 2 — métricas (5), alucinaciones (6 filas + checklist), consistencia (3 corridas), sesgos | ✅ |
| Parte 3 — comparación de técnicas, refinamiento con prompt antes/después, 3 aprendizajes | ✅ |
| Alucinaciones detectadas y documentadas (`PENDING`/400, `search=""`, `createdAt`, **CA-05d inexistente**) | ✅ |
| Outputs anclados a la spec real del repo (`task.service.ts`, `project.routes.ts`) | ✅ |
</content>
</invoke>
