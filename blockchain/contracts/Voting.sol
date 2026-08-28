// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./VoterRegistry.sol";
import "./interfaces/IVoting.sol";

/// @title Voting
/// @notice Core election contract: candidate registration, vote casting, tallying.
/// @dev Adds an emergency pause switch (separate from the normal open/closed
///      election lifecycle) so an admin can immediately freeze `castVote` if a
///      compromise or bug is discovered mid-election, without touching the
///      already-open/closed state or losing any recorded votes/candidates.
contract Voting is VoterRegistry, IVoting {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    mapping(uint256 => Candidate) public candidates;
    uint256 private _candidateCount;

    bool public electionOpen;
    bool public paused;

    event CandidateRegistered(uint256 indexed candidateId, string name);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event ElectionStatusChanged(bool isOpen);
    event PausedStatusChanged(bool isPaused);

    modifier whenNotPaused() {
        require(!paused, "Voting: contract is paused");
        _;
    }

    constructor() VoterRegistry(msg.sender) {
        electionOpen = false;
        paused = false;
    }

    function setElectionOpen(bool isOpen) external onlyAdmin {
        electionOpen = isOpen;
        emit ElectionStatusChanged(isOpen);
    }

    /// @notice Emergency circuit breaker. Does not affect `electionOpen` or any
    /// already-cast votes - only blocks new votes from being cast while true.
    function setPaused(bool isPaused) external onlyAdmin {
        paused = isPaused;
        emit PausedStatusChanged(isPaused);
    }

    function registerCandidate(string calldata name) external onlyAdmin returns (uint256) {
        require(bytes(name).length > 0, "Voting: candidate name required");
        _candidateCount += 1;
        candidates[_candidateCount] = Candidate({ id: _candidateCount, name: name, voteCount: 0 });
        emit CandidateRegistered(_candidateCount, name);
        return _candidateCount;
    }

    function castVote(uint256 candidateId) external whenNotPaused {
        require(electionOpen, "Voting: election is not open");
        require(candidateId > 0 && candidateId <= _candidateCount, "Voting: invalid candidate");
        _checkCanVote(msg.sender);

        markVoted(msg.sender);
        candidates[candidateId].voteCount += 1;

        emit VoteCast(msg.sender, candidateId);
    }

    function getResults() external view returns (uint256[] memory) {
        uint256[] memory results = new uint256[](_candidateCount);
        for (uint256 i = 1; i <= _candidateCount; i++) {
            results[i - 1] = candidates[i].voteCount;
        }
        return results;
    }

    function candidateCount() external view returns (uint256) {
        return _candidateCount;
    }
}
