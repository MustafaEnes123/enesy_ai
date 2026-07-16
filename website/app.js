/**
 * Fluid AI — App Logic v4
 * Single textarea · Floating sidebar · Anonymous · English
 */

/* ── STATE ── */
let conversations = {};
let activeConvId  = null;
let isLoading     = false;
let activeConfig  = {};
let currentTheme  = localStorage.getItem('fluid_theme') || 'dark';
let sidebarCollapsed = false;

/* ── DOM ── */
const $ = id => document.getElementById(id);

// Single input (always in DOM, always writable)
const chatInput  = $('chat-input');
const sendBtn    = $('send-btn');
const charCount  = $('char-count');

// Layout
const welcomeScreen  = $('welcome-screen');
const messagesScroll = $('messages-scroll');
const messagesInner  = $('messages-inner');
const sidebar        = $('sidebar');
const sidebarOverlay = $('sidebar-overlay');
const sidebarToggle  = $('sidebar-toggle');
const mainWrapper    = $('main-wrapper');
const newChatBtn     = $('new-chat-btn');
const chatList       = $('chat-list');
const barClearBtn    = $('bar-clear-btn');
const modelDot       = $('model-dot');
const modelNameDisplay = $('model-name-display');
const themeToggle    = $('theme-toggle');

// Settings
const settingsBtn       = $('settings-btn');
const settingsModal     = $('settings-modal');
const modalBackdrop     = $('modal-backdrop');
const closeSettingsBtn  = $('close-settings-btn');
const cancelSettingsBtn = $('cancel-settings-btn');
const saveSettingsBtn   = $('save-settings-btn');
const cfgEndpoint       = $('cfg-endpoint');
const cfgApiKey         = $('cfg-apikey');
const cfgDeployment     = $('cfg-deployment');
const cfgSysPrompt      = $('cfg-sysprompt');
const cfgTemp           = $('cfg-temp');
const cfgMaxTokens      = $('cfg-maxtokens');
const tempVal           = $('temp-val');
const cfgOllamaEndpoint = $('cfg-ollama-endpoint');
const cfgOllamaModel    = $('cfg-ollama-model');
const toastStack        = $('toast-stack');

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(currentTheme);
  loadConfig();
  bindEvents();
  loadConversations();
  checkConfigStatus();
});

/* ── THEME ── */
function applyTheme(t) {
  currentTheme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('fluid_theme', t);
}

/* ── CONFIG ── */
function loadConfig() {
  const base = window.AZURE_CONFIG || {};
  let s = {};
  try { s = JSON.parse(localStorage.getItem('fluid_cfg') || '{}'); } catch {}
  activeConfig = {
    // Ollama
    ollamaEndpoint: s.ollamaEndpoint ?? base.ollamaEndpoint ?? '',
    ollamaModel:    s.ollamaModel    ?? base.ollamaModel    ?? 'assistant',
    // Azure
    endpoint:       s.endpoint       || base.endpoint       || '',
    apiKey:         s.apiKey         || base.apiKey         || '',
    deploymentName: s.deploymentName || base.deploymentName || '',
    // Shared
    systemPrompt:   s.systemPrompt   ?? base.systemPrompt   ?? 'You are a helpful and intelligent AI assistant.',
    temperature:    s.temperature    ?? base.temperature    ?? 0.7,
    maxTokens:      s.maxTokens      || base.maxTokens      || 1024,
    apiVersion:     base.apiVersion  || '2024-02-01',
  };
  // Populate UI
  cfgOllamaEndpoint.value = activeConfig.ollamaEndpoint;
  cfgOllamaModel.value    = activeConfig.ollamaModel;
  cfgEndpoint.value       = activeConfig.endpoint;
  cfgApiKey.value         = activeConfig.apiKey;
  cfgDeployment.value     = activeConfig.deploymentName;
  cfgSysPrompt.value      = activeConfig.systemPrompt;
  cfgTemp.value           = activeConfig.temperature;
  cfgMaxTokens.value      = activeConfig.maxTokens;
  if (tempVal) tempVal.textContent = Number(activeConfig.temperature).toFixed(2);
}

