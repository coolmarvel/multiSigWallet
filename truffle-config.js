require("dotenv").config();
const { MNEMONIC } = process.env;

const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  contracts_directory: "./contracts",
  contracts_build_directory: "./build/wallet/contracts",

  networks: {
    // 가나슈
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 7545, // Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
    },

    // 이더리움 테스트넷
    goerli: {
      provider: () => new HDWalletProvider(MNEMONIC, ETHEREUM_GOERLI_RPC_URL),
      network_id: 5,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },

    // 이더리움 테스트넷
    sepolia: {
      provider: () => new HDWalletProvider(MNEMONIC, ETHEREUM_SEPOLIA_RPC_URL),
      network_id: 11155111,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },

    // 이더리움 메인넷
    ethereum: {
      provider: () => new HDWalletProvider(MNEMONIC, ETHEREUM_MAINNET_RPC_URL),
      network_id: 1,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },

    // 클레이튼 테스트넷
    baobab: {
      provider: () =>
        new KlaytnWalletProvider(PRIVATE_KEY, KLAYTN_TESTNET_RPC_URL),
      gas: "8500000",
      gasPrice: null,
      network_id: 1001,
    },

    // 클레이튼 메인넷
    klaytn: {
      provider: () =>
        new KlaytnWalletProvider(PRIVATE_KEY, KLAYTN_MAINNET_RPC_URL),
      gas: "8500000",
      gasPrice: null,
      network_id: 8217,
      skipDryRun: true,
      pollingInterval: 1800000,
      disableConfirmationListener: true,
    },

    // 폴리곤 테스트넷
    mumbai: {
      provider: () =>
        new HDWalletProvider(MNEMONIC, POLYGON_TESTNET_RPC_URL_V2),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },

    // 폴리곤 메인넷
    polygon: {
      provider: () => new HDWalletProvider(MNEMONIC, POLYGON_MAINNET_RPC_URL),
      network_id: 137,
      confirmmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.17", // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    },
  },
};
