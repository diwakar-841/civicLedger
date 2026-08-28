// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVoting {
    function registerCandidate(string calldata name) external returns (uint256);
    function castVote(uint256 candidateId) external;
    function getResults() external view returns (uint256[] memory);
    function candidateCount() external view returns (uint256);
}
