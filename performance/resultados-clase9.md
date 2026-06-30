# Resultados — Clase 9 · Performance Testing con k6

API: TaskFlow (`http://localhost:3001`) · Script: `performance/scenarios/api-load.k6.js`
k6 v2.0.0. Como k6 v2 no acepta el flag `--scenario`, load y spike se corrieron con override
`--vus N --duration` (mismo `setup()` y `default function`, thresholds activos).

## Smoke test (1 VU, 15s) — criterio de aprobación

| Check / Threshold | Valor | Resultado |
|---|---|---|
| login status 200 | 100% | ✅ |
| projects status 200 | 100% | ✅ |
| tasks status 200 | 100% | ✅ |
| error_rate | 0.00% | ✅ |
| http_req_duration p95 | 443.54 ms (<500) | ✅ |

## Load test (50 VUs, 90s)

| Métrica | Valor | SLO | Cumple |
|---|---|---|:---:|
| http_req_duration p95 | 62.05 ms | <500 ms | ✅ |
| http_req_duration p99 | 120.87 ms | <1000 ms | ✅ |
| error_rate | 0.00% | <1% | ✅ |
| list_duration p95 | 54.48 ms | <400 ms | ✅ |
| tasks_duration p95 | 67.29 ms | <400 ms | ✅ |
| throughput | 72.52 req/s | — | — |
| checks | 6721/6721 (100%) | — | ✅ |

## Spike test (200 VUs, 50s)

| Métrica | Valor | SLO | Cumple |
|---|---|---|:---:|
| http_req_duration p95 | 368.47 ms | <500 ms | ✅ |
| http_req_duration p99 | 443.53 ms | <1000 ms | ✅ |
| error_rate | 0.00% | <1% | ✅ |
| list_duration p95 | 309.80 ms | <400 ms | ✅ |
| tasks_duration p95 | **412.87 ms** | <400 ms | ❌ |
| throughput | 246.95 req/s | — | — |
| checks | 13119/13119 (100%) | — | ✅ |

> Exit code de k6: load = `0` (todos los thresholds OK), spike = `99` (un threshold falló:
> `tasks_duration p95`). En spike el sistema **responde sin errores (0%)** pero se **degrada**.

## Comparativa Load vs Spike

| Métrica | Load (50 VUs) | Spike (200 VUs) | Factor |
|---|---|---|---|
| p95 total | 62.05 ms | 368.47 ms | 5.9× |
| p99 total | 120.87 ms | 443.53 ms | 3.7× |
| error_rate | 0.00% | 0.00% | = |
| list_duration p95 | 54.48 ms | 309.80 ms | 5.7× |
| tasks_duration p95 | 67.29 ms | 412.87 ms | 6.1× |
| throughput | 72.5 req/s | 246.95 req/s | 3.4× |

La carga se cuadruplicó (50→200 VUs) pero la latencia creció ~6×: deterioro **supra-lineal**,
coherente con el bug de `listProjects` (ver análisis en el resumen de la clase).
