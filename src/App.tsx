import React, { useState, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import type { Message } from './components/ChatWindow';
import { CodeInterpreter } from './components/CodeInterpreter';
import {
  listModels, pickBestModel, pickTextModel, chatStream,
  extractCode, sanitizeCode, stripCodeBlocks,
  svgToPngDataUrl, wrapWithEmailPng,
} from './services/ollamaService';
import { buildBarChartSvgXml, buildLineChartSvgXml } from './services/chartTemplates';
import type { BarChartData, LineChartData } from './services/chartTemplates';

export interface SavedEmail {
  id: string;
  savedAt: string;
  label: string;
  chartType: 'bar' | 'line';
  generatedCode: string;
}

// Seasonal distribution ratios for air conditioner energy use (sums to 1.0)
const SEASONAL_RATIOS = [0.0662, 0.0612, 0.0683, 0.0719, 0.0777, 0.0863, 0.1065, 0.1151, 0.0935, 0.0777, 0.0662, 0.1094];
function distributeMonthly(annualKwh: number): number[] {
  return SEASONAL_RATIOS.map(r => Math.round(annualKwh * r));
}

interface ParsedAcRequest {
  oldKwh: number;
  newKwh: number;
  unitPrice: number;
  roomSize: string;
  chartType: 'bar' | 'line';
}

function parseAcRequest(text: string): ParsedAcRequest | null {
  const oldMatch = text.match(/旧型[^。\n]*?(\d[\d,]*)\s*kWh/i);
  const newMatch = text.match(/新型[^。\n]*?(\d[\d,]*)\s*kWh/i);
  if (!oldMatch || !newMatch) return null;
  const oldKwh = parseInt(oldMatch[1].replace(/,/g, ''));
  const newKwh = parseInt(newMatch[1].replace(/,/g, ''));
  const priceMatch = text.match(/電力単価[^\d]*(\d+)\s*円/);
  const unitPrice = priceMatch ? parseInt(priceMatch[1]) : 31;
  const roomMatch = text.match(/(\d+)\s*畳型?/);
  const roomSize = roomMatch ? `${roomMatch[1]}畳` : '';
  const chartType = (text.includes('線') || text.toLowerCase().includes('line')) ? 'line' : 'bar';
  return { oldKwh, newKwh, unitPrice, roomSize, chartType };
}

const SYSTEM_PROMPT = `You are a React UI component generator. Generate beautiful, interactive React components.

STRICT OUTPUT FORMAT:
1. Write 1-2 sentences describing what you created.
2. Output the complete code in a single \`\`\`jsx code block.

STRICT CODE RULES:
- The main component MUST be named exactly "App"
- Do NOT write any import or export statements (React, useState, useEffect, useRef etc. are already available as globals)
- Use ONLY inline styles (style={{...}}) — no className referencing external CSS
- Make it visually appealing with colors, rounded corners, and interactivity
- The LAST line of code must be the closing brace of App. Do NOT write any identifier, variable name, or statement after the closing brace of App.

CHART RULES (critical — follow exactly):
- Always use SVG for charts. Use rect elements for bars, polyline elements for lines.
- Calculate all x/y/width/height as pixel values from data — never use CSS height:X% on flex children.
- SVG rect height MUST be positive. For vertical bars: const barH = (value/maxValue)*chartH; use y={baseline - barH} height={barH}. NEVER use negative height like height={-barH}.
- Use JSX syntax THROUGHOUT — including for all SVG elements. NEVER call React.createElement() directly anywhere.
- NEVER use .forEach() inside JSX — it returns undefined and renders nothing. Always use .map() to render element lists.
- Precompute ALL coordinate arrays as const variables BEFORE the return statement. Keep expressions simple.
- Keep template literal expressions simple — never add extra closing parentheses (wrong: \${fn(x))}, correct: \${fn(x)}).
- All CSS string values inside style objects must be quoted strings, e.g. borderBottom: '2px solid #ccc'.
- For fill area between two lines: const fillPts = [...oldPts, ...[...newPts].reverse()].map(p => p.x+','+p.y).join(' '); then use a polygon element with points={fillPts} fill="rgba(16,185,129,0.15)". Never compute fill areas with complex math or nested spreads.
- Always leave padding inside the SVG viewBox: use padL=40, padR=20, padT=20, padB=30 and compute x/y within those bounds so no element falls outside the viewBox.
- Always close every JSX tag. Verify the return statement's outermost div is properly closed before the closing brace of App.`;

const EMAIL_SYSTEM_PROMPT = `あなたは家電量販店の販売促進担当者です。顧客への案内メールを丁寧な日本語で作成してください。
出力ルール: 件名・本文・署名のみを出力すること。コード・マークダウン記号（**等）・説明文は一切不要。`;

const EMAIL_PROMPTS: Record<'bar' | 'line', string> = {
  bar: `エアコン20畳型の旧型（年間2,383kWh）から新型（年間1,922kWh）への買い替えを促す来店案内メールを作成してください。電力単価31円/kWh、年間節約電力461kWh、節約金額14,291円。`,
  line: `エアコン12畳型の旧型（年間1,390kWh）から新型（年間1,032kWh）への買い替えを促す来店案内メールを作成してください。電力単価31円/kWh、年間節約電力358kWh、節約金額11,098円。`,
};



function makeMsg(sender: 'user' | 'ai', text: string): Message {
  return {
    id: `${Date.now()}-${Math.random()}`,
    sender,
    text,
    time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
  };
}

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    makeMsg('ai', 'こんにちは！Demo AI Replacement Proposal です。Ollama LLM に接続してリアルタイムで React コンポーネントを生成します。下のプロンプトをクリックするか、直接指示を入力してください。'),
  ]);
  const [presetId, setPresetId] = useState<'welcome' | 'bar' | 'line'>('welcome');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [ollamaModel, setOllamaModel] = useState('');
  const [ollamaTextModel, setOllamaTextModel] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [savedEmails, setSavedEmails] = useState<SavedEmail[]>(() => {
    try { return JSON.parse(localStorage.getItem('nexus_saved_emails') ?? '[]'); } catch { return []; }
  });

  const handleSaveEmail = (code: string, chartType: 'bar' | 'line', label: string) => {
    const entry: SavedEmail = {
      id: `${Date.now()}-${Math.random()}`,
      savedAt: new Date().toLocaleString('ja-JP'),
      label,
      chartType,
      generatedCode: code,
    };
    setSavedEmails(prev => {
      const next = [entry, ...prev];
      try { localStorage.setItem('nexus_saved_emails', JSON.stringify(next)); }
      catch { setMessages(p => [...p, makeMsg('ai', '⚠️ 保存容量が上限に達しました。古い履歴を削除してください。')]); }
      return next;
    });
  };

  const handleDeleteEmail = (id: string) => {
    setSavedEmails(prev => {
      const next = prev.filter(e => e.id !== id);
      localStorage.setItem('nexus_saved_emails', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const models = await listModels();
        const best = pickBestModel(models);
        const textBest = pickTextModel(models, best);
        setOllamaModel(best);
        setOllamaTextModel(textBest);
        setOllamaStatus('online');
        setMessages(prev => [...prev, makeMsg('ai',
          textBest !== best
            ? `Ollama に接続しました。コード生成「${best}」／メール生成「${textBest}」の2モデル構成で動作します。プロンプトを選択してください。`
            : `Ollama に接続しました。モデル「${best}」を使用します。プロンプトを選択してください。`
        )]);
      } catch {
        setOllamaStatus('offline');
        setMessages(prev => [...prev, makeMsg('ai',
          'Ollama に接続できませんでした。デモモードで動作します。（ollama serve が起動しているか確認してください）'
        )]);
      }
    })();
  }, []);

  const runGeneration = async (llmPrompt: string, presetType: 'bar' | 'line') => {
    setIsGenerating(true);
    setStreamingText('');
    setGeneratedCode('');

    // --- Demo fallback (Ollama offline) ---
    if (ollamaStatus === 'offline' || !ollamaModel) {
      setTimeout(() => {
        const demoText = presetType === 'bar'
          ? '（デモモード）旧モデルと新モデルの年間消費電力比較棒グラフを表示します。'
          : '（デモモード）5年間累積費用の折れ線グラフを表示します。';
        setMessages(prev => [...prev, makeMsg('ai', demoText)]);
        setIsGenerating(false);
        setIsCompiling(true);
        setTimeout(() => { setIsCompiling(false); setPresetId(presetType); }, 1200);
      }, 900);
      return;
    }

    // --- Real Ollama call ---
    try {
      let fullText = '';
      await chatStream(ollamaModel, SYSTEM_PROMPT, llmPrompt, (cumulative) => {
        fullText = cumulative;
        setStreamingText(cumulative);
      });

      const description = stripCodeBlocks(fullText) || 'コンポーネントを生成しました。';
      const rawCode = extractCode(fullText);

      setStreamingText('');
      setMessages(prev => [...prev, makeMsg('ai', description)]);
      setIsGenerating(false);

      setIsCompiling(true);
      setTimeout(() => {
        setIsCompiling(false);
        if (rawCode) {
          setGeneratedCode(sanitizeCode(rawCode));
        }
        setPresetId(presetType);
      }, 1200);
    } catch {
      setStreamingText('');
      setIsGenerating(false);
      setMessages(prev => [...prev, makeMsg('ai', 'エラーが発生しました。デモモードで表示します。')]);
      setIsCompiling(true);
      setTimeout(() => { setIsCompiling(false); setPresetId(presetType); }, 800);
    }
  };

  const runDualModelGeneration = async (emailPrompt: string, presetType: 'bar' | 'line', chartData?: BarChartData | LineChartData) => {
    setIsGenerating(true);
    setStreamingText('');
    setGeneratedCode('');

    if (ollamaStatus === 'offline' || !ollamaModel) {
      setTimeout(() => {
        setMessages(prev => [...prev, makeMsg('ai', '（デモモード）')]);
        setIsGenerating(false);
        setIsCompiling(true);
        setTimeout(() => { setIsCompiling(false); setPresetId(presetType); }, 1200);
      }, 900);
      return;
    }

    try {
      // Stage 1: メール文章をテキストモデルで生成
      setMessages(prev => [...prev, makeMsg('ai', `📧 ${ollamaTextModel} でメール文章を生成中...`)]);
      let emailText = '';
      await chatStream(ollamaTextModel, EMAIL_SYSTEM_PROMPT, emailPrompt, (cumulative) => {
        emailText = cumulative;
        setStreamingText(cumulative);
      });
      setStreamingText('');
      setMessages(prev => [...prev, makeMsg('ai', '✅ メール文章の生成が完了しました。グラフコードを生成します...')]);

      // Stage 2: SVG XML をテンプレートから同期生成
      setMessages(prev => [...prev, makeMsg('ai', '📊 グラフテンプレートを適用中...')]);
      const defaultBar = { oldKwh: 2383, newKwh: 1922, unitPrice: 31, savingsKwh: 461, savingsYen: 14291, roomSize: '20畳' };
      const defaultLine = { oldKwh: 1390, newKwh: 1032, unitPrice: 31, savingsKwh: 358, savingsYen: 11098, roomSize: '12畳',
        oldMonthly: [92, 85, 95, 100, 108, 120, 148, 155, 130, 108, 92, 157],
        newMonthly: [68, 63, 70, 74, 80, 89, 110, 115, 96, 80, 68, 119] };
      const svgXml = chartData
        ? (presetType === 'bar' ? buildBarChartSvgXml(chartData as BarChartData) : buildLineChartSvgXml(chartData as LineChartData))
        : (presetType === 'bar' ? buildBarChartSvgXml(defaultBar) : buildLineChartSvgXml(defaultLine));
      const resolvedData = chartData ?? (presetType === 'bar' ? defaultBar : defaultLine);
      const roomSize = (resolvedData as BarChartData).roomSize;
      const label = `${roomSize} ${presetType === 'bar' ? '棒グラフ' : '折れ線グラフ'}`;

      setMessages(prev => [...prev, makeMsg('ai', '🖼️ PNGに変換中...')]);
      setIsGenerating(false);
      setIsCompiling(true);

      // Stage 3: SVG → PNG → email JSX（非同期、最低1200msシマー保証）
      try {
        const [pngDataUrl] = await Promise.all([
          svgToPngDataUrl(svgXml),
          new Promise<void>(r => setTimeout(r, 1200)),
        ]);
        const finalCode = wrapWithEmailPng(pngDataUrl, emailText);
        setGeneratedCode(finalCode);
        handleSaveEmail(finalCode, presetType, label);
        setMessages(prev => [...prev, makeMsg('ai', `✅ メールを生成・保存しました（${label}）`)]);
        setPresetId(presetType);
      } catch {
        setMessages(prev => [...prev, makeMsg('ai', 'グラフのPNG変換に失敗しました。')]);
        setPresetId(presetType);
      } finally {
        setIsCompiling(false);
      }
    } catch {
      setStreamingText('');
      setIsGenerating(false);
      setMessages(prev => [...prev, makeMsg('ai', 'エラーが発生しました。デモモードで表示します。')]);
      setIsCompiling(true);
      setTimeout(() => { setIsCompiling(false); setPresetId(presetType); }, 800);
    }
  };

  const handleSendMessage = (text: string) => {
    setMessages(prev => [...prev, makeMsg('user', text)]);
    const isEmailRequest = text.includes('メール') || text.includes('案内') || text.includes('ドラフト');
    const parsed = isEmailRequest ? parseAcRequest(text) : null;

    if (parsed) {
      const savingsKwh = parsed.oldKwh - parsed.newKwh;
      const savingsYen = savingsKwh * parsed.unitPrice;
      const emailPrompt = `エアコン${parsed.roomSize}の旧型（年間${parsed.oldKwh}kWh）から新型（年間${parsed.newKwh}kWh）への買い替えを促す来店案内メールを作成してください。電力単価${parsed.unitPrice}円/kWh、年間節約電力${savingsKwh}kWh、節約金額${savingsYen.toLocaleString('ja-JP')}円。`;
      const chartData: BarChartData | LineChartData = parsed.chartType === 'line'
        ? { oldKwh: parsed.oldKwh, newKwh: parsed.newKwh, unitPrice: parsed.unitPrice, savingsKwh, savingsYen, roomSize: parsed.roomSize, oldMonthly: distributeMonthly(parsed.oldKwh), newMonthly: distributeMonthly(parsed.newKwh) }
        : { oldKwh: parsed.oldKwh, newKwh: parsed.newKwh, unitPrice: parsed.unitPrice, savingsKwh, savingsYen, roomSize: parsed.roomSize };
      runDualModelGeneration(emailPrompt, parsed.chartType, chartData);
    } else {
      const lower = text.toLowerCase();
      const preset: 'bar' | 'line' =
        (lower.includes('線') || lower.includes('推移') || lower.includes('5年') || lower.includes('line'))
          ? 'line' : 'bar';
      const enriched = `${text}\n\n（エアコンのデータがある場合: 旧モデル45,000円・新モデル33,000円・20畳型）`;
      runGeneration(enriched, preset);
    }
  };

  const handleSelectPreset = (id: 'bar' | 'line') => {
    const userText = id === 'bar'
      ? 'あなたは、家電量販店の販売促進スタッフで、過去にエアコン購入された顧客に、Eメールで新エアコンの案内をして、新型は、年間消費電力を節約できることアピールして、店舗に来店して購買するメールのドラフトを作成してます。 エアコンの20畳型の旧型は、2,383kWhの年間消費電力量、新型は、1,922kWhの年間消費電力量で、電力単価は31円です。年間消費電力比較の棒グラフを表示した、メール案内文をドラフトして'
      : 'あなたは、家電量販店の販売促進スタッフで、過去にエアコン購入された顧客に、Eメールで新エアコンの案内をして、新型は、年間消費電力を節約できることアピールして、店舗に来店して購買するメールのドラフトを作成してます。 エアコンの12畳型の旧型は、1,390kWhの年間消費電力量、新型は、1,032kWhの年間消費電力量で、電力単価は31円です。年間消費電力比較の線グラフを表示した、メール案内文をドラフトして';
    setMessages(prev => [...prev, makeMsg('user', userText)]);
    runDualModelGeneration(EMAIL_PROMPTS[id], id);
  };

  return (
    <div className="app-container">
      <ChatWindow
        messages={messages}
        isGenerating={isGenerating}
        streamingText={streamingText}
        ollamaStatus={ollamaStatus}
        ollamaModel={ollamaModel}
        ollamaTextModel={ollamaTextModel}
        onSendMessage={handleSendMessage}
        onSelectPreset={handleSelectPreset}
      />
      <CodeInterpreter
        presetId={presetId}
        isCompiling={isCompiling}
        generatedCode={generatedCode}
        savedEmails={savedEmails}
        onDeleteEmail={handleDeleteEmail}
      />
    </div>
  );
};

export default App;
