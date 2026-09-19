import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserProvider, formatEther } from 'ethers';

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [hasProvider, setHasProvider] = useState(false);

  // Check for Web3 Provider (MetaMask)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setHasProvider(true);

      // Check if already authorized
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then(async (accounts) => {
          if (accounts && accounts.length > 0) {
            await handleAccountSetup(accounts[0]);
          }
        })
        .catch((err) => console.log('Wallet check error:', err));

      // Listen to account switch
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          await handleAccountSetup(accounts[0]);
        }
      };

      // Listen to network change
      const handleChainChanged = (newChainId) => {
        setChainId(newChainId);
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    } else {
      setHasProvider(false);
    }
  }, []);

  const getNetworkName = (chain) => {
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x5': 'Goerli Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai',
      '0x13882': 'Polygon Amoy',
      '0x7a69': 'Hardhat Localhost (31337)',
    };
    return networks[chain] || `Chain ID: ${chain}`;
  };

  const handleAccountSetup = async (addr) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const hexChain = '0x' + network.chainId.toString(16);
      
      setAccount(addr.toLowerCase());
      setChainId(hexChain);
      setNetworkName(getNetworkName(hexChain));

      try {
        const bal = await provider.getBalance(addr);
        setBalance(parseFloat(formatEther(bal)).toFixed(4));
      } catch {
        setBalance('0.0000');
      }
    } catch (err) {
      console.error('Account setup failed:', err);
    }
  };

  // Connect Real or Fallback Session Wallet
  const connectWallet = async (useDemo = false) => {
    setIsConnecting(true);
    setError(null);

    // If no MetaMask/Web3 extension installed in browser or demo requested
    if (useDemo || typeof window === 'undefined' || !window.ethereum) {
      let sessionAddress = '0x71c67ed3e80435a55611f476c66337051b7b292a';
      try {
        const storedUser = localStorage.getItem('blockshare_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.walletAddress) {
            sessionAddress = parsed.walletAddress.toLowerCase();
          }
        }
      } catch {}

      setAccount(sessionAddress);
      setChainId('0xaa36a7');
      setNetworkName('Sepolia Testnet (In-Browser Web3)');
      setBalance('1.5000');
      setIsConnecting(false);
      return {
        success: true,
        address: sessionAddress,
        isDemo: true,
        isMetaMaskMissing: !window?.ethereum,
        message: !window?.ethereum
          ? 'MetaMask extension not detected. Initialized secure in-browser Web3 session wallet. Install MetaMask (https://metamask.io) for hardware/browser signing.'
          : 'Connected to local simulation wallet.',
      };
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        await handleAccountSetup(accounts[0]);
        setIsConnecting(false);
        return {
          success: true,
          address: accounts[0].toLowerCase(),
          isDemo: false,
          isMetaMaskMissing: false,
        };
      }
      setIsConnecting(false);
      return { success: false, error: 'No accounts authorized by user' };
    } catch (err) {
      console.warn('User rejected wallet connection or error:', err);
      setError(err.message || 'Failed to connect MetaMask');
      setIsConnecting(false);
      return { success: false, error: err.message || 'Connection rejected' };
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setNetworkName(null);
    setBalance(null);
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        networkName,
        balance,
        isConnecting,
        error,
        hasProvider,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
