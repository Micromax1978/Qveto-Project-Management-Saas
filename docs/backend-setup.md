# Qveto Backend Setup Guide

## Prerequisites

- Node.js and npm
- PostgreSQL
- Git

## 1. Install dependencies

Open a terminal in the `backend` directory:

```bash
cd backend
npm install
```

## 2. Configure environment variables

Create a `.env` file inside `backend` with your local configuration:

```env
PORT=5000
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/qveto_db?schema=public"
```

Replace the username and password with your local PostgreSQL credentials. Do not commit `.env` or share database passwords.

## 3. Prepare the database

Generate the Prisma Client:

```bash
npx prisma generate
```

Apply existing migrations:

```bash
npx prisma migrate deploy
```

Check migration status:

```bash
npx prisma migrate status
```

## 4. Start the backend

```bash
node server.js
```

The server should start at `http://localhost:5000`.

## 5. Verify the backend

- Home endpoint: `http://localhost:5000/`
- Health endpoint: `http://localhost:5000/health`

The health endpoint checks whether the backend can communicate with PostgreSQL.

## Troubleshooting

- Confirm PostgreSQL is running and `DATABASE_URL` is correct.
- Confirm the required dependencies are installed.
- Review the terminal output for server or database errors.
- Never reset or delete the database just to resolve a connection problem.
