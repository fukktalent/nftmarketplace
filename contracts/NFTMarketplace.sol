//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "./interfaces/IERC721Token.sol";
import "./interfaces/IERC1155Token.sol";

/// @title marketplace for create and sell ERC721 and ERC1155 NFTs 
/// @author fukktalent
/// @dev for create/list there are functions for each type of nft
///      buyItem/cancel/finishAuction there are check for amount of tokens in sale. Zero tokens amount means ERC721 NFT.
contract NFTMarketplace is ERC721Holder, ERC1155Holder {
    using Counters for Counters.Counter;

    struct FixedSale {
        uint256 tokenId;
        uint256 price;
        uint256 amount;
        address seller;
    }

    struct Auction {
        uint256 tokenId;
        uint256 price;
        address seller;
        address buyer;
        uint256 bidsCount;
        uint256 amount;
        uint256 finishTime;
    }

    uint256 public constant AUCTION_DURATION = 3 days;

    IERC20 public payToken;
    IERC721Token public erc721Token;
    IERC1155Token public erc1155Token;

    Counters.Counter private _tokenCount;

    mapping (uint256 => FixedSale) public sales;
    Counters.Counter public salesCount;

    mapping (uint256 => Auction) public auctions;
    Counters.Counter public auctionsCount;

    constructor(IERC721Token erc721Token_, IERC1155Token erc1155Token_, IERC20 payToken_) {
        erc721Token = erc721Token_;
        erc1155Token = erc1155Token_;
        payToken = payToken_;
    }

    function createItem(string memory tokenURI) public {
        uint256 tokenId = _getTokenId();
        erc721Token.mint(msg.sender, tokenURI, tokenId);
    }

    function createItem(uint256 amount, string memory tokenURI) public {
        uint256 tokenId = _getTokenId();
        erc1155Token.mint(msg.sender, amount, tokenURI, tokenId);
    }

    function listItem(uint256 tokenId, uint256 price) public {
        erc721Token.safeTransferFrom(msg.sender, address(this), tokenId);
        _listItem(tokenId, price, 0);
    }

    function listItem(uint256 tokenId, uint256 price, uint256 amount) public {
        erc1155Token.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        _listItem(tokenId, price, amount);
    }

    function buyItem(uint256 saleId) public {
        require(sales[saleId].tokenId != 0, "innactive sale");

        payToken.transferFrom(msg.sender, sales[saleId].seller, sales[saleId].price);

        _transferNFT(address(this), msg.sender, sales[saleId].tokenId, sales[saleId].amount);

        delete sales[saleId];
    }

    function cancel(uint256 saleId) public {
        require(sales[saleId].tokenId != 0, "innactive sale");
        require(sales[saleId].seller == msg.sender, "forbiden: not seller");

        _transferNFT(address(this), msg.sender, sales[saleId].tokenId, sales[saleId].amount);

        delete sales[saleId];
    }

    function listItemOnAuction(uint tokenId, uint256 minPrice) public {
        erc721Token.safeTransferFrom(msg.sender, address(this), tokenId);
        _listItemOnAction(tokenId, minPrice, 0);
    }

    function listItemOnAuction(uint tokenId, uint256 minPrice, uint256 amount) public {
        erc1155Token.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        _listItemOnAction(tokenId, minPrice, amount);
    }

    function makeBid(uint auctionId, uint256 price) public {
        Auction storage auction = auctions[auctionId];

        require(auction.tokenId != 0, "innactive auction");
        require(price > auction.price, "unsuitable bid price");

        payToken.transferFrom(msg.sender, address(this), price);
        if (auction.bidsCount != 0) {
            payToken.transfer(auction.buyer, auction.price);
        }

        auction.buyer = msg.sender;
        auction.price = price;
        auction.bidsCount++;
    }

    function finishAuction(uint256 auctionId) public {
        Auction storage auction = auctions[auctionId];

        require(auction.tokenId != 0, "innactive auction");
        require(auction.finishTime < block.timestamp, "can't be finished yet");

        if (auction.bidsCount > 2) {
            payToken.transfer(auction.seller, auction.price);
            _transferNFT(address(this), auction.buyer, auction.tokenId, auction.amount);
        } else {
            if (auction.bidsCount != 0) {
                payToken.transfer(auction.buyer, auction.price);
            }
            _transferNFT(address(this), auction.seller, auction.tokenId, auction.amount);
        }

        delete auctions[auctionId];
    }

    function _getTokenId() internal returns (uint256) {
        _tokenCount.increment();
        uint256 tokenId = _tokenCount.current();
        return tokenId;
    }

    function _listItem(uint256 tokenId, uint256 price, uint256 amount) private {
        uint256 saleId = salesCount.current();
        salesCount.increment();

        sales[saleId].tokenId = tokenId;
        sales[saleId].seller = msg.sender;
        sales[saleId].price = price;
        sales[saleId].amount = amount;
    }

    function _listItemOnAction(uint tokenId, uint256 minPrice, uint256 amount) private {
        uint256 auctionId = auctionsCount.current();
        auctionsCount.increment();

        auctions[auctionId].tokenId = tokenId;
        auctions[auctionId].seller = msg.sender;
        auctions[auctionId].price = minPrice;
        auctions[auctionId].amount = amount;
        auctions[auctionId].finishTime = block.timestamp + AUCTION_DURATION;
    }

    function _transferNFT(address from, address to, uint256 tokenId, uint256 amount) private {
        if (amount == 0) {
            erc721Token.safeTransferFrom(from, to, tokenId);
        } else {
            erc1155Token.safeTransferFrom(from, to, tokenId, amount, "");
        }
    }
}
