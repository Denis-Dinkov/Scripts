console.clear();

const {
  Client,
  PrivateKey,
  Hbar,
  TokenAssociateTransaction,
  TransferTransaction,
} = require("@hashgraph/sdk");
require("dotenv").config();
const axios = require("axios");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});
const accId = process.env.MY_ACCOUNT_ID;
const privateKey = process.env.MY_PRIVATE_KEY;

const askQuestion = (question) =>
  new Promise((resolve) => {
    readline.question(question, (answer) => {
      resolve(answer);
    });
  });

async function transferToken() {
  const tokenId = await askQuestion("What is your tokenId? ");
  let isAssociated = false;
  const associateAccountId = await askQuestion(
    "What is the ECDSA account ID to associate? "
  );

  const associatePrivateKey = await askQuestion(
    "What is the ECDSA private key of the account to associate? "
  );

  if (!tokenId || !associateAccountId || !associatePrivateKey) {
    throw new Error("Please provide all the required information");
  }

  if (!accId || !privateKey) {
    throw new Error(
      "Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present"
    );
  }

  const client = Client.forTestnet()
    .setOperator(accId, PrivateKey.fromStringECDSA(privateKey))
    .setDefaultMaxTransactionFee(new Hbar(100))
    .setDefaultMaxQueryPayment(new Hbar(50));

  const getAccountInfo = await axios.get(
    `https://testnet.mirrornode.hedera.com/api/v1/accounts/${associateAccountId}/tokens`
  );
  const accountTokens = getAccountInfo.data.tokens;

  accountTokens.forEach(async (token) => {
    if (token.token_id === tokenId) {
      isAssociated = true;
    }
  });

  // Associate a token to an account and freeze the unsigned transaction for signing
  if (!isAssociated) {
    const transaction = await new TokenAssociateTransaction()
      .setAccountId(associateAccountId)
      .setTokenIds([tokenId])
      .freezeWith(client);

    //Sign with the private key of the account that is being associated to a token
    const signTx = await transaction.sign(
      PrivateKey.fromStringECDSA(associatePrivateKey)
    );

    //Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log(
      "The transaction association status " + transactionStatus.toString()
    );
  }

  let tokenTransferTx = await new TransferTransaction()
    .addTokenTransfer(tokenId, accId, -5)
    .addTokenTransfer(tokenId, associateAccountId, 5)
    .freezeWith(client)
    .sign(PrivateKey.fromStringECDSA(privateKey));

  let tokenTransferSubmit = await tokenTransferTx.execute(client);

  //GET THE RECEIPT OF THE TRANSACTION
  let tokenTransferRx = await tokenTransferSubmit.getReceipt(client);

  //LOG THE TRANSACTION STATUS
  console.log(
    `\n- Bitcoin transfer from Treasury to ${associateAccountId}: ${tokenTransferRx.status} \n`
  );

  readline.close();
  return;
}

transferToken();
