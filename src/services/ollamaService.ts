const BASE = 'http://127.0.0.1:11434';

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export async function listModels(): Promise<OllamaModel[]> {
  const res = await fetch(`${BASE}/api/tags`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { models: OllamaModel[] };
  return data.models ?? [];
}

export function pickBestModel(models: OllamaModel[]): string {
  const pref = ['qwen2.5-coder', 'deepseek-coder', 'codellama', 'starcoder', 'codegemma', 'qwen', 'gemma', 'llama'];
  for (const kw of pref) {
    const m = models.find(m => m.name.toLowerCase().includes(kw));
    if (m) return m.name;
  }
  return models[0]?.name ?? '';
}

export async function chatStream(
  model: string,
  systemPrompt: string,
  userMessage: string,
  onToken: (cumulative: string) => void,
): Promise<string> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: true,
    }),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split('\n').filter(Boolean)) {
      try {
        const obj = JSON.parse(line) as { message?: { content?: string } };
        const token = obj.message?.content ?? '';
        if (token) { full += token; onToken(full); }
      } catch { /* skip */ }
    }
  }
  return full;
}

export function extractCode(response: string): string {
  const m = response.match(/```(?:jsx?|tsx?|javascript|js|react)?\n?([\s\S]*?)```/);
  return m ? m[1].trim() : '';
}

function fixCssPropertyNames(code: string): string {
  // Convert CSS kebab-case keys used as bare JS object keys (e.g. margin-bottom: → marginBottom:)
  return code.replace(
    /(?<!['"a-zA-Z0-9_$])([a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)+)(?=\s*:)/g,
    (match) => match.replace(/-([a-z])/g, (_, l) => l.toUpperCase())
  );
}

export function sanitizeCode(code: string): string {
  const cleaned = code
    .replace(/^import\s+.*?from\s+['"][^'"]*['"]\s*;?\s*\n?/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+(function|const|class|let|var)\b/gm, '$1')
    .trim();
  return fixCssPropertyNames(cleaned);
}

export function stripCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
