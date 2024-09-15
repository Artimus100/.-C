// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CarbonCreditTrading {
    // Carbon credit balance for each user
    mapping(address => uint256) public carbonCredits;
    // Government-defined carbon cap
    mapping(address => uint256) public carbonCap;

    // Event to track the transfer of carbon credits
    event Transfer(address indexed from, address indexed to, uint256 amount);
    
    // Initialize carbon caps for users
    function setCarbonCap(address user, uint256 cap) public {
        carbonCap[user] = cap;
    }

    // Initialize initial carbon production for users
    function setInitialProduction(address user, uint256 production) public {
        carbonCredits[user] = production;
    }

    // Function to transfer carbon credits
    function transferCarbonCredits(address from, address to, uint256 amount, uint256 price) public payable {
        require(carbonCredits[from] >= amount, "Insufficient carbon credits");
        require(msg.value == price, "Incorrect price sent");
        require(carbonCredits[to] + amount <= carbonCap[to], "Receiver will exceed carbon cap");
        
        // Transfer carbon credits
        carbonCredits[from] -= amount;
        carbonCredits[to] += amount;

        // Transfer the funds to the seller
        payable(from).transfer(price);

        emit Transfer(from, to, amount);
    }

    // Helper function to get the carbon credits of a user
    function getCarbonCredits(address user) public view returns (uint256) {
        return carbonCredits[user];
    }

    // Helper function to get the carbon cap of a user
    function getCarbonCap(address user) public view returns (uint256) {
        return carbonCap[user];
    }
}
