import React, { useState, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import type { Message } from './components/ChatWindow';
import { CodeInterpreter } from './components/CodeInterpreter';
import {
  listModels, pickBestModel, chatStream,
  extractCode, sanitizeCode, stripCodeBlocks,
} from './services/ollamaService';

const SYSTEM_PROMPT = `You are a React UI component generator. Generate beautiful, interactive React components.

STRICT OUTPUT FORMAT:
1. Write 1-2 sentences describing what you created.
2. Output the complete code in a single \`\`\`jsx code block.

STRICT CODE RULES:
- The main component MUST be named exactly "App"
- Do NOT write any import or export statements (React, useState, useEffect, useRef etc. are already available as globals)
- Use ONLY inline styles (style={{...}}) — no className referencing external CSS
- Make it visually appealing with colors, rounded corners, and interactivity

BAR CHART LAYOUT RULES (critical — follow exactly):
- Always use SVG for bar charts. Set viewBox="0 0 W H" and use <rect> elements for bars.
- Calculate bar x/y/width/height as pixel values from data, never as CSS percentages.
- Do NOT use height:X% on flex children — percentage heights in flex containers resolve to 0.`;

const PRESET_PROMPTS: Record<'bar' | 'line', string> = {
  bar: `エアコン20畳型の旧モデル（購入価格45,000円）と新モデル（購入価格33,000円）の月別年間消費電力量(kWh)を比較する棒グラフコンポーネントを作成して。

データ:
旧モデル(kWh): [280,255,155,75,55,85,195,315,225,75,115,210]
新モデル(kWh): [168,153,93,45,33,51,117,189,135,45,69,126]
月: 1月〜12月 / 電気代: 30円/kWh

要件:
- SVGのviewBox="0 0 760 260"を使い、<rect>要素でバーを描画すること（CSSのheight:%は使わない）
- 旧モデル=#f43f5e、新モデル=#06b6d4の2本並び棒グラフ
- SVG内に月ラベル（<text>）とY軸グリッド線を追加
- 下部に「旧モデル年間合計kWh」「新モデル年間合計kWh」「年間節約額（円）」の統計カード3枚
- ライトな背景でモダンなデザイン`,

  line: `エアコン20畳型の旧モデル（45,000円）と新モデル（33,000円）の5年間累積費用推移を折れ線グラフで作成して。

累積費用データ(円):
旧モデル: [45000, 106200, 167400, 228600, 289800, 351000]
新モデル: [33000, 69720, 106440, 143160, 179880, 216600]
X軸ラベル: 購入時〜5年目

要件:
- SVGで折れ線グラフ
- 旧モデル=#f43f5e、新モデル=#06b6d4、節約エリアを薄い緑でfill
- データ点をサークルで表示、Y軸ラベル（万円）・X軸ラベルあり
- 下部に「旧モデル5年総費用」「新モデル5年総費用」「5年間節約総額」の統計カード3枚
- ライトな背景でモダンなデザイン`,
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
    makeMsg('ai', 'こんにちは！Nexus AI Copilot です。Ollama LLM に接続してリアルタイムで React コンポーネントを生成します。下のプロンプトをクリックするか、直接指示を入力してください。'),
  ]);
  const [presetId, setPresetId] = useState<'welcome' | 'bar' | 'line'>('welcome');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [ollamaModel, setOllamaModel] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    (async () => {
      try {
        const models = await listModels();
        const best = pickBestModel(models);
        setOllamaModel(best);
        setOllamaStatus('online');
        setMessages(prev => [...prev, makeMsg('ai',
          `Ollama に接続しました。モデル「${best}」を使用します。プロンプトを選択してください。`
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

  const handleSendMessage = (text: string) => {
    setMessages(prev => [...prev, makeMsg('user', text)]);
    const lower = text.toLowerCase();
    let preset: 'bar' | 'line' =
      (lower.includes('線') || lower.includes('推移') || lower.includes('5年') || lower.includes('line'))
        ? 'line' : 'bar';
    const enriched = `${text}\n\n（エアコンのデータがある場合: 旧モデル45,000円・新モデル33,000円・20畳型）`;
    runGeneration(enriched, preset);
  };

  const handleSelectPreset = (id: 'bar' | 'line') => {
    const userText = id === 'bar'
      ? 'エアコンの20畳型の旧45,000円、新33,000円の年間消費電力比較のグラフを表示して。'
      : 'エアコンの20畳型の旧45,000円、新33,000円の年間消費電力比較の5年間の推移を線グラフで表示して。';
    setMessages(prev => [...prev, makeMsg('user', userText)]);
    runGeneration(PRESET_PROMPTS[id], id);
  };

  return (
    <div className="app-container">
      <ChatWindow
        messages={messages}
        isGenerating={isGenerating}
        streamingText={streamingText}
        ollamaStatus={ollamaStatus}
        ollamaModel={ollamaModel}
        onSendMessage={handleSendMessage}
        onSelectPreset={handleSelectPreset}
      />
      <CodeInterpreter
        presetId={presetId}
        isCompiling={isCompiling}
        generatedCode={generatedCode}
      />
    </div>
  );
};

export default App;
