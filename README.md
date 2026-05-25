# leaseMate

## Database migrations

Run Alembic commands from the backend directory:

```bash
cd backend
alembic upgrade head
```

Create a new migration after model changes:

```bash
cd backend
alembic revision --autogenerate -m "describe change"
```

The app no longer creates tables on startup by default. Set
`AUTO_CREATE_TABLES=true` only for throwaway local prototyping.

## Lightweight backend checks

Run this during development for quick backend sanity checks:

```bash
scripts/check_backend.sh
```

This compiles backend Python files inside the Docker backend container and
validates the production Compose file without printing resolved secrets.
