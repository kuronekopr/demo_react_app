import React, { useState } from 'react';
import { Code, Eye, Loader2 } from 'lucide-react';

interface CodeInterpreterProps {
  presetId: 'welcome' | 'bar' | 'line';
  isCompiling: boolean;
  generatedCode: string;
}

// Build a self-contained HTML page that renders the generated React component
function buildIframeHtml(code: string): string {
  const escaped = JSON.stringify(code);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 20px; font-family: Inter, system-ui, sans-serif;
           background: #f8fafc; color: #1e293b; min-height: 100vh; }
  </style>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"><p style="color:#94a3b8;font-size:12px;font-family:monospace;padding:8px">レンダリング中...</p></div>
  <script>
    const { useState, useEffect, useRef, useCallback, useMemo, useReducer } = React;
    const _root = document.getElementById('root');
    function showError(msg) {
      _root.innerHTML = '<pre style="color:#e11d48;font-size:12px;padding:16px;background:#fff1f2;border-radius:8px;margin:0;white-space:pre-wrap;word-break:break-word">' + msg + '</pre>';
    }
    const _code = ${escaped};
    try {
      const _compiled = Babel.transform(_code, { presets: ['react'] }).code;
      // Wrap in IIFE so const/let App leaks back — plain eval loses const/let to scope
      window.__comp__ = eval('(function(){\\n' + _compiled + '\\nreturn typeof App !== "undefined" ? App : null;\\n})()');
      if (!window.__comp__) {
        showError('Error: Component named "App" not found in generated code.');
      } else {
        try {
          ReactDOM.createRoot(_root).render(React.createElement(window.__comp__));
        } catch(e) {
          showError('Runtime Error:\\n' + e.message);
        }
      }
    } catch(e) {
      showError('Compile Error:\\n' + e.message);
    }
  </script>
</body>
</html>`;
}

export const CodeInterpreter: React.FC<CodeInterpreterProps> = ({
  presetId, isCompiling, generatedCode,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  // ---- Hardcoded fallback demos ----

  const WelcomeView = () => (
    <div style={{ textAlign: 'center', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="chat-logo" style={{ width: '60px', height: '60px', borderRadius: '16px', fontSize: '28px', margin: '0 auto' }}>
        <span>⚡</span>
        <div className="chat-logo-shimmer"></div>
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Code Interpreter デモ環境</h2>
      <p style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', lineHeight: 1.6 }}>
        左側のチャットで指示を入力すると、Ollama LLM がリアルタイムでReactコンポーネントを生成し、ここにレンダリングします。
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
        {['Ollama', 'React 19', 'Vite'].map(t => (
          <span key={t} className="interpreter-badge" style={{ background: 'hsla(var(--primary)/0.08)', color: 'hsl(var(--primary))', borderColor: 'hsla(var(--primary)/0.25)' }}>{t}</span>
        ))}
      </div>
    </div>
  );

  const BarComparisonDemo = () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const oldData = [280, 255, 155, 75, 55, 85, 195, 315, 225, 75, 115, 210];
    const newData = [168, 153, 93, 45, 33, 51, 117, 189, 135, 45, 69, 126];
    const maxVal = Math.max(...oldData);
    const oldTotal = oldData.reduce((a, b) => a + b, 0);
    const newTotal = newData.reduce((a, b) => a + b, 0);
    return (
      <div className="demo-comparison-card glass-panel">
        <div className="card-header" style={{ marginBottom: '4px' }}>
          <h3 className="card-title">年間消費電力量 月別比較（20畳型）</h3>
        </div>
        <div className="demo-legend">
          <span className="demo-legend-item" style={{ color: 'hsl(var(--rose))' }}><span className="demo-legend-dot" style={{ background: 'hsl(var(--rose))' }}></span>旧モデル 45,000円</span>
          <span className="demo-legend-item" style={{ color: 'hsl(var(--cyan))' }}><span className="demo-legend-dot" style={{ background: 'hsl(var(--cyan))' }}></span>新モデル 33,000円</span>
        </div>
        <div className="demo-comparison-chart">
          {months.map((m, i) => (
            <div key={i} className="demo-comparison-bar-group">
              <div className="demo-comparison-bars">
                <div className="demo-comparison-bar-outer"><div className="demo-comparison-bar old" style={{ height: `${(oldData[i] / maxVal) * 100}%` }} /></div>
                <div className="demo-comparison-bar-outer"><div className="demo-comparison-bar new" style={{ height: `${(newData[i] / maxVal) * 100}%` }} /></div>
              </div>
              <span style={{ fontSize: '9px', color: 'hsl(var(--text-dim))', fontWeight: 500 }}>{m}</span>
            </div>
          ))}
        </div>
        <div className="demo-stats-grid">
          <div className="demo-stat-card"><span style={{ fontSize: '11px', color: 'hsl(var(--text-dim))' }}>旧モデル年間</span><span style={{ fontSize: '17px', fontWeight: 700, color: 'hsl(var(--rose))' }}>{oldTotal.toLocaleString()} kWh</span></div>
          <div className="demo-stat-card"><span style={{ fontSize: '11px', color: 'hsl(var(--text-dim))' }}>新モデル年間</span><span style={{ fontSize: '17px', fontWeight: 700, color: 'hsl(var(--cyan))' }}>{newTotal.toLocaleString()} kWh</span></div>
          <div className="demo-stat-card"><span style={{ fontSize: '11px', color: 'hsl(var(--text-dim))' }}>年間節約額</span><span style={{ fontSize: '17px', fontWeight: 700, color: 'hsl(var(--emerald))' }}>¥{((oldTotal - newTotal) * 30).toLocaleString()}</span></div>
        </div>
      </div>
    );
  };

  const LineGraphDemo = () => {
    const years = ['購入時', '1年目', '2年目', '3年目', '4年目', '5年目'];
    const oldData = [45000, 106200, 167400, 228600, 289800, 351000];
    const newData = [33000, 69720, 106440, 143160, 179880, 216600];
    const W = 480, H = 185, padL = 46, padR = 16, padT = 14, padB = 32, maxY = 360000;
    const getX = (i: number) => padL + (i / (years.length - 1)) * (W - padL - padR);
    const getY = (v: number) => padT + (H - padT - padB) - (v / maxY) * (H - padT - padB);
    const oldPath = oldData.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
    const newPath = newData.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
    const fillPts = [...oldData.map((v, i) => `${getX(i)},${getY(v)}`), ...[...newData].reverse().map((v, i) => `${getX(years.length - 1 - i)},${getY(v)}`)].join(' ');
    return (
      <div className="demo-comparison-card glass-panel">
        <div className="card-header" style={{ marginBottom: '4px' }}><h3 className="card-title">5年間 累積費用推移（20畳型）</h3></div>
        <div className="demo-legend">
          <span className="demo-legend-item" style={{ color: 'hsl(var(--rose))' }}><span style={{ display: 'inline-block', width: '18px', height: '2.5px', background: 'hsl(var(--rose))', borderRadius: '2px', verticalAlign: 'middle' }}></span>&nbsp;旧モデル 45,000円</span>
          <span className="demo-legend-item" style={{ color: 'hsl(var(--cyan))' }}><span style={{ display: 'inline-block', width: '18px', height: '2.5px', background: 'hsl(var(--cyan))', borderRadius: '2px', verticalAlign: 'middle' }}></span>&nbsp;新モデル 33,000円</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: `${H}px`, display: 'block', marginBottom: '16px' }}>
          {[0, 100000, 200000, 300000].map((v, i) => (
            <React.Fragment key={i}>
              <line x1={padL} y1={getY(v)} x2={W - padR} y2={getY(v)} stroke="rgba(0,0,0,0.07)" strokeWidth="1" />
              <text x={padL - 5} y={getY(v) + 4} textAnchor="end" fontSize="9" fill="hsl(224, 10%, 62%)">{v === 0 ? '0' : `${v / 10000}万`}</text>
            </React.Fragment>
          ))}
          {years.map((yr, i) => <text key={i} x={getX(i)} y={H - 7} textAnchor="middle" fontSize="9" fill="hsl(224, 10%, 62%)">{yr}</text>)}
          <polygon points={fillPts} fill="rgba(16,185,129,0.07)" />
          <polyline points={oldPath} fill="none" stroke="hsl(345,82%,50%)" strokeWidth="2.5" strokeLinejoin="round" />
          <polyline points={newPath} fill="none" stroke="hsl(190,90%,36%)" strokeWidth="2.5" strokeLinejoin="round" />
          {oldData.map((v, i) => <circle key={i} cx={getX(i)} cy={getY(v)} r="3.5" fill="hsl(345,82%,50%)" />)}
          {newData.map((v, i) => <circle key={i} cx={getX(i)} cy={getY(v)} r="3.5" fill="hsl(190,90%,36%)" />)}
        </svg>
        <div className="demo-stats-grid">
          <div className="demo-stat-card"><span style={{ fontSize: '11px', color: 'hsl(var(--text-dim))' }}>旧モデル5年総費用</span><span style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--rose))' }}>¥{oldData[5].toLocaleString()}</span></div>
          <div className="demo-stat-card"><span style={{ fontSize: '11px', color: 'hsl(var(--text-dim))' }}>新モデル5年総費用</span><span style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--cyan))' }}>¥{newData[5].toLocaleString()}</span></div>
          <div className="demo-stat-card"><span style={{ fontSize: '11px', color: 'hsl(var(--text-dim))' }}>5年間節約総額</span><span style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(var(--emerald))' }}>¥{(oldData[5] - newData[5]).toLocaleString()}</span></div>
        </div>
      </div>
    );
  };

  // Code display for the fallback demos
  const fallbackCode: Record<string, string> = {
    welcome: `// Code Interpreter\n// AIからの指示をお待ちしています。`,
    bar: `// LLM Generated: AirconBarChart\n// 年間消費電力量 月別比較 (20畳型)\n\nfunction App() {\n  const months = ['1月','2月','3月','4月','5月','6月',\n                  '7月','8月','9月','10月','11月','12月'];\n  const oldData = [280,255,155,75,55,85,195,315,225,75,115,210];\n  const newData = [168,153,93,45,33,51,117,189,135,45,69,126];\n  const maxVal = Math.max(...oldData);\n  const saving = (oldData.reduce((a,b)=>a+b,0) -\n                  newData.reduce((a,b)=>a+b,0)) * 30;\n\n  return (\n    <div style={{padding:'24px'}}>\n      <h2>年間消費電力量 月別比較</h2>\n      <div style={{display:'flex',alignItems:'flex-end',height:'160px',gap:'4px'}}>\n        {months.map((m,i) => (\n          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>\n            <div style={{display:'flex',gap:'2px',height:'140px',alignItems:'flex-end'}}>\n              <div style={{width:'10px',height:\`\${(oldData[i]/maxVal)*100}%\`,background:'#f43f5e',borderRadius:'3px'}} />\n              <div style={{width:'10px',height:\`\${(newData[i]/maxVal)*100}%\`,background:'#06b6d4',borderRadius:'3px'}} />\n            </div>\n            <span style={{fontSize:'9px'}}>{m}</span>\n          </div>\n        ))}\n      </div>\n      <p>年間節約額: ¥{saving.toLocaleString()}</p>\n    </div>\n  );\n}`,
    line: `// LLM Generated: AirconLineChart\n// 5年間累積費用推移 (20畳型)\n\nfunction App() {\n  const years = ['購入時','1年目','2年目','3年目','4年目','5年目'];\n  const oldData = [45000,106200,167400,228600,289800,351000];\n  const newData = [33000,69720,106440,143160,179880,216600];\n  const W=480, H=185, maxY=360000;\n  const getX = i => 46 + (i/(years.length-1)) * (W-62);\n  const getY = v => 14 + (H-46) * (1 - v/maxY);\n\n  return (\n    <div style={{padding:'24px'}}>\n      <h2>5年間 累積費用推移</h2>\n      <svg viewBox={\`0 0 \${W} \${H}\`} style={{width:'100%'}}>\n        <polyline points={oldData.map((v,i)=>\`\${getX(i)},\${getY(v)}\`).join(' ')}\n          fill="none" stroke="#f43f5e" strokeWidth="2.5" />\n        <polyline points={newData.map((v,i)=>\`\${getX(i)},\${getY(v)}\`).join(' ')}\n          fill="none" stroke="#06b6d4" strokeWidth="2.5" />\n      </svg>\n      <p>5年節約総額: ¥{(oldData[5]-newData[5]).toLocaleString()}</p>\n    </div>\n  );\n}`,
  };

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const renderHighlightedCode = (code: string) =>
    code.split('\n').map((line, i) => {
      const safe = escapeHtml(line);
      let r = safe
        .replace(/\b(import|from|const|let|var|return|export|default|if|else|function)\b/g, '<span class="keyword">$1</span>')
        .replace(/\b(React|useState|useEffect|useRef|string|number|boolean)\b/g, '<span class="type">$1</span>')
        .replace(/(['"`].*?['"`])/g, '<span class="string">$1</span>');
      if (safe.trim().startsWith('//')) r = `<span class="comment">${safe}</span>`;
      return <div key={i} className="code-line" dangerouslySetInnerHTML={{ __html: r || '&nbsp;' }} />;
    });

  const codeToDisplay = generatedCode || fallbackCode[presetId] || '';

  return (
    <div className="glass-panel preview-column">
      <div className="interpreter-header">
        <div className="interpreter-title-row">
          <span className="interpreter-badge">Interpreter</span>
          {isCompiling ? (
            <div className="compiling-bar">
              <Loader2 size={14} className="spinning-loader" />
              <span style={{ fontFamily: 'monospace' }}>
                {generatedCode ? 'Injecting generated code...' : 'Vite 8.0.14 compiling...'}
              </span>
            </div>
          ) : (
            <span className="interpreter-subtext">
              {presetId === 'welcome' ? 'Standby' : generatedCode ? 'LLM Generated ✓' : 'Demo mode'}
            </span>
          )}
        </div>

        {presetId !== 'welcome' && (
          <div className="interpreter-tabs">
            <button className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
              <Eye size={14} /><span>プレビュー</span>
            </button>
            <button className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>
              <Code size={14} /><span>コード表示</span>
            </button>
          </div>
        )}
      </div>

      <div className="interpreter-viewport">
        {isCompiling ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', flex: 1 }}>
            <Loader2 size={36} className="spinning-loader" style={{ animationDuration: '0.8s' }} />
            <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', fontFamily: 'monospace' }}>
              Rendering component...
            </p>
          </div>
        ) : activeTab === 'preview' ? (
          generatedCode ? (
            // LLM generated code → iframe sandbox
            <iframe
              key={generatedCode}
              srcDoc={buildIframeHtml(generatedCode)}
              style={{ width: '100%', height: '100%', border: 'none', background: '#f8fafc' }}
              sandbox="allow-scripts"
              title="Generated React Component"
            />
          ) : (
            <div className="viewport-panel">
              {presetId === 'welcome' && <WelcomeView />}
              {presetId === 'bar' && <BarComparisonDemo />}
              {presetId === 'line' && <LineGraphDemo />}
            </div>
          )
        ) : (
          <div className="code-viewer-panel">
            {renderHighlightedCode(codeToDisplay)}
          </div>
        )}
      </div>
    </div>
  );
};
