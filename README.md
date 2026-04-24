# Edu Management System Frontend

This repository contains the web interface for the Edu Management System. It is a role-aware React application designed for daily school operations, with separate workflows for administrators, teachers, and students. The frontend consumes the backend API and presents dashboards, academic records, operational tools, and communication views in a single application shell.

Backend repository: `https://github.com/mnloop2020-byte/edu-management-backend`

## What the App Includes

- Dashboard with notifications, summaries, and operational indicators
- Student management and student profile views
- Teacher management and performance tracking
- Attendance workflows
- Payments and balance management
- Assignments and submission tracking
- Calendar and event planning
- Gradebook and transcripts
- Parent-related administration
- Communications center and audit log
- Global search, session handling, theme support, and localization hooks

## Supported Roles

- `ADMIN`
- `TEACHER`
- `STUDENT`

Route access is enforced in the UI and backed by API authorization.

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS
- Recharts
- Framer Motion

## Local Development

### Requirements

- Node.js 18 or newer
- npm
- Running backend API

### Setup

```bash
npm install
```

Create the local environment file:

```bash
cp .env.example .env.local
```

Set the backend URL:

```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

Start the app:

```bash
npm run dev
```

Default local URL: `http://localhost:5173`

## Available Scripts

- `npm run dev`: start the Vite development server
- `npm run build`: build the production bundle
- `npm run preview`: preview the production build locally
- `npm run lint`: run ESLint

## API Configuration

The client reads the backend base URL in this order:

1. `VITE_API_BASE_URL`
2. `VITE_API_URL`
3. Fallback to the deployed Railway API URL

This makes local development, Vercel deployment, and older environment naming conventions work without code changes.

## Main Application Areas

- `Landing`: entry page and public-facing start screen
- `Login` and `Register`: authentication flows
- `Dashboard`: overview, alerts, and quick actions
- `Students`, `StudentProfile`: student records and detailed profiles
- `Teachers`, `TeacherPerformance`: staff management and performance snapshots
- `Attendance`: attendance entry and analysis
- `Payments`: fees, installments, and transactions
- `Assignments`: assignment creation, tracking, and grading workflows
- `Calendar`: event scheduling and academic planning
- `Gradebook`: grade entry and academic scoring
- `Communications`: message and template management
- `Parents`: parent records and link management
- `AuditLog`: operational traceability
- `Transcripts`: academic transcript views

## Project Structure

- `src/pages`: route-level screens
- `src/components`: reusable interface components
- `src/context`: authentication state
- `src/api`: Axios client setup
- `src/hooks`: theme and locale helpers
- `src/utils`: display and localization helpers
- `src/assets`: local images and media

## Build and Deployment

Production build:

```bash
npm run build
```

This repository is ready for Vercel deployment. Configure `VITE_API_BASE_URL` in project environment variables so the frontend points to the correct backend API.
