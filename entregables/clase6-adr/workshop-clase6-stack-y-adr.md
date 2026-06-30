# Clase 6 · Módulo 2 — Workshop: Elección del Stack y ADR

**Equipo:** TaskFlow
**Integrantes:** Santiago Aurrecochea · Ignacio Villarreal
**Fecha:** Clase 6, Módulo 2

> Documento del workshop completado (Parte 1: evaluación · Parte 2: ADR · Parte 3: presentación y reflexión).
> El ADR canónico vive en [`docs/decisions/ADR-001-stack-testing.md`](../../docs/decisions/ADR-001-stack-testing.md).

---

## PARTE 1 — Evaluación de herramientas

Puntaje 1 (pobre) a 5 (excelente).

### 1.1 Unit Testing

| Criterio | Jest | **Vitest** | Mocha |
|---|:---:|:---:|:---:|
| Integración con Vite/TypeScript | 3 | **5** | 2 |
| Velocidad de ejecución | 3 | **5** | 3 |
| Facilidad de configuración | 3 | **5** | 2 |
| Soporte de mocks/spies | 5 | **5** | 2 |
| Compatibilidad CI/CD | 5 | **5** | 4 |
| **TOTAL** | **19** | **25** | **13** |

**Herramienta elegida:** Vitest

**Justificación:** Comparte el toolchain de Vite/TypeScript que ya usa el frontend, así que corre ESM y TS sin configuración extra; además su API es compatible con Jest, por lo que no hay curva de aprendizaje y el watch es mucho más rápido.

### 1.2 Testing E2E Web

| Criterio | **Playwright** | Cypress | Selenium |
|---|:---:|:---:|:---:|
| Soporte TypeScript nativo | **5** | 4 | 3 |
| Multi-browser | **5** | 3 | 5 |
| Facilidad de debugging | **5** | 5 | 2 |
| Integración con CI/CD | **5** | 4 | 3 |
| Robustez de locators | **5** | 4 | 2 |
| **TOTAL** | **25** | **20** | **15** |

**Herramienta elegida:** Playwright

**Justificación:** Soporte multi-browser real (Chromium/Firefox/WebKit) corriendo headless en GitHub Actions sin setup manual, locators robustos basados en roles/`data-testid` y Trace Viewer para diagnosticar fallas en CI. TypeScript es de primera clase.

### 1.3 API Testing — dos herramientas, dos propósitos

No se elige una y se descarta la otra: **conviven**.

| Momento / Propósito | Postman + Newman | Supertest + Vitest |
|---|:---:|:---:|
| Explorar un endpoint nuevo | **Ideal ✔** | — |
| Reportes para el docente / equipo | **Newman HTML/JSON ✔** | — |
| Matriz de trazabilidad | **Ya implementado (Clase 4) ✔** | — (trazabilidad por cobertura) |
| Tests en el pipeline CI/CD | Newman headless ✔ | **Principal ✔** |
| Cobertura medible | — | **Integrado con Vitest ✔** |
| Tests TypeScript en el repo | — | **Nativo ✔** |

**Cómo conviven en TaskFlow:**
- **Postman + Newman** se usa al **explorar/diseñar** un endpoint nuevo y para **comunicar** (colección como documentación viva, reporte HTML y matriz de trazabilidad que se entrega al docente).
- **Supertest + Vitest** son la **red de seguridad permanente**: viven en el repo (`apps/api/tests/integration/`), corren en cada push del pipeline y aportan cobertura medible.
- Regla práctica del equipo: *se prototipa en Postman, se consolida en Supertest.* Lo que se valida manualmente en Postman y queda estable, se "baja" a un test Supertest para que el CI lo proteja.

---

## PARTE 2 — Architecture Decision Record

### ADR-001 — Stack de Testing para TaskFlow

| Campo | Valor |
|---|---|
| **Número** | ADR-001 |
| **Fecha** | Clase 6 — Módulo 2 |
| **Estado*** | Aceptado |

**Título\***
Usar Vitest (unit/integration), Supertest + Postman/Newman (API) y Playwright (E2E) como stack de testing de TaskFlow.

**Contexto\***
TaskFlow es un monorepo con frontend React 18 + Vite + TypeScript y backend Node.js + Express + TypeScript sobre PostgreSQL/Prisma. El pipeline corre en **GitHub Actions**, por lo que toda herramienta debe ejecutarse **headless sin configuración manual**. El proyecto usa **TypeScript estricto** (soporte nativo o vía `@types` obligatorio) y se exige que **un único `npm run test`** corra toda la suite (unit + integration + e2e) en orden. Elegir mal implica fricción en CI, tests lentos o flaky, y mayor costo de onboarding para quien entre al equipo más adelante.

