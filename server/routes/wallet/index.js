const router = require("express").Router();

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

const bip39 = require("bip39");
const crypto = require("crypto");
const { randomBytes } = require("crypto");
const { split, combine } = require("shamirs-secret-sharing");
const { ecsign, toRpcSig, ecrecover, keccak256 } = require("ethereumjs-util");

router.post("/", async (req, res) => {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

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

    // 이더리움 키 생성
    // const privateKey = web3.utils.randomHex(32);
    const privateKey = randomBytes(32);
    console.log("privateKey: ", privateKey);
    // const publicKey = keccak256(privateKey);
    // console.log("publicKey: ", publicKey);

    // 메시지 생성
    const message = "Hello, world!";
    const hash = keccak256(Buffer.from(message));
    console.log("hash: ", hash);

    // 서명 분할
    const m = 3; // 분할된 서명 개수
    const n = 5; // 총 서명 개수
    const secret = Buffer.from(privateKey);
    console.log("secret: ", secret);
    const shares = split(secret, { shares: n, threshold: m });
    console.log("shares: ", shares[0]);
    const pieces = shares.map((share, i) => ({
      i: i + 1,
      sig: ecsign(hash, share),
    }));
    console.log(pieces);

    // 일부 서명 선택
    const selected = pieces.slice(0, m);

    // 선택된 서명으로 서명 결합
    const rs = selected.map(({ sig }) => [sig.r, sig.s]);
    const combined = combine(rs);
    console.log(combined);

    // 서명 검증
    const rpcSig = toRpcSig(combined.v, combined.r, combined.s);
    const recoveredPublicKey = keccak256(rpcSig, hash);
    const verify = publicKey.equals(recoveredPublicKey);
    console.log(verify); // true

    res.send({ message: true });
  } catch (error) {
    console.error(error.message);
    res.status(404).send({ message: error.message });
  }
});

module.exports = router;
