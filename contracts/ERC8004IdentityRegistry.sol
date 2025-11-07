// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ERC8004IdentityRegistry
 * @notice Identity Registry for trustless AI agents following ERC-8004 standard
 * @dev Each agent gets an NFT that represents their identity with metadata URI
 */
contract ERC8004IdentityRegistry is ERC721URIStorage, Ownable {
    uint256 private _nextAgentId;
    
    // Mapping from agent address to their agent ID
    mapping(address => uint256) public agentToId;
    
    // Mapping from agent ID to agent address
    mapping(uint256 => address) public idToAgent;
    
    event AgentRegistered(uint256 indexed agentId, address indexed agentAddress, string agentURI);
    event AgentURIUpdated(uint256 indexed agentId, string newURI);
    
    constructor() ERC721("USIC AI Agent Identity", "USIC-AGENT") Ownable(msg.sender) {
        _nextAgentId = 1; // Start from 1
    }
    
    /**
     * @notice Register a new AI agent with identity NFT
     * @param agentAddress The address of the agent
     * @param agentURI URI pointing to agent metadata (off-chain JSON)
     */
    function registerAgent(address agentAddress, string calldata agentURI) external returns (uint256) {
        require(agentAddress != address(0), "Invalid agent address");
        require(agentToId[agentAddress] == 0, "Agent already registered");
        require(bytes(agentURI).length > 0, "Agent URI cannot be empty");
        
        uint256 agentId = _nextAgentId++;
        
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);
        
        agentToId[agentAddress] = agentId;
        idToAgent[agentId] = agentAddress;
        
        emit AgentRegistered(agentId, agentAddress, agentURI);
        
        return agentId;
    }
    
    /**
     * @notice Update agent metadata URI
     * @param agentId The agent's token ID
     * @param newURI New URI pointing to updated metadata
     */
    function updateAgentURI(uint256 agentId, string calldata newURI) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        require(bytes(newURI).length > 0, "URI cannot be empty");
        
        _setTokenURI(agentId, newURI);
        
        emit AgentURIUpdated(agentId, newURI);
    }
    
    /**
     * @notice Get agent URI by address
     * @param agentAddress The address of the agent
     */
    function getAgentURI(address agentAddress) external view returns (string memory) {
        uint256 agentId = agentToId[agentAddress];
        require(agentId != 0, "Agent not registered");
        
        return tokenURI(agentId);
    }
    
    /**
     * @notice Check if an agent is registered
     * @param agentAddress The address to check
     */
    function isAgentRegistered(address agentAddress) external view returns (bool) {
        return agentToId[agentAddress] != 0;
    }
}