function saveConfig() {
  activeConfig = {
    ...activeConfig,
    ollamaEndpoint: cfgOllamaEndpoint.value.trim(),
    ollamaModel:    cfgOllamaModel.value.trim() || 'assistant',
    endpoint:       cfgEndpoint.value.trim(),
    apiKey:         cfgApiKey.value.trim(),
    deploymentName: cfgDeployment.value.trim(),
    systemPrompt:   cfgSysPrompt.value.trim(),
    temperature:    parseFloat(cfgTemp.value),
    maxTokens:      parseInt(cfgMaxTokens.value, 10),
  };
  localStorage.setItem('fluid_cfg', JSON.stringify(activeConfig));
  checkConfigStatus();
  closeSettingsModal();
  toast('Settings saved.', 'success');
}

function isOllamaConfigured() {
  const ep = activeConfig.ollamaEndpoint || '';
  return !!(ep && !ep.includes('YOUR_') && ep.startsWith('http'));
}

function isAzureConfigured() {
  return !!(activeConfig.endpoint && activeConfig.apiKey && activeConfig.deploymentName &&
    !activeConfig.endpoint.includes('YOUR_') && !activeConfig.apiKey.includes('YOUR_'));
}

function isConfigured() {
  return isOllamaConfigured() || isAzureConfigured();
}

function checkConfigStatus() {
  const ollama = isOllamaConfigured();
  const azure  = isAzureConfigured();
  const ok     = ollama || azure;

  modelDot.className = ok ? 'model-dot online' : 'model-dot error';

  if (ollama) {
    modelNameDisplay.textContent = activeConfig.ollamaModel || 'assistant';
  } else if (azure) {
    const dep = activeConfig.deploymentName;
    modelNameDisplay.textContent = (dep && !dep.includes('YOUR_')) ? dep : 'Azure Model';
  } else {
    modelNameDisplay.textContent = 'Demo Mode';
  }
}

/* ── CONVERSATIONS ── */
function loadConversations() {
  try { conversations = JSON.parse(localStorage.getItem('fluid_convs') || '{}'); }
  catch { conversations = {}; }
  renderChatList();
}
function saveConversations() {
  localStorage.setItem('fluid_convs', JSON.stringify(conversations));
}
function createConversation() {
  const id = 'c_' + Date.now();
  conversations[id] = { title: 'New Chat', messages: [], createdAt: Date.now() };
  saveConversations();
  return id;
}
function switchConversation(id) {
  if (!conversations[id]) return;
  activeConvId = id;
  renderChatList();
  renderMessages();
}
function renderChatList() {
  chatList.innerHTML = '';

  const all = Object.keys(conversations)
    .map(id => ({ id, ...conversations[id] }));

  const pinned  = all.filter(c => c.pinned).sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  const recent  = all.filter(c => !c.pinned).sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

  if (!all.length) {
    chatList.innerHTML = '<li class="chat-list-empty"><span>No conversations yet</span></li>';
    return;
  }

  if (pinned.length) {
    const lbl = document.createElement('div');
    lbl.className = 'nav-section-pinned';
    lbl.textContent = 'Pinned';
    chatList.appendChild(lbl);
    pinned.forEach(c => chatList.appendChild(makeChatItem(c.id)));
  }

  if (recent.length) {
    // Only show "Recent" label when there are also pinned items
    if (pinned.length) {
      const lbl = document.createElement('div');
      lbl.className = 'nav-section-label';
      lbl.style.marginTop = '6px';
      lbl.textContent = 'Recent';
      chatList.appendChild(lbl);
    }
    recent.forEach(c => chatList.appendChild(makeChatItem(c.id)));
  }
}

