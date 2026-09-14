# INSM

Sitio institucional y sistema de preinscripciones 2027 con frontend Facu, Express y MariaDB.

## Ejecutar con Docker

1. Copiar `.env.example` como `.env` y definir `ADMIN_PASSWORD`.
2. Ejecutar `docker compose up --build`.
3. Abrir `http://localhost:3000/`.

La tabla `inscripciones` se crea automáticamente al inicializar el volumen de MariaDB.
