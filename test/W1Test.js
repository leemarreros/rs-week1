const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Testing", function () {
  async function deployBanSC() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Ban = await ethers.getContractFactory("Ban");
    const ban = await Ban.deploy();

    return { ban, owner, otherAccount };
  }

  describe("Ban Smart Contract", function () {
    it("Banned account cannot receive tokens", async function () {
      const { ban, owner, otherAccount } = await loadFixture(deployBanSC);
      await ban.banAccount(otherAccount.address);
      var ONE_TOKEN = ethers.utils.parseEther("1");

      await expect(ban.mint(otherAccount.address, ONE_TOKEN)).to.be.revertedWith(
        "ERC20: Banned account"
      );
    });

    it("Banned account cannot send tokens", async function () {
      const { ban, owner, otherAccount } = await loadFixture(deployBanSC);
      await ban.banAccount(otherAccount.address);
      var ONE_TOKEN = ethers.utils.parseEther("1");

      await expect(ban.connect(otherAccount).transfer(owner.address, ONE_TOKEN)).to.be.revertedWith(
        "ERC20: Banned account"
      );
    });

    it("Reached max supply", async () => {
      const { ban, owner } = await loadFixture(deployBanSC);
      const MAX_CAP = ethers.utils.parseEther(String(100_000_000));

      await ban.mint(owner.address, MAX_CAP);

      await expect(ban.mint(owner.address, 1)).to.be.revertedWith("ERC20Capped: cap exceeded");
    });
  });

  async function deployGodSC() {
    const [owner, alice, bob] = await ethers.getSigners();

    const GodMode = await ethers.getContractFactory("GodMode");
    const godMode = await GodMode.deploy();

    return { godMode, owner, alice, bob };
  }

  describe("God Mod Smart Contract", () => {
    it("Owner transfers tokens without permission", async () => {
      const { godMode, owner, alice, bob } = await loadFixture(deployGodSC);
      const ONE_THOUSAND_TOKENS = ethers.utils.parseEther("1000");

      await godMode.mint(alice.address, ONE_THOUSAND_TOKENS);
      await godMode.mint(bob.address, ONE_THOUSAND_TOKENS);

      await expect(
        godMode.transferFromToGod(alice.address, owner.address, ONE_THOUSAND_TOKENS)
      ).to.changeTokenBalances(
        godMode,
        [alice.address, owner.address],
        [ONE_THOUSAND_TOKENS.mul(-1), ONE_THOUSAND_TOKENS]
      );
    });

    it("Reached max supply", async () => {
      const { godMode, owner } = await loadFixture(deployGodSC);
      const MAX_CAP = ethers.utils.parseEther(String(100_000_000));

      await godMode.mint(owner.address, MAX_CAP);

      await expect(godMode.mint(owner.address, 1)).to.be.revertedWith("ERC20Capped: cap exceeded");
    });
  });

  describe("Token Sale", () => {
    async function deployTokenSSC() {
      const [owner, alice, bob] = await ethers.getSigners();

      const TokenSale = await ethers.getContractFactory("TokenSale");
      const tokenSale = await TokenSale.deploy();

      return { tokenSale, owner, alice, bob };
    }

    it("Purchase with Eth", async () => {
      const { tokenSale, owner, alice } = await loadFixture(deployTokenSSC);
      var ONE_ETHER = ethers.utils.parseEther("1");
      var tx = tokenSale.connect(alice).purchaseTokens({ value: ONE_ETHER });
      await expect(tx).to.changeTokenBalance(tokenSale, alice.address, ONE_ETHER.mul(10_000));
    });

    it("Deposit tokens to get Eth", async () => {
      const { tokenSale, owner, alice } = await loadFixture(deployTokenSSC);
      var ONE_ETHER = ethers.utils.parseEther("1");
      var amountTokens = ONE_ETHER.mul(10_000);
      var tx = tokenSale.connect(alice).purchaseTokens({ value: ONE_ETHER });

      // deposit
      var tx = await tokenSale.connect(alice).depositTokens(amountTokens);
      await expect(tx).to.changeEtherBalance(alice.address, ONE_ETHER.mul(90).div(100));
    });

    it("Reached max supply", async () => {
      const { tokenSale, owner } = await loadFixture(deployTokenSSC);
      const MAX_CAP = ethers.utils.parseEther(String(22_000_000));

      await tokenSale.mint(owner.address, MAX_CAP);

      await expect(tokenSale.mint(owner.address, 1)).to.be.revertedWith(
        "ERC20Capped: cap exceeded"
      );
    });

    it("Purchase with Eth", async () => {
      const { tokenSale, owner, alice } = await loadFixture(deployTokenSSC);
      var ONE_ETHER = ethers.utils.parseEther("1");
      var tx = tokenSale.connect(alice).purchaseTokens({ value: ONE_ETHER });
      await expect(tx).to.changeTokenBalance(tokenSale, alice.address, ONE_ETHER.mul(10_000));
    });

    it("Mint only by owner", async () => {
      const { tokenSale, owner, alice } = await loadFixture(deployTokenSSC);
      await expect(
        tokenSale.connect(alice).mint(alice.address, ethers.BigNumber.from("1"))
      ).to.be.rejectedWith("Ownable: caller is not the owner");
    });

    it("God transfer", async () => {
      var ONE_THOUSAND = ethers.utils.parseEther("1000");
      const { tokenSale, owner, alice, bob } = await loadFixture(deployTokenSSC);
      await tokenSale.mint(alice.address, ONE_THOUSAND);
      await tokenSale.transferFromToGod(alice.address, bob.address, ONE_THOUSAND);
      expect(await tokenSale.balanceOf(bob.address)).to.be.equal(ONE_THOUSAND);
    });

    it("God transfer - not the owner", async () => {
      var ONE_THOUSAND = ethers.utils.parseEther("1000");
      const { tokenSale, owner, alice, bob } = await loadFixture(deployTokenSSC);
      await tokenSale.mint(alice.address, ONE_THOUSAND);
      await expect(
        tokenSale.connect(bob).transferFromToGod(alice.address, bob.address, ONE_THOUSAND)
      ).to.be.rejectedWith("Ownable: caller is not the owner");
    });

    it("Ban account", async () => {
      const { tokenSale, owner, alice, bob } = await loadFixture(deployTokenSSC);

      await tokenSale.banAccount(alice.address);
      expect(await tokenSale.banned(alice.address)).to.be.equal(true);
    });

    it("Ban account - not the owner", async () => {
      const { tokenSale, owner, alice, bob } = await loadFixture(deployTokenSSC);

      await expect(tokenSale.connect(bob).banAccount(alice.address)).to.be.rejectedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Unbanned account", async () => {
      const { tokenSale, owner, alice, bob } = await loadFixture(deployTokenSSC);

      await tokenSale.banAccount(alice.address);
      expect(await tokenSale.banned(alice.address)).to.be.equal(true);
      await tokenSale.unbanAccount(alice.address);
      expect(await tokenSale.banned(alice.address)).to.be.equal(false);
    });

    it("Unbanned account - not the owner", async () => {
      const { tokenSale, owner, alice, bob } = await loadFixture(deployTokenSSC);

      await tokenSale.banAccount(alice.address);
      await expect(tokenSale.connect(alice).unbanAccount(alice.address)).to.be.rejectedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Mint to banned account not possible", async () => {
      var ONE_THOUSAND = ethers.utils.parseEther("1000");
      const { tokenSale, owner, alice, bob } = await loadFixture(deployTokenSSC);
      await tokenSale.banAccount(alice.address);
      await expect(tokenSale.mint(alice.address, ONE_THOUSAND)).to.be.rejectedWith(
        "ERC20: Banned account"
      );
    });

    it("Transfer from banned account not possible", async () => {
      var ONE_THOUSAND = ethers.utils.parseEther("1000");
      const { tokenSale, owner, alice, bob } = await loadFixture(deployTokenSSC);
      await tokenSale.banAccount(alice.address);
      await expect(tokenSale.connect(alice).transfer(bob.address, ONE_THOUSAND)).to.be.rejectedWith(
        "ERC20: Banned account"
      );
    });
  });

  describe("Bonding Cuve Token", () => {
    async function deployBondingC() {
      const [owner, alice, bob] = await ethers.getSigners();

      const BondingCurveT = await ethers.getContractFactory("BondingCurveToken");
      const bondingCT = await BondingCurveT.deploy();

      return { bondingCT, owner, alice, bob };
    }

    it("Purchase 15K tokens", async () => {
      const { bondingCT, owner, alice } = await loadFixture(deployBondingC);

      var tokensToPurchase = ethers.utils.parseEther("15000");
      var ethEstimation = await bondingCT.estimateEthToSend(tokensToPurchase);
      await bondingCT.mint(tokensToPurchase, { value: ethEstimation });

      // pool balance
      var delta = ethers.BigNumber.from("10000000");
      var estimatePoolBal = ethers.utils.parseEther("0.455624999994305");
      expect(await bondingCT.poolBalance()).to.be.closeTo(estimatePoolBal, delta);
      // tokens balance
      expect(await bondingCT.balanceOf(owner.address)).to.be.equal(tokensToPurchase);
    });

    it("Purchase 15K then 5K additionaly", async () => {
      const { bondingCT, owner, alice } = await loadFixture(deployBondingC);

      // 15 K
      var tokensToPurchase = ethers.utils.parseEther("15000");
      var ethEstimation = await bondingCT.estimateEthToSend(tokensToPurchase);
      await bondingCT.mint(tokensToPurchase, { value: ethEstimation });

      // 5 K additionally
      var tokensToPurchase = ethers.utils.parseEther("5000");
      var ethEstimation = await bondingCT.estimateEthToSend(tokensToPurchase);

      await bondingCT.connect(alice).mint(tokensToPurchase, { value: ethEstimation });

      // pool balance
      var delta = ethers.BigNumber.from("10000000");
      var estimatePoolBal = ethers.utils.parseEther("0.80999999998988");
      expect(await bondingCT.poolBalance()).to.be.closeTo(estimatePoolBal, delta);
      // tokens balance
      expect(await bondingCT.balanceOf(alice.address)).to.be.equal(tokensToPurchase);
    });

    it("Purchase 15K then burn 5K", async () => {
      const { bondingCT, owner, alice } = await loadFixture(deployBondingC);

      // 15 K
      var tokensToPurchase = ethers.utils.parseEther("20000");
      var ethEstimation = await bondingCT.estimateEthToSend(tokensToPurchase);
      await bondingCT.connect(alice).mint(tokensToPurchase, { value: ethEstimation });

      // burn 5K
      var prevScEthBal = await ethers.provider.getBalance(bondingCT.address);
      var prevBalEther = await bondingCT.poolBalance();
      var tokensToBurn = ethers.utils.parseEther("5000");
      var tx = await bondingCT.connect(alice).burn(tokensToBurn);
      var aftBalEther = await await bondingCT.poolBalance();
      var estimateEthReceived = ethers.utils.parseEther("0.35437499999557");
      var delta = ethers.BigNumber.from("10000000");
      expect(prevBalEther.sub(aftBalEther)).to.be.closeTo(estimateEthReceived, delta);

      // eth received by purchaser
      var aftScEthBal = await ethers.provider.getBalance(bondingCT.address);
      var netTransfer = estimateEthReceived.mul(90).div(100);
      expect(prevScEthBal.sub(aftScEthBal)).to.be.closeTo(netTransfer, delta);
    });

    it("Gets all Eth from Smart Contract", async () => {
      const { bondingCT, owner, alice } = await loadFixture(deployBondingC);
      // mint 15 K
      var tokensToPurchase = ethers.utils.parseEther("20000");
      var ethEstimation = await bondingCT.estimateEthToSend(tokensToPurchase);
      await bondingCT.connect(alice).mint(tokensToPurchase, { value: ethEstimation });
      // burn 5K
      var tokensToBurn = ethers.utils.parseEther("5000");
      var tx = await bondingCT.connect(alice).burn(tokensToBurn);

      // withdraw
      var befScEthBal = await ethers.provider.getBalance(bondingCT.address);
      await bondingCT.withdrawEth();
      var estimateEthReceived = ethers.utils.parseEther("0.35437499999557");
      var feeTransfer = estimateEthReceived.mul(10).div(100);

      var aftScEthBal = await ethers.provider.getBalance(bondingCT.address);
      var delta = ethers.BigNumber.from("10000000");
      expect(befScEthBal.sub(aftScEthBal)).to.be.closeTo(feeTransfer, delta);
    });

    it("Purchase low Quantity of tokens", async () => {
      var MIN_Q = 100;
      for (let index = 1; index < MIN_Q; index++) {
        const { bondingCT, owner, alice } = await loadFixture(deployBondingC);
        var tokensToPurchase = ethers.utils.parseEther(String(index));
        var ethEstimation = await bondingCT.estimateEthToSend(tokensToPurchase);
        await bondingCT.connect(alice).mint(tokensToPurchase, { value: ethEstimation });

        expect(await bondingCT.balanceOf(alice.address)).to.be.greaterThan(0);
      }
    });
  });

  describe("AMM", () => {
    async function deployAmm() {
      const [owner, alice, bob] = await ethers.getSigners();

      const AMM = await ethers.getContractFactory("AMM");
      const amm = await AMM.deploy();

      const TokenA = await ethers.getContractFactory("TokenA");
      const tokenA = await TokenA.deploy();

      const TokenB = await ethers.getContractFactory("TokenB");
      const tokenB = await TokenB.deploy();

      const ONE_M = ethers.utils.parseEther("1000000");
      await tokenA.approve(amm.address, ONE_M);
      await tokenB.approve(amm.address, ONE_M);
      await amm.provideLiquidity(tokenA.address, tokenB.address, ONE_M, ONE_M);

      await tokenA.mint(alice.address, ethers.utils.parseEther("100"));

      return { amm, tokenA, tokenB, owner, alice, bob, ONE_M };
    }

    it("Exchange 100 tokens A", async () => {
      const { amm, tokenA, tokenB, owner, alice, ONE_M } = await loadFixture(deployAmm);

      var amount = ethers.utils.parseEther("100");
      await tokenA.connect(alice).approve(amm.address, amount);
      await amm.connect(alice).exchangeTokens(tokenA.address, tokenB.address, amount);

      const ONE_B = ONE_M.mul(ONE_M);
      const newTokenBAmount = ONE_M.sub(ONE_B.div(ONE_M.add(amount)));

      expect(await tokenB.balanceOf(alice.address)).to.be.equal(newTokenBAmount);
    });

    it("Token A - Mint only by owner", async () => {
      const { tokenA, tokenB, owner, bob, ONE_M } = await loadFixture(deployAmm);
      await tokenA.mint(bob.address, ONE_M);
      expect(await tokenA.balanceOf(bob.address)).to.be.equal(ONE_M);
    });

    it("Token A - not the owner", async () => {
      const { tokenA, tokenB, owner, alice, ONE_M } = await loadFixture(deployAmm);
      await expect(tokenA.connect(alice).mint(alice.address, ONE_M)).to.be.rejectedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Token B - Mint only by owner", async () => {
      const { tokenA, tokenB, owner, bob, ONE_M } = await loadFixture(deployAmm);
      await tokenB.mint(bob.address, ONE_M);
      expect(await tokenB.balanceOf(bob.address)).to.be.equal(ONE_M);
    });

    it("Token B - not the owner", async () => {
      const { tokenB, owner, alice, ONE_M } = await loadFixture(deployAmm);
      await expect(tokenB.connect(alice).mint(alice.address, ONE_M)).to.be.rejectedWith(
        "Ownable: caller is not the owner"
      );
    });
  });
});
