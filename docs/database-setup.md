# Qveto Database Setup Guide

## 1. Technology Used

- PostgreSQL — Database
- Prisma ORM — Database management
- Node.js — Runtime environment

## 2. Prerequisites

Install the following:

- Node.js and npm
- PostgreSQL
- Git

## 3. Get the Project

Clone the Qveto repository and switch to the `Database-Analytics` branch.

## 4. Install Dependencies

Open a terminal in the `backend` folder and run:

```bash
npm install
```

## 5. Configure Environment Variables

Create a `.env` file inside the `backend` folder.

Add your own PostgreSQL connection string:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/qveto_db?schema=public"
```

Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your local PostgreSQL credentials.

**Never commit or share the `.env` file.**

## 6. Create the Database

Create a PostgreSQL database named `qveto_db` using PostgreSQL tools.

## 7. Apply Migrations

From the `backend` folder, run:

```bash
npx prisma migrate deploy
```

## 8. Generate Prisma Client

Run:

```bash
npx prisma generate
```

## 9. Verify the Database

Run:

```bash
npx prisma migrate status
```

The database should report that its schema is up to date.

To inspect the tables, run:

```bash
npx prisma studio
```

## 10. Sample Data

The project includes a seed script at `prisma/seed.ts` for creating demo organizations, users, memberships, workspaces, projects, and tasks.

Run it with:

```bash
npx tsx prisma/seed.ts
```

The seed script can create additional workspaces, projects, and tasks when run repeatedly.