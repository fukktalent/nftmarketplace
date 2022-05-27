// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IERC1155Token.sol";

contract ERC1155Token is ERC1155, IERC1155Token {
    using Counters for Counters.Counter;

    address public owner;
    address public minter;

    Counters.Counter private _count;

    mapping (uint256 => string) private _tokenURI;

    modifier onlyOwner() {
        require(owner == msg.sender, "only owner");
        _;
    }

    modifier onlyMinter() {
        require(minter == msg.sender, "only minter");
        _;
    }

    constructor() ERC1155("") {
        owner = msg.sender;
    }

    function setMinter(address addr) public onlyOwner {
        minter = addr;
    }

    function mint(address to, uint256 amount, string memory tokenURI, uint256 tokenId) public onlyMinter {
        _mint(to, tokenId, amount, "");
        _tokenURI[tokenId] = tokenURI;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURI[tokenId];
    }
}