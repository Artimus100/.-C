const CarbonCreditToken = artifacts.require("CarbonCreditToken");
const truffleAssert = require('truffle-assertions');

contract("CarbonCreditToken", (accounts) => {
  let carbonCreditToken;
  const owner = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];

  beforeEach(async () => {
    carbonCreditToken = await CarbonCreditToken.new({ from: owner });
  });

  describe("Carbon Credit Creation", () => {
    it("should create a carbon credit", async () => {
      const result = await carbonCreditToken.createCarbonCredit(
        "Forest Project", 
        "Verra", 
        "Reforestation in Amazon", 
        1000, 
        100, 
        { from: owner }
      );

      truffleAssert.eventEmitted(result, 'CarbonCreditCreated', (ev) => {
        return ev.tokenId.toNumber() === 1 && 
               ev.origin === "Forest Project" && 
               ev.certificationStandard === "Verra";
      });

      const creditDetails = await carbonCreditToken.getCarbonCreditDetails(1);
      assert.equal(creditDetails.origin, "Forest Project", "Origin doesn't match");
      assert.equal(creditDetails.certificationStandard, "Verra", "Certification standard doesn't match");
      assert.equal(creditDetails.projectDetails, "Reforestation in Amazon", "Project details don't match");
      assert.equal(creditDetails.environmentalImpact, 1000, "Environmental impact doesn't match");
      assert.equal(creditDetails.retired, false, "Credit should not be retired");
    });

    it("should not allow non-owners to create carbon credits", async () => {
      await truffleAssert.reverts(
        carbonCreditToken.createCarbonCredit("Forest Project", "Verra", "Reforestation in Amazon", 1000, 100, { from: user1 }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Carbon Credit Retirement", () => {
    beforeEach(async () => {
      await carbonCreditToken.createCarbonCredit("Forest Project", "Verra", "Reforestation in Amazon", 1000, 100, { from: owner });
      await carbonCreditToken.safeTransferFrom(owner, user1, 1, 50, "0x", { from: owner });
    });

    it("should allow users to retire carbon credits", async () => {
      const result = await carbonCreditToken.retire(1, 25, { from: user1 });

      truffleAssert.eventEmitted(result, 'CarbonCreditRetired', (ev) => {
        return ev.tokenId.toNumber() === 1 && 
               ev.account === user1 && 
               ev.amount.toNumber() === 25;
      });

      const balance = await carbonCreditToken.balanceOf(user1, 1);
      assert.equal(balance.toNumber(), 25, "Balance should be reduced after retirement");

      const retirementAmount = await carbonCreditToken.getRetirementAmount(user1, 1);
      assert.equal(retirementAmount.toNumber(), 25, "Retirement amount should be recorded");
    });

    it("should not allow users to retire more credits than they own", async () => {
      await truffleAssert.reverts(
        carbonCreditToken.retire(1, 51, { from: user1 }),
        "Insufficient balance"
      );
    });
  });

  describe("Token URI", () => {
    it("should return the correct token URI", async () => {
      await carbonCreditToken.createCarbonCredit("Forest Project", "Verra", "Reforestation in Amazon", 1000, 100, { from: owner });
      
      const uri = await carbonCreditToken.uri(1);
      assert.equal(uri, "https://api.example.com/token/{id}.json1", "URI doesn't match expected format");
    });

    it("should revert for non-existent tokens", async () => {
      await truffleAssert.reverts(
        carbonCreditToken.uri(999),
        "ERC1155Metadata: URI query for nonexistent token"
      );
    });
  });
});