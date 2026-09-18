/**
 * Contract ABI and Network Deployment Configuration
 * FileAccessControl.sol
 */

export const FILE_ACCESS_CONTROL_ABI = [
  // Functions
  "function registerFile(string memory _ipfsHash, string memory _fileName, string memory _fileType, uint256 _fileSize) external",
  "function setFilePublicAccess(string memory _ipfsHash, bool _isPublic) external",
  "function grantAccess(string memory _ipfsHash, address _recipient) external",
  "function revokeAccess(string memory _ipfsHash, address _recipient) external",
  "function hasAccess(string memory _ipfsHash, address _user) external view returns (bool)",
  "function getFile(string memory _ipfsHash) external view returns (string memory fileName, string memory fileType, uint256 fileSize, address owner, uint256 uploadedAt, bool isPublic)",
  "function removeFileAccess(string memory _ipfsHash) external",
  "function getFilesByOwner(address _owner) external view returns (string[] memory)",
  "function getAuthorizedRecipients(string memory _ipfsHash) external view returns (address[] memory)",

  // Events
  "event FileRegistered(string indexed ipfsHash, string fileName, address indexed owner, uint256 timestamp)",
  "event PublicAccessToggled(string indexed ipfsHash, bool isPublic, address indexed owner, uint256 timestamp)",
  "event AccessGranted(string indexed ipfsHash, address indexed recipient, address indexed owner, uint256 timestamp)",
  "event AccessRevoked(string indexed ipfsHash, address indexed recipient, address indexed owner, uint256 timestamp)",
  "event FileAccessRemoved(string indexed ipfsHash, address indexed owner, bool cryptoShredded, uint256 timestamp)"
];

export const DEFAULT_CONTRACT_ADDRESSES = {
  // Sepolia Testnet
  '11155111': '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  // Polygon Amoy
  '80002': '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  // Localhost (Hardhat)
  '31337': '0x5FbDB2315678afecb367f032d93F642f64180aa3',
};
