// SPDX-License-Identifier: CC0-1.0
pragma solidity 0.8.23;

contract ERC6538Registry {
  error ERC6538Registry__InvalidSignature();

  mapping(address registrant => mapping(uint256 schemeId => bytes)) public stealthMetaAddressOf;

  mapping(address registrant => uint256) public nonceOf;

  bytes32 public constant ERC6538REGISTRY_ENTRY_TYPE_HASH =
    keccak256("Erc6538RegistryEntry(uint256 schemeId,bytes stealthMetaAddress,uint256 nonce)");

  uint256 internal immutable INITIAL_CHAIN_ID;

  bytes32 internal immutable INITIAL_DOMAIN_SEPARATOR;

  event StealthMetaAddressSet(
    address indexed registrant, uint256 indexed schemeId, bytes stealthMetaAddress
  );

  event NonceIncremented(address indexed registrant, uint256 newNonce);

  constructor() {
    INITIAL_CHAIN_ID = block.chainid;
    INITIAL_DOMAIN_SEPARATOR = _computeDomainSeparator();
  }

  function registerKeys(uint256 schemeId, bytes calldata stealthMetaAddress) external {
    stealthMetaAddressOf[msg.sender][schemeId] = stealthMetaAddress;
    emit StealthMetaAddressSet(msg.sender, schemeId, stealthMetaAddress);
  }

  function registerKeysOnBehalf(
    address registrant,
    uint256 schemeId,
    bytes memory signature,
    bytes calldata stealthMetaAddress
  ) external {
    bytes32 dataHash;
    address recoveredAddress;

    unchecked {
      dataHash = keccak256(
        abi.encodePacked(
          "\x19\x01",
          DOMAIN_SEPARATOR(),
          keccak256(
            abi.encode(
              ERC6538REGISTRY_ENTRY_TYPE_HASH,
              schemeId,
              keccak256(stealthMetaAddress),
              nonceOf[registrant]++
            )
          )
        )
      );
    }

    if (signature.length == 65) {
      bytes32 r;
      bytes32 s;
      uint8 v;
      assembly ("memory-safe") {
        r := mload(add(signature, 0x20))
        s := mload(add(signature, 0x40))
        v := byte(0, mload(add(signature, 0x60)))
      }
      recoveredAddress = ecrecover(dataHash, v, r, s);
    }

    if (
      (
        (recoveredAddress == address(0) || recoveredAddress != registrant)
          && (
            IERC1271(registrant).isValidSignature(dataHash, signature)
              != IERC1271.isValidSignature.selector
          )
      )
    ) revert ERC6538Registry__InvalidSignature();

    stealthMetaAddressOf[registrant][schemeId] = stealthMetaAddress;
    emit StealthMetaAddressSet(registrant, schemeId, stealthMetaAddress);
  }

  function incrementNonce() external {
    unchecked {
      nonceOf[msg.sender]++;
    }
    emit NonceIncremented(msg.sender, nonceOf[msg.sender]);
  }

  function DOMAIN_SEPARATOR() public view returns (bytes32) {
    return block.chainid == INITIAL_CHAIN_ID ? INITIAL_DOMAIN_SEPARATOR : _computeDomainSeparator();
  }

  function _computeDomainSeparator() internal view returns (bytes32) {
    return keccak256(
      abi.encode(
        keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256("ERC6538Registry"),
        keccak256("1.0"),
        block.chainid,
        address(this)
      )
    );
  }
}

  function isValidSignature(bytes32 hash, bytes memory signature)
    external
    view
    returns (bytes4 magicValue);
}