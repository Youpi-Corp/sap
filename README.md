# Brainforest API ("sap") Friendly Start

Hi! If this is your first time on GitHub, you're in the right place. You don’t need to know everything to get this running — just follow the steps and you’ll be fine.

This repo is the **backend API** for Brainforest. The frontend lives in the **"leaves"** project.

## What you need (local run)

- **Bun** (JavaScript runtime)
- **PostgreSQL** (database)

If you don’t have those yet, that’s okay — install them first, then come back.

## Quick start (local)

1) **Install dependencies**

```bash
bun install
```

2) **Create your environment file**

```bash
cp .env.example .env
```

3) **Update `.env`** with your database URL and JWT secrets

4) **Set up the database**

```bash
bun run setup
```

5) **Run the API**

```bash
bun run dev
```

You should see the API on `http://localhost:8080` and the docs at `http://localhost:8080/swagger`.

## Deploying (for schools/communities)

If you want to host this for your group, you’ll typically need:
- A Linux server (VPS)
- PostgreSQL
- A way to keep the API running (PM2 or similar)
- Environment variables set on the server

There’s a more technical guide here: `README-dev.md`.

## Need the dev docs?

The full technical README is still here:
- `README-dev.md`

It includes architecture, scripts, migrations, and advanced workflows.

---

You’ve got this. Start small, get it running locally, then level up when you’re ready.
