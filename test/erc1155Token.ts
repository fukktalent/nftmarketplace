import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ERC1155Token } from "../typechain-types";
import config from "./config";

const { METADATA_URI } = config;

describe("ERC1155Token", function () {
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;

    let erc1155Token: ERC1155Token;

    before(async function () {
        [owner, user1] = await ethers.getSigners();
    });

    it("Token deploy", async function () {
        const erc1155TokenFactory = await ethers.getContractFactory("ERC1155Token", owner);
        erc1155Token = <ERC1155Token>(await erc1155TokenFactory.deploy());
        await erc1155Token.deployed();
    });

    describe("setMinter", function () {
        it("Should set minter", async function () {
            await erc1155Token.setMinter(user1.address);
            expect(await erc1155Token.minter()).to.be.equal(user1.address);
        });

        it("Should revert with only owner", async function () {
            const tx = erc1155Token.connect(user1).setMinter(user1.address);
            await expect(tx).to.revertedWith("only owner");
        });
    });

    describe("mint", function () {
        it("Should mint token", async function () {
            const tx = await erc1155Token.connect(user1).mint(user1.address, 10, METADATA_URI, 1);
            expect(tx).to.emit(
                erc1155Token,
                "TransferSingle"
            ).withArgs(
                user1.address,
                ethers.constants.AddressZero,
                user1.address,
                1,
                10
            );

            expect(await erc1155Token.balanceOf(user1.address, 1)).to.be.equal(10); 
            expect(await erc1155Token.uri(1)).to.be.equal(METADATA_URI); 
        });

        it("Should revert with only minter", async function () {
            const tx = erc1155Token.connect(owner).mint(user1.address, 10, METADATA_URI, 1);
            await expect(tx).to.revertedWith("only minter");
        });
    });
});
