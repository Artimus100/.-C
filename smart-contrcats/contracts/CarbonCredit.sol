// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract CarbonCreditToken is ERC1155, Ownable {
    using Strings for uint256;

    uint256 private _currentTokenId;
    
    struct CarbonCredit {
        string origin;
        string certificationStandard;
        string projectDetails;
        uint256 environmentalImpact;
        bool retired;
    }

    mapping(uint256 => CarbonCredit) private _carbonCredits;
    mapping(address => mapping(uint256 => uint256)) private _retirements;

    event CarbonCreditCreated(uint256 indexed tokenId, string origin, string certificationStandard, uint256 amount);
    event CarbonCreditRetired(uint256 indexed tokenId, address indexed account, uint256 amount);

    constructor() ERC1155("https://api.example.com/token/{id}.json") Ownable(msg.sender) {
        _currentTokenId = 0;
    }

    function createCarbonCredit(
        string memory origin,
        string memory certificationStandard,
        string memory projectDetails,
        uint256 environmentalImpact,
        uint256 amount
    ) public onlyOwner returns (uint256) {
        _currentTokenId += 1;
        uint256 newTokenId = _currentTokenId;

        _carbonCredits[newTokenId] = CarbonCredit(
            origin,
            certificationStandard,
            projectDetails,
            environmentalImpact,
            false
        );

        _mint(msg.sender, newTokenId, amount, "");

        emit CarbonCreditCreated(newTokenId, origin, certificationStandard, amount);

        return newTokenId;
    }

    function getCarbonCreditDetails(uint256 tokenId) public view returns (CarbonCredit memory) {
        require(_exists(tokenId), "Token does not exist");
        return _carbonCredits[tokenId];
    }

    function retire(uint256 tokenId, uint256 amount) public {
        require(_exists(tokenId), "Token does not exist");
        require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        require(!_carbonCredits[tokenId].retired, "Credit already retired");

        _burn(msg.sender, tokenId, amount);
        _retirements[msg.sender][tokenId] += amount;

        emit CarbonCreditRetired(tokenId, msg.sender, amount);
    }

    function getRetirementAmount(address account, uint256 tokenId) public view returns (uint256) {
        return _retirements[account][tokenId];
    }

    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC1155Metadata: URI query for nonexistent token");
        return string(abi.encodePacked(super.uri(tokenId), tokenId.toString()));
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _carbonCredits[tokenId].environmentalImpact != 0;
    }
}