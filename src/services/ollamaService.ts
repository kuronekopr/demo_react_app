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

export function pickTextModel(models: OllamaModel[], codeModel: string): string {
  // Prefer generalist/language models for text generation, different from the code model
  const textPref = ['gemma4', 'gemma3', 'gemma', 'llama3', 'llama', 'mistral', 'phi'];
  for (const kw of textPref) {
    const m = models.find(m => m.name.toLowerCase().includes(kw) && m.name !== codeModel);
    if (m) return m.name;
  }
  return codeModel; // fallback: use same model
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

function ensureAppComponent(code: string): string {
  // If App is already defined, nothing to do
  if (/\b(?:function\s+App|const\s+App\s*=|class\s+App\b)/.test(code)) return code;
  // LLM wrote raw JSX without a component wrapper — wrap it automatically
  return `const App = () => (\n${code}\n);`;
}

export function sanitizeCode(code: string): string {
  const cleaned = code
    .replace(/^import\s+.*?from\s+['"][^'"]*['"]\s*;?\s*\n?/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+(function|const|class|let|var)\b/gm, '$1')
    // Remove trailing stray bare identifiers (e.g. "ReviewPage;" the LLM sometimes appends)
    .replace(/\n[A-Za-z_$][A-Za-z0-9_$]*\s*;?\s*$/g, '')
    .trim();
  return ensureAppComponent(fixCssPropertyNames(cleaned));
}

export function stripCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

export function wrapWithEmail(chartCode: string, emailText: string): string {
  // Rename App→ChartBody so we can define a new outer App that combines email + chart.
  // Use React.createElement() (not JSX) to avoid TypeScript parsing issues in .tsx files.
  // Split the email at ~40% of paragraphs so the chart appears between the intro and the CTA/closing.
  const renamed = chartCode.replace(/\b(const|function|class)\s+App\b/, '$1 ChartBody');
  const paragraphs = emailText.split(/\n\n+/);
  const splitIdx = Math.max(1, Math.ceil(paragraphs.length * 0.4));
  const part1 = paragraphs.slice(0, splitIdx).join('\n\n');
  const part2 = paragraphs.slice(splitIdx).join('\n\n');
  const escaped1 = JSON.stringify(part1);
  const escaped2 = JSON.stringify(part2);
  const emailStyle = '{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"12px",padding:"28px",whiteSpace:"pre-wrap",lineHeight:"2",fontSize:"14px",color:"#374151",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}';
  return renamed + '\n' +
    'const App = () => {\n' +
    '  const _p1 = ' + escaped1 + ';\n' +
    '  const _p2 = ' + escaped2 + ';\n' +
    '  return React.createElement("div",\n' +
    '    {style:{fontFamily:"system-ui,sans-serif",maxWidth:"860px",margin:"0 auto",padding:"20px",background:"#f8fafc"}},\n' +
    '    React.createElement("div", {style:' + emailStyle + '}, _p1),\n' +
    '    React.createElement("div", {style:{margin:"24px 0"}},\n' +
    '      React.createElement(ChartBody)\n' +
    '    ),\n' +
    '    React.createElement("div", {style:' + emailStyle + '}, _p2)\n' +
    '  );\n' +
    '};\n';
}
