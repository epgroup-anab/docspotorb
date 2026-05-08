# Docspot Orb

Single-agent ElevenLabs voice web app for Docspot AI, with a 3D orb call control.

## Configure the agent

1. Open `src/config/agent.ts`
2. Replace the exported agent ID with your ElevenLabs agent ID.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build / deploy

```bash
npm run build
npx netlify-cli deploy --build --prod
```
