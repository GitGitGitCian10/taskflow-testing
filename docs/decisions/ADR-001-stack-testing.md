# ADR-001: Usar Vitest, Playwright y Supertest como stack de testing para TaskFlow

* **Número:** ADR-001
* **Fecha:** 27/04/2026
* **Estado:** Aceptado

## Título
Usar Vitest, Playwright y Supertest como stack de testing para TaskFlow.

## Contexto
TaskFlow es un proyecto desarrollado con React 18, Vite y TypeScript en el frontend, y Node.js con Express en el backend. Se precisa una suite que se integre nativamente con ESM, que corra de forma eficiente en GitHub Actions y que nos permita recibir feedback rápido sin configuraciones complejas.

## Decisión
Elegimos Vitest para pruebas unitarias por su compatibilidad nativa con el stack de Vite/TypeScript. Elegimos Playwright para E2E por su robustez multi-browser y ejecución paralela. Elegimos la combinación de Supertest + Vitest para integración y Postman + Newman para exploración y reportes visuales.

## Alternativas consideradas
* **Jest:** Descartado por requerir configuración extra para ESM/TypeScript en proyectos de Vite.
* **Cypress:** Descartado por limitaciones en el soporte multi-browser nativo y mayor lentitud en CI.
* **Selenium:** Descartado por su complejidad en el setup y tendencia a generar flaky tests.

## Consecuencias
Se unifica el runner de pruebas (unitarias e integración bajo Vitest), simplificando el mantenimiento. El equipo deberá familiarizarse con la API de Playwright, aunque la curva de aprendizaje se reduce al usar TypeScript en todo el stack.

## Links y referencias
