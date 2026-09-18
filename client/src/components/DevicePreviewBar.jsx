import React, { useState } from 'react';
import { Monitor, Laptop, Tablet, Smartphone, Maximize2, RotateCcw } from 'lucide-react';

/**
 * 📱 DevicePreviewBar.jsx
 * Interactive responsive viewport testing controller.
 * Allows instant live preview and testing across 4 standard form factors:
 * 1. Desktop (1440px)
 * 2. Laptop (1024px)
 * 3. Tablet (768px)
 * 4. Mobile (375px)
 */
export const DevicePreviewBar = ({ activeMode, onModeChange, currentWidth }) => {
  const [isOpen, setIsOpen] = useState(true);

  const DEVICES = [
    { id: 'desktop', label: 'Desktop', icon: Monitor, width: '100%', minPx: '1440px', desc: 'Full UHD / Widescreen' },
    { id: 'laptop', label: 'Laptop', icon: Laptop, width: '1024px', minPx: '1024px', desc: 'Standard Notebooks' },
    { id: 'tablet', label: 'Tablet', icon: Tablet, width: '768px', minPx: '768px', desc: 'iPad / Tablets' },
    { id: 'mobile', label: 'Mobile', icon: Smartphone, width: '390px', minPx: '390px', desc: 'iPhone / Android' },
  ];

  if (!isOpen) {
    return (
      <div style={{ position: 'fixed', bottom: '1rem', left: '1rem', zIndex: 9990 }}>
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-secondary"
          title="Open Responsive Viewport Simulator"
          style={{
            fontSize: '0.75rem',
            padding: '0.35rem 0.75rem',
            background: 'rgba(15, 23, 42, 0.9)',
            borderColor: 'rgba(0, 242, 254, 0.4)',
            color: 'var(--accent-cyan)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          }}
        >
          <Smartphone size={14} />
          <span>📱 Viewport Mode</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9980,
        background: 'rgba(7, 10, 18, 0.92)',
        borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
        backdropFilter: 'blur(12px)',
        padding: '0.35rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        fontSize: '0.78rem',
      }}
    >
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span>📱</span> Responsive Viewport Simulator:
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          (Works seamlessly across Desktop, Laptop, Tablet, Mobile)
        </span>
      </div>

      {/* Device buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {DEVICES.map((d) => {
          const Icon = d.icon;
          const isCurrent = activeMode === d.id;
          return (
            <button
              key={d.id}
              onClick={() => onModeChange(d.id, d.width)}
              style={{
                background: isCurrent ? 'rgba(0, 242, 254, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isCurrent ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)'}`,
                color: isCurrent ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '0.25rem 0.6rem',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: isCurrent ? 700 : 500,
                transition: 'all 0.15s ease',
              }}
              title={`${d.label} (${d.minPx}) — ${d.desc}`}
            >
              <Icon size={13} />
              <span>{d.label}</span>
              <span style={{ fontSize: '0.66rem', opacity: 0.7 }}>({d.minPx})</span>
            </button>
          );
        })}

        {/* Reset / Full width */}
        <button
          onClick={() => onModeChange('desktop', '100%')}
          title="Reset to 100% Full Screen"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem 0.4rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <RotateCcw size={13} />
        </button>

        <button
          onClick={() => setIsOpen(false)}
          title="Minimize Viewport Bar"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0 0.35rem',
          }}
        >
          &times;
        </button>
      </div>
    </div>
  );
};
