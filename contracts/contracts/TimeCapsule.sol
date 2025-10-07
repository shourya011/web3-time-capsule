// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title TimeCapsule
 * @dev A smart contract for creating time-locked capsules with encrypted content
 * @author Shourya Sharma
 */
contract TimeCapsule {
    // Enums
    enum CapsuleType { RAW_TEXT, HASH_ONLY, ENCRYPTED }
    enum CapsuleStatus { LOCKED, UNLOCKED, REVEALED }

    // Structs
    struct CapsuleMeta {
        address owner;
        uint64 createdAt;
        uint64 unlockTime;
        CapsuleType capsuleType;
        CapsuleStatus status;
        bytes32 contentHash;
        string contentRef; // IPFS CID or similar
        string[] recipients; // Optional recipient addresses/ENS
        bool isPublic;
    }

    // State variables
    uint256 private _capsuleCounter;
    mapping(uint256 => CapsuleMeta) private _capsules;
    mapping(address => uint256[]) private _userCapsules;
    
    // Constants
    uint64 public constant MIN_LOCK_DURATION = 1 days;
    uint64 public constant MAX_LOCK_DURATION = 10 * 365 days; // 10 years
    uint256 public constant MAX_CONTENT_SIZE = 32 * 1024; // 32KB for raw text
    
    // Optional protocol fee
    uint256 public protocolFee = 0.001 ether;
    address public treasury;

    // Events
    event CapsuleCreated(
        uint256 indexed capsuleId,
        address indexed owner,
        uint64 unlockTime,
        CapsuleType capsuleType,
        bytes32 contentHash
    );
    
    event CapsuleRevealed(
        uint256 indexed capsuleId,
        address indexed revealer,
        string finalContentRef
    );
    
    event CapsuleUnlocked(
        uint256 indexed capsuleId,
        address indexed unlocker
    );

    // Custom errors
    error InvalidUnlockTime();
    error InsufficientFee();
    error NotOwner();
    error CapsuleNotFound();
    error CapsuleStillLocked();
    error CapsuleAlreadyRevealed();
    error ContentTooLarge();
    error HashMismatch();
    error UnauthorizedAccess();

    // Modifiers
    modifier validCapsule(uint256 capsuleId) {
        if (capsuleId == 0 || capsuleId > _capsuleCounter) {
            revert CapsuleNotFound();
        }
        _;
    }

    modifier onlyOwner(uint256 capsuleId) {
        if (_capsules[capsuleId].owner != msg.sender) {
            revert NotOwner();
        }
        _;
    }

    modifier onlyUnlocked(uint256 capsuleId) {
        if (block.timestamp < _capsules[capsuleId].unlockTime) {
            revert CapsuleStillLocked();
        }
        _;
    }

    constructor(address _treasury) {
        treasury = _treasury;
    }

    /**
     * @dev Create a new time capsule
     * @param capsuleType Type of content (RAW_TEXT, HASH_ONLY, ENCRYPTED)
     * @param contentHash Keccak256 hash of the content
     * @param contentRef Optional IPFS CID or external reference
     * @param unlockTime Timestamp when capsule can be accessed
     * @param recipients Optional list of recipient addresses
     * @param isPublic Whether capsule is publicly viewable when unlocked
     */
    function createCapsule(
        CapsuleType capsuleType,
        bytes32 contentHash,
        string calldata contentRef,
        uint64 unlockTime,
        string[] calldata recipients,
        bool isPublic
    ) external payable returns (uint256 capsuleId) {
        // Validate unlock time
        uint64 currentTime = uint64(block.timestamp);
        if (unlockTime <= currentTime + MIN_LOCK_DURATION || 
            unlockTime > currentTime + MAX_LOCK_DURATION) {
            revert InvalidUnlockTime();
        }

        // Check protocol fee
        if (msg.value < protocolFee) {
            revert InsufficientFee();
        }

        // Increment counter and create capsule
        capsuleId = ++_capsuleCounter;
        
        _capsules[capsuleId] = CapsuleMeta({
            owner: msg.sender,
            createdAt: currentTime,
            unlockTime: unlockTime,
            capsuleType: capsuleType,
            status: CapsuleStatus.LOCKED,
            contentHash: contentHash,
            contentRef: contentRef,
            recipients: recipients,
            isPublic: isPublic
        });

        // Add to user's capsule list
        _userCapsules[msg.sender].push(capsuleId);

        // Transfer protocol fee to treasury
        if (protocolFee > 0 && treasury != address(0)) {
            payable(treasury).transfer(protocolFee);
        }

        // Refund excess payment
        if (msg.value > protocolFee) {
            payable(msg.sender).transfer(msg.value - protocolFee);
        }

        emit CapsuleCreated(capsuleId, msg.sender, unlockTime, capsuleType, contentHash);
    }

    /**
     * @dev Reveal the content of an encrypted or hash-only capsule
     * @param capsuleId The ID of the capsule to reveal
     * @param plaintextOrKey The original content or decryption key
     * @param finalContentRef Optional final content reference after reveal
     */
    function revealCapsule(
        uint256 capsuleId,
        bytes calldata plaintextOrKey,
        string calldata finalContentRef
    ) external validCapsule(capsuleId) onlyUnlocked(capsuleId) {
        CapsuleMeta storage capsule = _capsules[capsuleId];
        
        // Check authorization
        if (!_canAccessCapsule(capsuleId, msg.sender)) {
            revert UnauthorizedAccess();
        }

        if (capsule.status == CapsuleStatus.REVEALED) {
            revert CapsuleAlreadyRevealed();
        }

        // Verify content hash
        bytes32 computedHash = keccak256(plaintextOrKey);
        if (computedHash != capsule.contentHash) {
            revert HashMismatch();
        }

        // Update capsule status
        capsule.status = CapsuleStatus.REVEALED;
        if (bytes(finalContentRef).length > 0) {
            capsule.contentRef = finalContentRef;
        }

        emit CapsuleRevealed(capsuleId, msg.sender, finalContentRef);
    }

    /**
     * @dev Unlock a capsule (mark as accessible)
     * @param capsuleId The ID of the capsule to unlock
     */
    function unlockCapsule(uint256 capsuleId) 
        external 
        validCapsule(capsuleId) 
        onlyUnlocked(capsuleId) 
    {
        CapsuleMeta storage capsule = _capsules[capsuleId];
        
        // Check authorization
        if (!_canAccessCapsule(capsuleId, msg.sender)) {
            revert UnauthorizedAccess();
        }

        if (capsule.status == CapsuleStatus.LOCKED) {
            capsule.status = CapsuleStatus.UNLOCKED;
            emit CapsuleUnlocked(capsuleId, msg.sender);
        }
    }

    /**
     * @dev Get capsule metadata
     * @param capsuleId The ID of the capsule
     */
    function getCapsule(uint256 capsuleId) 
        external 
        view 
        validCapsule(capsuleId) 
        returns (CapsuleMeta memory) 
    {
        return _capsules[capsuleId];
    }

    /**
     * @dev Get all capsule IDs for a user
     * @param user The address of the user
     */
    function getUserCapsules(address user) external view returns (uint256[] memory) {
        return _userCapsules[user];
    }

    /**
     * @dev Get total number of capsules created
     */
    function totalCapsules() external view returns (uint256) {
        return _capsuleCounter;
    }

    /**
     * @dev Check if a user can access a capsule
     * @param capsuleId The ID of the capsule
     * @param user The address to check
     */
    function canAccessCapsule(uint256 capsuleId, address user) 
        external 
        view 
        validCapsule(capsuleId) 
        returns (bool) 
    {
        return _canAccessCapsule(capsuleId, user);
    }

    /**
     * @dev Internal function to check capsule access permissions
     */
    function _canAccessCapsule(uint256 capsuleId, address user) 
        internal 
        view 
        returns (bool) 
    {
        CapsuleMeta storage capsule = _capsules[capsuleId];
        
        // Owner can always access
        if (capsule.owner == user) {
            return true;
        }

        // Check if user is in recipients list (basic string comparison)
        // Note: This is a simple implementation. In production, you might want
        // to use address comparison or ENS resolution
        string memory userStr = _addressToString(user);
        for (uint i = 0; i < capsule.recipients.length; i++) {
            if (_compareStrings(capsule.recipients[i], userStr)) {
                return true;
            }
        }

        // Public capsules can be accessed by anyone when unlocked
        if (capsule.isPublic && block.timestamp >= capsule.unlockTime) {
            return true;
        }

        return false;
    }

    /**
     * @dev Convert address to string
     */
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint(uint8(value[i + 12] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(value[i + 12] & 0x0f))];
        }
        return string(str);
    }

    /**
     * @dev Compare two strings
     */
    function _compareStrings(string memory a, string memory b) 
        internal 
        pure 
        returns (bool) 
    {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    /**
     * @dev Update protocol fee (only owner)
     */
    function setProtocolFee(uint256 newFee) external {
        require(msg.sender == treasury, "Only treasury can update fee");
        protocolFee = newFee;
    }

    /**
     * @dev Update treasury address (only current treasury)
     */
    function setTreasury(address newTreasury) external {
        require(msg.sender == treasury, "Only treasury can update address");
        treasury = newTreasury;
    }
}