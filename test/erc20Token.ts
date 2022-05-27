import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20Token__factory, ERC20Token } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("ERC20Token", function () {
    const TOKEN = { NAME: 'test token', SYMBOL: 'TST', DECIMALS: 18 };
    const SOME_TOKENS_AMOUNT = 999;

    let erc20Token: ERC20Token;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    before(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();
    });

    describe("Token deploy", function () {
        it("Should deploy token contract with given params and default data", async function () {
            erc20Token = await new ERC20Token__factory(owner).deploy(TOKEN.NAME, TOKEN.SYMBOL);
            await erc20Token.deployed();

            expect(await erc20Token.owner()).to.be.equal(owner.address);
            expect(await erc20Token.name()).to.be.equal(TOKEN.NAME);
            expect(await erc20Token.symbol()).to.be.equal(TOKEN.SYMBOL);
            expect(await erc20Token.decimals()).to.be.equal(TOKEN.DECIMALS);
            expect(await erc20Token.totalSupply()).to.be.equal(0);
        });

        it("Should revert with empty args error", async function () {
            const tx1 = new ERC20Token__factory(owner).deploy(TOKEN.NAME, '');
            await expect(tx1).to.be.revertedWith("args shouldn't be empty");

            const tx2 = new ERC20Token__factory(owner).deploy('', '');
            await expect(tx2).to.be.revertedWith("args shouldn't be empty");
        });
    })

    describe("Mint", function () {
        beforeEach(async function () {
            erc20Token = await new ERC20Token__factory(owner).deploy(TOKEN.NAME, TOKEN.SYMBOL);
            await erc20Token.deployed();
        });

        it("Should mint tokens to user 1", async function () {
            const balance = await erc20Token.balanceOf(user1.address);

            const txMint = erc20Token.mint(user1.address, SOME_TOKENS_AMOUNT);
            await expect(txMint).to.emit(
                erc20Token,
                "Transfer"
            ).withArgs(
                ethers.constants.AddressZero,
                user1.address,
                SOME_TOKENS_AMOUNT
            );

            const txBalance = await erc20Token.balanceOf(user1.address);
            expect(txBalance).to.be.equal(balance.add(BigNumber.from(SOME_TOKENS_AMOUNT)));
        })

        it("Should revert with zero address error", async function () {
            const tx = erc20Token.mint(ethers.constants.AddressZero, SOME_TOKENS_AMOUNT);
            await expect(tx).to.be.revertedWith("address shouldn't be zero");
        })

        it("Should revert with not owner error", async function () {
            const tx = erc20Token.connect(user1).mint(user1.address, SOME_TOKENS_AMOUNT);
            await expect(tx).to.be.revertedWith("not owner");
        })
    })

    describe("Burn", function () {
        beforeEach(async function () {
            erc20Token = await new ERC20Token__factory(owner).deploy(TOKEN.NAME, TOKEN.SYMBOL);
            await erc20Token.deployed();
            await erc20Token.mint(user1.address, SOME_TOKENS_AMOUNT);
        });

        it("Should mint tokens to user 1", async function () {
            const balance = await erc20Token.balanceOf(user1.address);

            const txBurn = erc20Token.burn(user1.address, SOME_TOKENS_AMOUNT);
            await expect(txBurn).to.emit(
                erc20Token, 
                "Transfer"
            ).withArgs(
                user1.address,
                ethers.constants.AddressZero,
                SOME_TOKENS_AMOUNT
            );

            const txBalance = await erc20Token.balanceOf(user1.address);
            expect(txBalance).to.be.equal(balance.sub(BigNumber.from(SOME_TOKENS_AMOUNT)));
        })

        it("Should revert with zero address error", async function () {
            const tx = erc20Token.burn(user1.address, SOME_TOKENS_AMOUNT + 100);
            await expect(tx).to.be.revertedWith("not enough balance");
        })

        it("Should revert with not owner error", async function () {
            const tx = erc20Token.connect(user1).burn(user1.address, SOME_TOKENS_AMOUNT);
            await expect(tx).to.be.revertedWith("not owner");
        })
    })

    describe("Transfer", function () {
        beforeEach(async function () {
            erc20Token = await new ERC20Token__factory(owner).deploy(TOKEN.NAME, TOKEN.SYMBOL);
            await erc20Token.deployed();
            await erc20Token.mint(user1.address, SOME_TOKENS_AMOUNT);
        });

        it("Should transfer tokens from user 1 to user 2", async function () {
            const user1Balance = await erc20Token.balanceOf(user1.address);
            const user2Balance = await erc20Token.balanceOf(user2.address);

            const txTransfer = erc20Token.connect(user1).transfer(user2.address, SOME_TOKENS_AMOUNT);
            await expect(txTransfer).to.emit(
                erc20Token,
                "Transfer"
            ).withArgs(
                user1.address,
                user2.address,
                SOME_TOKENS_AMOUNT
            );

            const txBalance1 = await erc20Token.balanceOf(user1.address);
            expect(txBalance1).to.be.equal(user1Balance.sub(BigNumber.from(SOME_TOKENS_AMOUNT)));

            const txBalance2 = await erc20Token.balanceOf(user2.address);
            expect(txBalance2).to.be.equal(user2Balance.add(BigNumber.from(SOME_TOKENS_AMOUNT)));
        })

        it("Should revert with zero address error", async function () {
            const user1Balance = await erc20Token.balanceOf(user1.address);
            await expect(erc20Token.connect(user1).transfer(ethers.constants.AddressZero, SOME_TOKENS_AMOUNT))
                .to.be.revertedWith("address shouldn't be zero");
            expect(await erc20Token.balanceOf(user1.address)).to.be.equal(user1Balance);
        })

        it("Should revert with not enough balance error", async function () {
            const user1Balance = await erc20Token.balanceOf(user1.address);
            const user2Balance = await erc20Token.balanceOf(user2.address);

            const tx = erc20Token.connect(user1).transfer(user2.address, SOME_TOKENS_AMOUNT + 1);
            await expect(tx).to.be.revertedWith("not enough balance");

            expect(await erc20Token.balanceOf(user1.address)).to.be.equal(user1Balance);
            expect(await erc20Token.balanceOf(user2.address)).to.be.equal(user2Balance);
        })
    })

    describe("Approve", function () {
        beforeEach(async function () {
            erc20Token = await new ERC20Token__factory(owner).deploy(TOKEN.NAME, TOKEN.SYMBOL);
            await erc20Token.deployed();
            await erc20Token.mint(user1.address, SOME_TOKENS_AMOUNT);
        });

        it("Should approve user 2 to send tokens of user 1", async function () {
            const txApprove = erc20Token.connect(user1).approve(user2.address, SOME_TOKENS_AMOUNT);
            await expect(txApprove).to.emit(
                erc20Token,
                "Approval"
            ).withArgs(
                user1.address,
                user2.address, 
                SOME_TOKENS_AMOUNT
            );

            const txAllowance = await erc20Token.allowance(user1.address, user2.address);
            expect(txAllowance).to.be.equal(SOME_TOKENS_AMOUNT);
        })

        it("Should revert with zero address error", async function () {
            const tx = erc20Token.connect(user1).approve(ethers.constants.AddressZero, SOME_TOKENS_AMOUNT);
            await expect(tx).to.be.revertedWith("address shouldn't be zero");
        })
    })

    describe("TransferFrom", function () {
        beforeEach(async function () {
            erc20Token = await new ERC20Token__factory(owner).deploy(TOKEN.NAME, TOKEN.SYMBOL);
            await erc20Token.deployed();
            await erc20Token.mint(user1.address, SOME_TOKENS_AMOUNT);
            erc20Token.connect(user1).approve(user3.address, SOME_TOKENS_AMOUNT);
        });

        it("Should transfer tokens from user 1 to user 2 (user 3 is signer)", async function () {
            const user1Balance = await erc20Token.balanceOf(user1.address);
            const user2Balance = await erc20Token.balanceOf(user2.address);

            const txTransfer = erc20Token.connect(user3).transferFrom(user1.address, user2.address, SOME_TOKENS_AMOUNT);
            await expect(txTransfer).to.emit(
                erc20Token, 
                "Transfer"
            ).withArgs(
                user1.address, 
                user2.address, 
                SOME_TOKENS_AMOUNT
            ).and.to.emit(
                erc20Token, 
                "Approval"
            ).withArgs(
                user1.address, 
                user3.address, 
                0
            );
            
            const txBalance1 = await erc20Token.balanceOf(user1.address);
            expect(txBalance1).to.be.equal(user1Balance.sub(BigNumber.from(SOME_TOKENS_AMOUNT)));

            const txBalance2 = await erc20Token.balanceOf(user2.address);
            expect(txBalance2).to.be.equal(user2Balance.add(BigNumber.from(SOME_TOKENS_AMOUNT)));

            expect(await erc20Token.allowance(user1.address, user3.address)).to.be.equal(0);
        })

        it("Should revert with zero address error", async function () {
            const user1Balance = await erc20Token.balanceOf(user1.address);

            const tx = erc20Token.connect(user3).transferFrom(user1.address, ethers.constants.AddressZero, SOME_TOKENS_AMOUNT);
            await expect(tx).to.be.revertedWith("address shouldn't be zero");

            expect(await erc20Token.balanceOf(user1.address)).to.be.equal(user1Balance);
        })

        it("Should revert with not allowed amount error", async function () {
            const user1Balance = await erc20Token.balanceOf(user1.address);

            const tx = erc20Token.connect(user3).transferFrom(user1.address, ethers.constants.AddressZero, SOME_TOKENS_AMOUNT + 1);
            await expect(tx).to.be.revertedWith("not allowed amount");

            expect(await erc20Token.balanceOf(user1.address)).to.be.equal(user1Balance);
        })
    })
});
