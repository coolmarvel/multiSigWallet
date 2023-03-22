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

router.post("/shamir", async (req, res) => {
  try {
    const { hdkey } = require("ethereumjs-wallet");
    const { split, join } = require("shamir");
    const { randomBytes } = require("crypto");
    const bip39 = require("bip39");

    const PARTS = 10; // 5등분 했을 때
    const QUORUM = 3; // 3개 이상의 값이 있어야 복원 가능

    const mnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const root = hdkey.fromMasterSeed(seed);
    const wallet = root.derivePath("m/44'/60'/0'/0/0").getWallet();

    const privateKey = wallet.getPrivateKeyString();
    console.log("mnemonic: ", mnemonic);
    console.log("privateKey: ", privateKey);

    // you can use any polyfill to covert string to Uint8Array
    const utf8Encoder = new TextEncoder();
    const utf8Decoder = new TextDecoder();
    const secretBytes = utf8Encoder.encode(privateKey);

    // parts is a object whos keys are the part number and values are an Uint8Array
    const parts = split(randomBytes, PARTS, QUORUM, secretBytes);
    console.log("parts: ", parts);

    function toHexString(byteArray) {
      return Array.prototype.map
        .call(byteArray, function (byte) {
          return ("0" + (byte & 0xff).toString(16)).slice(-2);
        })
        .join("");
    }

    const result = [];
    for (const key in parts) {
      result.push(toHexString(parts[key]));
    }

    // we only need QUORUM of the parts to recover the secret
    delete parts[1];
    delete parts[5];

    // recoverd is an Uint8Array
    const recoverd = join(parts);

    // prints 'hello there'
    console.log("origin: ", utf8Decoder.decode(recoverd));

    res.send({ result, privateKey, origin: utf8Decoder.decode(recoverd) });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

router.post("/sss", async (req, res) => {
  try {
    const { hdkey } = require("ethereumjs-wallet");
    const sss = require("shamirs-secret-sharing");
    const bip39 = require("bip39");

    const mnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const root = hdkey.fromMasterSeed(seed);
    const wallet = root.derivePath("m/44'/60'/0'/0/0").getWallet();

    const privateKey = wallet.getPrivateKeyString();
    console.log("mnemonic: ", mnemonic);
    console.log("privateKey: ", privateKey);

    const secret = Buffer.from(privateKey);
    console.log("secret: ", secret);

    const shares = sss.split(privateKey, { shares: 5, threshold: 3 });
    console.log("shares: ", shares);

    const test = [];
    test.push(shares[0]);
    test.push(shares[1]);
    test.push(shares[2]);

    const recoverd = sss.combine(test);
    console.log("recoverd: ", recoverd);

    const origin = recoverd.toString();
    console.log("origin: ", origin);

    res.send({ message: true });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

router.post("/mpc", async (req, res) => {
  try {
    const { string } = req.body;

    const { join } = require("shamir");

    const utf8Decoder = new TextDecoder();

    function toByteArray(hexString) {
      var result = [];
      for (var i = 0; i < hexString.length; i += 2) {
        result.push(parseInt(hexString.substr(i, 2), 16));
      }
      return result;
    }

    const parse = {};
    for (let i = 0; i < string.length; i++) {
      parse[i + 1] = new Uint8Array(toByteArray(string[i]));
    }
    console.log("parse: ", parse);

    // recoverd is an Uint8Array
    const recoverd = join(parse);

    // prints 'hello there'
    console.log("origin: ", utf8Decoder.decode(recoverd));

    res.send({ origin: utf8Decoder.decode(recoverd) });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

module.exports = router;
