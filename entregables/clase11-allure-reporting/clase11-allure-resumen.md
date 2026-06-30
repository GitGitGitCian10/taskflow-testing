# Clase 11 · Módulo 2 — Test Management, Métricas y Reporting

Integrantes: Santiago Aurrecochea · Ignacio Villarreal
Herramienta: **Allure Reports** + reporter de Vitest

---

## PARTE 1 — Configuración de Allure ✅

- **Dependencias:** `allure-vitest@2.15.1`, `allure-js-commons@2.15.1`, `allure-commandline`.
  > ⚠️ Se usó **allure-vitest v2** (no v3) porque el proyecto está en **Vitest 1.6**; el reporter de
  > v3 requiere Vitest 2/3 y no genera resultados con la 1.6.
- **Config** (`apps/api/vitest.config.ts`):
  ```ts
  reporters: ['default', ['allure-vitest/reporter', { resultsDir: 'allure-results' }]],
  setupFiles: ['./tests/setup.ts', 'allure-vitest/setup'],
  ```
- **Scripts** (`package.json` raíz): `allure:generate`, `allure:open`, `allure:report`.
- **`.gitignore`:** agregados `allure-results/` y `allure-report/`.
- **Verificación:** `npm run test:unit` → **55 tests passing** y se generan **87 archivos** en `allure-results/`.
- **HTML generado:** `allure generate` produjo `allure-report/` correctamente. Capturas reales:
  `allure-overview.png` (55 test cases, 100%) y `allure-behaviors.png` (features agrupadas).

> **⚠️ Corrección al guión sobre Java:** el documento afirma que *"allure-commandline permite generar
> el HTML sin instalar Java por separado"*. **Esto es incorrecto** para `allure-commandline` 2.x:
> verificado empíricamente, su distribución (`dist/`) trae `bin/config/lib/plugins` pero **NO incluye
> un JRE**, y al ejecutar `allure --version` falla con
> `ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH`.
> **Allure SÍ requiere Java.** Se instaló **Temurin JRE 21** (`winget install EclipseAdoptium.Temurin.21.JRE`)
> y con eso `allure generate` funcionó y se obtuvo el dashboard HTML.

---

## PARTE 2 — Anotaciones (5 tests) ✅

API v2 usada: `import { bindAllureApi } from 'allure-vitest'` → `const allure = bindAllureApi(context.task)`
dentro de cada test (el `context` lo inyecta Vitest). Verificado: los 5 result JSON contienen los
labels `feature`/`story`/`severity` y el link.

| # | Archivo / Test | feature | story | severity | link |
|---|---|---|---|---|---|
| 1 | `auth.service.spec.ts` · "acepta email válido" | Autenticación | US-01 | blocker | — |
| 2 | `auth.service.spec.ts` · "bloquea la cuenta en el 5º intento — BUG-05" | Autenticación | US-02 | critical | BUG-05.md (issue) |
| 3 | `project.service.spec.ts` · "crea un proyecto cuando el nombre no existe" | Proyectos | US-03 | critical | — |
| 4 | `task.service.spec.ts` · "crea la tarea si el usuario es miembro" | Tareas | US-05 | normal | — |
| 5 | `task.state-machine.spec.ts` · "transición inválida TODO -> DONE" | Tareas | US-06 | normal | — |

Evidencia (extracto de un result JSON del test BUG-05):
```json
"labels":[{"name":"feature","value":"Autenticación"},{"name":"story","value":"US-02"},{"name":"severity","value":"critical"}]
"links":[{"name":"BUG-05","url":".../BUG-05.md","type":"issue"}]
```

---

## PARTE 3 — Reporte Ejecutivo de Testing

### REPORTE EJECUTIVO DE TESTING — TaskFlow

| | |
|---|---|
| **Equipo / Proyecto** | TaskFlow — Aurrecochea / Villarreal |
| **Release / Sprint** | Módulo 2 · Hitos 1–6 |
| **Período cubierto** | Clases 2–11 (Módulo 2, 2026) |
| **Fecha del reporte** | 2026-06-30 |

#### A. Estado general del ciclo

