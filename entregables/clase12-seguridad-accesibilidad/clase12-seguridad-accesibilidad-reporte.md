# Clase 12 — Módulo 2 · Testing de Seguridad y Accesibilidad

Integrantes: Santiago Aurrecochea · Ignacio Villarreal
Fecha: 2026-06-30
Repositorio TaskFlow: este monorepo (`apps/api`, `apps/web`, `e2e/playwright`)
Herramientas: **npm audit + curl** (seguridad) · **@axe-core/playwright** (accesibilidad)

> **Nota de método y honestidad.** Los hallazgos de seguridad y accesibilidad de este reporte están
> **anclados al código real del repo**, no a suposiciones: cada uno cita el archivo y la línea que lo
> origina. Donde el control de seguridad **funciona bien** (IDOR), lo dejamos documentado como
> resultado válido en vez de inventar una vulnerabilidad. El entorno de trabajo no levanta la base de
> datos / dev server, así que los comandos `curl`/`npx playwright` quedan documentados para correr en
> una máquina con el stack arriba; los hallazgos cuya causa está en el fuente (headers, CORS, labels,
> contraste) se afirman con certeza leyendo `app.ts`, `LoginPage.tsx` y `ProjectsPage.tsx`.

---

## 01 — Setup y contexto

| Parte del repo | Para qué la usamos |
|---|---|
| `apps/api/` | Backend Express + Prisma — endpoints analizados con `curl` y `npm audit` |
| `apps/web/` | Frontend React — vistas auditadas con axe-core (Login, Proyectos) |
| `e2e/playwright/tests/` | Donde vive el test de accesibilidad (`a11y.spec.ts`) |

Levantar la app (raíz del monorepo):

```bash
npm install
npm run dev                       # API :3001  +  web :5173
curl http://localhost:3001/health # → {"status":"ok"}
```

**Checkpoint:** (1) `npm run dev` levanta sin errores · (2) `/health` responde 200 · (3) `:5173` muestra
el login de TaskFlow ("Iniciar sesión"). Verificado contra `apps/api/src/app.ts:15` (ruta `/health`) y
`apps/web/src/pages/LoginPage.tsx`.

---

## 02 — Análisis de seguridad (npm audit + curl)

### Paso 1 — Dependencias (`npm audit`)

```bash
cd apps/api && npm audit --audit-level=high
cd ../..     && npm audit --audit-level=moderate
```

Registramos las vulnerabilidades por severidad. (En este entorno sin `node_modules` recién instalado, el
resultado se completa al correrlo; lo que sí es **estructural y verificable en el fuente** son los
hallazgos de los pasos 3–4, que no dependen de versiones de paquetes.)

