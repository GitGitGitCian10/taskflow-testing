# BUG-05 — Bloqueo de cuenta por intentos fallidos

**Clase 3 · Módulo 2 — Práctica TDD (Ejercicio 3)**
Archivo afectado: `apps/api/src/services/auth.service.ts`

## Descripción del bug

La especificación indica que una cuenta debe bloquearse **al 5º intento de login fallido**
(`MAX_FAILED_ATTEMPTS = 5`). Sin embargo, la condición de bloqueo usaba un operador
estrictamente mayor:

```ts
const shouldLock = newFailedCount > MAX_FAILED_ATTEMPTS   // ❌ bug
```

Con `newFailedCount = 5` y `MAX_FAILED_ATTEMPTS = 5`, la expresión `5 > 5` es `false`,
por lo que la cuenta **no se bloqueaba en el 5º intento**, sino recién en el 6º
(`6 > 5`). Esto deja un intento extra de fuerza bruta antes del bloqueo.

## Fix aplicado

Se cambió el operador a "mayor o igual" para que el bloqueo ocurra **al alcanzar** el umbral:

```ts
const shouldLock = newFailedCount >= MAX_FAILED_ATTEMPTS   // ✅ fix
```

**En una oración:** el bug era usar `>` en vez de `>=` al comparar contra el umbral de
intentos, lo que retrasaba el bloqueo un intento (se bloqueaba en el 6º en lugar del 5º);
se corrigió cambiando el operador a `>=`.

## Ciclo TDD (RED → GREEN)

Test que documenta el comportamiento correcto:
`apps/api/tests/unit/auth.service.spec.ts` → *"bloquea la cuenta en el 5º intento fallido — BUG-05"*

- **RED:** con el bug (`>`), el test falla — `lockedUntil` queda `null` en el 5º intento.
- **GREEN:** con el fix (`>=`), `failedLogins` llega a 5 y `lockedUntil` queda definido → el test pasa.

Se agregó además el test *"NO bloquea la cuenta en el 4º intento fallido"* para fijar el
límite inferior (no debe bloquear antes de tiempo).

## Verificación

```
npm run test:unit
# Test Files  3 passed (3)
#      Tests  31 passed (31)
```
