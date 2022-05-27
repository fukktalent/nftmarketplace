import { ethers } from "hardhat";

async function main() {
    const ERC721Token = await ethers.getContractFactory("ERC721Token");
    const erc721Token = await ERC721Token.deploy(
        process.env.ERC721_NAME || "Token ERC20", 
        process.env.ERC721_SYMBOL || "ERC20"
    );

    await erc721Token.deployed();

    console.log("Token deployed to:", erc721Token.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