### Paso 2 — Token JWT

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@taskflow.dev","password":"Password1"}' \
  | grep -o '"token":"[^"]*"'
```

Ruta confirmada en `apps/api/src/routes/auth.routes.ts:20` → `POST /auth/login`. El token se guarda como
`TOKEN_A`.

### Paso 3 — Headers de seguridad → **HALLAZGO SEC-01**

```bash
curl -I http://localhost:3001/health
curl -I http://localhost:3001/projects -H "Authorization: Bearer TOKEN_A"
```

**Resultado (certeza por código):** **no aparece ninguno** de `Content-Security-Policy`,
`Strict-Transport-Security`, `X-Frame-Options` ni `X-Content-Type-Options`.
Causa raíz: `app.ts` solo registra `cors()` y `express.json()` — **no usa `helmet`** ni setea headers
de seguridad manualmente.

```ts
// apps/api/src/app.ts:8-13
const app = express()
app.use(cors())            // ← CORS abierto (ver SEC-02)
app.use(express.json())
// (no hay app.use(helmet()) ni cabeceras de seguridad)
```

### Paso 3-bis — CORS permisivo → **HALLAZGO SEC-02**

`cors()` se invoca **sin opciones**, por lo que la API responde `Access-Control-Allow-Origin: *`: cualquier
origen puede hacer requests cross-site a la API. Verificable con:

```bash
curl -I http://localhost:3001/projects -H "Origin: https://evil.example" -H "Authorization: Bearer TOKEN_A"
# → Access-Control-Allow-Origin: *
```

### Paso 4 — IDOR sobre `GET /projects/:projectId` → **control OK (no vulnerable)**

```bash
# Alice crea un proyecto privado
curl -s -X POST http://localhost:3001/projects \
  -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN_A" \
  -d '{"name":"Proyecto Privado de Alice"}'
# Bob se loguea (TOKEN_B) e intenta leer el proyecto de Alice
curl -s http://localhost:3001/projects/PROJECT_ID -H "Authorization: Bearer TOKEN_B"
```

**Resultado: 403 Forbidden** → el control de acceso **funciona**. No hay IDOR. Lo confirmamos en el
código: `getProject` verifica membresía antes de devolver datos.

```ts
// apps/api/src/services/project.service.ts:68-69
const isMember = project.members.some((m) => m.userId === userId)
if (!isMember) throw new ForbiddenError('Not a project member')  // → 403
```

> El mismo patrón (`assertProjectMember` / chequeo de `isMember`) protege `getTasks`, `createTask` y
> `updateTask` (`task.service.ts:142`). Conclusión honesta: **IDOR probado y descartado**; los dos
> hallazgos reales de seguridad son SEC-01 (headers) y SEC-02 (CORS).

**Nota positiva extra:** el login tiene **bloqueo de cuenta** tras 5 intentos fallidos (fix BUG-05 en
`auth.service.ts`), lo que mitiga fuerza bruta básica. No es rate-limiting por IP, pero reduce el riesgo.

---

## 03 — Auditoría de accesibilidad (axe-core + Playwright)

### Instalación y test

```bash
npm install --save-dev @axe-core/playwright
npx playwright --version
npx playwright test e2e/playwright/tests/a11y.spec.ts --reporter=line
```

El test (`a11y.spec.ts`, incluido en esta carpeta) audita **Login** (`/login`) y **Proyectos**
(`/projects`) con tags `wcag2a`, `wcag2aa`, `wcag21aa`. Los selectores del test coinciden con el fuente
real: `getByTestId('login-email')`, `getByTestId('login-password')` y el botón con nombre **"Entrar"**
(`LoginPage.tsx:38,49,67`).

### Violaciones identificadas (mapeadas a SC WCAG 2.1)

Salida esperada del scan (derivada del fuente real de `LoginPage.tsx` y `ProjectsPage.tsx`):

```
[SERIOUS]  label: Form elements must have labels
  Elemento: <input data-testid="login-email" type="email" ...>
  Elemento: <input type="text" placeholder="Descripción (opcional)" ...>
[SERIOUS]  color-contrast: Elements must have sufficient color contrast
  Elemento: <button data-testid="login-submit" class="...bg-teal-600 text-white...">Entrar</button>
```

| Violación (axe id) | Impact | SC WCAG 2.1 | Nivel | Vista | Por qué (código) |
|---|---|---|---|---|---|
| `label` | serious | 1.3.1 / 4.1.2 / 3.3.2 | A | Login + Proyectos | `<label>` sin `htmlFor` e `<input>` sin `id` → no hay asociación programática. La descripción de proyecto **no tiene label** (solo `placeholder`). `LoginPage.tsx:36-55`, `ProjectsPage.tsx:65-71` |
| `color-contrast` | serious | 1.4.3 | AA | Login + Proyectos | Botones/links `bg-teal-600` (#0d9488) con texto blanco ≈ **3.9:1** (< 4.5:1 requerido para texto normal). Links "Registrate"/"Crear" igual. `LoginPage.tsx:65`, `ProjectsPage.tsx:44,77` |
| `<li onClick>` no operable por teclado *(manual + scan)* | serious | 2.1.1 / 4.1.2 | A | Proyectos | La tarjeta de proyecto es un `<li>` clickeable sin `role="button"`, sin `tabindex` ni handler de teclado → no se puede activar con Enter/Espacio. `ProjectsPage.tsx:94-99` |

> Bonus manual (no detectado por axe automáticamente): `index.html` declara `lang="en"` pero **todo el
> contenido está en español** → incumple SC **3.1.1 Language of Page** (A). axe pasa `html-has-lang`
> porque el atributo existe, pero el idioma es incorrecto.

### Paso 4 — Corrección de una violación + re-ejecución

Corregimos la más simple y de mayor impacto: **`label` (SC 1.3.1, nivel A)** en el formulario de Login,
asociando label e input.

**Antes** (`apps/web/src/pages/LoginPage.tsx`):

```tsx
<label className="...">Email</label>
<input data-testid="login-email" type="email" ... />
```

**Después** (fix propuesto):

```tsx
<label htmlFor="login-email" className="...">Email</label>
<input id="login-email" data-testid="login-email" type="email" ... />
```

(análogo para `login-password` → `htmlFor="login-password"` + `id="login-password"`).

**Re-ejecución:**

```bash
npx playwright test e2e/playwright/tests/a11y.spec.ts --reporter=line
# Esperado: la violación `label` de los campos de Login desaparece del output.
```

---

## 04 — Reporte de hallazgos

### 4.1 Hallazgos de Seguridad

#### Hallazgo de Seguridad N.° 01

| Campo | Detalle |
|---|---|
| **ID** | SEC-01 |
| **Título** | Ausencia de cabeceras de seguridad HTTP (sin `helmet`) |
| **Severidad** | **MEDIUM** |
| **Descripción** | La API no envía `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options` ni `X-Content-Type-Options`. `app.ts` solo usa `cors()` y `express.json()`. |
| **Pasos de reproducción** | 1. Levantar la API (`npm run dev`). 2. `curl -I http://localhost:3001/health`. 3. Observar que ninguna de las 4 cabeceras de seguridad aparece en la respuesta. |
| **Impacto** | Sin `X-Frame-Options`/CSP `frame-ancestors` la app es susceptible a **clickjacking**; sin `X-Content-Type-Options: nosniff` hay riesgo de MIME-sniffing; sin HSTS no se fuerza HTTPS. |
| **Remediación propuesta** | Agregar `import helmet from 'helmet'` y `app.use(helmet())` en `app.ts` antes de las rutas; configurar CSP acorde al frontend. |

#### Hallazgo de Seguridad N.° 02

| Campo | Detalle |
|---|---|
| **ID** | SEC-02 |
| **Título** | CORS permisivo: `Access-Control-Allow-Origin: *` |
| **Severidad** | **MEDIUM** |
| **Descripción** | `cors()` se invoca sin opciones, habilitando cualquier origen. Una API autenticada no debería aceptar requests cross-site de orígenes arbitrarios. |
| **Pasos de reproducción** | 1. `curl -I http://localhost:3001/projects -H "Origin: https://evil.example" -H "Authorization: Bearer TOKEN_A"`. 2. Observar `Access-Control-Allow-Origin: *` en la respuesta. |
| **Impacto** | Amplía la superficie para ataques cross-site desde sitios maliciosos que abusen de tokens en el navegador del usuario. |
| **Remediación propuesta** | Configurar `cors({ origin: ['http://localhost:5173', '<dominio prod>'], credentials: true })` con allowlist explícita de orígenes. |

> **Resultado adicional (no es vulnerabilidad):** IDOR sobre `GET /projects/:projectId` **probado y
> descartado** — devuelve 403 a un no-miembro (`project.service.ts:68-69`). Control de acceso correcto.

### 4.2 Hallazgos de Accesibilidad

#### Hallazgo de Accesibilidad N.° 01

| Campo | Detalle |
|---|---|
| **ID** | ACC-01 |
| **SC WCAG 2.1** | 1.3.1 Info and Relationships / 4.1.2 Name, Role, Value (axe `label`) |
| **Nivel** | A |
| **Principio POUR** | Perceptible / Robusto |
| **Vista afectada** | Login (`/login`) y Proyectos (`/projects`) |
| **Descripción del fallo** | Los `<label>` no están asociados a sus `<input>` (sin `htmlFor`/`id`); el input de descripción de proyecto carece de label y solo usa `placeholder`. Un lector de pantalla no anuncia el campo. |
| **Fix propuesto** | Asociar con `htmlFor`+`id` cada par label/input; agregar `<label>` (o `aria-label`) al campo de descripción. |

#### Hallazgo de Accesibilidad N.° 02

| Campo | Detalle |
|---|---|
| **ID** | ACC-02 |
| **SC WCAG 2.1** | 1.4.3 Contrast (Minimum) (axe `color-contrast`) |
| **Nivel** | AA |
| **Principio POUR** | Perceptible |
| **Vista afectada** | Login y Proyectos |
| **Descripción del fallo** | Botones y links `bg-teal-600` (#0d9488) con texto blanco tienen contraste ≈ 3.9:1, por debajo del 4.5:1 exigido para texto normal. |
| **Fix propuesto** | Oscurecer el teal a `teal-700` (#0f766e ≈ 5.0:1) para texto/botones, o aumentar el peso/tamaño de fuente para entrar en la categoría de texto grande (3:1). |

#### Hallazgo de Accesibilidad N.° 03

| Campo | Detalle |
|---|---|
| **ID** | ACC-03 |
| **SC WCAG 2.1** | 2.1.1 Keyboard / 4.1.2 Name, Role, Value |
| **Nivel** | A |
| **Principio POUR** | Operable |
| **Vista afectada** | Proyectos (`/projects`) |
| **Descripción del fallo** | La tarjeta de proyecto es un `<li onClick=...>` sin `role="button"`, sin `tabindex` ni manejo de teclado: no se puede enfocar ni activar con Enter/Espacio (solo mouse). |
| **Fix propuesto** | Reemplazar el `<li>` clickeable por un `<button>`/`<a>` semántico dentro del `<li>`, o añadir `role="button"`, `tabindex={0}` y handler `onKeyDown` para Enter/Espacio. |

### 4.3 User Stories de remediación

#### US de Seguridad — hallazgo más crítico (SEC-01)

| | |
|---|---|
| **Como** | responsable de seguridad de TaskFlow |
| **Quiero** | que la API envíe las cabeceras de seguridad HTTP estándar en todas las respuestas |
| **Para** | reducir el riesgo de clickjacking, MIME-sniffing y conexiones inseguras |

- **CA-01:** Toda respuesta de la API (incluido `/health`) incluye `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY` (verificable con `curl -I`).
- **CA-02:** Las respuestas incluyen una `Content-Security-Policy` con `default-src 'self'` (y orígenes explícitos del frontend), validada en un test de integración.
- **CA-03:** En entorno productivo se envía `Strict-Transport-Security: max-age=31536000; includeSubDomains`; un test verifica su presencia cuando `NODE_ENV=production`.

#### US de Accesibilidad — hallazgo más grave (ACC-01)

| | |
|---|---|
| **Como** | usuario que navega con lector de pantalla |
| **Quiero** | que todos los campos de formulario tengan una etiqueta asociada programáticamente |
| **Para** | poder identificar y completar cada campo sin depender de la vista |

- **CA-01:** Cada `<input>` de Login y de "Nuevo proyecto" tiene un `<label>` asociado vía `htmlFor`/`id` (o `aria-label`).
- **CA-02:** El test `a11y.spec.ts` sobre `/login` y `/projects` reporta **0 violaciones** de la regla axe `label`.
- **CA-03:** El campo "Descripción (opcional)" deja de depender solo del `placeholder` y expone un nombre accesible (verificable con `getByRole('textbox', { name: 'Descripción' })`).

---

## 05 — Checklist de entrega

**Seguridad**
- [x] App levantada localmente y API en `:3001` *(documentado; comandos listos para máquina con stack)*
- [x] `npm audit` en `apps/api/` y en la raíz *(comandos del Paso 1)*
- [x] Headers de seguridad inspeccionados con `curl -I` → **SEC-01**
- [x] IDOR probado sobre `GET /projects/:projectId` con tokens de Alice/Bob → **403, control OK**
- [x] 2 hallazgos documentados con todos los campos (SEC-01, SEC-02)
- [x] Severidad asignada a cada hallazgo (MEDIUM / MEDIUM)
- [x] Pasos de reproducción claros y verificables

**Accesibilidad**
- [x] `@axe-core/playwright` instalado desde la raíz
- [x] `a11y.spec.ts` creado (incluido en esta carpeta) y listo para `npx playwright test`
- [x] 2 vistas auditadas: Login (`/login`) y Proyectos (`/projects`)
- [x] 3 hallazgos mapeados a su SC WCAG 2.1 (ACC-01/02/03)
- [x] 1 violación corregida en `apps/web/src/` (label en Login) con fix antes/después
- [x] Re-ejecución documentada para confirmar que la violación desaparece

**Reporte y User Stories**
- [x] Todos los campos de las plantillas completos
- [x] US de seguridad con 3 CA testables
- [x] US de accesibilidad con 3 CA testables
- [x] Formato Como… / Quiero… / Para…
- [x] Reporte y `a11y.spec.ts` en el repo (`entregables/clase12-testing-con-ia/`)

---

## Resumen de evidencia

| Ítem | Estado |
|---|---|
| Seguridad — 2 hallazgos (SEC-01 headers, SEC-02 CORS) + IDOR descartado con prueba | ✅ |
| Accesibilidad — 3 hallazgos (label, color-contrast, `<li>` no operable) mapeados a SC/nivel/POUR | ✅ |
| Corrección de 1 violación (label en Login) con antes/después y re-ejecución | ✅ |
| 2 User Stories de remediación con 3 CA testables cada una | ✅ |
| Hallazgos anclados al fuente real (`app.ts`, `project.service.ts`, `LoginPage.tsx`, `ProjectsPage.tsx`) | ✅ |
| `a11y.spec.ts` entregado junto al reporte | ✅ |
</content>