| Área evaluada | Estado |
|---|---|
| Cobertura de código ≥ 80% | 🟢 OK (95.69% en `src/services`) |
| Pipeline CI/CD verde en main | 🟡 Riesgo (verde local; falta confirmar en GitHub Actions) |
| Sin defectos críticos abiertos sin asignar | 🟡 Riesgo (BUG-06 perf latente) |
| Tests E2E sin flaky failures | 🟢 OK (4/4 Playwright en chromium) |
| Contract tests (Pact) consumer + provider | 🟢 OK (verification successful) |

#### B. Métricas clave

| Métrica | Valor obtenido | Meta | Interpretación |
|---|---|---|---|
| Pass Rate (unit) | 100% (55/55) | ≥ 95% | 🟢 Cumple |
| Cobertura de código | 95.69% | ≥ 80% | 🟢 Cumple |
| Defect Density (auth, módulo crítico) | ~2 / KLOC (estimado) | < 3 / KLOC | 🟢 Cumple |
| DDP (Defect Detection %) | ~95% (los bugs los detectó la suite, no producción) | ≥ 95% | 🟢 Cumple |
| Escaped Defects | 0 | 0 | 🟢 Cumple |
| Fix Rate (bugs trabajados) | 4/7 corregidos (BUG-03/04/05/07) | 100% | 🟡 Parcial |

#### C. Resumen de defectos

| | |
|---|---|
| **Total defectos encontrados** | 7 (BUG-01…BUG-07, latentes en el código base) |
| **Defectos corregidos** | 4 (57%) — BUG-03, BUG-04, BUG-05, BUG-07 |
| **Defectos diferidos** | 3 — BUG-01 (transición desde DONE), BUG-02 (filtro getTasks), BUG-06 (filtro `archived` en listProjects) |
| **Escaped defects** | 0 (no hay entorno productivo) |

**Defecto más crítico del ciclo:** **BUG-05** — bloqueo de cuenta.
- *Descripción:* la cuenta se bloqueaba recién al 6º intento fallido en vez del 5º.
- *Causa raíz:* off-by-one en `auth.service.ts` — `newFailedCount > MAX_FAILED_ATTEMPTS` debía ser `>=`. (ver `BUG-05.md`)

#### D. Riesgo residual

| Área / Módulo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| `listProjects` (BUG-06, performance) | Alto | Medio | Agregar `archived: false`; cubierto por test de carga k6 (Clase 9) |
| Transición de estados (BUG-01) | Medio | Medio | Endurecer `VALID_TRANSITIONS` para DONE; tests de máquina de estados |
| Filtro `getTasks` (BUG-02) | Medio | Bajo | Corregir el `where`; agregar integration test de filtro |

#### E. Deuda técnica en tests

| Tipo de deuda | Archivo / Módulo | Prioridad | Acción propuesta |
|---|---|---|---|
| Unit de Project/Comment faltaban (resuelto Clase 10) | `*.service.spec.ts` | — | Hecho (+30 tests) |
| Pipeline `test:bdd` apuntaba a workspace vacío (resuelto) | `package.json` | — | Hecho |
| E2E solo en chromium | `e2e/playwright` | Media | Extender a Firefox/WebKit antes de release |

#### F. Conclusión y recomendación

**Decisión: 🟡 GO con observaciones.**

*Justificación:* la cobertura (95.69%) y el pass rate (100%) superan las metas, los contratos Pact y
los E2E pasan, y no hay defectos escapados. Quedan 3 bugs latentes diferidos (BUG-01/02/06), ninguno
bloqueante para las funcionalidades entregadas, pero deben planificarse.

*Recomendaciones próximo ciclo:*
- Corregir BUG-06 (filtro `archived`) por su impacto en performance bajo carga.
- Confirmar el pipeline verde en GitHub Actions y agregar branch protection.

---

## Referencia — Comandos

```bash
npm run test:unit        # corre la suite y genera allure-results/
npm run allure:generate  # genera el HTML (requiere Java)
npm run allure:open      # abre el reporte
npm run allure:report    # los 3 pasos juntos
```
