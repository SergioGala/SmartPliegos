##  Configuración de Docker para desarrollo local DEV GIOVANNY

### Puerto conflictivo con PostgreSQL local

Si tienes PostgreSQL instalado nativamente en tu máquina (usando el puerto 5432), puedes usar una configuración Docker alternativa para evitar conflictos.

#### Opción recomendada: Configuración local personalizada

Crear un archivo `docker-compose.local.yml` en la raíz del proyecto:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: licitaapp-postgres
    environment:
      POSTGRES_DB: licitaapp
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5433:5432"  # Cambia el puerto host para evitar conflictos
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: licitaapp-redis
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:latest
    container_name: licitaapp-qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrantdata:/qdrant/storage
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  qdrantdata:

agregar las variables de entorno:

Variables de entorno
Crea un archivo .env en apps/backend/:

env
DB_HOST=localhost
DB_PORT=5433  # Usa el puerto que definiste en docker-compose.local.yml
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=licitaapp
NODE_ENV=development
JWT_SECRET=tu-secreto-aqui
CORS_ORIGIN=http://localhost:5173


Comandos para usar la configuración local
bash
# Iniciar servicios con configuración local
docker compose -f docker-compose.local.yml up -d

# Detener servicios
docker compose -f docker-compose.local.yml down

# Ver logs
docker compose -f docker-compose.local.yml logs -f

# Ver estado
docker compose -f docker-compose.local.yml ps

Configuración estándar (sin conflictos de puertos)

Si no tienes PostgreSQL instalado localmente, puedes usar el docker-compose.yml original:

# Configuración estándar (puerto 5432)
docker compose up -d
Nota: El archivo docker-compose.local.yml está ignorado por git (ver .gitignore), permitiendo que cada desarrollador tenga su propia configuración sin afectar al equipo.

Verificación de funcionamiento

# Verificar contenedores
docker ps

# Conectar a PostgreSQL
docker exec -it licitaapp-postgres psql -U postgres -c "\l"

# Verificar que no hay conflictos de puertos
netstat -an | findstr :5432  # PostgreSQL nativo (si existe)
netstat -an | findstr :5433  # PostgreSQL Docker