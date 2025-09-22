# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/7ae00cf5-af91-4325-8967-5e4bf1a117f8

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7ae00cf5-af91-4325-8967-5e4bf1a117f8) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7ae00cf5-af91-4325-8967-5e4bf1a117f8) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Environment variables

Create your local env files and fill in your secrets:

```sh
cp .env.example .env
```

Then edit `.env` and set values for:

- `VITE_OPENAI_API_KEY` — OpenAI API key
- `VITE_OPENAI_MODEL` — default model (e.g., gpt-4o-mini)
- `VITE_ELEVENLABS_API_KEY` — ElevenLabs API key
- `VITE_ELEVENLABS_VOICE_ID` — optional default voice ID
- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon public key

Notes:
- Vite only exposes variables prefixed with `VITE_` to the client.
- `.env` is gitignored; commit only `.env.example`.
- After changes, restart the dev server: `npm run dev`.

## Serverless proxies (Vercel)

This project includes serverless functions under `api/` for secure API access:

- `api/openai-chat.js` — proxies OpenAI Chat Completions
- `api/elevenlabs-tts.js` — proxies ElevenLabs Text-to-Speech

Configure env vars in your hosting provider (Vercel → Settings → Environment Variables):
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- Optional: `OPENAI_MODEL` (default `gpt-4o-mini`), `ELEVENLABS_DEFAULT_VOICE_ID`

### Local development
- Add the same keys to your local `.env` (gitignored). Do NOT prefix server-only secrets with `VITE_`.
- Run dev server: `npm run dev`

### Client usage examples

POST to your own endpoints instead of calling providers directly:

```ts
// OpenAI chat
await fetch('/api/openai-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
});
```

```ts
// ElevenLabs TTS
const res = await fetch('/api/elevenlabs-tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Hello world' })
});
const blob = await res.blob();
const url = URL.createObjectURL(blob);
new Audio(url).play();
```

These routes read secrets from server-side env vars and never expose them to the browser.
