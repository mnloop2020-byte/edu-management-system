# Edu Management System

React frontend for the Edu Management System. It connects to the backend API and provides dashboards for school administration, students, teachers, parents, attendance, payments, assignments, calendar, gradebook, communications, transcripts, audit logs, and workflow tools.

Backend repository: https://github.com/mnloop2020-byte/edu-management-backend

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- Axios
- Recharts
- Tailwind CSS

## Requirements

- Node.js 18 or newer
- npm
- Running backend API

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create the environment file:

```bash
cp .env.example .env.local
```

3. Set the backend API URL:

```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

4. Start the development server:

```bash
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Build

```bash
npm run build
```

## API Configuration

The frontend reads the API URL from `VITE_API_BASE_URL`. For compatibility, `VITE_API_URL` is also supported. If neither is set, it falls back to the deployed Railway backend URL.

## Deployment

This app is ready for Vercel. Configure `VITE_API_BASE_URL` in the Vercel project settings so the frontend points to the deployed backend API.
