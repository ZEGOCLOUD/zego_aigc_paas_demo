const express = require('express');
const crypto = require('crypto');

const { appID, serverSecret } = require('./tokens.json')

const app = express();
const port = 3000;


//Signature=md5(AppId + SignatureNonce + ServerSecret + Timestamp)
function GenerateUASignature(appId, signatureNonce, serverSecret, timeStamp) {
  const hash = crypto.createHash('md5'); //规定使用哈希算法中的MD5算法
  const str = appId + signatureNonce + serverSecret + timeStamp;
  hash.update(str);
  //hash.digest('hex')表示输出的格式为16进制
  return hash.digest('hex');
}



app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/token', (req, res) => {
  const signatureNonce = crypto.randomBytes(8).toString('hex');
  //使用你的appId和serverSecret
  const timeStamp = Math.round(Date.now() / 1000);

  res.json({
    signature: GenerateUASignature(appID, signatureNonce, serverSecret, timeStamp),
    // signatureNonce,
    timeStamp,
  })
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});