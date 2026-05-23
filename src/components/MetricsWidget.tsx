import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react';

interface MetricState {
  cpu: number;
  memory: number;
  network: number;
}

export const MetricsWidget: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricState>({
    cpu: 24,
    memory: 58,
    network: 42,
  });

  // Simulate real-time metrics fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        // Generate minor positive or negative changes to keep it natural
        const cpuDelta = (Math.random() - 0.5) * 6;
        const memDelta = (Math.random() - 0.5) * 2;
        const netDelta = (Math.random() - 0.5) * 12;

        return {
          cpu: Math.max(5, Math.min(95, Math.round(prev.cpu + cpuDelta))),
          memory: Math.max(10, Math.min(95, Math.round(prev.memory + memDelta))),
          network: Math.max(1, Math.min(100, Math.round(prev.network + netDelta))),
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getMetricColor = (val: number) => {
    if (val > 80) return 'hsl(var(--rose))';
    if (val > 60) return 'hsl(var(--amber))';
    return 'hsl(var(--cyan))';
  };

  return (
    <div className="glass-panel card-padding">
      <div className="card-header">
        <h3 className="card-title">
          <Activity size={18} className="text-primary-color" />
          <span>システムステータス</span>
        </h3>
        <span className="dot dot-emerald" title="システム正常稼働中"></span>
      </div>

      <div className="metrics-list">
        {/* CPU Metric */}
        <div className="metric-card">
          <div className="metric-info-row">
            <div className="metric-name-tag">
              <Cpu size={16} style={{ color: metrics.cpu > 70 ? 'hsl(var(--rose))' : 'hsl(var(--cyan))' }} />
              <span>CPU使用率</span>
            </div>
            <span className="metric-value-text" style={{ color: getMetricColor(metrics.cpu) }}>
              {metrics.cpu}%
            </span>
          </div>
          <div className="metric-bar-outer">
            <div 
              className="metric-bar-inner" 
              style={{ 
                width: `${metrics.cpu}%`,
                background: `linear-gradient(90deg, hsl(var(--primary)) 0%, ${getMetricColor(metrics.cpu)} 100%)`,
                boxShadow: `0 0 10px ${getMetricColor(metrics.cpu)}44`
              }}
            />
          </div>
        </div>

        {/* Memory Metric */}
        <div className="metric-card">
          <div className="metric-info-row">
            <div className="metric-name-tag">
              <HardDrive size={16} style={{ color: 'hsl(var(--secondary))' }} />
              <span>メモリ使用率</span>
            </div>
            <span className="metric-value-text">
              {metrics.memory}%
            </span>
          </div>
          <div className="metric-bar-outer">
            <div 
              className="metric-bar-inner" 
              style={{ 
                width: `${metrics.memory}%`,
                background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
                boxShadow: '0 0 10px hsla(var(--secondary)/0.3)'
              }}
            />
          </div>
        </div>

        {/* Network Metric */}
        <div className="metric-card">
          <div className="metric-info-row">
            <div className="metric-name-tag">
              <Wifi size={16} style={{ color: 'hsl(var(--emerald))' }} />
              <span>ネットワーク転送</span>
            </div>
            <span className="metric-value-text" style={{ color: 'hsl(var(--emerald))' }}>
              {metrics.network} Mbps
            </span>
          </div>
          <div className="metric-bar-outer">
            <div 
              className="metric-bar-inner" 
              style={{ 
                width: `${metrics.network}%`,
                background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--emerald)) 100%)',
                boxShadow: '0 0 10px hsla(var(--emerald)/0.3)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
