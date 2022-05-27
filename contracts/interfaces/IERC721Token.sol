// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IERC721Token is IERC721 {
    function mint(address to, string memory tokenURI, uint256 tokenId) external;

    function setMinter(address addr) external;
}