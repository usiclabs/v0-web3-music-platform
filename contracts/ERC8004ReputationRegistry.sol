// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title ERC8004ReputationRegistry
 * @notice Reputation system for AI agents following ERC-8004 standard
 * @dev Clients can submit feedback about server agents with authorization
 */
contract ERC8004ReputationRegistry is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    struct Feedback {
        address client;
        address server;
        uint8 score; // 0-100
        string[] tags;
        string feedbackURI; // Points to detailed off-chain report
        bytes32 reportHash; // KECCAK-256 hash of the report for integrity
        uint256 timestamp;
    }
    
    // Mapping from server address to array of feedback
    mapping(address => Feedback[]) public serverFeedback;
    
    // Mapping to track used authorization nonces
    mapping(bytes32 => bool) public usedAuthorizations;
    
    event FeedbackSubmitted(
        address indexed client,
        address indexed server,
        uint8 score,
        string feedbackURI,
        bytes32 reportHash
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Submit feedback for a server agent with authorization
     * @param server The server agent address
     * @param score Score from 0-100
     * @param tags Array of tags describing the feedback
     * @param feedbackURI URI to detailed off-chain report
     * @param reportHash KECCAK-256 hash of the report
     * @param authorization Signed authorization from the server
     * @param signature Server's signature authorizing this feedback
     */
    function submitFeedback(
        address server,
        uint8 score,
        string[] calldata tags,
        string calldata feedbackURI,
        bytes32 reportHash,
        bytes32 authorization,
        bytes calldata signature
    ) external {
        require(score <= 100, "Score must be 0-100");
        require(bytes(feedbackURI).length > 0, "Feedback URI required");
        require(!usedAuthorizations[authorization], "Authorization already used");
        
        // Verify the server signed the authorization
        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, server, authorization));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        
        require(signer == server, "Invalid authorization signature");
        
        // Mark authorization as used
        usedAuthorizations[authorization] = true;
        
        // Store feedback
        serverFeedback[server].push(Feedback({
            client: msg.sender,
            server: server,
            score: score,
            tags: tags,
            feedbackURI: feedbackURI,
            reportHash: reportHash,
            timestamp: block.timestamp
        }));
        
        emit FeedbackSubmitted(msg.sender, server, score, feedbackURI, reportHash);
    }
    
    /**
     * @notice Get all feedback for a server agent
     * @param server The server agent address
     */
    function getFeedback(address server) external view returns (Feedback[] memory) {
        return serverFeedback[server];
    }
    
    /**
     * @notice Get feedback count for a server
     * @param server The server agent address
     */
    function getFeedbackCount(address server) external view returns (uint256) {
        return serverFeedback[server].length;
    }
    
    /**
     * @notice Calculate average score for a server
     * @param server The server agent address
     */
    function getAverageScore(address server) external view returns (uint256) {
        Feedback[] memory feedback = serverFeedback[server];
        if (feedback.length == 0) return 0;
        
        uint256 totalScore = 0;
        for (uint256 i = 0; i < feedback.length; i++) {
            totalScore += feedback[i].score;
        }
        
        return totalScore / feedback.length;
    }
}