function makeChatItem(id) {
  const conv = conversations[id];
  const li   = document.createElement('li');
  li.className = 'chat-list-item' +
    (id === activeConvId ? ' active' : '') +
    (conv.pinned ? ' pinned' : '');
  li.setAttribute('role', 'listitem');
  li.setAttribute('tabindex', '0');

  // Pin icon (shown when pinned)
  const pinIcon = document.createElement('span');
  pinIcon.className = 'pin-icon';
  pinIcon.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>`;

  // Title
  const title = document.createElement('span');
  title.className = 'chat-item-title';
  title.textContent = conv.title || 'Chat';

  // 3-dot button
  const dots = document.createElement('button');
  dots.className = 'chat-item-dots';
  dots.setAttribute('aria-label', 'Chat options');
  dots.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>`;

  dots.addEventListener('click', e => {
    e.stopPropagation();
    openCtxMenu(id, dots);
  });

  li.appendChild(pinIcon);
  li.appendChild(title);
  li.appendChild(dots);

  li.addEventListener('click', () => { switchConversation(id); closeSidebarMobile(); });
  li.addEventListener('keydown', e => { if (e.key === 'Enter') li.click(); });

  return li;
}

function renderMessages() {
  messagesInner.innerHTML = '';
  if (!activeConvId || !conversations[activeConvId]) { showWelcome(); return; }
  const msgs = conversations[activeConvId].messages;
  if (!msgs.length) { showWelcome(); return; }
  showChat();
  msgs.forEach(m => appendBubble(m.role, m.content, m.time));
  scrollToBottom();
}

/* ── WELCOME / CHAT MODE ── */
function showWelcome() {
  welcomeScreen.classList.remove('hidden');
  messagesScroll.classList.remove('show');
}
function showChat() {
  welcomeScreen.classList.add('hidden');
  messagesScroll.classList.add('show');
}

/* ── SIDEBAR ── */
function toggleSidebar() {
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    const opening = !sidebar.classList.contains('mobile-open');
    sidebar.classList.toggle('mobile-open', opening);
    sidebarOverlay.classList.toggle('show', opening);
    // Remove desktop collapsed class on mobile
    sidebar.classList.remove('collapsed');
  } else {
    // Desktop: just collapse/expand, NEVER show overlay
    sidebarCollapsed = !sidebarCollapsed;
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
    // Adjust main-wrapper margin
    mainWrapper.style.marginLeft = sidebarCollapsed
      ? '0'
      : `calc(var(--sidebar-w) + var(--sidebar-gap) * 2)`;
  }
}
function closeSidebarMobile() {
  sidebar.classList.remove('mobile-open');
  sidebarOverlay.classList.remove('show');
}

/* ── EVENTS ── */
function bindEvents() {
  themeToggle.addEventListener('click', () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark'));
  sidebarToggle.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', closeSidebarMobile);
  newChatBtn.addEventListener('click', startNewChat);
  barClearBtn.addEventListener('click', clearCurrentChat);

  settingsBtn.addEventListener('click', openSettingsModal);
  $('model-badge').addEventListener('click', openSettingsModal);
  closeSettingsBtn.addEventListener('click', closeSettingsModal);
  cancelSettingsBtn.addEventListener('click', closeSettingsModal);
  saveSettingsBtn.addEventListener('click', saveConfig);
  modalBackdrop.addEventListener('click', closeSettingsModal);

  cfgTemp.addEventListener('input', () => {
    if (tempVal) tempVal.textContent = parseFloat(cfgTemp.value).toFixed(2);
  });

  // Single chat input
  chatInput.addEventListener('input', onInputChange);
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); triggerSend(); }
  });
  sendBtn.addEventListener('click', triggerSend);

  // Starter cards
  document.querySelectorAll('.starter-card').forEach(card => {
    card.addEventListener('click', () => { const m = card.dataset.msg; if (m) triggerSend(m); });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSettingsModal(); closeCtxMenu(); }
  });

  // Close ctx menu on outside click
  document.addEventListener('click', () => closeCtxMenu());

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      sidebarOverlay.classList.remove('show');
      sidebar.classList.remove('mobile-open');
    }
  });
}

/* ── INPUT ── */
function onInputChange() {
  // Auto-resize
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
  // Char count
  const len = chatInput.value.length, max = 4000;
  if (!len) { charCount.textContent = ''; charCount.className = 'char-count'; }
  else {
    charCount.textContent = `${len} / ${max}`;
    charCount.className = 'char-count' + (len >= max ? ' over' : len > max * .85 ? ' warn' : '');
  }
  sendBtn.disabled = !len || isLoading;
}

