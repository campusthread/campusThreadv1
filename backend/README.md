# Miggle Backend

Fresh backend scaffold for the CampusThread project.

## Run

```bash
npm install
npm run dev
```

## Structure

- `server/app.js`: Express app setup
- `server/server.js`: runtime boot sequence
- `server/config`: env, db, redis, security, sockets
- `server/controllers`: request handlers
- `server/services`: business logic
- `server/routes`: route definitions
- `server/middleware`: auth, validation, errors, rate limiting
- `server/models`: Mongoose models
- `server/utils`: shared helpers
