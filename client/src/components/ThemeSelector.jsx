import React, { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

const THEMES = [
  {
    id: 'cyber',
    name: 'Cyber Cyan',
    dotColor: '#00f2fe',
    secondaryColor: '#3b82f6',
    desc: 'Electric Blue & Cyberpunk Cyan',
  },
  {
    id: 'nebula',
    name: 'Nebula Violet',
    dotColor: '#c084fc',
    secondaryColor: '#ec4899',
    desc: 'Deep Purple & Neon Magenta',
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    dotColor: '#10b981',
    secondaryColor: '#06b6d4',
    desc: 'Bioluminescent Mint & Jade',
  },
  {
    id: 'sunset',
    name: 'Solar Sunset',
    dotColor: '#f59e0b',
    secondaryColor: '#f43f5e',
    desc: 'Vivid Amber & Coral Glow',
  },
];

export const ThemeSelector = ({ onShowToast }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('blockshare_theme') || 'cyber';
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('blockshare_theme', currentTheme);
  }, [currentTheme]);

  const selectTheme = (themeId, themeName) => {
    setCurrentTheme(themeId);
    setOpen(false);
    if (onShowToast) {
      onShowToast(`Theme changed to ${themeName}!`, 'info');
    }
  };

  const activeTheme = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setOpen(!open)}
        title="Change UI Color Theme Palette"
        style={{
          fontSize: '0.8rem',
          padding: '0.35rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          borderColor: 'rgba(255, 255, 255, 0.18)',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 'var(--radius-full)',
        }}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${activeTheme.dotColor}, ${activeTheme.secondaryColor})`,
            boxShadow: `0 0 8px ${activeTheme.dotColor}`,
          }}
        />
        <Palette size={14} style={{ color: activeTheme.dotColor }} />
        <span style={{ fontWeight: 600 }}>{activeTheme.name.split(' ')[1]}</span>
      </button>

      {open && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 998,
            }}
            onClick={() => setOpen(false)}
          />
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '240px',
              padding: '0.75rem',
              zIndex: 999,
              borderRadius: '16px',
              border: '1px solid var(--card-border-hover)',
              background: 'var(--card-bg)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7), 0 0 25px var(--glow-primary)',
              backdropFilter: 'blur(20px)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem',
                padding: '0 0.4rem',
              }}
            >
              🎨 Color Palette
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {THEMES.map((theme) => {
                const isSelected = theme.id === currentTheme;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => selectTheme(theme.id, theme.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.65rem',
                      borderRadius: '10px',
                      border: isSelected
                        ? `1px solid ${theme.dotColor}`
                        : '1px solid transparent',
                      background: isSelected
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${theme.dotColor}, ${theme.secondaryColor})`,
                          boxShadow: isSelected ? `0 0 12px ${theme.dotColor}` : 'none',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {theme.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {theme.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} style={{ color: theme.dotColor }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