/* ── SEND ── */
function triggerSend(forcedText) {
  const text = (forcedText || chatInput.value).trim();
  if (!text || isLoading) return;

  // If not configured → demo mode (no interrupt, just simulate)
  const demoMode = !isConfigured();

  // Ensure active conversation
  if (!activeConvId || !conversations[activeConvId]) {
    activeConvId = createConversation();
    renderChatList();
  }

  // Clear input
  if (!forcedText) {
    chatInput.value = '';
    chatInput.style.height = 'auto';
    charCount.textContent = '';
  }
  sendBtn.disabled = true;

  showChat();

  const now  = formatTime(new Date());
  const conv = conversations[activeConvId];
  conv.messages.push({ role: 'user', content: text, time: now });
  if (conv.messages.length === 1 || conv.title === 'New Chat') {
    conv.title = text.length > 44 ? text.slice(0, 44) + '…' : text;
  }
  saveConversations();
  renderChatList();
  appendBubble('user', text, now);

  isLoading = true;
  const tid = showTyping();

  // Priority: Ollama → Azure OpenAI → Demo
  let apiCall;
  if (isOllamaConfigured()) {
    apiCall = callOllamaAPI(conv.messages);
  } else if (isAzureConfigured()) {
    apiCall = callAzureAPI(conv.messages);
  } else {
    apiCall = getDemoResponse(text);
  }

  apiCall
    .then(reply => {
      removeTyping(tid);
      const rt = formatTime(new Date());
      conv.messages.push({ role: 'assistant', content: reply, time: rt });
      saveConversations();
      appendBubble('ai', reply, rt);
      if (demoMode) toast('Demo mode — configure API settings to use your model.', 'info', 5000);
    })
    .catch(err => {
      removeTyping(tid);
      appendBubble('ai', `⚠️ ${err.message}`, formatTime(new Date()), true);
      toast(err.message, 'error');
      conv.messages.pop();
      saveConversations();
    })
    .finally(() => {
      isLoading = false;
      sendBtn.disabled = chatInput.value.trim().length === 0;
      chatInput.focus();
    });
}

/* ── DEMO MODE ── */
const DEMO_RESPONSES = [
  (msg) => `Great question! You asked: *"${msg.slice(0,60)}${msg.length>60?'…':''}"*\n\nThis is a **demo response** from Fluid AI. Your fine-tuned model isn't connected yet — head to **Settings** (⚙️) and enter your Azure OpenAI credentials to activate your model.\n\nOnce connected, I'll respond with the intelligence of your custom fine-tuned model instead of these placeholders.`,
  () => `I'm currently running in **demo mode** 🔬\n\nTo connect your fine-tuned Azure OpenAI model:\n\n1. Click the **model badge** in the top bar\n2. Enter your **Azure Endpoint**, **API Key**, and **Deployment Name**\n3. Hit **Save** — and I'll be fully powered by your model.`,
  (msg) => `You said: *"${msg.slice(0,80)}${msg.length>80?'…':''}"*\n\nDemo mode is active. I can simulate conversations so you can **explore the UI** before connecting your Azure API. The typing delay, message bubbles, sidebar history — everything is working as it will in production.`,
  () => `**Fluid AI** is ready when you are.\n\nRight now I'm in demo mode — your Azure fine-tuned model isn't connected yet. The interface is fully functional: you can browse chat history in the sidebar, toggle light/dark mode, and test the conversation flow.\n\nConnect your model via **Settings** to go live.`,
];

let _demoIdx = 0;
function getDemoResponse(userMsg) {
  return new Promise(resolve => {
    // 5-second thinking delay
    setTimeout(() => {
      const fn = DEMO_RESPONSES[_demoIdx % DEMO_RESPONSES.length];
      _demoIdx++;
      resolve(fn(userMsg));
    }, 5000);
  });
}

