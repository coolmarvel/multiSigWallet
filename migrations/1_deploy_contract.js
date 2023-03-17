const MultiSigWallet = artifacts.require("MultiSigWallet");

module.exports = async (deployer) => {
  try {
    // 2 of 3 multisig
    await deployer.deploy(
      MultiSigWallet,
      [
        "0xe13cC349980d8f73929ec71Ea9B8d75f5b1B57BA",
        "0xC06Ee9Cd426EC35C12E9629D69515a350b3B6a71",
        "0x4B94a131fDaBE47Bf4DB71c4Bf8D0062934F56E5",
      ],
      2
    );
  } catch (error) {
    console.error(error);
  }
};