**Decisión\***
- **Unit / Integration → Elegimos Vitest** porque comparte el toolchain de Vite, soporta ESM y TypeScript sin configuración extra y su API es compatible con Jest (curva de aprendizaje casi nula). Unifica el runner de unit e integración, simplificando el mantenimiento.
- **API testing → Usamos Supertest + Vitest y Postman + Newman de forma complementaria.** Supertest+Vitest es la herramienta principal del pipeline (tests en el repo, con cobertura); Postman+Newman cubre exploración, reportes visuales y la matriz de trazabilidad.
- **E2E → Elegimos Playwright** por su soporte multi-browser real, ejecución paralela/headless en CI, locators robustos y Trace Viewer para debugging.

**Alternativas consideradas\***
- **Unit:** *Jest* — descartado por requerir configuración adicional para ESM/TS en un proyecto Vite y por ser más lento en watch. *Mocha* — descartado por necesitar ensamblar mocks/aserciones por separado (Sinon/Chai) y peor integración con Vite/TS.
- **E2E:** *Cypress* — descartado por soporte multi-browser limitado y mayor lentitud en CI. *Selenium* — descartado por setup complejo y tendencia a tests flaky.
- **API:** no se descarta ninguna: Postman+Newman y Supertest+Vitest se usan en momentos distintos del ciclo (ver Parte 1.3).

**Consecuencias**
- *Positivas:* stack cohesivo 100% TypeScript/JavaScript; pipeline más rápido que con Jest; un solo runner para unit+integration; onboarding sencillo; reportes y trazabilidad listos para entregar.
- *Trade-offs / deuda aceptada:* Vitest tiene un ecosistema de plugins más chico que Jest (aunque crece rápido); Playwright requiere descargar browsers (~300 MB en CI); mantener Postman+Newman implica versionar la colección y el environment además de los tests del repo.

**Links y referencias**
- Vitest — https://vitest.dev/
- Playwright — https://playwright.dev/
- Supertest — https://github.com/ladjs/supertest
- Newman — https://github.com/postmanlabs/newman
- ADR canónico del repo: `docs/decisions/ADR-001-stack-testing.md`

---

## PARTE 3 — Presentación (checklist) y reflexión

### Checklist de presentación (5 min)

| # | Punto | ✔ |
|---|---|:---:|
| 1 | Stack elegido: **Vitest** (unit), **Playwright** (E2E), **Supertest+Newman** (API) | ☑ |
| 2 | Criterio más determinante: **integración nativa con Vite/TypeScript y ejecución headless en CI** | ☑ |
| 3 | Principal alternativa descartada: **Jest** (config extra para ESM/TS) y **Cypress** (multi-browser limitado) | ☑ |
| 4 | Mayor trade-off/riesgo: **ecosistema de plugins de Vitest más chico** y **descarga de browsers de Playwright en CI** | ☑ |
| 5 | Conexión con los hitos: unit/integration desde el Hito 1-2, BDD/E2E hacia los Hitos 7-11, performance/contract en los últimos hitos | ☑ |

### Reflexión final (portfolio)

**1. ¿Cambiarías alguna decisión del ADR si TaskFlow fuera una fintech en producción con 10.000 usuarios diarios? ¿Cuál y por qué?**

Mantendría Vitest y Playwright, pero **reforzaría las capas que el stack actual deja livianas**:
- Agregaría **contract testing** (Pact) como bloqueante en CI: con muchos usuarios y despliegues frecuentes, romper el contrato entre frontend y API es un riesgo caro.
- Subiría el listón de **performance** (k6) con SLOs versionados y pruebas de carga/estrés obligatorias antes de release.
- Exigiría **cobertura mínima más alta** y tests de seguridad (authz, rate limiting, bloqueo de cuenta — justamente el BUG-05). En una fintech un 200 donde debía haber 401/403 es crítico.
- Probablemente correría los E2E en **los tres browsers** en cada release (no solo chromium) y agregaría smoke tests post-deploy en producción.

**2. ¿En qué circunstancias actualizarías el `Estado` del ADR a "Deprecado" durante el semestre?**

Lo marcaría **Deprecado** si la premisa que justificó la decisión deja de valer, por ejemplo:
- Si migramos el frontend fuera de Vite (p. ej. a Next.js), la ventaja principal de Vitest se diluye y reabriríamos la comparación.
- Si una herramienta deja de mantenerse, cambia su licencia a una incompatible, o el equipo adopta otra por estándar institucional.
- Si en la práctica Playwright/Vitest no rinden en nuestro CI (flakiness sostenido, tiempos inaceptables).

En todos los casos, "Deprecado" no se borra: se crea un **ADR sucesor** que lo reemplaza y se enlaza desde este, para conservar la trazabilidad de la decisión.
