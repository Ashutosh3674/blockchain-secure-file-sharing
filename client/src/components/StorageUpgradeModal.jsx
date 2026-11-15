import React, { useState } from 'react';
import {
  X,
  HardDrive,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  Server,
  Database,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import {
  STORAGE_PLANS,
  getActiveStoragePlan,
  setActiveStoragePlan,
  contractService,
} from '../services/contractService';

export const StorageUpgradeModal = ({ isOpen, onClose, userAddress, onShowToast, onPlanChanged }) => {
  if (!isOpen) return null;

  const [activePlan, setActivePlan] = useState(getActiveStoragePlan());
  const storageDetails = contractService.getStorageDetails(userAddress);

  const handleSelectPlan = (planId) => {
    const updated = setActiveStoragePlan(planId);
    setActivePlan(updated);
    if (onPlanChanged) onPlanChanged(updated);
    if (onShowToast) {
      onShowToast(`🎉 Storage plan updated to ${updated.name} (${updated.quotaGB} GB)!`);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: '820px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '1.75rem',
          borderRadius: '18px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.7), 0 0 50px rgba(0, 242, 254, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(139, 92, 246, 0.25) 100%)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0, 242, 254, 0.35)',
              }}
            >
              <HardDrive size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Decentralized Storage Plans</h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                  Web3 Quota Management
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Track usage, manage free tier storage quota &amp; unlock decentralized IPFS expansion
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Usage Meter Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0, 242, 254, 0.05) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            borderRadius: '14px',
            padding: '1.15rem 1.4rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Storage Usage
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '2px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatBytes(storageDetails.usedBytes)}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  used of <strong style={{ color: 'var(--accent-cyan)' }}>{storageDetails.plan.quotaGB} GB</strong> ({storageDetails.plan.name})
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: storageDetails.percentUsed > 80 ? '#ef4444' : storageDetails.percentUsed > 50 ? '#f59e0b' : '#10b981',
                }}
              >
                {storageDetails.percentUsed}% Quota Used
              </span>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {formatBytes(storageDetails.freeBytesRemaining)} free remaining
              </div>
            </div>
          </div>

          {/* Meter Bar */}
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.max(2, storageDetails.percentUsed)}%`,
                height: '100%',
                background: storageDetails.percentUsed > 80 ? '#ef4444' : storageDetails.percentUsed > 50 ? '#f59e0b' : 'linear-gradient(90deg, #10b981, #00f2fe)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          {/* Category breakdown pills */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.85rem', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>📄 Docs: <b style={{ color: 'var(--text-secondary)' }}>{formatBytes(storageDetails.categories.documents)}</b></span>
            <span>&bull;</span>
            <span>🖼️ Images: <b style={{ color: 'var(--text-secondary)' }}>{formatBytes(storageDetails.categories.images)}</b></span>
            <span>&bull;</span>
            <span>📊 Sheets/Slides: <b style={{ color: 'var(--text-secondary)' }}>{formatBytes(storageDetails.categories.presentations + storageDetails.categories.spreadsheets)}</b></span>
            <span>&bull;</span>
            <span>📦 Archives: <b style={{ color: 'var(--text-secondary)' }}>{formatBytes(storageDetails.categories.archives)}</b></span>
            {storageDetails.trashedBytes > 0 && (
              <>
                <span>&bull;</span>
                <span style={{ color: '#fb7185' }}>🗑️ Trash: <b>{formatBytes(storageDetails.trashedBytes)}</b></span>
              </>
            )}
          </div>
        </div>

        {/* 3 Tier Upgrade Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {STORAGE_PLANS.map((plan) => {
            const isCurrent = activePlan.id === plan.id;
            const isPro = plan.id === 'pro';

            return (
              <div
                key={plan.id}
                style={{
                  background: isCurrent
                    ? 'linear-gradient(145deg, rgba(0, 242, 254, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: `2px solid ${isCurrent ? 'var(--accent-cyan)' : isPro ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Popular or Active Badge */}
                {isCurrent && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      background: 'var(--accent-cyan)',
                      color: '#050b14',
                      fontWeight: 800,
                      fontSize: '0.66rem',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Current Active Plan
                  </span>
                )}
                {!isCurrent && plan.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.66rem',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {plan.badge}
                  </span>
                )}

                <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700 }}>
                  {plan.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {plan.quotaGB >= 1024 ? `${plan.quotaGB / 1024} TB` : `${plan.quotaGB} GB`}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    IPFS Quota
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                    marginBottom: '1rem',
                  }}
                >
                  {plan.price} {plan.price !== 'Free' ? '(Free in Demo)' : ''}
                </div>

                {/* Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem', flex: 1 }}>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <Check size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`btn ${isCurrent ? 'btn-secondary' : isPro ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    width: '100%',
                    fontSize: '0.82rem',
                    padding: '0.5rem',
                    fontWeight: 700,
                    opacity: isCurrent ? 0.75 : 1,
                  }}
                >
                  {isCurrent ? 'Active Plan' : `Activate ${plan.quotaGB} GB Quota`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Highlights Note */}
        <div
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={14} color="var(--accent-cyan)" />
            <span>
              All plans include client-side zero-knowledge AES-256-GCM encryption and Smart Contract Access Control.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.85rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

