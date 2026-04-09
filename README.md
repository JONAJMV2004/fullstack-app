# 🏨 Cielito Home — Sistema de Lealtad Full-Stack

Aplicación web full-stack para el programa de lealtad del hotel **Cielito Home**. Permite a los huéspedes acumular puntos por estancias, canjear premios y ver su historial, con un panel de administración completo para gestión interna.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18, Vite, React Router DOM v6 |
| **Backend** | Node.js, Express |
| **Base de datos** | Supabase (PostgreSQL) |
| **Autenticación** | JWT, bcryptjs, OAuth (Google + Facebook) vía Supabase |
| **QR** | qrcode.react |

---

## 📁 Estructura del Proyecto

```
fullstack-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js              # Cliente Supabase (admin + público)
│   │   ├── controllers/
│   │   │   ├── authController.js        # Register, login, OAuth
│   │   │   ├── userController.js        # CRUD de perfiles de usuario
│   │   │   ├── lealtadController.js     # Estancias, puntos, premios, canjes
│   │   │   └── adminController.js       # Panel de administración
│   │   ├── middleware/
│   │   │   └── auth.js                  # Verificación JWT
│   │   ├── models/
│   │   │   └── userModel.js             # Queries a Supabase DB
│   │   ├── routes/
│   │   │   ├── auth.js                  # /api/auth/*
│   │   │   ├── users.js                 # /api/users/*
│   │   │   ├── lealtad.js               # /api/lealtad/*
│   │   │   └── admin.js                 # /api/admin/*
│   │   └── app.js                       # Configuración de Express
│   ├── server.js                        # Punto de entrada
│   ├── .env.example                     # Plantilla de variables de entorno
│   └── package.json
├── frontend-react/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Estado de sesión global (JWT + user)
│   │   ├── components/
│   │   │   ├── AdminLayout.jsx          # Layout del panel admin (sidebar)
│   │   │   ├── Alert.jsx                # Componente de alertas
│   │   │   ├── AppTopbar.jsx            # Barra superior de la app
│   │   │   ├── BottomNav.jsx            # Navegación inferior (mobile)
│   │   │   ├── CielitoLogo.jsx          # Logo de la marca
│   │   │   ├── SideMenu.jsx             # Menú lateral de ajustes
│   │   │   └── SocialAuth.jsx           # Botones OAuth (Google / Facebook)
│   │   ├── pages/
│   │   │   ├── SplashPage.jsx           # Pantalla de bienvenida
│   │   │   ├── LoginPage.jsx            # Inicio de sesión
│   │   │   ├── RegisterPage.jsx         # Registro de cuenta
│   │   │   ├── OAuthCallbackPage.jsx    # Callback OAuth
│   │   │   ├── HomePage.jsx             # Inicio: resumen del usuario
│   │   │   ├── RecompensasPage.jsx      # Catálogo de premios
│   │   │   ├── TarjetaPage.jsx          # Tarjeta de lealtad + QR
│   │   │   ├── DashboardPage.jsx        # Dashboard de puntos e historial
│   │   │   ├── AjustesPage.jsx          # Ajustes: idioma, tema, sesión
│   │   │   ├── EditarPerfilPage.jsx     # Edición de nombre y datos
│   │   │   ├── CambiarPasswordPage.jsx  # Cambio de contraseña
│   │   │   ├── NotificacionesPage.jsx   # Notificaciones del usuario
│   │   │   ├── AcercaPage.jsx           # Información de la app
│   │   │   ├── CondicionesPage.jsx      # Términos y condiciones
│   │   │   ├── SoportePage.jsx          # Soporte y contacto
│   │   │   └── admin/
│   │   │       ├── AdminReportesPage.jsx    # Reportes generales
│   │   │       ├── AdminUsuariosPage.jsx    # Gestión de usuarios
│   │   │       ├── AdminPuntosPage.jsx      # Ajuste de puntos
│   │   │       ├── AdminEstanciasPage.jsx   # Gestión de estancias
│   │   │       ├── AdminPremiosPage.jsx     # CRUD de premios
│   │   │       └── AdminCanjesPage.jsx      # Validación de canjes
│   │   ├── styles/
│   │   │   ├── cielito.css              # Estilos globales de la app
│   │   │   ├── dashboard.css            # Estilos del dashboard
│   │   │   └── admin.css               # Estilos del panel admin
│   │   ├── App.jsx                      # Rutas principales (pública/protegida/admin)
│   │   └── main.jsx                     # Entry point de React
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── supabase/
    └── schema.sql                       # Definición de tablas PostgreSQL
```

---

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/JONAJMV2004/fullstack-app.git
cd fullstack-app
```

### 2. Crear un proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo.
2. Abre el **Editor SQL** y ejecuta el contenido de `supabase/schema.sql`.
3. Copia tus credenciales desde **Configuración del proyecto → API**:
   - Project URL
   - Clave pública `anon`
   - Clave secreta `service_role`

### 3. Activar OAuth en Supabase (Google / Facebook)

1. Ve a **Authentication → Providers** en tu dashboard de Supabase.
2. Activa **Google** → ingresa tu Client ID y Client Secret.
3. Activa **Facebook** → ingresa tu App ID y App Secret.
4. Establece la **URL de redirección** en cada proveedor: `http://localhost:5000/api/auth/oauth/callback`