/* ── AZURE API ── */
async function callAzureAPI(messages) {
  const { endpoint, apiKey, deploymentName, apiVersion, systemPrompt, temperature, maxTokens } = activeConfig;
  const url = `${endpoint.replace(/\/$/,'')}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })),
      ],
      max_tokens: maxTokens, temperature, stream: false,
    }),
  });
  if (!res.ok) {
    let d = '';
    try { const j = await res.json(); d = j?.error?.message || JSON.stringify(j); }
    catch { d = await res.text(); }
    throw new Error(`API ${res.status}: ${d.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from API.');
  return content;
}

/* ── OLLAMA API ── */
async function callOllamaAPI(messages) {
  const endpoint = (activeConfig.ollamaEndpoint || '').replace(/\/$/, '');
  const model    = activeConfig.ollamaModel || 'assistant';
  const url      = `${endpoint}/api/chat`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      // /api/chat supports full conversation history
      messages: [
        { role: 'system', content: activeConfig.systemPrompt },
        ...messages.map(m => ({
          role:    m.role === 'ai' ? 'assistant' : m.role,
          content: m.content,
        })),
      ],
      stream: false,
      options: {
        temperature: activeConfig.temperature ?? 0.7,
      },
    }),
  });

  if (!res.ok) {
    let d = '';
    try { d = await res.text(); } catch {}
    throw new Error(`Ollama ${res.status}: ${d.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.message?.content;
  if (!content) throw new Error('Empty response from Ollama.');
  return content;
}

/* ── ACTIONS ── */

function startNewChat() {
  // Don't create a conversation yet — wait until the user sends their first message.
  // This prevents empty ghost entries appearing in the sidebar history.
  activeConvId = null;
  messagesInner.innerHTML = '';
  showWelcome();
  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendBtn.disabled = true;
  charCount.textContent = '';
  closeSidebarMobile();
  chatInput.focus();
  // Re-render to deselect any active item in the list
  renderChatList();
}

function clearCurrentChat() {
  if (!activeConvId || !conversations[activeConvId]) return;
  conversations[activeConvId].messages = [];
  conversations[activeConvId].title    = 'New Chat';
  saveConversations();
  renderChatList();
  messagesInner.innerHTML = '';
  showWelcome();
  toast('Conversation cleared.', 'info');
}

/* ── CONTEXT MENU ── */
const ctxMenu      = $('ctx-menu');
const ctxPin       = $('ctx-pin');
const ctxPinLabel  = $('ctx-pin-label');
const ctxDelete    = $('ctx-delete');
let ctxTargetId    = null;
let ctxDotsEl      = null;

function openCtxMenu(id, dotsBtn) {
  // Close any open menu first
  closeCtxMenu();

  ctxTargetId = id;
  ctxDotsEl   = dotsBtn;
  dotsBtn.classList.add('open');

  // Update pin label
  ctxPinLabel.textContent = conversations[id]?.pinned ? 'Unpin' : 'Pin';

  // Position: below the dots button, aligned to its left
  const rect = dotsBtn.getBoundingClientRect();
  const menuW = 150;
  const spaceRight = window.innerWidth - rect.right;

  let left = rect.left;
  if (spaceRight < menuW) left = rect.right - menuW;
  let top  = rect.bottom + 4;
  if (top + 90 > window.innerHeight) top = rect.top - 94;

  ctxMenu.style.left = `${left}px`;
  ctxMenu.style.top  = `${top}px`;
  ctxMenu.classList.add('show');
}

function closeCtxMenu() {
  ctxMenu.classList.remove('show');
  if (ctxDotsEl) { ctxDotsEl.classList.remove('open'); ctxDotsEl = null; }
  ctxTargetId = null;
}

function pinConversation(id) {
  if (!conversations[id]) return;
  conversations[id].pinned = !conversations[id].pinned;
  saveConversations();
  renderChatList();
  toast(conversations[id].pinned ? 'Chat pinned.' : 'Chat unpinned.', 'info', 2500);
}

function deleteConversation(id) {
  const wasActive = id === activeConvId;
  delete conversations[id];
  saveConversations();

  if (wasActive) {
    // Switch to the next available conversation or reset
    const remaining = Object.keys(conversations)
      .sort((a, b) => (conversations[b]?.createdAt || 0) - (conversations[a]?.createdAt || 0));
    if (remaining.length) {
      activeConvId = remaining[0];
      renderChatList();
      renderMessages();
    } else {
      activeConvId = null;
      messagesInner.innerHTML = '';
      showWelcome();
      renderChatList();
    }
  } else {
    renderChatList();
  }
  toast('Conversation deleted.', 'info', 2500);
}

// Wire up ctx menu buttons (once)
ctxPin.addEventListener('click', e => {
  e.stopPropagation();
  if (ctxTargetId) pinConversation(ctxTargetId);
  closeCtxMenu();
});
ctxDelete.addEventListener('click', e => {
  e.stopPropagation();
  if (ctxTargetId) deleteConversation(ctxTargetId);
  closeCtxMenu();
});

/* ── SETTINGS ── */
function openSettingsModal() {
  loadConfig();
  settingsModal.classList.add('show');
  modalBackdrop.classList.add('show');
  settingsModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => cfgEndpoint.focus(), 80);
}
function closeSettingsModal() {
  settingsModal.classList.remove('show');
  modalBackdrop.classList.remove('show');
  settingsModal.setAttribute('aria-hidden', 'true');
}

/* ── RENDER ── */
function appendBubble(role, text, time, isError = false) {
  const row = document.createElement('div');
  row.className = `msg-row ${role === 'user' ? 'user' : 'ai'}`;

  if (role !== 'user') {
    const av = document.createElement('div');
    av.className = 'msg-av';
    av.innerHTML = '<div class="msg-av-dot"></div>';
    row.appendChild(av);
  }

  const col = document.createElement('div');
  col.className = 'bubble-col';
  const bub = document.createElement('div');
  bub.className = 'bubble';
  if (isError) bub.style.cssText = 'border-color:rgba(248,113,113,.4);color:#fca5a5;';
  bub.innerHTML = role === 'user' ? escHtml(text).replace(/\n/g,'<br>') : fmtMd(text);
  const t = document.createElement('div');
  t.className = 'msg-time'; t.textContent = time || '';
  col.appendChild(bub); col.appendChild(t);
  row.appendChild(col);
  messagesInner.appendChild(row);
  scrollToBottom();
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtMd(text) {
  let h = escHtml(text);
  h = h.replace(/```([\s\S]*?)```/g, (_, c) => `<pre><code>${c.trim()}</code></pre>`);
  h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  h = h.split(/\n\n+/).map(p => {
    const t = p.trim();
    if (!t) return '';
    if (t.startsWith('<pre>')) return t;
    return `<p>${t.replace(/\n/g, '<br>')}</p>`;
  }).filter(Boolean).join('');
  return h || `<p>${escHtml(text)}</p>`;
}

/* ── TYPING ── */
let _tn = 0;
function showTyping() {
  const id = `ty-${++_tn}`;
  const row = document.createElement('div');
  row.id = id; row.className = 'typing-row';
  row.innerHTML = `<div class="msg-av"><div class="msg-av-dot"></div></div>
    <div class="typing-bubble"><div class="td"></div><div class="td"></div><div class="td"></div></div>`;
  messagesInner.appendChild(row);
  scrollToBottom();
  return id;
}
function removeTyping(id) {
  const el = $(id);
  if (!el) return;
  el.style.transition = 'opacity .2s,transform .2s';
  el.style.opacity = '0'; el.style.transform = 'translateY(-5px)';
  setTimeout(() => el.remove(), 220);
}

/* ── UTILS ── */
function scrollToBottom() {
  requestAnimationFrame(() => {
    messagesScroll.scrollTo({ top: messagesScroll.scrollHeight, behavior: 'smooth' });
  });
}
function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/* ── TOAST ── */
function toast(msg, type = 'info', ms = 4000) {
  const el = document.createElement('div');
  el.className = `toast ${type}`; el.textContent = msg;
  toastStack.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 340); }, ms);
}
