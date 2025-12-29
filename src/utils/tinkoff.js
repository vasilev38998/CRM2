const crypto = require('crypto');

function createTinkoffSignature(params, password) {
  const sortedKeys = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null)
    .sort();

  const values = sortedKeys.map((key) => params[key]);
  const signature = crypto
    .createHash('sha256')
    .update(values.join('') + password)
    .digest('hex');

  return signature;
}

function verifyTinkoffSignature(params, password) {
  const receivedToken = params.Token;
  const data = { ...params };
  delete data.Token;
  const expectedToken = createTinkoffSignature(data, password);
  return receivedToken === expectedToken;
}

module.exports = {
  createTinkoffSignature,
  verifyTinkoffSignature
};
