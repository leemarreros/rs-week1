require("dotenv").config();
const hre = require("hardhat");

function getRole(role) {
  return hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(role));
}

var MINTER_ROLE = getRole("MINTER_ROLE");
var BURNER_ROLE = getRole("BURNER_ROLE");

async function main() {
  var name = "Mi Primer Token";
  var symbol = "MPRTKN";

  // publicar MiPrimerToken
  var MiPrimerToken = await hre.ethers.getContractFactory("MiPrimerTokenUpgradeable");

  var miPrimerToken = await hre.upgrades.deployProxy(MiPrimerToken, [name, symbol], {
    kind: "upps",
  });

  await miPrimerToken.deployed();

  //publicar AirdropOne
  var AirdroOne = await hre.ethers.getContractFactory("AirdropOneUpgradeable");
  var airdropOne = await hre.upgrades.deployProxy(AirdropOne, [miPrimerToken.address], {
    kind: "upps",
  });
  await airdropOne.deployed();

  await airdropOne.setTokenAddress(miPrimerToken.address);

  // Set up Roles Token => Airdrop
  await miPrimerToken.grantRole(MINTER_ROLE, airdropOne.address);
  await miPrimerToken.grantRole(BURNER_ROLE, airdropOne.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
