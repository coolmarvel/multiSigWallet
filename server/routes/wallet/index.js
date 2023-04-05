const router = require("express").Router();

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

const bip39 = require("bip39");
const crypto = require("crypto");
const { randomBytes } = require("crypto");
const { split, combine } = require("shamirs-secret-sharing");
const util = require("ethereumjs-util");

router.post("/", async (req, res) => {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const secret = randomBytes(16);
    console.log("secret: ", secret);

    const buffer = Buffer.from(secret, "hex");
    console.log("buffer: ", buffer);

    const shares = split(secret, { shares: 2, threshold: 2 });
    console.log("shares: ", shares);

    const hexs = shares.map((v) => v.toString("hex"));
    console.log("hexs: ", hexs);

    const buffers = hexs.map((v) => Buffer.from(v, "hex"));
    console.log("buffers: ", buffers);

    const origin = combine(buffers);
    console.log("origin: ", origin.toString());

    // // RSA 키 생성
    // const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    //   modulusLength: 2048,
    // });
    // console.log("publicKey: ", publicKey);
    // console.log("privateKey: ", privateKey);

    // // 서명 생성
    // const message = "Hello, world!";
    // const sign = crypto.sign("sha256", Buffer.from(message), privateKey);

    // // 서명을 분할
    // const pieces = split(sign, { shares: 5, threshold: 3 });
    // console.log("pieces: ", pieces);

    // // 분할된 조각 중 일부만 선택
    // const selected = pieces.slice(0, 3);
    // console.log("selected: ", selected);

    // // 선택된 조각들을 결합하여 복원
    // const combined = combine(selected);

    // // 복원된 서명 검증
    // const verify = crypto.verify(
    //   "sha256",
    //   Buffer.from(message),
    //   publicKey,
    //   combined
    // );
    // console.log(verify); // true

    res.send({ message: true });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

router.post("/test", async (req, res) => {
  try {
    const { ec: EC } = require("elliptic");
    const ec = new EC("secp256k1");
    const privateKey = web3.utils.sha3("secret");
    console.log("privateKey: ", privateKey);

    const privateKeyBuffer = util.toBuffer(privateKey);
    console.log("privateKeyBuffer: ", privateKeyBuffer);

    const n = 3; // 전체 조각
    const k = 2; // 필요한 조각

    const shares = split(privateKey, { shares: n, threshold: k });
    console.log("shares: ", shares);

    const keys = shares.map((v) => ec.keyFromPrivate(v));
    console.log("keys: ", keys);

    const message = "hello world";
    const hash = crypto.createHash("sha256").update(message).digest();
    console.log("hash: ", hash);

    const signatures = [];
    for (let i = 0; i < k; i++) {
      const signature = keys[i].sign(hash);
      const { r, s } = signature;
      const v = keys[i].getPublic().encode("hex").slice(0, 2) === "04" ? 0 : 1;
      const result = { r, s, v };

      signatures.push(result);
    }
    console.log("signatures: ", signatures);

    const vrs = signatures.map((v) => [v.v, v.r, v.s]);
    console.log("vrs: ", vrs);

    const v = 27;
    const rs = vrs.map(([v, r, s]) => [r, s]);
    const recoveredPublicKeys = rs.map(([r, s]) =>
      util.ecrecover(util.hashPersonalMessage(util.toBuffer(hash)), v, r, s)
    );
    console.log("recoveredPublicKeys: ", recoveredPublicKeys);

    res.send({ message: true });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

module.exports = router;
