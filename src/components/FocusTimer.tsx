import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Brain, Coffee } from 'lucide-react';

export const FocusTimer: React.FC = () => {
  const FOCUS_TIME = 25 * 60; // 25 minutes
  const BREAK_TIME = 5 * 60;  // 5 minutes

  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const timerRef = useRef<any | null>(null);

  // Stroke Dash properties
  const radius = 90;
  const circumference = 2 * Math.PI * radius; // 565.48
  const progress = timeLeft / (isBreak ? BREAK_TIME : FOCUS_TIME);
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    
    // Switch modes
    const nextMode = !isBreak;
    setIsBreak(nextMode);
    setTimeLeft(nextMode ? BREAK_TIME : FOCUS_TIME);

    // Standard audio notify fallback (beep)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio Context not allowed yet');
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setTimeLeft(isBreak ? BREAK_TIME : FOCUS_TIME);
  };

  const switchMode = (toBreak: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setIsBreak(toBreak);
    setTimeLeft(toBreak ? BREAK_TIME : FOCUS_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel card-padding">
      <div className="card-header">
        <h3 className="card-title">
          <Brain size={18} className="text-primary-color" />
          <span>フォーカスタイマー</span>
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn-glass ${!isBreak ? 'active' : ''}`} 
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px',
              borderColor: !isBreak ? 'hsla(var(--primary)/0.3)' : '',
              background: !isBreak ? 'hsla(var(--primary)/0.1)' : ''
            }}
            onClick={() => switchMode(false)}
          >
            <Brain size={12} className={!isBreak ? 'text-primary-color' : ''} />
            <span>集中</span>
          </button>
          <button 
            className={`btn-glass ${isBreak ? 'active' : ''}`}
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px',
              borderColor: isBreak ? 'hsla(var(--secondary)/0.3)' : '',
              background: isBreak ? 'hsla(var(--secondary)/0.1)' : ''
            }}
            onClick={() => switchMode(true)}
          >
            <Coffee size={12} className={isBreak ? 'text-rose' : ''} />
            <span>休憩</span>
          </button>
        </div>
      </div>

      <div className="timer-container">
        {/* Animated SVG Ring */}
        <div className="timer-circle-wrap">
          <svg className="timer-svg">
            <defs>
              <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor={isBreak ? "hsl(var(--rose))" : "hsl(var(--secondary))"} />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r={radius} className="timer-bg-circle" />
            <circle 
              cx="100" 
              cy="100" 
              r={radius} 
              className="timer-progress-circle"
              style={{ strokeDashoffset }}
            />
          </svg>
          <div className="timer-text-content">
            <span className="timer-digits">{formatTime(timeLeft)}</span>
            <span className="timer-status-text">
              {isBreak ? 'Break Time' : 'Deep Work'}
            </span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="timer-controls">
          <button 
            className={`timer-btn-icon ${isActive ? 'active' : ''}`}
            onClick={toggleTimer}
            title={isActive ? '一時停止' : '開始'}
          >
            {isActive ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
          </button>
          <button 
            className="timer-btn-icon" 
            onClick={resetTimer}
            title="リセット"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
