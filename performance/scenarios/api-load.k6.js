// performance/scenarios/api-load.k6.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// ── Custom metrics ────────────────────────────────────────────
const errorRate = new Rate('error_rate')
const tasksDuration = new Trend('tasks_duration', true)
const listDuration = new Trend('list_duration', true)

// ── Thresholds (SLOs definidos en US como NFRs) ───────────────
export const options = {
  thresholds: {
    // SLO: p95 de todos los requests < 500ms
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    // SLO: error rate < 1%
    error_rate: ['rate<0.01'],
    // SLOs por endpoint
    list_duration: ['p(95)<400'],
    tasks_duration: ['p(95)<400'],
  },

  scenarios: {
    // Carga normal: 50 usuarios concurrentes durante 2 minutos
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },  // ramp up
        { duration: '1m', target: 50 },  // steady state
        { duration: '30s', target: 0 },   // ramp down
      ],
      tags: { scenario: 'load' },
    },

    // Pico: spike de 200 usuarios
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 200 }, // spike súbito
        { duration: '30s', target: 200 }, // mantener
        { duration: '10s', target: 0 },   // bajar
      ],
      startTime: '3m', // empieza después del load test
      tags: { scenario: 'spike' },
    },
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001'

// ── Setup: crear usuario para el test ────────────────────────
export function setup() {
  const email = `perf-${Date.now()}@test.com`
  const password = 'Password1'

  // 1. Registrar usuario
  const res = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email,
    password,
    name: 'Perf User',
  }), { headers: { 'Content-Type': 'application/json' } })

  const token = res.json('token')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  // 2. Crear proyecto
  const projRes = http.post(`${BASE_URL}/projects`, JSON.stringify({
    name: 'Load Test Project',
    description: 'Created during setup'
  }), { headers })

  const projectId = projRes.json('id')

  // 3. Crear tarea
  http.post(`${BASE_URL}/projects/${projectId}/tasks`, JSON.stringify({
    title: 'Load Test Task',
    priority: 'HIGH'
  }), { headers })

  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email,
    password,
  }), { headers: { 'Content-Type': 'application/json' } })

  errorRate.add(loginRes.status !== 200)
  check(loginRes, { 'login status 200': (r) => r.status === 200 })

  // 4. Retornar
  return { token, projectId }
}

// ── Main scenario ─────────────────────────────────────────────
export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  }

  // 1. List projects
  const projectsRes = http.get(`${BASE_URL}/projects`, { headers })
  listDuration.add(projectsRes.timings.duration)
  check(projectsRes, { 'projects status 200': (r) => r.status === 200 })
  errorRate.add(projectsRes.status !== 200)

  sleep(0.3)

  // 2. Get tasks with filter
  const tasksRes = http.get(`${BASE_URL}/projects/${data.projectId}/tasks?status=TODO`, {
    headers,
    tags: { name: 'Get Tasks' }
  })
  tasksDuration.add(tasksRes.timings.duration)
  errorRate.add(tasksRes.status !== 200)
  check(tasksRes, { 'tasks status 200': (r) => r.status === 200 })

  sleep(1)
}
