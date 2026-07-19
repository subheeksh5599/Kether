// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {KetherIndexer} from "../src/KetherIndexer.sol";

contract KetherTest is Test {
    KetherIndexer public indexer;
    uint256 constant AGENT_ID = 1;
    address constant CLIENT_A = address(0x1000);
    address constant CLIENT_B = address(0x2000);
    address constant CLIENT_C = address(0x3000);

    function setUp() public {
        indexer = new KetherIndexer();
    }

    function test_index_payment_event() public {
        indexer.indexPayment(AGENT_ID, CLIENT_A, 100, "/analyze");
        (uint256 rev, uint256 txns, uint256 clients) = indexer.getAgentRevenue(AGENT_ID);
        assertEq(rev, 100);
        assertEq(txns, 1);
        assertEq(clients, 1);
    }

    function test_aggregate_agent_revenue() public {
        indexer.indexPayment(AGENT_ID, CLIENT_A, 100, "/analyze");
        indexer.indexPayment(AGENT_ID, CLIENT_B, 200, "/audit");
        indexer.indexPayment(AGENT_ID, CLIENT_A, 50, "/analyze");
        (uint256 rev,,) = indexer.getAgentRevenue(AGENT_ID);
        assertEq(rev, 350);
    }

    function test_get_top_clients() public {
        indexer.indexPayment(AGENT_ID, CLIENT_A, 100, "/analyze");
        indexer.indexPayment(AGENT_ID, CLIENT_B, 500, "/audit");
        indexer.indexPayment(AGENT_ID, CLIENT_C, 200, "/swap");
        (address[] memory clients, uint256[] memory amounts) = indexer.getTopClients(AGENT_ID, 2);
        assertEq(clients.length, 2);
        assertEq(amounts[0], 500); // CLIENT_B highest
    }

    function test_get_service_rankings() public {
        indexer.indexPayment(AGENT_ID, CLIENT_A, 100, "/analyze");
        indexer.indexPayment(AGENT_ID, CLIENT_B, 500, "/audit");
        (string[] memory svcs, uint256[] memory revs) = indexer.getServiceRankings(AGENT_ID);
        assertEq(svcs.length, 2);
    }

    function test_link_erc8004_identity() public {
        // ERC-8004 identity is resolved off-chain by the indexer
        // This test verifies the contract correctly accepts any agentId
        indexer.indexPayment(48816, CLIENT_A, 1000, "/price");
        (uint256 rev,,) = indexer.getAgentRevenue(48816);
        assertEq(rev, 1000);
    }

    function test_unlinked_address_returns_zero() public {
        (uint256 rev,,) = indexer.getAgentRevenue(999);
        assertEq(rev, 0);
    }

    function test_total_indexed_payments() public {
        indexer.indexPayment(AGENT_ID, CLIENT_A, 100, "/a");
        indexer.indexPayment(AGENT_ID, CLIENT_B, 200, "/b");
        indexer.indexPayment(2, CLIENT_C, 300, "/c");
        assertEq(indexer.totalIndexedPayments(), 3);
    }

    function test_prediction_recording() public {
        vm.expectEmit(true, true, false, true);
        emit KetherIndexer.PredictionRequested(AGENT_ID, "/analyze", 500, 85);
        indexer.recordPrediction(AGENT_ID, "/analyze", 500, 85);
    }
}
