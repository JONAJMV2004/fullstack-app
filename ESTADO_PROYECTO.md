# Cielito Home — Documento de Estado del Proyecto

**Fecha de actualización:** 27 de marzo de 2026
**Versión:** 1.0.0
**Estado general:** ✅ En desarrollo activo

---

## Descripción General

**Cielito Home** es una aplicación web progresiva (PWA) de programa de lealtad para huéspedes de un hotel/hospedaje. Permite a los clientes acumular puntos por sus estancias y canjearlos por premios. El administrador gestiona usuarios, puntos, estancias, premios y canjes desde un panel dedicado.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite |
| Enrutamiento | React Router DOM v6 |
| Backend | Node.js + Express 4 |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | JWT (jsonwebtoken) |
| Hash de contraseñas | bcryptjs |
| Subida de archivos | Multer |
| Almacenamiento de imágenes | Supabase Storage |
| QR codes | qrcode.react |

---

## Estructura del Proyecto

```
fullstack-app/
├── backend/                   → API REST (Node.js + Express)
│   ├── src/
│   │   ├── app.js             → Configuración principal de Express
│   │   ├── server.js          → Punto de entrada (puerto 5000)
│   │   ├── config/
│   │   │   └── supabase.js    → Cliente de Supabase (anon + service role)
│   │   ├── middleware/
│   │   │   └── auth.js        → Verificación de JWT (verifyToken)
│   │   ├── models/            → Consultas a Supabase
│   │   │   ├── usuarioModel.js
│   │   │   ├── puntosModel.js
│   │   │   ├── estanciaModel.js
│   │   │   ├── premioModel.js
│   │   │   └── canjeModel.js
│   │   ├── controllers/       → Lógica de negocio
│   │   │   ├── authController.js
│   │   │   ├── lealtadController.js
│   │   │   └── adminController.js
│   │   └── routes/            → Definición de rutas
│   │       ├── auth.js
│   │       ├── lealtad.js
│   │       └── admin.js
│   ├── .env                   → Variables de entorno (NO subir a git)
│   └── package.json
│
└── frontend-react/            → SPA (React + Vite)
    ├── src/
    │   ├── main.jsx           → Punto de entrada React
    │   ├── App.jsx            → Definición de rutas (React Router)
    │   ├── context/
    │   │   └── AuthContext.jsx → Token JWT, usuario, authHeaders()
    │   ├── components/
    │   │   ├── AdminLayout.jsx → Layout del panel admin (sidebar + topbar)
    │   │   ├── AppTopbar.jsx   → Barra superior de la app cliente
    │   │   ├── BottomNav.jsx   → Navegación inferior (app cliente)
    │   │   └── Alert.jsx       → Componente de alertas
    │   ├── pages/
    │   │   ├── SplashPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── HomePage.jsx
    │   │   ├── RecompensasPage.jsx
    │   │   ├── TarjetaPage.jsx
    │   │   ├── AjustesPage.jsx
    │   │   └── admin/
    │   │       ├── AdminReportesPage.jsx
    │   │       ├── AdminUsuariosPage.jsx
    │   │       ├── AdminPuntosPage.jsx
    │   │       ├── AdminEstanciasPage.jsx
    │   │       ├── AdminPremiosPage.jsx
    │   │       └── AdminCanjesPage.jsx
    │   └── styles/
    │       ├── cielito.css    → Estilos de la app cliente (PWA)
    │       └── admin.css      → Estilos del panel admin
    ├── public/
    │   ├── LOGO_CH.png
    │   └── manifest.json      → Manifiesto PWA
    ├── index.html             → Meta tags PWA, safe-area, theme-color
    └── package.json
```

---

## Base de Datos (Supabase)

### Tabla `usuarios`
Almacena todos los usuarios del sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | bigint / uuid | PK |
| `nombre` | text | Nombre completo |
| `email` | text (unique) | Correo electrónico |
| `password_hash` | text | Contraseña hasheada con bcryptjs |
| `tipo_usuario` | text | `cliente` \| `admin` \| `staff` |
| `provider` | text | `local` \| `google` \| `facebook` |
| `avatar_url` | text | URL de foto de perfil |
| `fecha_registro` | timestamp | Fecha de registro |

### Tabla `puntos`
Libro de movimientos de puntos (positivos = ganados, negativos = canjeados).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | bigint | PK |
| `usuario_id` | bigint | FK → usuarios |
| `puntos` | integer | Cantidad (puede ser negativo) |
| `descripcion` | text | Motivo del movimiento |
| `fecha` | timestamp | Fecha del movimiento |

### Tabla `estancias`
Registro de estadías de los huéspedes.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | bigint | PK |
| `usuario_id` | bigint | FK → usuarios |
| `fecha_check_in` | date | Fecha de llegada |
| `fecha_check_out` | date | Fecha de salida |
| `puntos_ganados` | integer | Puntos asignados |
| `estado` | text | `pendiente` \| `aprobado` \| `rechazado` |

### Tabla `premios`
Catálogo de premios canjeables.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | bigint | PK |
| `nombre` | text | Nombre del premio |
| `puntos_necesarios` | integer | Costo en puntos |
| `disponibilidad` | integer | Unidades disponibles |
| `imagen_url` | text | URL de imagen (Supabase Storage) |

> ⚠️ **Requerido:** Ejecutar en Supabase SQL Editor:
> ```sql
> ALTER TABLE premios ADD COLUMN IF NOT EXISTS imagen_url text;
> ```

