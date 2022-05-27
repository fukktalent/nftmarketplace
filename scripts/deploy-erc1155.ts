import { ethers } from "hardhat";

async function main() {
    const ERC1155Token = await ethers.getContractFactory("ERC1155Token");
    const erc1155Token = await ERC1155Token.deploy();

    await erc1155Token.deployed();

    console.log("Token deployed to:", erc1155Token.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
