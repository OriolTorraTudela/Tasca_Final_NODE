# T9 - Gestor de Tasques: JWT Avançat + Jerarquia de Rols

API REST en Node.js/Express/MongoDB amb sistema d'autenticació professional.

## Característiques

- **JWT Avançat**: Access Token (15min) + Refresh Token (7 dies)
- **Jerarquia de Rols**: SUPER_ADMIN > ADMIN > MANAGER > USER > VIEWER (herència de permisos)
- **Delegació de Permisos**: temporals i condicionals entre usuaris
- **Token Blacklist**: logout segur (MongoDB TTL index)
- **Rate Limiting**: per rol (SUPER_ADMIN: 1000, ADMIN: 500, MANAGER: 200, USER: 100, VIEWER: 50 req/min)
- **Auditoria Avançada**: qui, què, quan, on, canvis detallats + exportació CSV
- **Recuperació de Contrasenya**: token per email (1 hora de validesa)
- **Seguretat HTTP**: Helmet + CORS + validació d'entrades (express-validator)

## Requisits

- Node.js >= 18
- MongoDB >= 6 (local o Atlas)

## Instal·lació

```bash
# 1. Clonar el repositori
git clone <URL_REPOSITORI>
cd projecte-t9

# 2. Instal·lar dependències
npm install

# 3. Configurar variables d'entorn
cp .env.example .env
# Edita .env amb els teus valors

# 4. Poblar la base de dades (crea rols, permisos i usuaris de prova)
npm run seed

# 5. Arrancar el servidor
npm start          # producció
npm run dev        # desenvolupament (nodemon)
```

## Variables d'Entorn (.env)

| Variable | Descripció | Exemple |
|---|---|---|
| `PORT` | Port del servidor | `3000` |
| `MONGODB_URI` | URI de MongoDB | `mongodb://localhost:27017/projecte-t9` |
| `JWT_ACCESS_SECRET` | Secret per als access tokens | cadena aleatòria llarga |
| `JWT_REFRESH_SECRET` | Secret per als refresh tokens | cadena aleatòria llarga |
| `JWT_ACCESS_EXPIRES` | Durada access token | `15m` |
| `JWT_REFRESH_EXPIRES` | Durada refresh token | `7d` |
| `EMAIL_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `EMAIL_USER` | Email emissor | `noreply@empresa.com` |
| `EMAIL_PASS` | Contrasenya SMTP | `app_password` |

## Usuaris de Prova (després del seed)

| Email | Contrasenya | Rol |
|---|---|---|
| superadmin@example.com | Password123! | SUPER_ADMIN |
| admin@example.com | Password123! | ADMIN |
| manager@example.com | Password123! | MANAGER |
| user@example.com | Password123! | USER |
| viewer@example.com | Password123! | VIEWER |

## Endpoints

### Autenticació
```
POST /api/auth/register          # Registre
POST /api/auth/login             # Login → accessToken + refreshToken
POST /api/auth/refresh           # Renovar access token
POST /api/auth/logout            # Logout (revoca tokens)
POST /api/auth/forgot-password   # Sol·licitar reset
POST /api/auth/reset-password/:token  # Restablir contrasenya
```

### Usuaris
```
GET    /api/users                    # Llistar (ADMIN+)
GET    /api/users/:id                # Obtenir un usuari
PUT    /api/users/:id                # Actualitzar
DELETE /api/users/:id                # Esborrar (ADMIN+)
GET    /api/users/:id/permissions    # Permisos efectius (rol + delegats)
```

### Rols
```
GET    /api/roles                    # Llistar rols
GET    /api/roles/:id                # Obtenir rol
POST   /api/roles                    # Crear (ADMIN+)
PUT    /api/roles/:id                # Actualitzar (ADMIN+)
DELETE /api/roles/:id                # Esborrar (ADMIN+)
GET    /api/roles/:id/hierarchy      # Cadena de herència
GET    /api/roles/:id/permissions    # Permisos propis + heretats
```

### Permisos
```
GET    /api/permissions              # Llistar
GET    /api/permissions/:id          # Obtenir
POST   /api/permissions              # Crear (ADMIN+)
PUT    /api/permissions/:id          # Actualitzar (ADMIN+)
DELETE /api/permissions/:id          # Esborrar (ADMIN+)
```

### Delegació de Permisos
```
GET    /api/delegations              # Llistar
GET    /api/delegations/:id          # Obtenir
POST   /api/delegations              # Crear (MANAGER+)
PUT    /api/delegations/:id          # Actualitzar (MANAGER+)
DELETE /api/delegations/:id          # Revocar (MANAGER+)
GET    /api/delegations/user/:userId # Delegacions d'un usuari
```

### Tasques
```
GET    /api/tasks                    # Llistar (paginació: ?page=1&limit=10)
GET    /api/tasks/:id                # Obtenir
POST   /api/tasks                    # Crear
PUT    /api/tasks/:id                # Actualitzar
DELETE /api/tasks/:id                # Esborrar
```

### Auditoria (ADMIN+)
```
GET /api/audit/logs                          # Logs (filtres: ?action=, ?userId=)
GET /api/audit/stats                         # Estadístiques globals
GET /api/audit/stats/user/:userId            # Stats per usuari
GET /api/audit/export?format=csv             # Exportar a CSV
```

## Flux JWT

```
Login → accessToken (15min) + refreshToken (7d)
↓
Cada petició: Authorization: Bearer <accessToken>
↓
Token expirat → POST /api/auth/refresh amb refreshToken
↓
Logout → ambdós tokens a la blacklist (MongoDB TTL)
```

## Estructura del Projecte

```
src/
├── config/         # database, jwt, constants, seed
├── models/         # User, Role, Permission, TokenBlacklist, etc.
├── middleware/     # auth, role, rateLimiter, audit, errorHandler
├── routes/         # authRoutes, userRoutes, roleRoutes, etc.
├── controllers/    # authController, userController, etc.
├── services/       # jwtService, authService, permissionService, etc.
└── utils/          # validators, logger
tests/
└── T9-Postman-Collection.json
```

## Tests Postman

Importa `tests/T9-Postman-Collection.json` a Postman.

**Ordre d'execució recomanat:**
1. Executa primer la carpeta **SETUP** per obtenir tokens i IDs
2. Executa les categories en ordre (1→9)
3. Els tests s'encadenen automàticament via variables de col·lecció

**51 proves cobertes**: Autenticació (7), Usuaris (5), Rols (8), Permisos (6), Delegació (6), Auditoria (5), Tasques (5), Seguretat (5), Errors (4)
