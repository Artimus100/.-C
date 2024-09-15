require('dotenv').config();
const { ethers } = require('ethers');
const bodyParser = require('body-parser');
const express = require('express');
// Load environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const app = express();
// Set up provider and wallet
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545'); // Ensure Ganache is running here
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
app.use(bodyParser.json());

// Contract ABI
const abi = [
    "function createCarbonCredit(string memory origin, string memory certificationStandard, string memory projectDetails, uint256 environmentalImpact, uint256 amount) public returns (uint256)",
    "function getCarbonCreditDetails(uint256 tokenId) public view returns (string memory origin, string memory certificationStandard, string memory projectDetails, uint256 environmentalImpact, bool retired)",
    "function retire(uint256 tokenId, uint256 amount) public",
    "function getRetirementAmount(address account, uint256 tokenId) public view returns (uint256)",
    "function uri(uint256 tokenId) public view returns (string memory)",
    "event CarbonCreditCreated(uint256 indexed tokenId, string origin, string certificationStandard, uint256 amount)",
    "event CarbonCreditRetired(uint256 indexed tokenId, address indexed account, uint256 amount)"
];

// Initialize contract
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

async function createCarbonCredit(origin, certificationStandard, projectDetails, environmentalImpact, amount) {
    try {
        console.log("Attempting to create carbon credit...");
        console.log("Parameters:", { origin, certificationStandard, projectDetails, environmentalImpact, amount });

        const tx = await contract.createCarbonCredit(origin, certificationStandard, projectDetails, environmentalImpact, amount);
        console.log("Transaction sent. Waiting for confirmation...");
        const receipt = await tx.wait();

        console.log("Transaction confirmed. Receipt:", receipt);

        if (receipt.logs && receipt.logs.length > 0) {
            console.log("Transaction logs:", receipt.logs);
            
            // Update the event signature to match the emitted event
            const eventSignature = ethers.utils.id("CarbonCreditCreated(uint256,string,string,uint256)");

            const event = receipt.logs.find(log => 
                log.topics && log.topics[0] === eventSignature
            );
            
            if (event) {
                console.log("CarbonCreditCreated event found:", event);
                const parsedLog = contract.interface.parseLog(event);
                console.log("Parsed log:", parsedLog);
                const tokenId = parsedLog.args[0].toString();
                console.log(`Carbon credit created with token ID: ${tokenId}`);
                return tokenId;
            } else {
                console.error("No CarbonCreditCreated event found in the logs.");
            }
        } else {
            console.error("No logs found in the transaction receipt.");
        }
        
        return null;
        
    } catch (error) {
        console.error(`Error creating carbon credit: ${error.message}`);
        console.error("Full error object:", error);
        if (error.transaction) {
            console.error("Transaction details:", error.transaction);
        }
        return null;
    }
}

async function getCarbonCreditDetails(tokenId) {
    try {
        const details = await contract.getCarbonCreditDetails(tokenId);
        console.log(`Carbon Credit Details for token ID ${tokenId}:`, details);
    } catch (error) {
        console.error(`Error getting carbon credit details: ${error.message}`);
    }
}

async function retireCarbonCredit(tokenId, amount) {
    try {
        const tx = await contract.retire(tokenId, amount);
        const receipt = await tx.wait();
        console.log(`Carbon credit with token ID ${tokenId} retired. Amount: ${amount}`);
    } catch (error) {
        console.error(`Error retiring carbon credit: ${error.message}`);
    }
}

async function getRetirementAmount(account, tokenId) {
    try {
        const amount = await contract.getRetirementAmount(account, tokenId);
        console.log(`Retirement amount for token ID ${tokenId} and account ${account}: ${amount}`);
    } catch (error) {
        console.error(`Error getting retirement amount: ${error.message}`);
    }
}

async function getTokenURI(tokenId) {
    try {
        const uri = await contract.uri(tokenId);
        console.log(`Token URI for token ID ${tokenId}: ${uri}`);
    } catch (error) {
        console.error(`Error getting token URI: ${error.message}`);
    }
}

async function createHardcodedCarbonCredits() {
    try {
        const origin = 'Brazil';
        const certificationStandard = 'Verra';
        const projectDetails = 'Rainforest Protection';
        const environmentalImpact = 1000;
        const amount = 10; // Amount of carbon credits to mint

        // Call the createCarbonCredit function from the CarbonCredit contract
        const tx = await contract.createCarbonCredit(origin, certificationStandard, projectDetails, environmentalImpact, amount);
        await tx.wait(); // Wait for the transaction to be mined
        console.log(`Carbon credit created with Tx Hash: ${tx.hash}`);
    } catch (error) {
        console.error('Error creating carbon credit:', error);
    }
}

async function main() {
    try {
        const network = await provider.getNetwork();
        if (network.chainId === 1337) {
            console.log("Connected to local Ganache network");
        } else {
            console.log(`Connected to network: ${network.name} (${network.chainId})`);
        }
        
        const balance = await provider.getBalance(wallet.address);
        console.log(`Wallet balance: ${ethers.formatEther(balance)} ETH`);

        const tokenId = await createCarbonCredit("Brazil", "Verra", "Project XYZ", 1000, 10);

        if (tokenId) {
            await getCarbonCreditDetails(tokenId);
            await retireCarbonCredit(tokenId, 5);
            await getRetirementAmount(wallet.address, tokenId);
            await getTokenURI(tokenId);
        } else {
            console.log("Failed to create carbon credit. Skipping subsequent operations.");
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
    await createHardcodedCarbonCredits();
}
app.post('/contract/mint', async (req, res) => {
    const { origin, certificationStandard, projectDetails, environmentalImpact, amount } = req.body;
    
    try {
        const tx = await contract.createCarbonCredit(origin, certificationStandard, projectDetails, environmentalImpact, amount);
        const receipt = await tx.wait();
        res.json({ txHash: tx.hash, receipt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/contract/retire', async (req, res) => {
    const { tokenId, amount } = req.body;
    
    try {
        const tx = await contract.retire(tokenId, amount);
        const receipt = await tx.wait();
        res.json({ txHash: tx.hash, receipt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

main().catch((error) => {
    console.error("Failed to run the script:", error);
});
