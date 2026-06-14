# Private Chat App

Private one-to-one chat built with Node.js, Express, and Socket.IO. No database required — connected users are stored in memory.

This version removes group chat and provides:
- Required gender selection on join
- Users page showing online users (name + gender)
- One-to-one private messaging (runtime only, in-memory)

Project structure:

chat-app/
├── server.js
├── package.json
└── public/
    ├── index.html        # join page (name + gender)
    ├── users.html        # users listing and private chat UI
    ├── users.js          # users page script
    ├── script.js         # join page script
    └── style.css

Quick start
-----------

1. Install dependencies:

   npm install

2. Run the server:

   npm start

3. Open your browser and visit:

   http://localhost:3000

4. Enter your name and select your gender. After joining you will be redirected to the Users page.

5. Open another tab or browser and join with a different name. On the Users page click a user to open a private chat panel and send private messages.

Notes
-----
- Users are stored in memory; restarting the server clears the list.
- Private messages are only retained in memory while the server and client are running; refreshing a page clears client-side history.
- Socket.IO serves the client script at /socket.io/socket.io.js automatically.
- Error handling is implemented for common socket failures.

If you want improvements (persistent history, user accounts, delivery receipts), open an issue or request features.

Deployment
----------
This repository can be deployed to Fly.io using GitHub Actions (recommended). The app uses long-lived WebSocket connections (Socket.IO) so Fly's build/deploy is a good free-tier option.

Quick automatic deploy (Fly buildpacks + GitHub Actions)
1. Create a Fly.io account and generate an API token.
2. In the GitHub repo, add a repository secret named FLY_API_TOKEN with that token.
3. This repo includes a workflow at .github/workflows/fly-deploy.yml that runs on push to main and calls `flyctl deploy --remote-only` (buildpacks). No Dockerfile required.
4. After pushing to main, monitor GitHub Actions and the Fly dashboard. Verify the app at the Fly-assigned URL and test /health and real-time messaging.

Initial app setup (one-time, local)
1. (Optional but recommended) Run `flyctl launch --name your-fly-app-name` locally to create a dedicated Fly app and generate fly.toml. Rename the generated fly.toml or keep it in the repo for the workflow.
2. If you run `fly launch` locally, commit the generated fly.toml (or copy contents to fly.toml.example) so the app configuration is preserved.
3. If you prefer purely remote creation, the workflow will attempt remote deploys using `flyctl deploy --remote-only`, but creating the app locally gives you more control over region and initial settings.

Add GitHub secret
- In GitHub: Settings → Secrets → Actions → New repository secret
  - Name: FLY_API_TOKEN
  - Value: (the token generated in your Fly account)
- Optionally set FLY_APP_NAME if you want the workflow to target a specific app name.

Triggering deploy
- Push (or merge) to main to trigger the workflow. The action will call flyctl and perform a remote build/deploy using buildpacks.

Notes
- If you prefer Dockerfile-based builds, create a Dockerfile and modify the workflow to run `flyctl deploy` without --remote-only, or run `fly launch` locally to generate fly.toml.
- For custom domains, configure DNS in the Fly dashboard and follow their TLS instructions.

