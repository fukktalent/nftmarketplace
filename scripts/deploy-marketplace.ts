import * as dotenv from "dotenv";

import { ethers } from "hardhat";

dotenv.config();

async function main() {
    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    const nftMarketplace = await NFTMarketplace.deploy(
        process.env.ERC721_ADDRESS || "0x6d32d4343F99E7018Bc8F18e2C909DE80281cac9", // my simple erc tokens
        process.env.ERC1155_ADDRESS || "0xF2BF57DC167A0C2BB3F88C879226C8813eADCa84",
        process.env.ERC20_ADDRESS || "0xCFf5814533944ca7AAfe586d9920C7f585Ba0ab5"
    );

    await nftMarketplace.deployed();

    console.log("Marketplace contract deployed to:", nftMarketplace.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
