// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.23;

contract ERC5564Announcer {
  event Announcement(
    uint256 indexed schemeId,
    address indexed stealthAddress,
    address indexed caller,
    bytes ephemeralPubKey,
    bytes metadata
  );

  function announce(
    uint256 schemeId,
    address stealthAddress,
    bytes memory ephemeralPubKey,
    bytes memory metadata
  ) external {
    emit Announcement(schemeId, stealthAddress, msg.sender, ephemeralPubKey, metadata);
  }
}