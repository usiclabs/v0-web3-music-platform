// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC8004ValidationRegistry
 * @notice Validation system for AI agent outputs following ERC-8004 standard
 * @dev Independent validators can verify agent actions and submit results
 */
contract ERC8004ValidationRegistry is Ownable {
    struct ValidationRequest {
        address agent;
        bytes32 requestHash;
        string requestURI;
        uint256 timestamp;
        bool fulfilled;
    }
    
    struct ValidationResult {
        address validator;
        bytes32 requestHash;
        uint8 resultCode; // 0=failed, 1=passed, 2=pending
        string[] tags;
        string evidenceURI; // URI to validation evidence
        uint256 timestamp;
    }
    
    // Mapping from request hash to validation request
    mapping(bytes32 => ValidationRequest) public validationRequests;
    
    // Mapping from request hash to array of validation results
    mapping(bytes32 => ValidationResult[]) public validationResults;
    
    // Mapping of approved validators
    mapping(address => bool) public approvedValidators;
    
    event ValidationRequested(
        address indexed agent,
        bytes32 indexed requestHash,
        string requestURI
    );
    
    event ValidationSubmitted(
        address indexed validator,
        bytes32 indexed requestHash,
        uint8 resultCode,
        string evidenceURI
    );
    
    event ValidatorApproved(address indexed validator);
    event ValidatorRevoked(address indexed validator);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Request validation for an agent action
     * @param agent The agent address
     * @param requestHash Unique hash identifying the request
     * @param requestURI URI to detailed request information
     */
    function requestValidation(
        address agent,
        bytes32 requestHash,
        string calldata requestURI
    ) external {
        require(validationRequests[requestHash].timestamp == 0, "Request already exists");
        require(bytes(requestURI).length > 0, "Request URI required");
        
        validationRequests[requestHash] = ValidationRequest({
            agent: agent,
            requestHash: requestHash,
            requestURI: requestURI,
            timestamp: block.timestamp,
            fulfilled: false
        });
        
        emit ValidationRequested(agent, requestHash, requestURI);
    }
    
    /**
     * @notice Submit validation result (validators only)
     * @param requestHash The request being validated
     * @param resultCode Result: 0=failed, 1=passed, 2=pending
     * @param tags Array of tags describing the validation
     * @param evidenceURI URI to validation evidence
     */
    function submitValidation(
        bytes32 requestHash,
        uint8 resultCode,
        string[] calldata tags,
        string calldata evidenceURI
    ) external {
        require(approvedValidators[msg.sender], "Not an approved validator");
        require(validationRequests[requestHash].timestamp != 0, "Request does not exist");
        require(resultCode <= 2, "Invalid result code");
        require(bytes(evidenceURI).length > 0, "Evidence URI required");
        
        validationResults[requestHash].push(ValidationResult({
            validator: msg.sender,
            requestHash: requestHash,
            resultCode: resultCode,
            tags: tags,
            evidenceURI: evidenceURI,
            timestamp: block.timestamp
        }));
        
        if (resultCode != 2) {
            validationRequests[requestHash].fulfilled = true;
        }
        
        emit ValidationSubmitted(msg.sender, requestHash, resultCode, evidenceURI);
    }
    
    /**
     * @notice Approve a validator (owner only)
     * @param validator The validator address to approve
     */
    function approveValidator(address validator) external onlyOwner {
        require(!approvedValidators[validator], "Already approved");
        approvedValidators[validator] = true;
        emit ValidatorApproved(validator);
    }
    
    /**
     * @notice Revoke a validator (owner only)
     * @param validator The validator address to revoke
     */
    function revokeValidator(address validator) external onlyOwner {
        require(approvedValidators[validator], "Not approved");
        approvedValidators[validator] = false;
        emit ValidatorRevoked(validator);
    }
    
    /**
     * @notice Get validation results for a request
     * @param requestHash The request hash
     */
    function getValidationResults(bytes32 requestHash) external view returns (ValidationResult[] memory) {
        return validationResults[requestHash];
    }
    
    /**
     * @notice Get validation request details
     * @param requestHash The request hash
     */
    function getValidationRequest(bytes32 requestHash) external view returns (ValidationRequest memory) {
        return validationRequests[requestHash];
    }
}
