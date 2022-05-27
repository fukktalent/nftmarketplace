import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

import { ERC721Token, ERC1155Token, NFTMarketplace } from "../typechain-types";

task("set-minter-erc721", "set minter for token")
    .addParam("tokenaddress", "address of token")
    .addParam("addr", "address of minter")
    .setAction(async (args, { ethers }) => {
        const { tokenaddress, addr } = args;
        const [signer] = await ethers.getSigners();

        const token: ERC721Token = <ERC721Token>(await ethers.getContractAt("ERC721Token", tokenaddress, signer));
        const tx = await token.setMinter(addr);

        console.log(tx);
    });

task("set-minter-erc1155", "set minter for token")
    .addParam("tokenaddress", "address of token")
    .addParam("addr", "address of minter")
    .setAction(async (args, { ethers }) => {
        const { tokenaddress, addr } = args;
        const [signer] = await ethers.getSigners();

        const token: ERC1155Token = <ERC1155Token>(await ethers.getContractAt("ERC1155Token", tokenaddress, signer));
        const tx = await token.setMinter(addr);

        console.log(tx);
    });

task("create-item", "creates item on marketplace")
    .addParam("mpaddr", "address of marketplace")
    .addParam("uri", "metadata uri")
    .addParam("amount", "amount of tokens if 1155")
    .setAction(async (args, { ethers }) => {
        const { mpaddr, uri, amount } = args;
        const [signer] = await ethers.getSigners();

        const marketplace: NFTMarketplace = <NFTMarketplace>(await ethers.getContractAt("NFTMarketplace", mpaddr, signer));
        let tx;
        if (!!amount) {
            tx = await marketplace["createItem(uint256,string)"](amount, uri);
        } else {
            tx = await marketplace["createItem(string)"](uri);
        }

        console.log(tx);
    });

task("list-item", "list item on marketplace")
    .addParam("mpaddr", "address of marketplace")
    .addParam("id", "token id")
    .addParam("price", "price")
    .addParam("amount", "amount of tokens if 1155")
    .setAction(async (args, { ethers }) => {
        const { mpaddr, id, amount, price } = args;
        const [signer] = await ethers.getSigners();

        const marketplace: NFTMarketplace = <NFTMarketplace>(await ethers.getContractAt("NFTMarketplace", mpaddr, signer));
        let tx;
        if (!!amount) {
            tx = await marketplace["listItem(uint256,uint256)"](id, price);
        } else {
            tx = await marketplace["listItem(uint256,uint256,uint256)"](id, price, amount);
        }

        console.log(tx);
    });

task("list-item-auction", "list item on marketplace")
    .addParam("mpaddr", "address of marketplace")
    .addParam("id", "token id")
    .addParam("price", "price")
    .addParam("amount", "amount of tokens if 1155")
    .setAction(async (args, { ethers }) => {
        const { mpaddr, id, amount, price } = args;
        const [signer] = await ethers.getSigners();

        const marketplace: NFTMarketplace = <NFTMarketplace>(await ethers.getContractAt("NFTMarketplace", mpaddr, signer));
        let tx;
        if (!!amount) {
            tx = await marketplace["listItemOnAuction(uint256,uint256)"](id, price);
        } else {
            tx = await marketplace["listItemOnAuction(uint256,uint256,uint256)"](id, price, amount);
        }

        console.log(tx);
    });

task("buy-item", "buy item on marketplace")
    .addParam("mpaddr", "address of marketplace")
    .addParam("sellid", "sell id")
    .setAction(async (args, { ethers }) => {
        const { mpaddr, sellid } = args;
        const [signer] = await ethers.getSigners();

        const marketplace: NFTMarketplace = <NFTMarketplace>(await ethers.getContractAt("NFTMarketplace", mpaddr, signer));
        let tx = await marketplace.buyItem(sellid);

        console.log(tx);
    });

task("cancel", "cancel sell on marketplace")
    .addParam("mpaddr", "address of marketplace")
    .addParam("sellid", "sell id")
    .setAction(async (args, { ethers }) => {
        const { mpaddr, sellid } = args;
        const [signer] = await ethers.getSigners();

        const marketplace: NFTMarketplace = <NFTMarketplace>(await ethers.getContractAt("NFTMarketplace", mpaddr, signer));
        let tx = await marketplace.cancel(sellid);

        console.log(tx);
    });

task("bid", "make bid for auction on marketplace")
    .addParam("mpaddr", "address of marketplace")
    .addParam("auctionid", "auction id")
    .addParam("price", "bid price")
    .setAction(async (args, { ethers }) => {
        const { mpaddr, auctionid, price } = args;
        const [signer] = await ethers.getSigners();

        const marketplace: NFTMarketplace = <NFTMarketplace>(await ethers.getContractAt("NFTMarketplace", mpaddr, signer));
        let tx = await marketplace.makeBid(auctionid, price);

        console.log(tx);
    });

task("finish-auction", "finish auction on marketplace")
    .addParam("mpaddr", "address of marketplace")
    .addParam("auctionid", "auction id")
    .setAction(async (args, { ethers }) => {
        const { mpaddr, auctionid } = args;
        const [signer] = await ethers.getSigners();

        const marketplace: NFTMarketplace = <NFTMarketplace>(await ethers.getContractAt("NFTMarketplace", mpaddr, signer));
        let tx = await marketplace.finishAuction(auctionid);

        console.log(tx);
    });