// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FileAccessControl
 * @dev Decentralized access control and file metadata registry on Ethereum/EVM.
 * Allows file owners (e.g. Ashutosh) to upload encrypted IPFS file hashes and
 * grant/revoke access to specific recipient wallet addresses (e.g. Rahul).
 */
contract FileAccessControl {
    
    struct FileRecord {
        string ipfsHash;        // IPFS Content Identifier (CID) of the encrypted file
        string fileName;        // Human-readable file name
        string fileType;        // MIME type / extension
        uint256 fileSize;       // File size in bytes
        address owner;          // Wallet address of the uploader (Owner: e.g. Ashutosh 0xAAA...)
        uint256 uploadedAt;     // Timestamp of upload
        bool exists;            // Existence flag
        bool isPublic;          // false by default (Private Sharing is Default!)
    }

    // Mapping: ipfsHash => FileRecord
    mapping(string => FileRecord) private files;

    struct AccessPermission {
        bool isAuthorized;
        uint256 expiresAt;      // 0 = unlimited, otherwise Unix timestamp after which access expires
        uint256 maxDownloads;   // 0 = unlimited, e.g. 3
        uint256 downloadCount;  // current download count on-chain
    }

    // Mapping: ipfsHash => (recipientAddress => AccessPermission)
    mapping(string => mapping(address => AccessPermission)) private filePermissions;

    // Mapping: ipfsHash => (recipientAddress => encryptedWrappedKey)
    mapping(string => mapping(address => string)) private wrappedKeys;

    // Mapping: ipfsHash => list of authorized recipient addresses
    mapping(string => address[]) private authorizedRecipientsList;

    // Mapping: ownerAddress => list of ipfsHashes owned
    mapping(address => string[]) private ownerFiles;

    // Events
    event FileRegistered(
        string indexed ipfsHash,
        string fileName,
        address indexed owner,
        uint256 timestamp
    );

    event PublicAccessToggled(
        string indexed ipfsHash,
        bool isPublic,
        address indexed owner,
        uint256 timestamp
    );

    event AccessGranted(
        string indexed ipfsHash,
        address indexed recipient,
        address indexed owner,
        uint256 expiresAt,
        uint256 maxDownloads,
        uint256 timestamp
    );

    event AccessRevoked(
        string indexed ipfsHash,
        address indexed recipient,
        address indexed owner,
        uint256 timestamp
    );

    event DownloadRecorded(
        string indexed ipfsHash,
        address indexed recipient,
        uint256 downloadCount,
        uint256 maxDownloads,
        uint256 timestamp
    );

    event FileAccessRemoved(
        string indexed ipfsHash,
        address indexed owner,
        bool cryptoShredded,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyFileOwner(string memory _ipfsHash) {
        require(files[_ipfsHash].exists, "File does not exist on blockchain registry");
        require(files[_ipfsHash].owner == msg.sender, "Access denied: Only file owner can manage permissions");
        _;
    }

    /**
     * @notice Registers a newly encrypted file onto the blockchain registry.
     * @param _ipfsHash The IPFS CID hash of the ciphertext.
     * @param _fileName Name of the file.
     * @param _fileType MIME type or extension.
     * @param _fileSize Size in bytes.
     */
    function registerFile(
        string memory _ipfsHash,
        string memory _fileName,
        string memory _fileType,
        uint256 _fileSize
    ) external {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(!files[_ipfsHash].exists, "File with this IPFS hash already registered");

        files[_ipfsHash] = FileRecord({
            ipfsHash: _ipfsHash,
            fileName: _fileName,
            fileType: _fileType,
            fileSize: _fileSize,
            owner: msg.sender,
            uploadedAt: block.timestamp,
            exists: true,
            isPublic: false // STRICT SECURITY: Private sharing is the default!
        });

        ownerFiles[msg.sender].push(_ipfsHash);

        emit FileRegistered(_ipfsHash, _fileName, msg.sender, block.timestamp);
    }

    /**
     * @notice Allows file owner to toggle between Private (default) and Public sharing mode.
     * @param _ipfsHash The file CID.
     * @param _isPublic True for public link access, false for private (selected wallet only).
     */
    function setFilePublicAccess(string memory _ipfsHash, bool _isPublic)
        external
        onlyFileOwner(_ipfsHash)
    {
        files[_ipfsHash].isPublic = _isPublic;
        emit PublicAccessToggled(_ipfsHash, _isPublic, msg.sender, block.timestamp);
    }

    /**
     * @notice Grants time-limited access to an authorized recipient (e.g. Rahul 0xBBB...).
     * @param _ipfsHash The file CID.
     * @param _recipient The recipient's EVM wallet address.
     * @param _expiresAt Unix timestamp when access expires (0 for unlimited).
     */
    function grantAccess(
        string memory _ipfsHash,
        address _recipient,
        uint256 _expiresAt,
        uint256 _maxDownloads
    ) external onlyFileOwner(_ipfsHash) {
        require(_recipient != address(0), "Invalid recipient address");
        require(_recipient != msg.sender, "Owner already has implicit access");
        if (_expiresAt > 0) {
            require(_expiresAt > block.timestamp, "Expiry must be in the future");
        }

        filePermissions[_ipfsHash][_recipient] = AccessPermission({
            isAuthorized: true,
            expiresAt: _expiresAt,
            maxDownloads: _maxDownloads,
            downloadCount: 0
        });
        authorizedRecipientsList[_ipfsHash].push(_recipient);

        emit AccessGranted(_ipfsHash, _recipient, msg.sender, _expiresAt, _maxDownloads, block.timestamp);
    }

    /**
     * @notice Grants time-limited access with wrapped AES file key and max download quota.
     */
    function grantAccessWithKey(
        string memory _ipfsHash,
        address _recipient,
        string memory _wrappedKey,
        uint256 _expiresAt,
        uint256 _maxDownloads
    ) external onlyFileOwner(_ipfsHash) {
        require(_recipient != address(0), "Invalid recipient address");
        require(_recipient != msg.sender, "Owner already has implicit access");
        if (_expiresAt > 0) {
            require(_expiresAt > block.timestamp, "Expiry must be in the future");
        }

        filePermissions[_ipfsHash][_recipient] = AccessPermission({
            isAuthorized: true,
            expiresAt: _expiresAt,
            maxDownloads: _maxDownloads,
            downloadCount: 0
        });
        wrappedKeys[_ipfsHash][_recipient] = _wrappedKey;
        authorizedRecipientsList[_ipfsHash].push(_recipient);

        emit AccessGranted(_ipfsHash, _recipient, msg.sender, _expiresAt, _maxDownloads, block.timestamp);
    }

    /**
     * @notice Records a download and increments counter on-chain.
     */
    function recordDownload(string memory _ipfsHash) external {
        require(files[_ipfsHash].exists, "File does not exist");
        if (files[_ipfsHash].owner == msg.sender) {
            return; // Owner is exempt from download quotas
        }

        AccessPermission storage perm = filePermissions[_ipfsHash][msg.sender];
        require(perm.isAuthorized, "Access denied: Not authorized");
        if (perm.expiresAt > 0) {
            require(block.timestamp <= perm.expiresAt, "Access denied: Access period has expired");
        }
        if (perm.maxDownloads > 0) {
            require(perm.downloadCount < perm.maxDownloads, "Access denied: Maximum download quota exceeded");
        }

        perm.downloadCount++;

        emit DownloadRecorded(_ipfsHash, msg.sender, perm.downloadCount, perm.maxDownloads, block.timestamp);
    }

    /**
     * @notice Retrieves the wrapped AES key for the caller (recipient or owner).
     */
    function getMyWrappedKey(string memory _ipfsHash)
        external
        view
        returns (string memory)
    {
        require(files[_ipfsHash].exists, "File does not exist");
        if (files[_ipfsHash].owner == msg.sender) {
            return wrappedKeys[_ipfsHash][msg.sender];
        }

        AccessPermission memory perm = filePermissions[_ipfsHash][msg.sender];
        require(perm.isAuthorized, "Access denied: Not authorized to retrieve encryption key");
        if (perm.expiresAt > 0) {
            require(block.timestamp <= perm.expiresAt, "Access denied: Access period has expired");
        }
        if (perm.maxDownloads > 0) {
            require(perm.downloadCount < perm.maxDownloads, "Access denied: Maximum download quota reached");
        }

        return wrappedKeys[_ipfsHash][msg.sender];
    }

    /**
     * @notice Revokes previously granted access from a recipient.
     * @param _ipfsHash The file CID.
     * @param _recipient The recipient's EVM wallet address.
     */
    function revokeAccess(string memory _ipfsHash, address _recipient)
        external
        onlyFileOwner(_ipfsHash)
    {
        require(filePermissions[_ipfsHash][_recipient].isAuthorized, "Recipient does not have access");

        filePermissions[_ipfsHash][_recipient].isAuthorized = false;
        delete wrappedKeys[_ipfsHash][_recipient];

        emit AccessRevoked(_ipfsHash, _recipient, msg.sender, block.timestamp);
    }

    /**
     * @notice Verifies whether a given wallet address has read/download access to the file.
     * @param _ipfsHash The file CID.
     * @param _user The wallet address being verified.
     * @return bool True if the user is either the owner or an authorized recipient with active expiry and quota remaining.
     */
    function hasAccess(string memory _ipfsHash, address _user)
        external
        view
        returns (bool)
    {
        if (!files[_ipfsHash].exists) {
            return false;
        }
        if (files[_ipfsHash].owner == _user) {
            return true;
        }

        // Public Sharing Mode: Owner intentionally opened access to anyone with link
        if (files[_ipfsHash].isPublic) {
            return true;
        }

        // Private Sharing Mode (Default): Only explicitly authorized recipient
        AccessPermission memory perm = filePermissions[_ipfsHash][_user];
        if (!perm.isAuthorized) {
            return false;
        }

        // Time-limited access check: if expiresAt is set and current block time has passed it
        if (perm.expiresAt > 0 && block.timestamp > perm.expiresAt) {
            return false; // Expired
        }

        // Download limit quota check
        if (perm.maxDownloads > 0 && perm.downloadCount >= perm.maxDownloads) {
            return false; // Download quota exhausted
        }

        return true;
    }

    /**
     * @notice Retrieves file metadata by IPFS hash.
     */
    function getFile(string memory _ipfsHash)
        external
        view
        returns (
            string memory fileName,
            string memory fileType,
            uint256 fileSize,
            address owner,
            uint256 uploadedAt,
            bool isPublic
        )
    {
        require(files[_ipfsHash].exists, "File does not exist");
        FileRecord memory f = files[_ipfsHash];
        return (f.fileName, f.fileType, f.fileSize, f.owner, f.uploadedAt, f.isPublic);
    }

    /**
     * @notice Returns list of all files registered by a specific owner.
     */
    function getFilesByOwner(address _owner) external view returns (string[] memory) {
        return ownerFiles[_owner];
    }

    /**
     * @notice Returns list of authorized recipient addresses for a file.
     */
    function getAuthorizedRecipients(string memory _ipfsHash)
        external
        view
        onlyFileOwner(_ipfsHash)
        returns (address[] memory)
    {
        return authorizedRecipientsList[_ipfsHash];
    }

    /**
     * @notice Removes application access and marks the file as de-registered/revoked.
     * @dev Decentralized Storage Distinction:
     * While IPFS blocks may still be retained on external peer nodes that previously cached the CID,
     * this method revokes smart contract authorization and signals cryptographic key shredding,
     * rendering any retained ciphertext blobs mathematically indecipherable.
     * @param _ipfsHash The IPFS CID hash of the file to remove.
     */
    function removeFileAccess(string memory _ipfsHash)
        external
        onlyFileOwner(_ipfsHash)
    {
        files[_ipfsHash].exists = false;

        emit FileAccessRemoved(_ipfsHash, msg.sender, true, block.timestamp);
    }
}
