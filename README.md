# Full-Stack App — Node.js + Express + Supabase

A full-stack authentication app with email/password and OAuth (Google + Facebook) login, built with:

- **Backend:** Node.js, Express, Supabase (PostgreSQL), JWT, bcrypt
- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks)

---

## Project Structure

```
fullstack-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js          # Supabase client setup (admin + public)
│   │   ├── controllers/
│   │   │   ├── authController.js    # Register, login, OAuth handlers
│   │   │   └── userController.js    # CRUD for user profiles
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT verification middleware
│   │   ├── models/
│   │   │   └── userModel.js         # Supabase DB queries
│   │   ├── routes/
│   │   │   ├── auth.js              # /api/auth/* routes
│   │   │   └── users.js             # /api/users/* routes
│   │   └── app.js                   # Express app setup
│   ├── server.js                    # Entry point
│   ├── .env.example                 # Environment variable template
│   └── package.json
├── frontend/
│   ├── index.html                   # Login / Register page
│   ├── dashboard.html               # Protected user dashboard
│   ├── /oauth-callback route        # OAuth redirect handler (React Router)
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── auth.js                  # Shared auth utilities (token storage)
│       ├── app.js                   # Login/register page logic
│       ├── oauth-callback.js        # Exchanges OAuth tokens for app JWT
│       └── dashboard.js             # Dashboard page logic
└── supabase/
    └── schema.sql                   # PostgreSQL table definition
```

---

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`.
3. Copy your credentials from **Project Settings → API**:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 2. Enable Google & Facebook OAuth in Supabase

1. Go to **Authentication → Providers** in your Supabase dashboard.
2. Enable **Google** — enter your Google OAuth Client ID and Secret.
3. Enable **Facebook** — enter your Facebook App ID and Secret.
4. Set the **Redirect URL** in each provider to: `http://localhost:3000/oauth-callback`

> Get Google credentials from [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
> Get Facebook credentials from [Facebook Developers](https://developers.facebook.com/) → Your App → Settings → Basic.

### 3. Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
JWT_SECRET=your_random_64_char_secret
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OAUTH_REDIRECT_URL=http://localhost:3000/oauth-callback
FRONTEND_URL=http://localhost:3000
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Install Dependencies & Run Backend

```bash
cd backend
npm install
npm run dev      # development (nodemon)
# or
npm start        # production
```

Backend runs at: `http://localhost:5000`

### 5. Serve the Frontend

Serve the `frontend/` directory with any static file server, e.g.:

```bash
# Using Node.js http-server
npx http-server frontend -p 3000 -c-1

# Using Python
cd frontend && python -m http.server 3000
```

Frontend runs at: `http://localhost:3000`

---

## API Reference

### Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register with name, email, password |
| POST | `/login` | No | Login with email, password |
| GET | `/oauth/google` | No | Get Google OAuth redirect URL |
| GET | `/oauth/facebook` | No | Get Facebook OAuth redirect URL |
| POST | `/oauth/callback` | No | Exchange Supabase tokens for app JWT |
| GET | `/me` | JWT | Get current user profile |

### User Routes (`/api/users`) — all require JWT

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all users |
| GET | `/:id` | Get user by ID (own only) |
| PUT | `/:id` | Update name / password (own only) |
| DELETE | `/:id` | Delete account (own only) |

---

## Authentication Flow

### Email/Password
1. User submits form → frontend POSTs to `/api/auth/register` or `/api/auth/login`
2. Backend validates, hashes password (bcrypt), stores in Supabase, returns JWT
3. Frontend stores JWT in `localStorage`, redirects to dashboard

### OAuth (Google / Facebook)
1. User clicks button → frontend GETs `/api/auth/oauth/google` or `/facebook`
2. Backend returns Supabase OAuth URL → frontend redirects the browser
3. User authenticates with provider → Supabase redirects to `/oauth-callback#access_token=...`
4. `oauth-callback.js` extracts tokens, POSTs to `/api/auth/oauth/callback`
5. Backend verifies Supabase session, upserts user in DB, returns app JWT
6. Frontend stores JWT, redirects to dashboard

---

## Deploy en Render (Backend + Frontend React)

Este repositorio ya incluye `render.yaml` para crear ambos servicios desde Blueprint.

### 1) Crear los servicios

1. Sube este repo a GitHub.
2. En Render: **New +** → **Blueprint**.
3. Selecciona tu repositorio para que Render lea `render.yaml`.

Se crearán:
- `fullstack-app-backend` (Web Service Node)
- `fullstack-app-frontend` (Static Site Vite)

### 2) Configurar variables en Render

En el servicio **backend**:
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL` = URL del frontend en Render (ej. `https://fullstack-app-frontend.onrender.com`)
- `OAUTH_REDIRECT_URL` = `https://<tu-frontend>.onrender.com/oauth-callback`

En el servicio **frontend**:
- `VITE_API_BASE_URL` = `https://<tu-backend>.onrender.com/api`

### 3) Ajustar OAuth provider en Supabase

En Supabase Authentication Providers (Google/Facebook), usa:
- Redirect URL: `https://<tu-frontend>.onrender.com/oauth-callback`

### 4) Probar despliegue

- Backend health: `https://<tu-backend>.onrender.com/api/health`
- Frontend: `https://<tu-frontend>.onrender.com`

Si ves error CORS, revisa que `FRONTEND_URL` coincida exactamente con el dominio del sitio frontend (sin slash final).
