const CarbonCreditTrading = artifacts.require("CarbonCreditTrading");
const { expectRevert, ether } = require('@openzeppelin/test-helpers');

contract("CarbonCreditTrading", (accounts) => {
  let contract;
  const owner = accounts[0];
  const userA = accounts[1];
  const userB = accounts[2];

  beforeEach(async () => {
    // Deploy the contract before each test
    carbonCreditTrading = await CarbonCreditTrading.deployed();

    contract = await CarbonCreditTrading.new({ from: owner });

    // Set carbon caps for users using the correct account
    await contract.setCarbonCap(userA, 100, { from: owner });  // Set User A's cap
    await contract.setCarbonCap(userB, 100, { from: owner });  // Set User B's cap

    // Set initial carbon production for each user
    await contract.setInitialProduction(userA, 150, { from: owner });  // User A produces 150
    await contract.setInitialProduction(userB, 50, { from: owner });   // User B produces 50
  });
  it("Should set initial carbon caps and production", async () => {
    const userACap = await contract.getCarbonCap(userA);
    const userBCap = await contract.getCarbonCap(userB);
    const userAProduction = await contract.getCarbonCredits(userA);
    const userBProduction = await contract.getCarbonCredits(userB);

    assert.equal(userACap.toNumber(), 100, "User A cap should be 100");
    assert.equal(userBCap.toNumber(), 100, "User B cap should be 100");
    assert.equal(userAProduction.toNumber(), 150, "User A should have 150 credits");
    assert.equal(userBProduction.toNumber(), 50, "User B should have 50 credits");
  });

it("should not allow non-owners to transfer a credit", async function () {
  
});

  it("Should transfer carbon credits from User B to User A", async function () {
    await carbonCreditTrading.setCap(accounts[1], 1000); // Ensure the cap is set correctly
    await carbonCreditTrading.transferCredit(accounts[2], accounts[1], 500, { from: accounts[2] });
    const credits = await carbonCreditTrading.balanceOf(accounts[1]);
    assert.equal(credits.toNumber(), 500, "Transfer failed");
  });
  it("Should fail if transfer exceeds User A's carbon cap", async function () {
    await expectRevert(
      carbonCreditTrading.transferCredit(accounts[2], accounts[1], 2000, { from: accounts[2] }),
      "Receiver will exceed carbon cap"
    );
  });

  it("Should fail if the wrong price is sent", async () => {
    const amountToTransfer = 50;
    const price = ether("1");  // Correct price is 1 ether
    const wrongPrice = ether("0.5");  // Only sending 0.5 ether

    await expectRevert(
      contract.transferCarbonCredits(userB, userA, amountToTransfer, price, {
        from: userB,
        value: wrongPrice,
      }),
      "Incorrect price sent"
    );
  });

  it("Should fail if User B tries to transfer more credits than they own", async () => {
    const amountToTransfer = 60;  // User B only has 50 credits
    const price = ether("1");

    await expectRevert(
      contract.transferCarbonCredits(userB, userA, amountToTransfer, price, {
        from: userB,
        value: price,
      }),
      "Insufficient carbon credits"
    );
  });
});
