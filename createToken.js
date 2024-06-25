console.clear();

const {
  Client,
  PrivateKey,
  Hbar,
  TokenCreateTransaction,
  TokenType,
} = require("@hashgraph/sdk");
require("dotenv").config();

async function createToken() {
  const accId = process.env.MY_ACCOUNT_ID;
  const privateKey = process.env.MY_PRIVATE_KEY;
  const supplyKey = PrivateKey.generate();

  if (!accId || !privateKey) {
    throw new Error(
      "Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present"
    );
  }
  const client = Client.forTestnet()
    .setOperator(accId, PrivateKey.fromStringECDSA(privateKey))
    .setDefaultMaxTransactionFee(new Hbar(100))
    .setDefaultMaxQueryPayment(new Hbar(50));

  let tokenCreateTx = new TokenCreateTransaction()
    .setTokenName("Bitcoin")
    .setTokenSymbol("BTC")
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(8)
    .setInitialSupply(999999999999999999999999999)
    .setTreasuryAccountId(accId)
    .setSupplyKey(supplyKey)
    .freezeWith(client);

  const tokenCreateSign = await tokenCreateTx.sign(
    PrivateKey.fromStringECDSA(privateKey)
  );
  const tokenCreateSubmit = await tokenCreateSign.execute(client);
  const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
  const tokenId = tokenCreateRx.tokenId;

  console.log("Created token with ID:" + tokenId);
  process.exit();
}

createToken();
