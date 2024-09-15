const path = require("path");

module.exports = {
  contracts_build_directory: path.join(__dirname, "build/contracts"),
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 8000000, // Use this high gas limit
      from: "0x31A29cBFB76ABf438cEe1140bB5F9f30b6C6dD0B",
    },
  },
  compilers: {
    solc: {
      version: "0.8.20",  // Updated to match OpenZeppelin contracts
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    }
  },
  contracts_directory: './contracts',
};
