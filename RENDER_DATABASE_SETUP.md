# Render PostgreSQL setup for this app

This project can connect to Render using a single `DATABASE_URL`, which is the easiest option for Render-hosted PostgreSQL.

## 1) Create the database

1. Go to the Render dashboard.
2. Create a **New PostgreSQL** service.
3. Pick a name, region, and plan.
4. After provisioning, Render will show:
   - `Internal Database URL` if the backend is also on Render
   - `External Database URL` if you need to connect from your local machine

## 2) Point the backend at Render

Set this environment variable in the backend service:

```env
DATABASE_URL=postgresql://...
```

If you prefer to use the individual Render database fields instead, the backend now also accepts:

```env
DB_HOST=...
DB_PORT=5432
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
```

Recommended production settings:

```env
NODE_ENV=production
PORT=5000
FRONTEND_ORIGIN=https://your-frontend-url.onrender.com
JWT_SECRET=your-strong-secret
```

If you want to keep using the older PG variables instead of `DATABASE_URL`, the app still supports:

```env
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
```

## 3) Run the schema against the new database

Once the backend can reach Render Postgres, start the backend so it can run its startup schema checks and migrations.

If your database is empty, you may need to import or create the tables first. The backend expects tables such as:

- `userinfo`
- `user_learning_stats`
- `user_topic_progress`
- `isl_words`

## 4) Important SSL note

Render PostgreSQL connections usually require SSL in production. This project now enables SSL automatically when `DATABASE_URL` is present or when `NODE_ENV=production`.

## 5) Quick checklist

- [ ] Create Render PostgreSQL service
- [ ] Copy `DATABASE_URL` into backend environment variables
- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_ORIGIN` to the deployed frontend URL
- [ ] Start the backend and verify it can query the database

## 6) If you are deploying only the database

If you only want the database right now, stop after step 1 and save the `DATABASE_URL` for later.

When you deploy the backend, use that saved URL as the database connection string.