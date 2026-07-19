// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title KetherIndexer — On-chain x402 payment analytics for GOAT Network
/// @notice Stores aggregated revenue data per ERC-8004 agent for public verifiability
contract KetherIndexer {
    // --- Events ---
    event PaymentIndexed(uint256 indexed agentId, address indexed payer, uint256 amount, string serviceId, uint256 timestamp);
    event RevenueAggregated(uint256 indexed agentId, uint256 totalRevenue, uint256 transactionCount, uint256 uniqueClients);
    event ServiceRanked(uint256 indexed agentId, string serviceId, uint256 revenue);
    event PredictionRequested(uint256 indexed agentId, string endpoint, uint256 predictedRevenue, uint256 confidence);

    // --- Structs ---
    struct AgentRevenue {
        uint256 totalRevenue;
        uint256 transactionCount;
        uint256 uniqueClients;
        uint256 lastUpdated;
    }

    struct ClientSpend {
        uint256 totalSpent;
        uint256 transactionCount;
        uint256 lastPayment;
    }

    struct ServiceRevenue {
        uint256 totalRevenue;
        uint256 callCount;
    }

    // --- Storage ---
    mapping(uint256 => AgentRevenue) public agentRevenue;
    mapping(uint256 => mapping(address => ClientSpend)) public clientSpending;
    mapping(uint256 => mapping(string => ServiceRevenue)) public serviceRevenue;
    mapping(uint256 => address[]) public agentClients;
    mapping(uint256 => string[]) public agentServices;
    mapping(uint256 => mapping(address => bool)) private hasClient;
    mapping(uint256 => mapping(string => bool)) private hasService;

    address public owner;
    uint256 public totalIndexedPayments;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // --- Core: Index a payment ---
    function indexPayment(
        uint256 agentId,
        address payer,
        uint256 amount,
        string calldata serviceId
    ) external {
        AgentRevenue storage rev = agentRevenue[agentId];
        rev.totalRevenue += amount;
        rev.transactionCount += 1;
        rev.lastUpdated = block.timestamp;

        // Track unique clients
        if (!hasClient[agentId][payer]) {
            hasClient[agentId][payer] = true;
            agentClients[agentId].push(payer);
            rev.uniqueClients += 1;
        }

        // Client spending
        ClientSpend storage client = clientSpending[agentId][payer];
        client.totalSpent += amount;
        client.transactionCount += 1;
        client.lastPayment = block.timestamp;

        // Service revenue
        ServiceRevenue storage svc = serviceRevenue[agentId][serviceId];
        svc.totalRevenue += amount;
        svc.callCount += 1;

        if (!hasService[agentId][serviceId]) {
            hasService[agentId][serviceId] = true;
            agentServices[agentId].push(serviceId);
        }

        totalIndexedPayments += 1;

        emit PaymentIndexed(agentId, payer, amount, serviceId, block.timestamp);
        emit RevenueAggregated(agentId, rev.totalRevenue, rev.transactionCount, rev.uniqueClients);
        emit ServiceRanked(agentId, serviceId, svc.totalRevenue);
    }

    // --- Query: Agent revenue ---
    function getAgentRevenue(uint256 agentId) external view returns (
        uint256 totalRevenue,
        uint256 transactionCount,
        uint256 uniqueClients
    ) {
        AgentRevenue storage rev = agentRevenue[agentId];
        return (rev.totalRevenue, rev.transactionCount, rev.uniqueClients);
    }

    // --- Query: Top clients ---
    function getTopClients(uint256 agentId, uint256 limit) external view returns (
        address[] memory clients,
        uint256[] memory amounts
    ) {
        address[] storage allClients = agentClients[agentId];
        uint256 count = allClients.length < limit ? allClients.length : limit;
        clients = new address[](count);
        amounts = new uint256[](count);

        // Simple top-N by insertion sort for small sets
        for (uint256 i = 0; i < allClients.length && i < limit; i++) {
            uint256 maxSpent = 0;
            uint256 maxIdx = 0;
            for (uint256 j = 0; j < allClients.length; j++) {
                uint256 spent = clientSpending[agentId][allClients[j]].totalSpent;
                if (spent > maxSpent) {
                    bool alreadySelected = false;
                    for (uint256 k = 0; k < i; k++) {
                        if (clients[k] == allClients[j]) { alreadySelected = true; break; }
                    }
                    if (!alreadySelected) {
                        maxSpent = spent;
                        maxIdx = j;
                    }
                }
            }
            clients[i] = allClients[maxIdx];
            amounts[i] = maxSpent;
        }
    }

    // --- Query: Service rankings ---
    function getServiceRankings(uint256 agentId) external view returns (
        string[] memory services,
        uint256[] memory revenues
    ) {
        string[] storage allServices = agentServices[agentId];
        uint256 count = allServices.length;
        services = new string[](count);
        revenues = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            services[i] = allServices[i];
            revenues[i] = serviceRevenue[agentId][allServices[i]].totalRevenue;
        }
    }

    // --- Admin: Record prediction ---
    function recordPrediction(
        uint256 agentId,
        string calldata endpoint,
        uint256 predictedRevenue,
        uint256 confidence
    ) external {
        emit PredictionRequested(agentId, endpoint, predictedRevenue, confidence);
    }
}
