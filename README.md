🚀 Updating the Frontend (PM2 Deployment)

Follow these steps whenever you make changes to the frontend:

1. Build the project
npm run build

This will generate the updated production files in the dist folder.

2. Restart the PM2 process
npx pm2 restart frontend

This reloads the application with the latest build.

3. Save the PM2 process list (recommended)
npx pm2 save

Ensures the updated configuration is preserved.

⚡ One-liner (Quick Update)

You can run everything in one command:

npm run build && npx pm2 restart frontend && npx pm2 save

🔍 Verify the Update
Open in browser:
http://localhost:5000
Check PM2 status:
npx pm2 list
View logs (if needed):
npx pm2 logs frontend

if nothing in the pm2 list
start new frontend:
npx pm2 serve dist 5000 --spa --name frontend