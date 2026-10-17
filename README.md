<h1 align="center">Mentora</h1>

AI engineering learning platform with various lessons, interactive diagrams, hands-on labs, and AI chatbot.

## Features

- Fundamentals, worked examples, and A–F technical interview preparation.
- Interactive lessons for LLMs, Prompt Engineering, RAG, and AI Agents.
- Expandable course sidebar, lesson search (`Ctrl/Cmd + K`), and locally saved progress.
- **Mentora AI:** Ask questions about the page you are reading, with streaming answers through **9Router**.
- **Ask selected text:** Highlight lesson text → click **Ask Mentora** → ask about the quoted passage in chat. Remove it with `×` if needed.

## Run locally

Requires **Node.js 22.22.0+** and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:4321/academy/>. Lessons and interactive labs work without AI configuration.

## AI setup (9Router)

1. Start **9Router** and configure a working model/provider there. Create a 9Router API key.
2. In `.env`, check that `NINEROUTER_BASE_URL` points to your 9Router **OpenAI-compatible `/v1`** endpoint (default: `http://127.0.0.1:20128/v1`). This URL is reached **from the Astro server**.
3. Run Mentora and open any course or lesson. Click **✧** in the top bar to open **Mentora AI**.
4. Click the **settings gear**, paste your **API key**, then click **Load models**.
5. Choose a model (or enter its exact model ID manually) and click **Save settings**.
6. Ask a question, or **highlight text on the lesson page → Ask Mentora**. The selected passage appears above the chat input. Type a question, or send it as-is for a simple explanation.

Optional: Set `NINEROUTER_API_KEY` and `NINEROUTER_MODEL` in `.env` as server defaults instead of entering them in the UI. Restart the server after changing `.env`.

```env
NINEROUTER_BASE_URL=http://127.0.0.1:20128/v1
NINEROUTER_API_KEY=
NINEROUTER_MODEL=
ALLOWED_ORIGINS=http://localhost:4321,http://127.0.0.1:4321
```

**How AI works:** Mentora sends the current page's text, your question, and any explicitly selected excerpt to its server-side `/api/chat/` endpoint, which calls 9Router. It does not search other lessons. If the page lacks an answer, the assistant should identify additional general background as such.

**Key handling:** Keys entered in Settings are kept in the browser tab's `sessionStorage`, not the URL, and are forwarded to 9Router through your Mentora server. They remain accessible to scripts running on the page. Use HTTPS and access controls for any public deployment; avoid shared devices. The server-only `.env` key is never sent to the browser.

