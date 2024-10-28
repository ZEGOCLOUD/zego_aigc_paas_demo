const express = require('express');
const crypto = require('crypto');
const cors = require('cors'); // 引入 cors 中间件
const { generateToken04 } = require('./zegoServerAssistant.js')
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

// 使用 cors 中间件
app.use(cors());

// 使用 express.json() 中间件来解析 JSON 请求体
app.use(express.json());

// 自定义中间件，用于记录请求日志和请求参数
app.use((req, res, next) => {
  console.log(`Request ${req.method}:${req.url}`);

  // 继续处理请求
  next();
});

app.get('/api', (req, res) => {
  res.send('Hello World!');
});

app.post('/api/signature', (req, res) => {
  const signatureNonce = crypto.randomBytes(8).toString('hex');
  //使用你的appId和serverSecret
  const timeStamp = Math.round(Date.now() / 1000);

  res.json({
    appID,
    signature: GenerateUASignature(appID, signatureNonce, serverSecret, timeStamp),
    signatureNonce,
    timeStamp,
  })
});

app.post('/api/token', (req, res) => {

  const { userID } = req.body

  const effectiveTimeInSeconds = 3600; //type: number; unit: s； token 过期时间，单位：秒

  //生成基础鉴权 token时，payload 要设为空字符串
  const payload = '';
  // Build token 
  const token = generateToken04(appID, userID, serverSecret, effectiveTimeInSeconds, payload);
  res.json({ token });

});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});