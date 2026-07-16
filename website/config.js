/**
 * Fluid AI — API Configuration
 * ==============================
 * Two supported backends — the app auto-detects which one to use:
 *
 *  1. OLLAMA  (your fine-tuned model)
 *     → Set ollamaEndpoint + ollamaModel
 *     → Example: "http://localhost:11434" for local, or your server's address
 *
 *  2. AZURE OPENAI  (optional fallback)
 *     → Set endpoint + apiKey + deploymentName
 *
 * Priority: Ollama → Azure OpenAI → Demo Mode
 *
 * ⚠️  SECURITY NOTE:
 *     Never commit real API keys or server IPs to a public repository.
 *     Fill in your values locally and keep this file in .gitignore,
 *     or configure your backend via environment variables / a proxy.
 */

const AZURE_CONFIG = {

  /* ── OLLAMA ──────────────────────────────────────────────
   * Point this to your Ollama server.
   * For local development: "http://localhost:11434"
   * For a remote server:   set this in your own local copy, never commit it.
   * -------------------------------------------------------- */
  ollamaEndpoint: "http://localhost:11434",  // Projeyi indirenler kendi lokallerinde çalıştırabilir
  ollamaModel:    "assistant", // model name as shown in `ollama list`

  /* ── AZURE OPENAI (optional) ─────────────────────────── */
  endpoint:       "",          // e.g. "https://your-resource.openai.azure.com"
  apiKey:         "",          // your Azure OpenAI API key
  deploymentName: "",          // deployment name from Azure OpenAI Studio
  apiVersion:     "2024-02-01",

  /* ── SHARED SETTINGS ─────────────────────────────────── */
  systemPrompt: "You are a helpful and intelligent AI assistant.",
  temperature:  0.7,
  maxTokens:    1024,
};

window.AZURE_CONFIG = AZURE_CONFIG;
