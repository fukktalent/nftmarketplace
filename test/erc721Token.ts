import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ERC721Token } from "../typechain-types";
import config from "./config";

const { METADATA_URI } = config;

describe("ERC721Token", function () {
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;

    let erc721Token: ERC721Token;

    before(async function () {
        [owner, user1] = await ethers.getSigners();
    });

    it("Token deploy", async function () {
        const erc721TokenFactory = await ethers.getContractFactory("ERC721Token", owner);
        erc721Token = <ERC721Token>(await erc721TokenFactory.deploy("ERC 721", "E721"));
        await erc721Token.deployed();
    });

    describe("setMinter", function () {
        it("Should set minter", async function () {
            await erc721Token.setMinter(user1.address);
            expect(await erc721Token.minter()).to.be.equal(user1.address);
        });

        it("Should revert with only owner", async function () {
            const tx = erc721Token.connect(user1).setMinter(user1.address);
            await expect(tx).to.revertedWith("only owner");
        });
    });

    describe("mint", function () {
        it("Should mint token", async function () {
            const tx = await erc721Token.connect(user1).mint(user1.address, METADATA_URI, 1);
            expect(tx).to.emit(
                erc721Token,
                "Transfer"
            ).withArgs(
                ethers.constants.AddressZero,
                user1.address,
                1
            );

            expect(await erc721Token.ownerOf(1)).to.be.equal(user1.address); 
            expect(await erc721Token.tokenURI(1)).to.be.equal(METADATA_URI); 
        });

        it("Should revert with only minter", async function () {
            const tx = erc721Token.connect(owner).mint(user1.address, METADATA_URI, 1);
            await expect(tx).to.revertedWith("only minter");
        });
    });
});
