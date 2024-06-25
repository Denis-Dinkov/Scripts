const {
  Client,
  PrivateKey,
  Hbar,
  ContractCreateFlow,
  FileCreateTransaction,
} = require("@hashgraph/sdk");
require("dotenv").config();

const accId = process.env.MY_ACCOUNT_ID;
const privateKey = process.env.MY_PRIVATE_KEY;
let whbar = require("./WHBAR.json");
const bytecode = whbar.data.bytecode.object;

async function createSmartContract() {
  console.log("asd");
  if (!accId || !privateKey) {
      "Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present"
    );
  }

  const client = Client.forTestnet()
    .setOperator(accId, PrivateKey.fromStringECDSA(privateKey))
    .setDefaultMaxTransactionFee(new Hbar(100))
    .setDefaultMaxQueryPayment(new Hbar(50));

  //Create the transaction
  const contractCreate = new ContractCreateFlow()
    .setGas(200000)
    .setBytecode(bytecode);

  //Sign the transaction with the client operator key and submit to a Hedera network
  const txResponse = contractCreate.execute(client);

  //Get the receipt of the transaction
  const receipt = (await txResponse).getReceipt(client);

  //Get the new contract ID
  const newContractId = (await receipt).contractId;

  console.log("The new contract ID is " + newContractId);
  //SDK Version: v2.11.0-beta.1

  const transaction = await new ContractCreateTransaction()
    .setGas(500)
    .setBytecodeFileId(newContractId)
    .setAdminKey(privateKey);

  console.log(transaction);
}

createSmartContract();
