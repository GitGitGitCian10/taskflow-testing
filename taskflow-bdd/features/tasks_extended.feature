# ============================================================
# US-07: Filtrar y buscar tareas
# US-08: Comentar en una tarea
# ============================================================

Feature: Búsqueda de tareas y Comentarios
  Como miembro del proyecto
  Quiero filtrar tareas y agregar comentarios
  Para coordinar mejor con el equipo

  Background:
    Given el servidor de TaskFlow está disponible
    And la base de datos está limpia

  # ── US-07: Filtrar y buscar tareas ──────────────────────────
  Scenario: Filtrar tareas por estado
    Given que el proyecto tiene 3 tareas TODO y 2 tareas DONE
    When envío GET "/projects/proj-1/tasks?status=TODO"
    Then recibo exactamente 3 tareas
    And todas tienen estado "TODO"

  Scenario: Buscar tareas por texto
    Given que existen tareas con título "Implementar login" y "Revisar diseño"
    When envío GET "/projects/proj-1/tasks?search=login"
    Then recibo solo la tarea "Implementar login"

  # ── US-08: Comentar en una tarea ────────────────────────────
  Scenario: Agregar comentario a tarea
    Given que soy miembro del proyecto y existe la tarea "task-1"
    When envío POST "/tasks/task-1/comments" con texto "Revisado y aprobado"
    Then la respuesta tiene código de estado 201
    And el comentario incluye mi userId como autor

  Scenario: Comentarios se devuelven en orden cronológico
    Given que la tarea "task-1" tiene 3 comentarios agregados en distintos momentos
    When envío GET "/tasks/task-1/comments"
    Then los comentarios están ordenados del más antiguo al más reciente
