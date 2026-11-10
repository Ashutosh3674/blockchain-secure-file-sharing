import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileSearch,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Activity,
  Cpu,
} from 'lucide-react';

export const AIThreatScannerCard = ({
  threatAnalysis,
  isScanning,
  fileName,
  onApplyPreset,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (isScanning) {
    return (
      <div
        style={{
          marginTop: '0.65rem',
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(0, 242, 254, 0.15)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            animation: 'pulse 1.5s infinite',
          }}
        >
          <Activity size={18} className="animate-spin" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              AI Threat Intelligence Scanning...
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.66rem' }}>
              Deep Inspection
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Inspecting magic bytes, double extensions, Shannon entropy &amp; payload patterns for &ldquo;{fileName || 'selected file'}&rdquo;...
          </p>
        </div>
      </div>
    );
  }

  if (!threatAnalysis) return null;

  const {
    level = 'Safe',
    score = 5,
    verdict,
    recommendation,
    aiSummary,
    entropy,
    magicBytes,
    detectedType,
    findings = [],
    stats = {},
  } = threatAnalysis;

  // Level configuration
  const isDangerous = level === 'Dangerous';
  const isWarning = level === 'Warning';
  const isSafe = level === 'Safe';

  const themeColor = isDangerous ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  const bgGradient = isDangerous
    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(185, 28, 28, 0.05) 100%)'
    : isWarning
    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(180, 83, 9, 0.05) 100%)'
    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)';

  const borderColor = isDangerous
    ? 'rgba(239, 68, 68, 0.45)'
    : isWarning
    ? 'rgba(245, 158, 11, 0.45)'
    : 'rgba(16, 185, 129, 0.4)';

  const StatusIcon = isDangerous ? ShieldAlert : isWarning ? AlertTriangle : ShieldCheck;

  return (
    <div
      style={{
        marginTop: '0.65rem',
        background: bgGradient,
        border: `1.5px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: `${themeColor}22`,
              border: `1px solid ${themeColor}66`,
              color: themeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <StatusIcon size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI File Threat Detector
              </span>

              {/* Threat Score Pill */}
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.65rem',
                  borderRadius: '20px',
                  background: `${themeColor}25`,
                  border: `1px solid ${themeColor}`,
                  color: themeColor,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Threat Score: {score}/100</span>
                <span>&bull;</span>
                <span style={{ textTransform: 'uppercase' }}>{level}</span>
              </span>

              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                <Cpu size={10} /> AI Intel 2026
              </span>
            </div>

            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: isDangerous ? '#fca5a5' : isWarning ? '#fde68a' : '#a7f3d0', fontWeight: 600 }}>
              {verdict}
            </p>
          </div>
        </div>

        {/* Score Meter Visual */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ width: '70px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
            <div
              style={{
                width: `${score}%`,
                height: '100%',
                background: themeColor,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Entropy: {entropy || '0.0'}
          </span>
        </div>
      </div>

      {/* AI Intelligence Summary */}
      <div
        style={{
          marginTop: '0.55rem',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          fontSize: '0.74rem',
          color: 'var(--text-secondary)',
          borderLeft: `3px solid ${themeColor}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.45rem',
        }}
      >
        <Sparkles size={13} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>AI Analysis: </span>
          <span>{aiSummary || recommendation}</span>
        </div>
      </div>

      {/* Expand/Collapse Breakdown Toggle */}
      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.72rem',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <span>{expanded ? 'Hide Threat Vectors' : `View ${findings.length} Scanned Vectors & Findings`}</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* Quick Test Preset Buttons if callback provided */}
        {onApplyPreset && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Demo:</span>
            <button
              type="button"
              onClick={() => onApplyPreset('safe')}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                borderRadius: '4px',
                fontSize: '0.66rem',
                padding: '0.1rem 0.35rem',
                cursor: 'pointer',
              }}
              title="Test Safe File detection"
            >
              🟢 Safe
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset('warning')}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                borderRadius: '4px',
                fontSize: '0.66rem',
                padding: '0.1rem 0.35rem',
                cursor: 'pointer',
              }}
              title="Test Warning (Macro/Script) detection"
            >
              🟡 Warning
            </button>
            <button
              type="button"
              onClick={() => onApplyPreset('dangerous')}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                borderRadius: '4px',
                fontSize: '0.66rem',
                padding: '0.1rem 0.35rem',
                cursor: 'pointer',
              }}
              title="Test Dangerous (Executable disguise) detection"
            >
              🔴 Dangerous
            </button>
          </div>
        )}
      </div>

      {/* Expanded Findings Details */}
      {expanded && (
        <div
          style={{
            marginTop: '0.55rem',
            paddingTop: '0.55rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          {findings.map((finding, idx) => {
            const isCrit = finding.severity === 'critical';
            const isWarn = finding.severity === 'warning';
            const iconColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : '#10b981';
            const ItemIcon = isCrit ? XCircle : isWarn ? AlertTriangle : CheckCircle2;

            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.65rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  fontSize: '0.72rem',
                }}
              >
                <ItemIcon size={14} color={iconColor} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{finding.title}</span>
                    <span style={{ fontSize: '0.65rem', color: iconColor, textTransform: 'uppercase', fontWeight: 700 }}>
                      {finding.severity}
                    </span>
                  </div>
                  <p style={{ margin: '1px 0 0', color: 'var(--text-muted)' }}>{finding.desc}</p>
                </div>
              </div>
            );
          })}

          {/* Technical Diagnostics */}
          <div
            style={{
              marginTop: '0.25rem',
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.03)',
              padding: '0.35rem 0.55rem',
              borderRadius: '6px',
            }}
          >
            <span>Magic Bytes: <code className="mono">{magicBytes || 'N/A'}</code></span>
            <span>&bull;</span>
            <span>Detected Format: <strong>{detectedType || 'Document'}</strong></span>
            <span>&bull;</span>
            <span>Shannon Entropy: <strong>{entropy}/8.0</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

