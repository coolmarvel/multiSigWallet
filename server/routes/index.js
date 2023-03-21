const router = require("express").Router();

router.get("/", (req, res) => {
  try {
    res.send({ message: "server-client connected" });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

const networkId = "5777";
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

const multiSigWalletJson = require("../../build/wallet/contracts/MultiSigWallet.json");
const multiSigWalletAddress = multiSigWalletJson.networks[networkId].address;
const multiSigWalletABI = multiSigWalletJson.abi;

const multiSigWallet = new web3.eth.Contract(
  multiSigWalletABI,
  multiSigWalletAddress
);

router.post("/balance", async (req, res) => {
  try {
    const { address } = req.body;
    console.log(multiSigWalletAddress);

    const ret = await web3.eth.getBalance(address);
    const balance = await web3.utils.fromWei(ret);

    res.send({ balance });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

router.post("/transfer", async (req, res) => {
  try {
    const { privateKey, amount } = req.body;
    const account = await web3.eth.accounts.wallet.add(privateKey);

    const receipt = await web3.eth.sendTransaction({
      from: account.address,
      to: multiSigWalletAddress,
      gas: 3000000,
      value: web3.utils.toWei(amount, "ether"),
    });

    await web3.eth.accounts.wallet.remove(account.address);

    res.send({ receipt });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

router.post("/transfer/submit", async (req, res) => {
  try {
    const { privateKey, amount } = req.body;

    const owners = await multiSigWallet.methods.getOwners().call();
    const account = await web3.eth.accounts.wallet.add(privateKey);

    if (!owners.includes(account.address)) {
      console.log("isOwner: ", false);
      await web3.eth.accounts.wallet.remove(account.address);
      return res.status(404).send({ message: "You are not owner" });
    }

    const transferABI = multiSigWallet.methods
      .submitTransaction(
        account.address,
        web3.utils.toWei(amount, "ether"),
        "0x0"
      )
      .encodeABI();
    console.log("transferABI: ", transferABI);

    const tx = {
      from: account.address,
      to: multiSigWalletAddress,
      gas: 3000000,
      data: transferABI,
      value: web3.utils.toWei("0", "ether"),
    };
    const rawTx = (await web3.eth.accounts.signTransaction(tx, privateKey))
      .rawTransaction;
    console.log("rawTx: ", rawTx);

    const receipt = await web3.eth.sendSignedTransaction(rawTx);
    console.log("receipt: ", receipt);

    await web3.eth.accounts.wallet.remove(account.address);

    res.send({ receipt });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

router.post("/getCount", async (req, res) => {
  try {
    const count = await multiSigWallet.methods.getTransactionCount().call();

    res.send({ count });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

router.post("/getTransaction", async (req, res) => {
  try {
    const { txIndex } = req.body;

    const transaction = await multiSigWallet.methods
      .getTransaction(txIndex)
      .call();

    res.send({ transaction });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

router.post("/transfer/confirm", async (req, res) => {
  try {
    const { txIndex, privateKey } = req.body;

    const owners = await multiSigWallet.methods.getOwners().call();
    const account = await web3.eth.accounts.wallet.add(privateKey);

    if (!owners.includes(account.address)) {
      console.log("isOwner: ", false);
      await web3.eth.accounts.wallet.remove(account.address);
      return res.status(404).send({ message: "You are not owner" });
    }

    const confirmABI = multiSigWallet.methods
      .confirmTransaction(txIndex)
      .encodeABI();

    const tx = {
      from: account.address,
      to: multiSigWalletAddress,
      gas: 3000000,
      data: confirmABI,
      value: web3.utils.toWei("0", "ether"),
    };
    const rawTx = (await web3.eth.accounts.signTransaction(tx, privateKey))
      .rawTransaction;
    console.log("rawTx: ", rawTx);

    const receipt = await web3.eth.sendSignedTransaction(rawTx);
    console.log("receipt: ", receipt);

    await web3.eth.accounts.wallet.remove(account.address);

    res.send({ receipt });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

router.post("/transfer/execute", async (req, res) => {
  try {
    const { txIndex, privateKey } = req.body;

    const owners = await multiSigWallet.methods.getOwners().call();
    const account = await web3.eth.accounts.wallet.add(privateKey);

    if (!owners.includes(account.address)) {
      console.log("isOwner: ", false);
      await web3.eth.accounts.wallet.remove(account.address);
      return res.status(404).send({ message: "You are not owner" });
    }

    const executeABI = multiSigWallet.methods
      .executeTransaction(txIndex)
      .encodeABI();

    const tx = {
      from: account.address,
      to: multiSigWalletAddress,
      gas: 3000000,
      data: executeABI,
      value: web3.utils.toWei("0", "ether"),
    };
    const rawTx = (await web3.eth.accounts.signTransaction(tx, privateKey))
      .rawTransaction;
    console.log("rawTx: ", rawTx);

    const receipt = await web3.eth.sendSignedTransaction(rawTx);
    console.log("receipt: ", receipt);

    await web3.eth.accounts.wallet.remove(account.address);

    res.send(receipt);
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

router.post("/mpc", async (req, res) => {
  try {
    const wallets = await web3.eth.accounts.wallet.create(2);
    console.log(wallets);
    res.send({ messate: true });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

module.exports = router;
