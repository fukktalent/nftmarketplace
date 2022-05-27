// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IERC721Token.sol";

contract ERC721Token is ERC721, IERC721Token {
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

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        owner = msg.sender;
    }

    function mint(address to, string memory tokenURI_, uint256 tokenId) public onlyMinter {
        _safeMint(to, tokenId);
        _tokenURI[tokenId] = tokenURI_;
    }

    function setMinter(address addr) public onlyOwner {
        minter = addr;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURI[tokenId];
    }
}