### Tabla `canjes`
Registro de canjes realizados por clientes.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | bigint | PK |
| `usuario_id` | bigint | FK → usuarios |
| `premio_id` | bigint | FK → premios |
| `puntos_utilizados` | integer | Puntos deducidos |
| `codigo_unico` | text | Código de 12 chars para validar |
| `estado` | text | `pendiente` \| `aprobado` \| `rechazado` |
| `fecha` | timestamp | Fecha del canje |

---

## Endpoints de la API

### Autenticación — `/api/auth`

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/register` | Registrar nuevo usuario | No |
| POST | `/login` | Iniciar sesión | No |
| GET | `/me` | Obtener usuario actual | JWT |
| PUT | `/update-password` | Cambiar contraseña propia | JWT |
| DELETE | `/me` | Eliminar cuenta propia | JWT |

### Lealtad — `/api/lealtad` (requiere JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/estancias` | Registrar nueva estancia |
| GET | `/estancias` | Ver mis estancias |
| GET | `/puntos` | Ver balance e historial de puntos |
| GET | `/premios` | Ver catálogo de premios disponibles |
| POST | `/canjes` | Canjear un premio |
| GET | `/canjes` | Ver mis canjes |

### Admin — `/api/admin` (requiere JWT + rol admin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/usuarios` | Listar todos los usuarios |
| PATCH | `/usuarios/:id` | Editar nombre y rol de usuario |
| PATCH | `/usuarios/:id/password` | Cambiar contraseña de usuario |
| DELETE | `/usuarios/:id` | Eliminar usuario |
| GET | `/puntos` | Ver todos los movimientos de puntos |
| POST | `/puntos` | Ajustar puntos de un usuario manualmente |
| GET | `/estancias` | Ver todas las estancias |
| PATCH | `/estancias/:id` | Aprobar/rechazar estancia y asignar puntos |
| GET | `/premios` | Ver todos los premios |
| POST | `/premios` | Crear premio |
| PATCH | `/premios/:id` | Editar premio |
| DELETE | `/premios/:id` | Eliminar premio |
| POST | `/premios/:id/imagen` | Subir imagen de premio |
| GET | `/canjes` | Ver todos los canjes |
| POST | `/canjes/validar` | Validar código de canje |
| GET | `/reportes` | Ver estadísticas generales |

---

## Páginas del Frontend

### App Cliente

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | SplashPage | Pantalla de bienvenida con acciones de login/registro |
| `/login` | LoginPage | Formulario de inicio de sesión |
| `/register` | RegisterPage | Formulario de registro |
| `/home` | HomePage | Tarjeta de lealtad, puntos, registrar estancia |
| `/recompensas` | RecompensasPage | Catálogo de premios canjeables |
| `/tarjeta` | TarjetaPage | Vista ampliada de la tarjeta y QR |
| `/ajustes` | AjustesPage | Perfil, cambio de contraseña, cerrar sesión |

### Panel Admin

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/admin` | AdminReportesPage | Estadísticas generales del programa |
| `/admin/usuarios` | AdminUsuariosPage | Gestión de usuarios (editar rol, contraseña, eliminar) |
| `/admin/puntos` | AdminPuntosPage | Buscar usuario y ajustar puntos manualmente |
| `/admin/estancias` | AdminEstanciasPage | Revisar y aprobar estancias de clientes |
| `/admin/premios` | AdminPremiosPage | CRUD de premios + subida de imágenes |
| `/admin/canjes` | AdminCanjesPage | Historial de canjes + validación de códigos |

---

## Autenticación y Roles

- Los tokens JWT duran **7 días** y contienen: `{ id, email, tipo_usuario }`
- Al iniciar sesión, si `tipo_usuario === 'admin'` se redirige a `/admin/reportes`
- Si `tipo_usuario === 'cliente'` o `'staff'`, se redirige a `/home`
- Las rutas `/admin/*` verifican el rol en el middleware `requireAdmin`

### Roles disponibles

| Rol | Acceso |
|-----|--------|
| `cliente` | App de cliente (/home, /recompensas, etc.) |
| `admin` | Panel admin completo + app de cliente |
| `staff` | Igual que cliente (sin funcionalidad diferenciada aún) |

---

## PWA — Configuración

- **Manifest:** `frontend-react/public/manifest.json`
- **Theme color:** `#2D6A50` (verde Cielito)
- **Display mode:** `standalone` (sin barra del navegador)
- **Orientación:** portrait
- **Safe area:** Soporte para notch, Dynamic Island e indicador de inicio (iOS/Android)
- **Viewport:** `viewport-fit=cover`

---

## Variables de Entorno (backend/.env)

```env
PORT=5000
SUPABASE_URL=https://[proyecto].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=[clave secreta]
```

> ⚠️ El archivo `.env` **no debe subirse a Git**.

---

## Cómo Iniciar el Proyecto

### Backend
```bash
cd backend
npm install
npm run dev        # Inicia en http://localhost:5000
```

### Frontend
```bash
cd frontend-react
npm install
npm run dev        # Inicia en http://localhost:3001
```

> El frontend hace proxy de `/api` hacia el backend en el puerto 5000 (configurado en `vite.config.js`).

---

## Pendientes / Notas

- [ ] Ejecutar `ALTER TABLE premios ADD COLUMN IF NOT EXISTS imagen_url text;` en Supabase
- [ ] Crear bucket `premios` en Supabase Storage (tipo: público)
- [ ] Definir funcionalidad para rol `staff`
- [ ] Configurar Service Worker para modo offline
- [ ] Configurar notificaciones push (opcional)

---

*Documento generado el 27 de marzo de 2026*