> Obtén credenciales de Google en [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.  
> Obtén credenciales de Facebook en [Facebook Developers](https://developers.facebook.com/) → Tu App → Settings → Basic.

### 4. Configurar el Backend

```bash
cd backend
cp .env.example .env
```

Edita `.env` con tus valores:

```env
PORT=5000
JWT_SECRET=tu_secreto_aleatorio_de_64_caracteres
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_clave_anon
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role
OAUTH_REDIRECT_URL=http://localhost:5000/api/auth/oauth/callback
FRONTEND_URL=http://localhost:5173
```

Generar un JWT secret seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Instalar dependencias e iniciar:
```bash
npm install
npm run dev      # desarrollo (nodemon)
# o
npm start        # producción
```

Backend disponible en: `http://localhost:5000`

### 5. Configurar el Frontend

```bash
cd frontend-react
npm install
npm run dev
```

Frontend disponible en: `http://localhost:5173`

---

## 🌐 Rutas del Frontend

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Splash / bienvenida |
| `/login` | Público | Inicio de sesión |
| `/register` | Público | Registro |
| `/oauth-callback` | Público | Callback OAuth |
| `/home` | 🔒 Protegido | Inicio del usuario |
| `/recompensas` | 🔒 Protegido | Catálogo de premios |
| `/tarjeta` | 🔒 Protegido | Tarjeta de lealtad + QR |
| `/dashboard` | 🔒 Protegido | Dashboard de puntos |
| `/ajustes` | 🔒 Protegido | Ajustes de cuenta |
| `/editar-perfil` | 🔒 Protegido | Editar perfil |
| `/cambiar-password` | 🔒 Protegido | Cambiar contraseña |
| `/notificaciones` | 🔒 Protegido | Notificaciones |
| `/acerca` | 🔒 Protegido | Acerca de la app |
| `/condiciones` | 🔒 Protegido | Términos y condiciones |
| `/soporte` | 🔒 Protegido | Soporte |
| `/admin` | 👑 Admin | Reportes generales |
| `/admin/usuarios` | 👑 Admin | Gestión de usuarios |
| `/admin/puntos` | 👑 Admin | Ajuste de puntos |
| `/admin/estancias` | 👑 Admin | Gestión de estancias |
| `/admin/premios` | 👑 Admin | CRUD de premios |
| `/admin/canjes` | 👑 Admin | Validación de canjes |

---

## 📡 API Reference

### Auth (`/api/auth`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/register` | No | Registro con nombre, email, contraseña |
| POST | `/login` | No | Login con email y contraseña |
| GET | `/oauth/google` | No | URL de redirección de Google OAuth |
| GET | `/oauth/facebook` | No | URL de redirección de Facebook OAuth |
| POST | `/oauth/callback` | No | Canjear tokens de Supabase por JWT de app |
| GET | `/me` | JWT | Obtener perfil del usuario actual |

### Usuarios (`/api/users`) — requieren JWT

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar todos los usuarios |
| GET | `/:id` | Obtener usuario por ID (solo propio) |
| PUT | `/:id` | Actualizar nombre / contraseña (solo propio) |
| DELETE | `/:id` | Eliminar cuenta (solo propio) |

### Lealtad (`/api/lealtad`) — requieren JWT

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/estancias` | Registrar una estancia |
| GET | `/estancias` | Ver estancias del usuario |
| GET | `/puntos` | Consultar saldo y resumen de puntos |
| GET | `/premios` | Listar premios disponibles |
| POST | `/canjes` | Canjear un premio |
| GET | `/canjes` | Ver historial de canjes |
| POST | `/canjes/validar` | Validar código QR de canje |

### Admin (`/api/admin`) — requieren JWT + rol `admin`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/usuarios` | Listar todos los usuarios |
| DELETE | `/usuarios/:id` | Eliminar usuario |
| GET | `/puntos` | Ver puntos de todos los usuarios |
| POST | `/puntos` | Ajustar puntos manualmente |
| GET | `/estancias` | Ver todas las estancias |
| PATCH | `/estancias/:id` | Actualizar estado de estancia |
| GET | `/premios` | Listar premios |
| POST | `/premios` | Crear premio |
| PATCH | `/premios/:id` | Actualizar premio |
| DELETE | `/premios/:id` | Eliminar premio |
| GET | `/canjes` | Ver todos los canjes |
| POST | `/canjes/validar` | Validar canje (admin) |
| GET | `/reportes` | Obtener reportes generales |

---

## 🔐 Flujo de Autenticación

### Email / Contraseña
1. El usuario llena el formulario → el frontend hace POST a `/api/auth/register` o `/api/auth/login`
2. El backend valida, hashea la contraseña (bcrypt), guarda en Supabase y devuelve un JWT
3. El frontend guarda el JWT en `localStorage` y redirige a `/home`

### OAuth (Google / Facebook)
1. El usuario hace clic en el botón → GET a `/api/auth/oauth/google` o `/facebook`
2. El backend devuelve la URL de Supabase OAuth → el frontend redirige al navegador
3. El usuario se autentica con el proveedor → Supabase redirige a `/oauth-callback`
4. `OAuthCallbackPage` extrae los tokens y hace POST a `/api/auth/oauth/callback`
5. El backend verifica la sesión de Supabase, crea/actualiza el usuario en DB y devuelve un JWT de app
6. El frontend guarda el JWT y redirige a `/home`

---

## 👑 Roles de Usuario

| Rol | Acceso |
|-----|--------|
| `user` | Rutas protegidas estándar (home, recompensas, tarjeta, etc.) |
| `admin` | Todo lo anterior + rutas `/admin/*` con panel de administración |
