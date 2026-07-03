# Employee Leave Management System

An enterprise-grade, full-stack Employee Leave Management System designed for modern HR administration. It enables employees to request leaves, track their balances, and view request history, while managers can approve or reject applications with comments.

## Tech Stack

### Frontend
- **React 19** & **Vite** & **TypeScript**
- **Tailwind CSS** (Custom theme configurations)
- **React Router v6** (Protected and role-based routing guards)
- **TanStack Query v5** (Server-state caching and auto API re-fetching)
- **React Hook Form** & **Zod** (Form schema validations)
- **Axios** (Session cookie forwarding and automatic JWT access/refresh token rotation)
- **Recharts** (Visual leave type analytics)
- **Sonner** (Rich toast notifications)

### Backend
- **Node.js** & **Express.js** with **TypeScript**
- **Prisma ORM** (Database client and schema migrations)
- **PostgreSQL**
- **JWT Authentication** (Short-lived access tokens + rotate-on-refresh cookies)
- **bcryptjs** (Secure salted password hashing)
- **Helmet** & **CORS** & **Express Rate Limit** (Production-ready request headers and DDOS/Brute-force security shields)
- **Morgan Logger** & **Cookie Parser** & **Express Validator** (HTTP logs, cookie binding, and body validations)

---

## Folder Structure

```text
leave-management-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Prisma database connection singleton
│   │   ├── controllers/     # Route endpoints handler logic
│   │   ├── middlewares/     # Auth, logs, rate limits, validation middlewares
│   │   ├── repositories/    # Database queries data layer
│   │   ├── routes/          # Express route bindings
│   │   ├── services/        # Central business rule services
│   │   ├── types/           # Request TS type overrides
│   │   ├── utils/           # Custom error utility classes
│   │   ├── app.ts           # Express configurations
│   │   └── server.ts        # Node server listener
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── schema.prisma        # Prisma schemas for PostgreSQL
│   ├── seed.ts              # Seeding engine for mock managers and employees
│   └── er-diagram.md        # Mermaid-based entity relationship layout
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/        # ProtectedRoute wrapper
│   │   │   ├── layout/      # Sidebar, Header, DashboardLayout
│   │   │   └── ui/          # Custom Buttons, Cards, Inputs, Dialogs, Badges
│   │   ├── context/         # AuthContext & ThemeContext
│   │   ├── pages/           # Login, Dashboard, History, Apply, Details, Profiles
│   │   ├── services/        # Axios API client setup with token rotation
│   │   ├── utils.ts         # Dynamically merge CSS classes helper (cn)
│   │   ├── App.tsx          # Client routing guards
│   │   ├── index.css        # Tailwind style variables & theme sheets
│   │   └── main.tsx         # React mounting entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docs/
│   └── swagger.json         # Swagger OpenAPI 3.0 API specifications
├── postman/
│   └── collection.json      # Full Postman JSON test collection
├── .gitignore
├── .env.example
└── README.md
```

---

## Local Development Installation

### 1. Database Setup & Configurations
1. Create a PostgreSQL database instance locally or on a cloud provider like Neon.
2. In the root directory, create a `.env` file (based on `.env.example`) and configure your connection strings:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:password@localhost:5432/leave_db?schema=public"
JWT_ACCESS_SECRET="generate_a_random_very_long_string_here"
JWT_REFRESH_SECRET="generate_another_random_very_long_string_here"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
```

### 2. Backend Server Boot
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate the Prisma DB client mapping:
   ```bash
   npm run prisma:generate
   ```
4. Run migrations to create the database schemas:
   ```bash
   npm run prisma:migrate
   ```
5. Seed the database with test profiles:
   ```bash
   npm run db:seed
   ```
   *This seeds a Manager: `manager@example.com` and 5 Employees: `employee1@example.com` (password for all: `Password123`).*
6. Start the Express development server:
   ```bash
   npm run dev
   ```
   *The server runs on `http://localhost:5000`.*

### 3. Frontend App Boot
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React client:
   ```bash
   npm run dev
   ```
   *The client runs on `http://localhost:5173`.*

---

## Deployment Instructions

This project is fully structured to support deployments on **Vercel** (for the frontend client) and **Render** (for the backend server & PostgreSQL database).

### 1. Database Deployment (Neon / Render PostgreSQL)
- Create a new PostgreSQL Database on Neon or Render.
- Copy the external Database connection URL.

### 2. Backend Deployment (Render)
- Link your GitHub repository to a new **Web Service** on Render.
- Set the following settings:
  - **Environment**: `Node`
  - **Build Command**: `cd backend && npm install && npm run build`
  - **Start Command**: `cd backend && npm run prisma:generate && npm run start`
- Add the Environment variables in Render Settings dashboard:
  - `DATABASE_URL`: *Your cloud DB URL*
  - `PORT`: `10000` (or leave default)
  - `NODE_ENV`: `production`
  - `CLIENT_URL`: *Your Vercel deployment URL*
  - `JWT_ACCESS_SECRET`: *Your secret*
  - `JWT_REFRESH_SECRET`: *Your secret*
- Run Prisma migrations once by running a one-time build shell or by prepending `npx prisma migrate deploy` to the start script.

### 3. Frontend Deployment (Vercel)
- Create a new Project on Vercel.
- Select the `frontend` subdirectory of your repository.
- Build settings will automatically detect Vite. Set:
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
- Create a file `vercel.json` in the frontend root to handle fallback routing for React SPA:
  ```json
  {
    "rewrites": [
      {
        "source": "/api/(.*)",
        "destination": "https://your-backend-render-url.onrender.com/api/$1"
      },
      {
        "source": "/((?!api/).*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
  *This redirects all API requests from your Vercel URL directly to Render, eliminating CORS configurations.*

---

## Swagger API Documentation
Open your browser and navigate to `http://localhost:5000/api-docs` when the backend is running to view interactive API documentation.
