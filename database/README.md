# Database setup

This project can now load its demo data from a MySQL database instead of the
bundled in-memory arrays. The `schema.sql` file creates the required tables and
seeds them with the same sample records that ship with the repository.

## 1. Create the schema and seed data

```bash
mysql -u <user> -p < database/schema.sql
```

The script creates a database named `pos_jither` and populates it with product
categories, menu items, inventory entries, staff accounts, demo transactions,
and two application users (`manager` / `cashier`, password `1234`).

## 2. Configure the application

Set the following environment variables before running PHP locally:

- `DB_HOST` – MySQL host (default `127.0.0.1`)
- `DB_PORT` – MySQL port (default `3306`)
- `DB_NAME` – Database name (`pos_jither` if you used the script)
- `DB_USER` – Database user
- `DB_PASSWORD` – Database password

Alternatively you can provide a full DSN via `DB_DSN` or a `DATABASE_URL`
(`mysql://user:password@host:port/database`).

When these variables are set the application will automatically read the menu,
inventory, staff, and sales data from MySQL. If the connection fails or is not
configured the existing in-memory demo data is used as a fallback.
