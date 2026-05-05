# language: es
@sprint
Característica: Gestión de proyectos (US-03 y US-04)
  Como miembro registrado
  Quiero crear y consultar proyectos
  Para organizar tareas del equipo

  Antecedentes:
    Dado una base limpia y la API iniciada
    Y existe un usuario autenticado "projowner@test.com" con contraseña "Password1"

  @US-03
  Escenario: Crear proyecto válido devuelve 201
    Cuando ese usuario POST "/projects" con JSON:
      """
      {"name":"Proyecto BDD Backend","description":"suite Gherkin"}
      """
    Entonces el código HTTP es 201
    Y el cuerpo contiene campo "ownerId"

  @US-03
  Escenario: No se puede crear proyecto sin autorización válida
    Cuando envío GET "/projects" sin token
    Entonces el código HTTP es 401

  @US-03
  Escenario: Crear proyecto con nombre muy corto devuelve 400
    Cuando ese usuario POST "/projects" con JSON:
      """
      {"name":"XY","description":"min 3 chars"}
      """
    Entonces el código HTTP es 400

  @US-04
  Escenario: Cada usuario solo lista sus proyectos
    Cuando ese usuario POST "/projects" con JSON:
      """
      {"name":"Solo Yo","description":"Privado"}
      """
    Entonces el código HTTP es 201
    Dado existe un usuario autenticado "otravis@test.com" con contraseña "Password1"
    Cuando ese otro usuario envía GET "/projects"
    Entonces la lista proyectos tiene longitud exacta 0
