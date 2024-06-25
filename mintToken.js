console.clear();

const {
  Client,
  PrivateKey,
  Hbar,
  TokenCreateTransaction,
  TokenType,
  TokenMintTransaction,
} = require("@hashgraph/sdk");
require("dotenv").config();

async function mintToken() {
  const accId = process.env.MY_ACCOUNT_ID;
  const privateKey = process.env.MY_PRIVATE_KEY;
  const supplyKey =
    "302e020100300506032b65700422042052311ee7e093145618c26831473703e8e01e8dacb31f8f7bf1f1a8eea66745a4";
  const tokenid = "0.0.4470141";

  if (!accId || !privateKey) {
    throw new Error(
      "Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present"
    );
  }
  const client = Client.forTestnet()
    .setOperator(accId, PrivateKey.fromStringECDSA(privateKey))
    .setDefaultMaxTransactionFee(new Hbar(100))
    .setDefaultMaxQueryPayment(new Hbar(50));

  //Mint another 1,000 tokens and freeze the unsigned transaction for manual signing
  const transaction = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setAmount(1000)
    .setMaxTransactionFee(new Hbar(20)) //Use when HBAR is under 10 cents
    .freezeWith(client);

  //Sign with the supply private key of the token
  const signTx = await transaction.sign(supplyKey);

  //Submit the transaction to a Hedera network
  const txResponse = await signTx.execute(client);

  //Request the receipt of the transaction
  const receipt = await txResponse.getReceipt(client);

  //Get the transaction consensus status
  const transactionStatus = receipt.status;

  console.log(
    "The transaction consensus status " + transactionStatus.toString()
  );

  //v2.0.7
}

mintToken();
