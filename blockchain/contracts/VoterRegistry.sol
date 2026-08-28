// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title VoterRegistry
/// @notice Tracks which addresses are eligible to vote and enforces one-vote-per-address.
/// @dev Admin control uses a two-step transfer (propose + accept) rather than a
///      single `transferAdmin(newAdmin)` call. A one-step transfer that typos the
///      new address, or is front-run, permanently locks the contract's admin
///      functions (candidate registration, opening/closing the election,
///      registering voters) with no recovery path. Requiring the new admin to
///      explicitly accept means a bad address can never "stick".
contract VoterRegistry {
    address public admin;
    address public pendingAdmin;
    mapping(address => bool) public isEligible;
    mapping(address => bool) public hasVoted;

    event VoterRegistered(address indexed voter);
    event AdminTransferProposed(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "VoterRegistry: not admin");
        _;
    }

    constructor(address _admin) {
        require(_admin != address(0), "VoterRegistry: admin cannot be zero address");
        admin = _admin;
    }

    function registerVoter(address voter) external onlyAdmin {
        require(voter != address(0), "VoterRegistry: voter cannot be zero address");
        require(!isEligible[voter], "VoterRegistry: already registered");
        isEligible[voter] = true;
        emit VoterRegistered(voter);
    }

    /// @notice Step 1 of a safe admin handover: current admin nominates a successor.
    /// The successor has no power until they call `acceptAdmin`.
    function proposeAdminTransfer(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "VoterRegistry: new admin cannot be zero address");
        pendingAdmin = newAdmin;
        emit AdminTransferProposed(admin, newAdmin);
    }

    /// @notice Step 2: only the nominated address can complete the handover.
    function acceptAdmin() external {
        require(msg.sender == pendingAdmin, "VoterRegistry: not the pending admin");
        address previousAdmin = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);
        emit AdminTransferred(previousAdmin, admin);
    }

    function markVoted(address voter) internal {
        hasVoted[voter] = true;
    }

    function _checkCanVote(address voter) internal view {
        require(isEligible[voter], "VoterRegistry: not eligible");
        require(!hasVoted[voter], "VoterRegistry: already voted");
    }
}
