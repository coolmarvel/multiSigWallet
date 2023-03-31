const { createHash } = require("crypto");
const { toBigIntBE } = require("bigint-buffer");

/**
 * Pedersen commitment of two points
 * @param {Buffer} p1 - First point
 * @param {Buffer} p2 - Second point
 * @returns {Buffer} - Pedersen commitment of the two points
 */
function pedersenCommit(p1, p2) {
  const h1 = createHash("sha256").update(p1).digest();
  const h2 = createHash("sha256").update(p2).digest();
  const h1n = toBigIntBE(h1);
  const h2n = toBigIntBE(h2);
  const r = BigInt(
    "7237005577332262213973186563042994240857116359379907606001950938285454250989"
  ); // order of the curve
  const c = (h1n + h2n) % r;
  const cbuf = Buffer.from(c.toString(16), "hex");
  const h3 = createHash("sha256").update(cbuf).digest();
  return Buffer.concat([h1, h2, h3]);
}

/**
 * Hashes an array of ECDSA points
 * @param {Buffer[]} points - Array of ECDSA points
 * @returns {Buffer} - Hash of the points
 */
function hashPoints(points) {
  const hash = createHash("sha256");
  for (let i = 0; i < points.length; i++) {
    hash.update(points[i]);
  }
  return hash.digest();
}

module.exports = { pedersenCommit, hashPoints };
