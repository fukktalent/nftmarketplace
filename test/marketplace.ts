import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumberish } from "ethers";

import { ERC20Token, ERC721Token, ERC1155Token, NFTMarketplace } from "../typechain-types";
import config from "./config";

const { METADATA_URI, PRICE } = config;

describe("Staking", function () {
    let marketplace: NFTMarketplace;

    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let userNoBalance: SignerWithAddress;

    let erc721Token: ERC721Token;
    let erc1155Token: ERC1155Token;
    let payToken: ERC20Token;

    let salesCount = 0;
    let saleId721: BigNumberish;
    let saleId1155: BigNumberish;

    let auctionsCount = 0;
    let auctionId721: BigNumberish;
    let auctionId1155: BigNumberish;

    before(async function () {
        [owner, user1, user2, userNoBalance] = await ethers.getSigners();

        const erc721TokenFactory = await ethers.getContractFactory("ERC721Token", owner);
        erc721Token = <ERC721Token>(await erc721TokenFactory.deploy("ERC 721", "E721"));
        await erc721Token.deployed();

        const erc1155TokenFactory = await ethers.getContractFactory("ERC1155Token", owner);
        erc1155Token = <ERC1155Token>(await erc1155TokenFactory.deploy());
        await erc1155Token.deployed();

        const erc20TokenFactory = await ethers.getContractFactory("ERC20Token", owner);
        payToken = <ERC20Token>(await erc20TokenFactory.deploy("ERC 20", "E20"));
        await payToken.deployed();

        payToken.mint(owner.address, 1_000_000_000);
        payToken.mint(user1.address, 1_000_000_000);
        payToken.mint(user2.address, 1_000_000_000);
    });

    it("Should deploy contract", async function () {
        const marketpalceFactory = await ethers.getContractFactory("NFTMarketplace", owner);
        marketplace = <NFTMarketplace>(await marketpalceFactory.deploy(
            erc721Token.address,
            erc1155Token.address,
            payToken.address
        ));
        await marketplace.deployed();

        await erc1155Token.setApprovalForAll(marketplace.address, true);
        await payToken.connect(user1).approve(marketplace.address, ethers.constants.MaxUint256);
        await payToken.connect(user2).approve(marketplace.address, ethers.constants.MaxUint256);

        expect(await marketplace.salesCount()).to.be.equal(0);
        expect(await marketplace.auctionsCount()).to.be.equal(0);
    });

    it("Should set auction contract to minter in erc721, erc1155", async function () {
        erc721Token.setMinter(marketplace.address);
        erc1155Token.setMinter(marketplace.address);

        expect(await erc721Token.minter()).to.be.equal(marketplace.address);
        expect(await erc1155Token.minter()).to.be.equal(marketplace.address);
    });

    describe("createItem", function () {
        it("Should mint ERC721 to sender", async function () {
            const tx = await marketplace["createItem(string)"](METADATA_URI);
            await expect(tx).to.emit(erc721Token, "Transfer").withArgs(
                ethers.constants.AddressZero,
                owner.address, 
                1
            );
            
            expect(await erc721Token.ownerOf(1)).to.be.equal(owner.address);
        });

        it("Should mint 3 ERC1155 tokens to sender", async function () {
            const tx = await marketplace["createItem(uint256,string)"](3, METADATA_URI);
            await expect(tx).to.emit(erc1155Token, "TransferSingle").withArgs(
                marketplace.address, 
                ethers.constants.AddressZero,
                owner.address, 
                2,
                3
            );
            
            expect(await erc1155Token.balanceOf(owner.address, 2)).to.be.equal(3);
        });
    });

    describe("listItem", function () {
        it("Should create new sale and transfer erc721 to marketplace", async function () {
            await erc721Token.approve(marketplace.address, 1);

            const tx = await marketplace["listItem(uint256,uint256)"](1, PRICE);
            await expect(tx).to.emit(erc721Token, "Transfer").withArgs(
                owner.address,
                marketplace.address, 
                1
            );

            expect(await erc721Token.ownerOf(1)).to.be.equal(marketplace.address);
            
            saleId721 = salesCount++;
            const sale = await marketplace.sales(saleId721);
            expect(sale.tokenId).to.be.equal(1);
            expect(sale.amount).to.be.equal(0);
            expect(sale.price).to.be.equal(PRICE);
            expect(sale.seller).to.be.equal(owner.address);
        });

        it("Should create new sale and transfer erc1155 to marketplace", async function () {
            const userBalance = await erc1155Token.balanceOf(owner.address, 2);
            const marketBalance = await erc1155Token.balanceOf(marketplace.address, 2);

            const tx = await marketplace["listItem(uint256,uint256,uint256)"](2, PRICE, 2);
            await expect(tx).to.emit(erc1155Token, "TransferSingle").withArgs(
                marketplace.address, 
                owner.address,
                marketplace.address, 
                2,
                2
            );
            
            const userBalanceAfter = await erc1155Token.balanceOf(owner.address, 2);
            const marketBalanceAfter = await erc1155Token.balanceOf(marketplace.address, 2);
            expect(userBalanceAfter).to.be.equal(userBalance.sub(2));
            expect(marketBalanceAfter).to.be.equal(marketBalance.add(2));
            
            saleId1155 = salesCount++;
            const sale = await marketplace.sales(saleId1155);
            expect(sale.tokenId).to.be.equal(2);
            expect(sale.amount).to.be.equal(2);
            expect(sale.price).to.be.equal(PRICE);
            expect(sale.seller).to.be.equal(owner.address);
        });
    });

    describe("buyItem", function() {
        it("Should revert then try to buy token without balance", async function () {
            const sale = await marketplace.sales(saleId721);

            const tx = marketplace.connect(userNoBalance).buyItem(saleId721);
            await expect(tx).to.be.revertedWith("not allowed amount");

            expect(await erc721Token.ownerOf(1)).to.be.equal(marketplace.address);
            expect(await marketplace.sales(saleId721)).to.deep.equal(sale);
        });

        it("Should cancel sale, transfer erc721 to buyer, erc20 to seller", async function () {
            const sellerBalance = await payToken.balanceOf(owner.address);

            const tx = await marketplace.connect(user1).buyItem(saleId721);
            await expect(tx).to.emit(erc721Token, "Transfer").withArgs(
                owner.address,
                marketplace.address, 
                1
            ).and.to.emit(payToken, "Transfer").withArgs(
                user1.address,
                owner.address,
                PRICE
            );

            expect(await erc721Token.ownerOf(1)).to.be.equal(user1.address);
            expect(await payToken.balanceOf(owner.address)).to.be.equal(sellerBalance.add(PRICE));
            
            const sale = await marketplace.sales(saleId721);
            expect(sale.tokenId).to.be.equal(0);
            expect(sale.amount).to.be.equal(0);
            expect(sale.price).to.be.equal(0);
            expect(sale.seller).to.be.equal(ethers.constants.AddressZero);
        });

        it("Should cancel sale, transfer erc1155 to buyer, erc20 to seller", async function () {
            const sellerBalance = await payToken.balanceOf(owner.address);

            const tx = await marketplace.connect(user1).buyItem(saleId1155);
            await expect(tx).to.emit(erc721Token, "TransferSingle").withArgs(
                marketplace.address,
                owner.address,
                marketplace.address, 
                1,
                2
            ).and.to.emit(payToken, "Transfer").withArgs(
                user1.address,
                owner.address,
                PRICE
            );

            expect(await erc1155Token.balanceOf(user1.address, 2)).to.be.equal(2);
            expect(await payToken.balanceOf(owner.address)).to.be.equal(sellerBalance.add(PRICE));
            
            const sale = await marketplace.sales(saleId1155);
            expect(sale.tokenId).to.be.equal(0);
            expect(sale.amount).to.be.equal(0);
            expect(sale.price).to.be.equal(0);
            expect(sale.seller).to.be.equal(ethers.constants.AddressZero);
        });

        it("Should revert with innactive sale", async function () {
            const tx = marketplace.connect(user1).buyItem(saleId721);
            await expect(tx).to.be.revertedWith("innactive sale");
        });
    });

    describe("cancel", function() {
        before(async function () {
            await marketplace["createItem(string)"](METADATA_URI);
            await erc721Token.approve(marketplace.address, 3);
            await marketplace["listItem(uint256,uint256)"](3, PRICE);
        });

        it("Should revert with no seller", async function () {
            const tx = marketplace.connect(user1).cancel(salesCount);
            await expect(tx).to.be.revertedWith("forbiden: not seller");
        });

        it("Should cancel sale and transfer token to seller", async function () {
            const tx = await marketplace.cancel(salesCount);
            await expect(tx).to.emit(erc721Token, "Transfer").withArgs(
                marketplace.address, 
                owner.address,
                3
            );

            expect(await erc721Token.ownerOf(3)).to.be.equal(owner.address);
        });

        it("Should revert with innactive sale", async function () {
            const tx = marketplace.connect(owner).cancel(salesCount);
            await expect(tx).to.be.revertedWith("innactive sale");
        });
    });

    describe("listItemOnAuction", function () {
        before(async function () {
            await marketplace["createItem(string)"](METADATA_URI);
            await erc721Token.approve(marketplace.address, 4);

            await marketplace["createItem(uint256,string)"](10, METADATA_URI);
        });

        it("Should create auction and transfer erc721Token to marketplace", async function () {
            const tx = await marketplace["listItemOnAuction(uint256,uint256)"](4, PRICE);
            await expect(tx).to.emit(erc721Token, "Transfer").withArgs(
                owner.address,
                marketplace.address, 
                4
            );

            expect(await erc721Token.ownerOf(4)).to.be.equal(marketplace.address);
            
            auctionId721 = auctionsCount++;
            const auction = await marketplace.auctions(auctionId721);
            expect(auction.tokenId).to.be.equal(4);
            expect(auction.amount).to.be.equal(0);
            expect(auction.price).to.be.equal(PRICE);
            expect(auction.seller).to.be.equal(owner.address);
            expect(auction.bidsCount).to.be.equal(0);
            expect(auction.buyer).to.be.equal(ethers.constants.AddressZero);
        });

        it("Should create auction and transfer erc1155Token to marketplace", async function () {
            const userBalance = await erc1155Token.balanceOf(owner.address, 5);
            const marketBalance = await erc1155Token.balanceOf(marketplace.address, 5);

            const tx = await marketplace["listItemOnAuction(uint256,uint256,uint256)"](5, PRICE, 10);
            await expect(tx).to.emit(erc1155Token, "TransferSingle").withArgs(
                marketplace.address, 
                owner.address,
                marketplace.address, 
                5,
                10
            );

            const userBalanceAfter = await erc1155Token.balanceOf(owner.address, 5);
            const marketBalanceAfter = await erc1155Token.balanceOf(marketplace.address, 5);
            expect(userBalanceAfter).to.be.equal(userBalance.sub(10));
            expect(marketBalanceAfter).to.be.equal(marketBalance.add(10));
            
            auctionId1155 = auctionsCount++;
            const auction = await marketplace.auctions(auctionId1155);
            expect(auction.tokenId).to.be.equal(5);
            expect(auction.amount).to.be.equal(10);
            expect(auction.price).to.be.equal(PRICE);
            expect(auction.seller).to.be.equal(owner.address);
            expect(auction.bidsCount).to.be.equal(0);
            expect(auction.buyer).to.be.equal(ethers.constants.AddressZero);
        });
    });

    describe("makeBid", function() {
        it("Should revert with unsuitable bid price", async function () {
            const tx = marketplace.connect(user1).makeBid(auctionId721, PRICE);
            await expect(tx).to.be.revertedWith("unsuitable bid price");
        });

        it("Should make first bid and do needed transfers", async function () {
            const marketBalance = await payToken.balanceOf(marketplace.address);

            await marketplace.connect(user1).makeBid(auctionId721, PRICE + 1);

            const marketBalanceAfter = await payToken.balanceOf(marketplace.address);
            expect(marketBalanceAfter).to.be.equal(marketBalance.add(PRICE + 1));

            const auction = await marketplace.auctions(auctionId721);
            expect(auction.tokenId).to.be.equal(4);
            expect(auction.price).to.be.equal(PRICE + 1);
            expect(auction.seller).to.be.equal(owner.address);
            expect(auction.bidsCount).to.be.equal(1);
            expect(auction.buyer).to.be.equal(user1.address);
        });

        it("Should make second bid and do needed transfers", async function () {
            const tx = await marketplace.connect(user2).makeBid(auctionId721, PRICE + 2);

            expect(() => tx).to.changeTokenBalance(
                payToken,
                [user2, user1, marketplace],
                [-(PRICE + 2), PRICE + 1, 1]
            );

            const marketBalanceAfter = await payToken.balanceOf(marketplace.address);
            expect(marketBalanceAfter).to.be.equal(PRICE + 2);

            const auction = await marketplace.auctions(auctionId721);
            expect(auction.tokenId).to.be.equal(4);
            expect(auction.price).to.be.equal(PRICE + 2);
            expect(auction.seller).to.be.equal(owner.address);
            expect(auction.bidsCount).to.be.equal(2);
            expect(auction.buyer).to.be.equal(user2.address);
        });

        it("Should revert with innactive auction", async function () {
            const tx = marketplace.makeBid(99, PRICE);
            await expect(tx).to.be.revertedWith("innactive auction");
        });
    });

    describe("finishAuction", function() {
        it("Should revert with can't be finished yet", async function () {
            const tx = marketplace.connect(user1).finishAuction(auctionId721);
            await expect(tx).to.be.revertedWith("can't be finished yet");
        });

        it("Should finish auction with more than 2 bids and do needed transfers", async function () {
            await marketplace.connect(user1).makeBid(auctionId721, PRICE * 2);

            await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            const tx = await marketplace.finishAuction(auctionId721);

            expect(() => tx).to.changeTokenBalance(
                payToken,
                [owner, marketplace],
                [PRICE * 2, -(PRICE * 2)]
            );

            expect(await erc721Token.ownerOf(4)).to.be.equal(user1.address);

            const auction = await marketplace.auctions(auctionId721);
            expect(auction.tokenId).to.be.equal(0);
            expect(auction.price).to.be.equal(0);
        });

        it("Should finish auction with less than 2 bids and do needed transfers", async function () {
            await marketplace.connect(user1).makeBid(auctionId1155, PRICE * 2);

            const tx = await marketplace.finishAuction(auctionId1155);

            expect(() => tx).to.changeTokenBalance(
                payToken,
                [user1, marketplace, owner],
                [PRICE * 2, -(PRICE * 2), 0]
            );

            expect(await erc1155Token.balanceOf(owner.address, 5)).to.be.equal(10);

            const auction = await marketplace.auctions(auctionId1155);
            expect(auction.tokenId).to.be.equal(0);
            expect(auction.price).to.be.equal(0);
        });

        it("Should finish auction with 0 bids and do needed transfers", async function () {
            await marketplace["listItemOnAuction(uint256,uint256,uint256)"](5, PRICE, 10);

            expect(await erc1155Token.balanceOf(owner.address, 5)).to.be.equal(0);

            await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine", []);

            const tx = await marketplace.finishAuction(auctionsCount);

            expect(() => tx).to.changeTokenBalance(
                payToken,
                [marketplace, owner],
                [0, 0]
            );

            expect(await erc1155Token.balanceOf(owner.address, 5)).to.be.equal(10);

            const auction = await marketplace.auctions(auctionsCount);
            expect(auction.tokenId).to.be.equal(0);
            expect(auction.price).to.be.equal(0);
        });

        it("Should revert with innactive auction", async function () {
            const tx = marketplace.finishAuction(99);
            await expect(tx).to.be.revertedWith("innactive auction");
        });
    });
});
