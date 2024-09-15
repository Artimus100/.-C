
# Decentralized Carbon Credit Marketplace

This project is a decentralized carbon credit marketplace built on Ethereum. It allows users to create, trade, and retire carbon credits. The smart contracts are written in Solidity and deployed locally using Ganache. The frontend interacts with the smart contracts using ethers.js, and an Express.js server is used to provide HTTP endpoints for creating and retiring carbon credits.

## Features

- Mint carbon credits with metadata (origin, certification, environmental impact)
- View carbon credit details
- Retire carbon credits
- Query retired carbon credits for specific addresses
- Locally hosted with Ganache CLI

## Prerequisites

Before starting, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 16.x or higher)
- [npm](https://www.npmjs.com/get-npm) or [yarn](https://yarnpkg.com/)
- [Ganache CLI](https://github.com/trufflesuite/ganache-cli) (for local Ethereum blockchain)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-project-name.git
   cd your-project-name
   ```

2. Install project dependencies:

   ```bash
   npm install
   ```

3. Install Ganache CLI globally if you haven't already:

   ```bash
   npm install -g ganache-cli
   ```

4. Start the Ganache CLI with a specific amount of ETH (10,000 ETH) for testing:

   ```bash
   ganache-cli --accounts 10 --defaultBalanceEther 10000
   ```

   Ganache will run a local Ethereum blockchain at `http://127.0.0.1:8545`.

5. Create a `.env` file in the root of your project and add the following environment variables:

   ```bash
   PRIVATE_KEY=<Your Private Key>
   CONTRACT_ADDRESS=<Deployed Smart Contract Address>
   PORT=3000
   ```

   - Replace `<Your Private Key>` with the private key from one of the Ganache accounts.
   - Replace `<Deployed Smart Contract Address>` with the address of your deployed contract.

## Smart Contract Deployment

1. Compile the smart contract using Truffle, Hardhat, or use Remix IDE for deployment.

2. Deploy the contract locally to the Ganache instance:

   If using Truffle:

   ```bash
   truffle migrate --network development
   ```

   Make sure to update the `.env` file with the deployed contract address.

## Running the Project

1. **Start the Server**:

   To interact with the smart contract, run the Express.js server:

   ```bash
   npm start
   ```

   The server will run at `http://localhost:3000`.

2. **Mint Carbon Credits**:

   You can mint carbon credits by sending a POST request to the `/contract/mint` endpoint.

   Example using `curl`:

   ```bash
   curl -X POST http://localhost:3000/contract/mint    -H "Content-Type: application/json"    -d '{"origin":"Brazil","certificationStandard":"Verra","projectDetails":"Rainforest Protection","environmentalImpact":1000,"amount":10}'
   ```

3. **Retire Carbon Credits**:

   Retire credits by sending a POST request to the `/contract/retire` endpoint.

   Example using `curl`:

   ```bash
   curl -X POST http://localhost:3000/contract/retire    -H "Content-Type: application/json"    -d '{"tokenId":1,"amount":5}'
   ```

4. **View Carbon Credit Details**:

   Use the `/contract/details/:tokenId` endpoint to view details of a specific carbon credit.

   Example using `curl`:

   ```bash
   curl http://localhost:3000/contract/details/1
   ```

## Project Structure

```bash
.
├── .env                    # Environment variables
├── contracts                # Solidity smart contracts
├── src                      # Express server and routes
│   ├── index.js             # Main entry point of the server
│   ├── controllers          # Controllers for handling HTTP requests
├── package.json             # Project dependencies and scripts
├── README.md                # Project documentation
└── ...
```

## Available Scripts

- `npm start` - Start the Express.js server
- `ganache-cli` - Start Ganache CLI with 10,000 ETH

## Testing

1. Use Ganache CLI to deploy the contract and interact locally.
2. Test the endpoints using `curl`, Postman, or a similar tool.

## License

This project is licensed under the MIT License.
