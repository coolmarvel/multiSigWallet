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

    const PARTS = 5; // 5등분 했을 때
    const QUORUM = 3; // 3개 이상의 값이 있어야 복원 가능

    const mnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic);
    console.log("seed: ", seed);
    const root = hdkey.fromMasterSeed(seed);
    const wallet = root.derivePath("m/44'/60'/0'/0/0").getWallet();

    const privateKey = wallet.getPrivateKeyString();
    console.log("mnemonic: ", mnemonic);
    console.log("privateKey: ", privateKey);

    const random = randomBytes(32).toString("hex");
    console.log("random: ", random);

    // you can use any polyfill to covert string to Uint8Array
    const utf8Encoder = new TextEncoder();
    const utf8Decoder = new TextDecoder();
    const secretBytes = utf8Encoder.encode(randomBytes(16));
    // const secretBytes = utf8Encoder.encode(mnemonic);
    console.log("secretBytes: ", secretBytes);

    // parts is a object whos keys are the part number and values are an Uint8Array
    const parts = split(randomBytes, PARTS, QUORUM, secretBytes);
    console.log("parts: ", parts);

    const privateKeys = [];
    for (const key in parts) {
      privateKeys.push(`${key}${toHexString(parts[key])}`);
      // privateKeys.push(toHexString(parts[key]));
    }

    // we only need QUORUM of the parts to recover the secret
    delete parts[1];
    delete parts[5];

    // recoverd is an Uint8Array
    const recoverd = utf8Decoder.decode(join(parts));

    // prints 'hello there'
    console.log("origin: ", recoverd);

    res.send({ privateKeys, privateKey, origin: recoverd });
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

    const parse = {};
    for (let i = 0; i < string.length; i++) {
      parse[string[i].slice(0, 1)] = hexToUint8Array(string[i].slice(1, 200));
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

router.post("/bls", async (req, res) => {
  try {
    const loadBLS = require("bls-signatures");
    const BLS = await loadBLS();

    // Creating keys and signatures
    const seed = Uint8Array.from([
      0, 50, 6, 244, 24, 199, 1, 25, 52, 88, 192, 19, 18, 12, 89, 6, 220, 18,
      102, 58, 209, 82, 12, 62, 89, 110, 182, 9, 44, 20, 254, 22,
    ]);

    const sk = BLS.AugSchemeMPL.key_gen(seed);
    const pk = sk.get_g1();

    const message = Uint8Array.from([1, 2, 3, 4, 5]);
    const signature = BLS.AugSchemeMPL.sign(sk, message);

    let ok = BLS.AugSchemeMPL.verify(pk, message, signature);
    console.log("ok: ", ok);

    // Serializing keys and signatures to bytes
    const skBytes = sk.serialize();
    const pkBytes = pk.serialize();
    const signatureBytes = signature.serialize();

    console.log("skBytes: ", BLS.Util.hex_str(skBytes));
    console.log("pkBytes: ", BLS.Util.hex_str(pkBytes));
    console.log("signatureBytes: ", BLS.Util.hex_str(signatureBytes));

    // Loading keys and signatures from bytes
    const skc = BLS.PrivateKey.from_bytes(skBytes, false);
    const pkc = BLS.G1Element.from_bytes(pkBytes);
    const signaturec = BLS.G2Element.from_bytes(signatureBytes);

    // Create aggregate signatures
    // 1. Generate some more private keys
    seed[0] = 1;
    const sk1 = BLS.AugSchemeMPL.key_gen(seed);
    seed[0] = 2;
    const sk2 = BLS.AugSchemeMPL.key_gen(seed);
    const message2 = Uint8Array.from([1, 2, 3, 4, 5, 6, 7]);

    // 2. Generate first sig
    const pk1 = sk1.get_g1();
    const sig1 = BLS.AugSchemeMPL.sign(sk1, message);

    // 3. Generate second sig
    const pk2 = sk2.get_g1();
    const sig2 = BLS.AugSchemeMPL.sign(sk2, message2);

    // 4. Signatures can be non-interactively combined by anyone
    const aggSig = BLS.AugSchemeMPL.aggregate([sig1, sig2]);

    let ok2 = BLS.AugSchemeMPL.aggregate_verify(
      [pk1, pk2],
      [message, message2],
      aggSig
    );
    console.log("ok2: ", ok2);

    // Arbitrary trees of aggregates
    seed[0] = 3;
    const sk3 = BLS.AugSchemeMPL.key_gen(seed);
    const pk3 = sk3.get_g1();
    const message3 = Uint8Array.from([100, 2, 254, 88, 90, 45, 23]);
    const sig3 = BLS.AugSchemeMPL.sign(sk3, message3);

    const aggSigFinal = BLS.AugSchemeMPL.aggregate([aggSig, sig3]);
    let ok3 = BLS.AugSchemeMPL.aggregate_verify(
      [pk1, pk2, pk3],
      [message, message2, message3],
      aggSigFinal
    );
    console.log("ok3: ", ok3);

    // Very fast verification with Proof of Possession cheme
    // 1. If the same message is signed, you can use Proof of Posession (PopScheme) for efficiency
    // 2. A proof of possession MUST be passed around with the PK to ensure security.
    const popSig1 = BLS.PopSchemeMPL.sign(sk1, message);
    const popSig2 = BLS.PopSchemeMPL.sign(sk2, message);
    const popSig3 = BLS.PopSchemeMPL.sign(sk3, message);
    const pop1 = BLS.PopSchemeMPL.pop_prove(sk1);
    const pop2 = BLS.PopSchemeMPL.pop_prove(sk2);
    const pop3 = BLS.PopSchemeMPL.pop_prove(sk3);

    ok = BLS.PopSchemeMPL.pop_verify(pk1, pop1);
    console.log("ok: ", ok); // true
    ok = BLS.PopSchemeMPL.pop_verify(pk2, pop2);
    console.log("ok: ", ok); // true
    ok = BLS.PopSchemeMPL.pop_verify(pk3, pop3);
    console.log("ok: ", ok); // true

    const popSigAgg = BLS.PopSchemeMPL.aggregate([popSig1, popSig2, popSig3]);
    ok = BLS.PopSchemeMPL.fast_aggregate_verify(
      [pk1, pk2, pk3],
      message,
      popSigAgg
    );
    console.log("ok: ", ok); // true

    // 3. Aggregate public key, indistinguishable from a single public key
    const popAggPk = pk1.add(pk2).add(pk3);
    ok = BLS.PopSchemeMPL.verify(popAggPk, message, popSigAgg);
    console.log("ok: ", ok); // true

    // 4. Aggregate private keys
    const aggSk = BLS.PrivateKey.aggregate([sk1, sk2, sk3]);
    ok = BLS.PopSchemeMPL.sign(aggSk, message).equal_to(popSigAgg);
    console.log("ok: ", ok); // true

    // HD keys using EIP-2333
    // 1. You can derive 'child' keys from any key, to create arbitrary trees. 4 byte indeces are used.
    // 2. Hardened (more secure, but no parent pk -> child pk)
    const masterSk = BLS.AugSchemeMPL.key_gen(seed);
    const child = BLS.AugSchemeMPL.derive_child_sk(masterSk, 152);
    const grandChild = BLS.AugSchemeMPL.derive_child_sk(child, 952);

    // Unhardened (less secure, but can go from parent pk -> child pk), BIP32 style
    const masterPk = masterSk.get_g1();
    const childU = BLS.AugSchemeMPL.derive_child_sk_unhardened(masterSk, 22);
    const grandchildU = BLS.AugSchemeMPL.derive_child_sk_unhardened(childU, 0);

    const childUPk = BLS.AugSchemeMPL.derive_child_pk_unhardened(masterPk, 22);
    const grandchildUPk = BLS.AugSchemeMPL.derive_child_pk_unhardened(
      childUPk,
      0
    );

    ok = grandchildUPk.equal_to(grandchildU.get_g1());
    console.log("ok: ", ok); // true

    res.send({ message: true });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

function toHexString(byteArray) {
  return Array.prototype.map
    .call(byteArray, function (byte) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    })
    .join("");
}

function toByteArray(hexString) {
  var result = [];
  for (var i = 0; i < hexString.length; i += 2) {
    result.push(parseInt(hexString.substr(i, 2), 16));
  }
  return result;
}

function uint8ArrayToHex(uint8Array) {
  const maxByteLength = 32;
  const byteLength = Math.min(uint8Array.length, maxByteLength);
  let hexString = "";

  for (let i = 0; i < byteLength; i++) {
    const byte = uint8Array[i];
    const hex = ("0" + byte.toString(16)).slice(-2);
    hexString += hex;
  }

  return hexString;
}

function hexToUint8Array(hexString) {
  if (hexString.length % 2 !== 0) {
    throw new Error("Hex string length must be even");
  }

  const byteLength = hexString.length / 2;
  const uint8Array = new Uint8Array(byteLength);

  for (let i = 0; i < byteLength; i++) {
    const hex = hexString.substr(i * 2, 2);
    const byte = parseInt(hex, 16);

    if (isNaN(byte)) {
      throw new Error(`Invalid hex byte: ${hex}`);
    }

    uint8Array[i] = byte;
  }

  return uint8Array;
}

router.post("/ecdsa", async (req, res) => {
  try {
    const { message, address, privateKey } = req.body;

    const { split, join } = require("shamir");
    const { randomBytes } = require("crypto");

    const PARTS = 5; // 5등분 했을 때
    const QUORUM = 3; // 3개 이상의 값이 있어야 복원 가능

    // you can use any polyfill to covert string to Uint8Array
    const utf8Encoder = new TextEncoder();
    const utf8Decoder = new TextDecoder();
    const secretBytes = utf8Encoder.encode(privateKey);

    // generate signature
    const signature = web3.eth.accounts.sign(message, privateKey).signature;
    console.log("signature: ", signature);
    const sigBytes = utf8Encoder.encode(signature);

    // generate share privateKey
    const shares = split(randomBytes, PARTS, QUORUM, secretBytes);
    console.log("shares: ", shares);

    // generate share signature
    const sigShares = split(randomBytes, PARTS, QUORUM, sigBytes);
    console.log("sigShares: ", sigShares);

    delete sigShares[1];
    delete sigShares[5];
    console.log("sigShares: ", sigShares);

    // origin signature
    const sigOrigin = utf8Decoder.decode(join(sigShares));
    console.log("sigOrigin: ", sigOrigin);

    res.send({ message: true });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

module.exports = router;
