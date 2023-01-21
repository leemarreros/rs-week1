const { ethers } = require("hardhat");

async function advanceTime(extratime) {
  // se obtiene el timestamp del blocke
  var blockNumBefore = await ethers.provider.getBlockNumber();
  var blockBefore = await ethers.provider.getBlock(blockNumBefore);
  var timestampBefore = blockBefore.timestamp;

  // se instruye al blockchain interno de añadir x segundos
  await network.provider.send("evm_setNextBlockTimestamp", [
    timestampBefore + extratime,
  ]);

  // se mina un nuevo bloque con el nuevo tiempo
  await network.provider.send("evm_mine");
}

var primes = [
  false,
  false,
  false,
  true,
  false,
  true,
  false,
  true,
  false,
  false,
  false,
  true,
  false,
  true,
  false,
  false,
  false,
  true,
  false,
  true,
  false,
];

module.exports = { advanceTime, primes };
