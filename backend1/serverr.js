require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Load environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Set up provider and wallet
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract ABI (make sure this matches your deployed contract)
const abi = [
    "function createCarbonCredit(string memory origin, string memory certificationStandard, string memory projectDetails, uint256 environmentalImpact, uint256 amount) public returns (uint256)",
    "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) public",
    "function retire(uint256 tokenId, uint256 amount) public",
    "event CarbonCreditCreated(uint256 indexed tokenId, string origin, string certificationStandard, uint256 amount)",
    "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
    "event CarbonCreditRetired(uint256 indexed tokenId, address indexed account, uint256 amount)"
];

// Initialize contract
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

// Helper function for creating carbon credits

// Initialize contract

async function createCarbonCredit(origin, certificationStandard, projectDetails, environmentalImpact) {
    try {
        console.log("Attempting to create carbon credit...");
        console.log("Parameters:", { origin, certificationStandard, projectDetails, environmentalImpact });

        const recipient = wallet.address; // Use the wallet address or another address as the recipient

        // Estimate gas for the mintCredit function
        const gasEstimate = await contract.estimateGas.mintCredit(
            recipient,
            origin,
            certificationStandard,
            projectDetails,
            environmentalImpact
        );
        console.log(`Estimated Gas: ${gasEstimate.toString()}`);

        const tx = await contract.mintCredit(
            recipient,
            origin,
            certificationStandard,
            projectDetails,
            environmentalImpact,
            {
                gasLimit: gasEstimate.toNumber() // Use estimated gas
            }
        );
        console.log("Transaction sent. Waiting for confirmation...");
        const receipt = await tx.wait();

        console.log("Transaction confirmed. Receipt:", receipt);

        if (receipt.logs && receipt.logs.length > 0) {
            for (const log of receipt.logs) {
                try {
                    const parsedLog = contract.interface.parseLog({ data: log.data, topics: log.topics });
                    if (parsedLog.name === "CreditMinted") {
                        console.log("CreditMinted event found:", parsedLog);
                        const tokenId = parsedLog.args.tokenId.toString();
                        console.log(`Carbon credit created with token ID: ${tokenId}`);
                        return tokenId;
                    }
                } catch (parseError) {
                    console.warn("Error parsing log, skipping:", parseError.message);
                }
            }
            console.warn("No CreditMinted event found in the logs.");
        } else {
            console.warn("No logs found in the transaction receipt.");
        }
        
        console.error("Failed to retrieve token ID.");
        return null;
    } catch (error) {
        console.error(`Error creating carbon credit: ${error.message}`);
        console.error("Full error object:", error);
        if (error.transaction) {
            console.error("Transaction details:", error.transaction);
        }
        throw error;
    }
}


// Routes
app.post('/contracts/mint', async (req, res) => {
    const { origin, certificationStandard, projectDetails, environmentalImpact, totalCredits } = req.body;
    
    if (!origin || !certificationStandard || !projectDetails || !environmentalImpact || !totalCredits) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const tokenId = await createCarbonCredit(origin, certificationStandard, projectDetails, environmentalImpact, totalCredits);
        
        if (tokenId) {
            res.status(200).json({ message: "Carbon credit created", tokenId });
        } else {
            res.status(500).json({ error: "Failed to create carbon credit or retrieve token ID" });
        }
    } catch (error) {
        console.error("Error in /contracts/mint:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

app.post('/contracts/transfer', async (req, res) => {
    const { fromAddress, toAddress, tokenId, amount } = req.body;

    if (!fromAddress || !toAddress || !tokenId || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const tx = await contract.safeTransferFrom(fromAddress, toAddress, tokenId, amount, []);
        const receipt = await tx.wait();
        
        const transferEvent = receipt.logs.find(log => {
            try {
                const parsedLog = contract.interface.parseLog({ data: log.data, topics: log.topics });
                return parsedLog.name === "TransferSingle";
            } catch {
                return false;
            }
        });

        if (transferEvent) {
            res.status(200).json({ message: "Carbon credit transferred", transactionHash: receipt.transactionHash });
        } else {
            res.status(500).json({ error: "Transfer event not found in transaction logs" });
        }
    } catch (error) {
        console.error("Error transferring carbon credits:", error);
        res.status(500).json({ error: "Transfer failed", details: error.message });
    }
});

app.post('/contracts/retire', async (req, res) => {
    const { tokenId, amount } = req.body;

    if (!tokenId || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const tx = await contract.retire(tokenId, amount);
        const receipt = await tx.wait();
        
        const retireEvent = receipt.logs.find(log => {
            try {
                const parsedLog = contract.interface.parseLog({ data: log.data, topics: log.topics });
                return parsedLog.name === "CarbonCreditRetired";
            } catch {
                return false;
            }
        });

        if (retireEvent) {
            res.status(200).json({ message: "Carbon credits retired successfully", transactionHash: receipt.transactionHash });
        } else {
            res.status(500).json({ error: "Retirement event not found in transaction logs" });
        }
    } catch (error) {
        console.error("Error retiring carbon credits:", error);
        res.status(500).json({ error: "Failed to retire carbon credits", details: error.message });
    }
});

// Server startup
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Initial setup and connection check
async function main() {
    try {
        const network = await provider.getNetwork();
        console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
        
        const balance = await provider.getBalance(wallet.address);
        console.log(`Wallet balance: ${ethers.formatEther(balance)} ETH`);

        console.log("Server is ready to handle requests.");
    } catch (error) {
        console.error("Failed to initialize the server:", error);
    }
}

main().catch((error) => {
    console.error("Failed to run the script:", error);
});