# language: es
@sprint
Característica: Tareas en proyecto (US-05)
  Como miembro de un proyecto
  Quiero crear tareas priorizadas
  Para llevar los pendientes ordenados

  Antecedentes:
    Dado una base limpia y la API iniciada
    Y existe un usuario autenticado "tasklead@test.com" con contraseña "Password1"
    Y ese usuario tiene proyecto "Backlog QA" ya creado

  @US-05
  Escenario: Crear tarea con prioridad válida HIGH
    Cuando ese usuario POST último proyecto tasks con JSON:
      """
      {"title":"Implementar verificación","priority":"HIGH"}
      """
    Entonces el código HTTP es 201
    Y el cuerpo contiene texto "HIGH" en campo "priority"

  @US-05
  Escenario: Rechazo al crear con prioridad desconocida
    Cuando ese usuario POST último proyecto tasks con JSON:
      """
      {"title":"Título largo suficiente","priority":"NO_EXISTE"}
      """
    Entonces el código HTTP es 400
