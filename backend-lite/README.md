# backend-lite (Azure-ready)

Minimal Node/Express backend designed for Azure App Service Zip Deploy.

## Endpoints
- `GET /health` → `{ ok: true, uptime }`
- `POST /api/echo` → echoes JSON body

## Deploy (Zip Deploy)
1. Zip the folder contents (package.json, server.js):
   - On Windows: Select files in `backend-lite`, right-click → Send to → Compressed (zipped) folder.
2. Go to `https://<appname>.scm.azurewebsites.net/api/zipdeploy` and upload the zip.
3. Ensure App Settings:
   - `SCM_DO_BUILD_DURING_DEPLOYMENT=true` (Oryx will install dependencies)
   - Optional CORS rules if called from Obsidian/other domains
4. App will run using `npm start` → `node server.js` and bind to `PORT`.

## Local run
- `npm i`
- `npm start`
- Open http://localhost:3000/health
