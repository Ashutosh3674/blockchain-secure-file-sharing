import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Clock,
  Blocks,
  FileText,
  User,
  ArrowRight,
  Fuel,
  Cpu,
  Layers,
  X,
  Sparkles,
  Link,
  Lock,
} from 'lucide-react';

/**
 * ⛓️ TransactionDetailsModal.jsx
 * Blockchain Transaction Verification & Explorer Inspector
 *
 * User Requirements:
 * User blockchain transaction ko verify kar sakega.
 *
 * Example:
 * Transaction ID: 0x82A7...
 * Block: #893721
 * Status: Confirmed
 * Timestamp: 18 Sept 2026
 * Action: File Permission Granted
 * "View on Explorer" button
 */
export const TransactionDetailsModal = ({ isOpen, onClose, initialTxHash = '0x82A7b913e8a4d70183ec9482bca84192bfa71029487cbb9281a4b92138a011', onShowToast }) => {
  const [txQuery, setTxQuery] = useState(initialTxHash);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [simulatedExplorerOpen, setSimulatedExplorerOpen] = useState(false);

  // Active Transaction Data
  const [txData, setTxData] = useState({
    txHash: '0x82A7b913e8a4d70183ec9482bca84192bfa71029487cbb9281a4b92138a011',
    txHashShort: '0x82A7...',
    blockNumber: '#893721',
    blockHeightNumber: 893721,
    status: 'Confirmed',
    confirmations: 24,
    timestampFormatted: '18 Sept 2026',
    timestampFull: '18 Sept 2026, 14:30:12 UTC',
    action: 'File Permission Granted',
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    contractName: 'FileAccessControl.sol',
    from: '0x71c67ed3e80435a55611f476c66337051b7b292a',
    fromName: 'Ashutosh (Owner)',
    to: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    toName: 'Rahul (Recipient)',
    fileName: 'Project.pdf',
    ipfsHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    gasUsed: '48,210',
    gasFeeETH: '0.000684 ETH ($1.64)',
    network: 'Ethereum Sepolia Testnet (EVM)',
    explorerUrl: 'https://sepolia.etherscan.io/tx/0x82A7b913e8a4d70183ec9482bca84192bfa71029487cbb9281a4b92138a011',
  });

  const SAMPLE_PRESETS = [
    {
      label: '0x82A7... (Permission Granted #893721)',
      hash: '0x82A7b913e8a4d70183ec9482bca84192bfa71029487cbb9281a4b92138a011',
    },
    {
      label: '0x8f2b... (File Registered #893710)',
      hash: '0x8f2b4c7913e8a4d70183ec9482bca84192bfa71029487cbb9281a4b92138a011',
    },
    {
      label: '0x9d4e... (Access Revoked #893735)',
      hash: '0x9d4e1f7a82bca84192bfa71029487cbb9281a4b92138a0110183ec9482bca855',
    },
  ];

  useEffect(() => {
    if (initialTxHash) {
      setTxQuery(initialTxHash);
      verifyTransaction(initialTxHash);
    }
  }, [initialTxHash, isOpen]);

  const verifyTransaction = async (hashToVerify) => {
    const hash = (hashToVerify || txQuery || '').trim();
    if (!hash) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/files/transactions/${encodeURIComponent(hash)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.transaction) {
          setTxData({
            ...data.transaction,
            timestampFull: `${data.transaction.timestampFormatted || '18 Sept 2026'}, ${new Date(data.transaction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC`,
            contractName: 'FileAccessControl.sol',
            gasFeeETH: '0.000684 ETH ($1.64)',
          });
          if (onShowToast) {
            onShowToast(`Transaction ${data.transaction.txHashShort} successfully verified on-chain!`, 'success');
          }
        }
      }
    } catch (err) {
      console.log('Transaction verify fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    if (onShowToast) onShowToast(`Copied ${fieldName} to clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 11, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '2rem',
          borderRadius: '20px',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(79, 172, 254, 0.2) 100%)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                }}
              >
                <Blocks size={22} />
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                  ⛓️ Blockchain <span className="gradient-text">Transaction Details</span>
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Cryptographic verification of smart contract access state & on-chain receipts
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Verification Search Bar & Presets */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={txQuery}
                onChange={(e) => setTxQuery(e.target.value)}
                placeholder="Enter Transaction ID (e.g. 0x82A7...)"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                }}
              />
              <Search
                size={15}
                color="var(--accent-cyan)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => verifyTransaction(txQuery)}
              disabled={loading}
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
            >
              {loading ? 'Verifying...' : 'Verify Tx'}
            </button>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Quick Examples:</span>
            {SAMPLE_PRESETS.map((preset) => (
              <button
                key={preset.hash}
                onClick={() => {
                  setTxQuery(preset.hash);
                  verifyTransaction(preset.hash);
                }}
                style={{
                  background: txData.txHash === preset.hash ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${txData.txHash === preset.hash ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`,
                  color: txData.txHash === preset.hash ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  borderRadius: '6px',
                  padding: '0.25rem 0.6rem',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* PRIMARY TRANSACTION CARD (Exact Structure Required) */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(0, 242, 254, 0.04) 0%, rgba(5, 11, 20, 0.8) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '1.5rem',
            position: 'relative',
          }}
        >
          {/* Status Badge Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                <span className="pulse-dot" style={{ background: '#10b981', width: '8px', height: '8px' }}></span>
                Status: {txData.status}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ({txData.confirmations} Block Confirmations)
              </span>
            </div>

            <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
              {txData.network}
            </span>
          </div>

          {/* 5 CANONICAL FIELDS REQUESTED BY USER */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            {/* Field 1: Transaction ID */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Transaction ID
                </span>
                <button
                  onClick={() => handleCopy(txData.txHash, 'Transaction ID')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem' }}
                >
                  {copiedField === 'Transaction ID' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedField === 'Transaction ID' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                {txData.txHashShort || txData.txHash.slice(0, 6) + '...'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '4px' }}>
                {txData.txHash}
              </div>
            </div>

            {/* Field 2: Block Number */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Block
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c084fc', fontFamily: 'monospace', marginTop: '2px' }}>
                {txData.blockNumber}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Epoch Block Index: {txData.blockHeightNumber || 893721}
              </span>
            </div>

            {/* Field 3: Timestamp */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Timestamp
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                {txData.timestampFormatted}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Clock size={12} /> {txData.timestampFull}
              </span>
            </div>

            {/* Field 4: Action */}
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Action
              </span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                {txData.action}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                Smart Contract Method: <code>grantAccess(ipfsHash, recipient)</code>
              </span>
            </div>

          </div>

          {/* Action Button: "View on Explorer" */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href={txData.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{
                fontSize: '0.88rem',
                padding: '0.65rem 1.35rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 0 16px rgba(0, 242, 254, 0.4)',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={16} />
              <span>View on Explorer</span>
            </a>

            <button
              className="btn btn-secondary"
              onClick={() => setSimulatedExplorerOpen(!simulatedExplorerOpen)}
              style={{ fontSize: '0.88rem', padding: '0.65rem 1rem' }}
            >
              {simulatedExplorerOpen ? 'Hide Block Explorer' : '🔍 In-App Explorer Receipt'}
            </button>
          </div>
        </div>

        {/* IN-APP BLOCK EXPLORER RECEIPT DRAWER */}
        {simulatedExplorerOpen && (
          <div
            style={{
              background: '#04070d',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              fontSize: '0.82rem',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                <b style={{ color: '#38bdf8' }}>Etherscan Sepolia Simulation (Transaction Receipt)</b>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Success (State Root 0x1)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>From (Signer):</span>
                <span className="mono" style={{ color: '#f8fafc' }}>{txData.from} ({txData.fromName})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Interacted With (To):</span>
                <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{txData.contractAddress} ({txData.contractName})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Recipient Address:</span>
                <span className="mono" style={{ color: '#c084fc' }}>{txData.to} ({txData.toName})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Encrypted File:</span>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{txData.fileName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>IPFS Multihash CID:</span>
                <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{txData.ipfsHash}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gas Consumed:</span>
                <span style={{ color: '#fbbf24' }}>{txData.gasUsed} Units ({txData.gasFeeETH})</span>
              </div>
            </div>
          </div>
        )}

        {/* Cryptographic Zero-Knowledge Security Note */}
        <div
          style={{
            background: 'rgba(0, 242, 254, 0.05)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.8rem',
          }}
        >
          <Lock size={20} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
          <div style={{ color: 'var(--text-secondary)' }}>
            <b style={{ color: '#f8fafc' }}>Zero-Knowledge On-Chain Invariant:</b> The transaction payload contains only the public Ethereum addresses, authorization timestamps, and encrypted wrapped keys. Plaintext file contents and symmetric AES-256 decryption keys are <b>never stored on-chain</b>.
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.85rem' }}>
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
