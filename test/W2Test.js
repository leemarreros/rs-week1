const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { primes } = require("../utils");

const getRole = (role) =>
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));

const MINTER_ROLE = getRole("MINTER_ROLE");

describe("Testing Staking Week 2", function () {
  async function deployStakingSCs() {
    const [owner, alice] = await ethers.getSigners();

    const SimpleToken = await ethers.getContractFactory("SimpleToken");
    const simpleToken = await SimpleToken.deploy();

    const SimpleNft = await ethers.getContractFactory("SimpleNft");
    const simpleNft = await SimpleNft.deploy();

    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(
      simpleToken.address,
      simpleNft.address
    );

    // set up
    await simpleToken.grantRole(MINTER_ROLE, staking.address);
    await simpleNft.safeMint(alice.address);
    return { simpleToken, simpleNft, staking, owner, alice };
  }

  describe("Staking Nft", function () {
    var TOKEN_ID = 0;
    var TWENTY_FOUR_H = 3600 * 24;
    var AMOUNT_STAKING_TOKENS = ethers.utils.parseEther("10");

    it("Staking SC receives NFT", async function () {
      const { simpleToken, simpleNft, staking, alice } = await loadFixture(
        deployStakingSCs
      );

      await simpleNft
        .connect(alice)
        .functions["safeTransferFrom(address,address,uint256)"](
          alice.address,
          staking.address,
          TOKEN_ID
        );

      expect(await simpleNft.ownerOf(TOKEN_ID)).to.be.equal(staking.address);
      expect((await staking.stakers(TOKEN_ID))[0]).to.be.equal(alice.address);
    });

    it("Claims tokens before 24 hours", async () => {
      const { simpleToken, simpleNft, staking, alice } = await loadFixture(
        deployStakingSCs
      );

      await simpleNft
        .connect(alice)
        .functions["safeTransferFrom(address,address,uint256)"](
          alice.address,
          staking.address,
          TOKEN_ID
        );

      await expect(
        staking.connect(alice).claimTokens(TOKEN_ID)
      ).to.be.rejectedWith("Did not pass 24 hours yet");
    });

    it("Claims tokens after 24 hours", async () => {
      const { simpleToken, simpleNft, staking, alice } = await loadFixture(
        deployStakingSCs
      );

      await simpleNft
        .connect(alice)
        .functions["safeTransferFrom(address,address,uint256)"](
          alice.address,
          staking.address,
          TOKEN_ID
        );

      await time.increase(TWENTY_FOUR_H);

      await staking.connect(alice).claimTokens(TOKEN_ID);
      expect(await simpleToken.balanceOf(alice.address)).to.be.equal(
        AMOUNT_STAKING_TOKENS
      );
    });

    it("Withdraw NFT from staking SC", async () => {
      const { simpleToken, simpleNft, staking, alice } = await loadFixture(
        deployStakingSCs
      );

      await simpleNft
        .connect(alice)
        .functions["safeTransferFrom(address,address,uint256)"](
          alice.address,
          staking.address,
          TOKEN_ID
        );
      await staking.connect(alice).withdrawNft(TOKEN_ID);

      expect(await simpleNft.ownerOf(TOKEN_ID)).to.be.equal(alice.address);
    });
  });

  describe("NFT Enumerable Primes", () => {
    var MAX_ID = 20;
    async function enumerableSCs() {
      const [owner, alice] = await ethers.getSigners();

      const EnumerableNFT = await ethers.getContractFactory("EnumerableNFT");
      const enumerableNFT = await EnumerableNFT.deploy();

      var idList = Array(MAX_ID)
        .fill(null)
        .map((_, index) => index + 1);

      var promises = idList.map((item) =>
        enumerableNFT.safeMint(owner.address, item)
      );
      await Promise.all(promises);

      const PrimeFinder = await ethers.getContractFactory("PrimeFinder");
      const primeFinder = await PrimeFinder.deploy(enumerableNFT.address);

      return { enumerableNFT, primeFinder, owner, alice };
    }

    it("Verify primer numbers", async () => {
      const { enumerableNFT, primeFinder, owner, alice } = await loadFixture(
        enumerableSCs
      );

      var idList = Array(21)
        .fill(null)
        .map((_, index) => index);

      var promises = idList.map((el) => primeFinder.inversePrimeList(el));
      var res = await Promise.all(promises);

      res.forEach((val, index) => expect(!val).to.be.equal(primes[index]));
    });

    it("User has minted 1 to 20 NFT", async () => {
      const { enumerableNFT, primeFinder, owner, alice } = await loadFixture(
        enumerableSCs
      );
      expect(await enumerableNFT.balanceOf(owner.address)).to.be.equal(MAX_ID);

      var idList = Array(20)
        .fill(null)
        .map((_, index) => index + 1);

      var promises = idList.map(async (el) => {
        expect(await enumerableNFT.ownerOf(el)).to.be.equal(owner.address);
      });

      await Promise.all(promises);
    });

    it("Counting primer numbers", async () => {
      const { enumerableNFT, primeFinder, owner, alice } = await loadFixture(
        enumerableSCs
      );

      var primeCounterTest = primes.filter((el) => el).length;

      expect(await primeFinder.getPrimeCounter(owner.address)).to.be.equal(
        primeCounterTest
      );
    });
  });
});
