// apps/web/src/api/projects.ts
// Cliente de la API de proyectos. La ruta real del backend es /projects
// (el monorepo NO usa el prefijo /api), por eso el contrato Pact usa /projects.
export async function createProject(
  baseUrl: string,
  name: string,
  description: string,
  token: string
): Promise<{ id: string; name: string; ownerId: string }> {
  const res = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}
