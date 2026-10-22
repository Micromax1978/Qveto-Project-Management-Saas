# Qveto Database Setup Guide

## 1. Technology Used

- PostgreSQL — Database
- Prisma ORM — Database schema and migrations
- Node.js and npm — Runtime and package management

## 2. Prerequisites

Install the following:

- Node.js and npm
- PostgreSQL
- Git

You should also have access to the Qveto repository.

## 3. Get the Project

Clone the Qveto repository and switch to the `Database-Analytics` branch.

If the repository is already cloned, open a terminal in the repository root and run:

```bash
git switch Database-Analytics
git pull origin Database-Analytics
```

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

Never commit or share the `.env` file. Do not put real database credentials in documentation or Git commits.

## 6. Create the Database

Using PostgreSQL tools such as pgAdmin, create a database named:

```text
qveto_db
```

Ensure the username and password in `backend/.env` match an account that can connect to this database.

## 7. Apply Migrations

From the `backend` folder, run:

```bash
npx prisma migrate deploy
```

This applies pending migrations already included in the repository. It is the recommended command for setting up an existing project from its committed migrations.

When developing a database schema change, create a migration using:

```bash
npx prisma migrate dev --name describe_your_change
```

Replace `describe_your_change` with a short name describing the change. Review and commit the generated migration files along with the schema change.

Do not edit an already-applied migration just to change the database schema; create a new migration instead.

## 8. Generate Prisma Client

Run this command from the `backend` folder:

```bash
npx prisma generate
```

This generates the Prisma Client used by application code to interact with the database.

## 9. Verify the Database

Check migration status:

```bash
npx prisma migrate status
```

The database should report that its schema is up to date.

To inspect database records visually, run:

```bash
npx prisma studio
```

## 10. Sample Data

The project includes a seed script at:

```text
backend/prisma/seed.ts
```

It creates demo organizations, users, memberships, workspaces, projects, project memberships, and tasks.

From the `backend` folder, run:

```bash
npx tsx prisma/seed.ts
```

Use only a development database for sample data. Inspect the existing records before running the seed script on a database that contains important data.

## 11. Organization Isolation Checks

The repository includes read-only SQL validation queries at:

```text
backend/prisma/organization-isolation-checks.sql
```

Open the file in pgAdmin's Query Tool while connected to `qveto_db`, then execute the queries.

The checks look for:

- Tasks linked to projects in a different organization.
- Projects linked to workspaces in a different organization.
- Project members who do not belong to the project's organization.

A result of `0` means the corresponding query found no matching records. These checks validate existing data; they do not prove that application API authorization is secure.

## 12. Troubleshooting

### Database connection errors

- Confirm PostgreSQL is running.
- Confirm the database `qveto_db` exists.
- Check the connection details in your local `backend/.env`.
- Never share your password or commit your `.env` file.

### Migration errors

Run:

```bash
npx prisma migrate status
```

Check the error message and confirm that the database connection works before attempting further migration commands.

### Prisma Client issues

Run:

```bash
npx prisma generate
```

Then retry the relevant development command.

## 13. Setup Completion Checklist

- [ ] PostgreSQL is installed and running.
- [ ] The `qveto_db` database exists.
- [ ] `backend/.env` contains the correct local connection string.
- [ ] Backend dependencies are installed.
- [ ] Prisma migrations have been applied.
- [ ] Prisma Client has been generated.
- [ ] Migration status reports that the database schema is up to date.
- [ ] Sample data has been seeded if required.
- [ ] Organization-isolation validation queries have been executed.
