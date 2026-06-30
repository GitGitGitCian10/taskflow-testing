# Matriz de Trazabilidad — estado al finalizar la Clase 5

Estado **real verificado** contra el repositorio (no el objetivo aspiracional del guión).
Leyenda: ✅ cubierto · — sin cobertura todavía.

| US | Unit | Integration | BDD / Gherkin | E2E |
|---|:---:|:---:|:---:|:---:|
| **US-01** Registro | ✅ | ✅ | ✅ | ✅ |
| **US-02** Login | ✅ | ✅ | ✅ | ✅ |
| **US-03** Crear proyecto | — | — | ✅ | ✅ |
| **US-04** Listar proyectos | — | — | ✅¹ | — |
| **US-05** Crear tarea | ✅² | ✅ | ✅ | — |
| **US-06** Cambiar estado tarea | ✅ | — | ✅ | — |

## Dónde está cada cobertura

| US | Unit | Integration | BDD | E2E |
|---|---|---|---|---|
| US-01 | `auth.service.spec.ts` | `auth.routes.spec.ts` | `auth.feature` | `auth.e2e.spec.ts` |
| US-02 | `auth.service.spec.ts` | `auth.routes.spec.ts` | `auth.feature` | `auth.e2e.spec.ts` |
| US-03 | — | — | `projects.feature` | `projects.e2e.spec.ts` |
| US-04 | — | — | `projects.feature`¹ | — |
| US-05 | `task.service.spec.ts`² | `tasks.routes.spec.ts` | `tasks.feature` | — |
| US-06 | `task.state-machine.spec.ts` | — | `tasks.feature` | — |

## Notas (diferencias con la matriz objetivo del guión)

1. **US-04** — La feature de proyectos cubre el *invitar miembro* / tablero, no estrictamente
   el listado `GET /projects`. No hay test E2E de listado.
2. **US-05 Unit** — Cubierto a nivel de validación (`validateTitle`), no del flujo completo
   de creación.
3. El guión marca **US-03 Unit/Integration = Sí** y **US-04 Unit/Integration = Sí**, pero en
   el repo **no existen** `project.service.spec.ts` ni `project.routes.spec.ts`. Esas celdas
   quedan pendientes para próximas clases.

## Pendientes derivados de esta matriz

- Unit + integration de **US-03** (crear proyecto) y **US-04** (listar proyectos).
- E2E de **US-04**, **US-05** y **US-06**.
