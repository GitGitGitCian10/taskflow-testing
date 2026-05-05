# language: es
@sprint
Característica: Autenticación (US-01 y US-02)
  Como usuario
  Quiero registrarme e iniciar sesión
  Para usar TaskFlow de forma segura

  Antecedentes:
    Dado una base limpia y la API iniciada

  @US-01
  Escenario: Registro exitoso
    Cuando envío POST "/auth/register" con email "usuario01@test.com" y contraseña "Password1"
    Entonces el código HTTP es 201
    Y el cuerpo contiene el texto "token"

  @US-01
  Escenario: Registro rechazado por email duplicado
    Cuando envío POST "/auth/register" con email "usuario01@test.com" y contraseña "Password1"
    Y envío POST "/auth/register" con email "usuario01@test.com" y contraseña "Password1"
    Entonces el código HTTP es 409
    Y el cuerpo contiene el texto "already registered"

  @US-02
  Escenario: Login exitoso
    Dado existe un usuario "login01@test.com" con contraseña "Password1"
    Cuando envío POST "/auth/login" con email "login01@test.com" y contraseña "Password1"
    Entonces el código HTTP es 200
    Y el cuerpo contiene el texto "token"

  @US-02
  Escenario: Login rechazado con contraseña incorrecta
    Dado existe un usuario "login02@test.com" con contraseña "Password1"
    Cuando envío POST "/auth/login" con email "login02@test.com" y contraseña "WrongThing1"
    Entonces el código HTTP es 401
