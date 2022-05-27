// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IERC1155Token is IERC1155 {
    function mint(address to, uint256 amount, string memory tokenURI, uint256 tokenId) external;

    function setMinter(address addr) external;
}