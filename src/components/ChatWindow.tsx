import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ArrowRight, Wifi, WifiOff, Loader2 } from 'lucide-react';

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

interface ChatWindowProps {
  messages: Message[];
  isGenerating: boolean;
  streamingText: string;
  ollamaStatus: 'checking' | 'online' | 'offline';
  ollamaModel: string;
  ollamaTextModel?: string;
  onSendMessage: (text: string) => void;
  onSelectPreset: (presetId: 'bar' | 'line') => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isGenerating,
  streamingText,
  ollamaStatus,
  ollamaModel,
  ollamaTextModel,
  onSendMessage,
  onSelectPreset,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const presetDemos = [
    { id: 'bar', title: 'あなたは、家電量販店の販売促進スタッフで、過去にエアコン購入された顧客に、Eメールで新エアコンの案内をして、新型は、年間消費電力を節約できることアピールして、店舗に来店して購買するメールのドラフトを作成してます。 エアコンの20畳型の旧型は、2,383kWhの年間消費電力量、新型は、1,922kWhの年間消費電力量で、電力単価は31円です。年間消費電力比較の棒グラフを表示した、メール案内文をドラフトして' },
    { id: 'line', title: 'あなたは、家電量販店の販売促進スタッフで、過去にエアコン購入された顧客に、Eメールで新エアコンの案内をして、新型は、年間消費電力を節約できることアピールして、店舗に来店して購買するメールのドラフトを作成してます。 エアコンの12畳型の旧型は、1,390kWhの年間消費電力量、新型は、1,032kWhの年間消費電力量で、電力単価は31円です。年間消費電力比較の線グラフを表示した、メール案内文をドラフトして' },
  ] as const;

  const statusColor = ollamaStatus === 'online' ? 'hsl(var(--emerald))' : ollamaStatus === 'offline' ? 'hsl(var(--rose))' : 'hsl(var(--amber))';
  const isDualModel = ollamaTextModel && ollamaTextModel !== ollamaModel;
  const shorten = (name: string) => name.split(':')[0];
  const statusLabel = ollamaStatus === 'online'
    ? (isDualModel ? `${shorten(ollamaModel)} / ${shorten(ollamaTextModel!)}` : ollamaModel)
    : ollamaStatus === 'offline' ? 'Offline' : '接続中...';

  return (
    <div className="glass-panel chat-column">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-logo">
          <span>AI</span>
          <div className="chat-logo-shimmer"></div>
        </div>
        <div className="chat-title-area">
          <h1 className="chat-title">Nexus AI Copilot</h1>
          <div className="chat-status" style={{ color: statusColor }}>
            {ollamaStatus === 'online' ? <Wifi size={10} /> : ollamaStatus === 'offline' ? <WifiOff size={10} /> : <Loader2 size={10} className="spinning-loader" />}
            <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {statusLabel}
            </span>
          </div>
        </div>
        <Sparkles size={16} className="text-primary-color" />
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`msg-wrapper ${msg.sender === 'user' ? 'msg-user' : 'msg-ai'}`}>
            <div className="msg-bubble">{msg.text}</div>
            <span className="msg-time">{msg.time}</span>
          </div>
        ))}

        {/* Streaming text (in-progress AI response) */}
        {streamingText && (
          <div className="msg-wrapper msg-ai">
            <div className="msg-bubble" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {streamingText}
              <span className="streaming-cursor"></span>
            </div>
          </div>
        )}

        {/* Typing indicator (before first token arrives) */}
        {isGenerating && !streamingText && (
          <div className="msg-wrapper msg-ai">
            <div className="msg-bubble" style={{ padding: '12px 20px' }}>
              <div className="ai-typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Presets */}
      <div className="chat-presets">
        <p className="preset-title">おすすめの指示プロンプト</p>
        {presetDemos.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="preset-button"
            onClick={() => onSelectPreset(preset.id)}
            disabled={isGenerating}
          >
            <span>{preset.title}</span>
            <ArrowRight size={14} className="preset-button-icon" />
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            className="glass-input chat-input"
            placeholder="AIに指示を送信..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isGenerating}
          />
          <button
            type="submit"
            className="btn-primary chat-submit-btn"
            disabled={isGenerating || !inputText.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
