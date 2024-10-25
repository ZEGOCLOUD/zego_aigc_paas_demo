<template>
  <div class="container">
    <div class="left-panel">
      <!-- 左侧内容 -->
      <h1>
        Actions
      </h1>
      <sub>v: {{ seed }}</sub>
      <p></p>
      <div class="button-container">
        <button @click="onStartClick" class="button start-button">1. Init First</button>
      </div>
      <div v-if="errorMessage" class="error-tip">
        {{ errorMessage }}
      </div>
      <div v-if="tipMessages.length" class="tip-container">
        <div class="tip" v-for="(tip, index) in tipMessages" :key="index">
          {{ tip }}
        </div>
      </div>

      <div v-if="isInited" class="input-container">
        <textarea v-model="inputText" class="textarea" placeholder="Input text to drive digital human"></textarea>
        <button @click="onSendClick" class="button send-button">2. Send Text</button>
      </div>

      <div v-if="isInited" class="button-container2">
        <button @click="onStopClick" class="button stop-button">3. Stop if finish</button>
      </div>

    </div>
    <div class="right-panel">
      <!-- 右侧内容 -->
      <h1>
        PaaS  Digital Human
      </h1>
      <h4>Time Limit {{ remainTime }}s</h4>
      <div id="remote-video"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ZegoExpressEngine } from 'zego-express-engine-webrtc'
import { ZegoAPI } from "../network/ZegoAPI";
import { nextTick, ref } from 'vue';
import { Timer } from '@/utils/Timer';

import config from '../config.json'
import { getResponseCodeDescriptionEnSafe, getResponseCodeDescriptionSafe } from '@/network/APIError';

const getUrlParam = (key: string) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key) || '';
};

const isTest = parseInt(getUrlParam('test')) === 1

const { AppID, RtcServer } = config

const { SignatureServer, MaxLiveTime } = config[isTest ? 'Test' : 'Prod']


const zegoApi = new ZegoAPI(SignatureServer);

const tipMessages = ref<string[]>([])
const errorMessage = ref('')
const inputText = ref("Good morning! Today, I stand before you to talk about the power of unity. In a world that often seems divided, it's easy to forget that we are all part of the same human family. Our differences should be celebrated, not feared. ")


const seed = parseInt(getUrlParam('seed'), 10) || localStorage.seed || Date.now();
localStorage.seed = seed
const rtcRoomID = 'zego_test_' + seed
const rtcUserID = 'test_user_' + seed
const rtcStreamID = 'stream_digitalhuman_' + seed

// 楚瑶的MetaHumanID
const metaHumanID = "2929ebf1-a443-4d41-b414-81d9f107992a"
// 音色: 活力甜妹
const timbreID = "4e79abb9-6dc9-44ef-b9ca-6f0da9620a6c"

function throwTips(message: string) {
  tipMessages.value.push(message)
  nextTick(scrollToBottom)
}

const scrollToBottom = () => {
  const container = document.querySelector('.tip-container');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
};
let isInited = ref(false)

async function initRTC() {
  throwTips('Initializing RTC...')
  // 初始化实例
  const zg = new ZegoExpressEngine(AppID, RtcServer);

  // 房间状态更新回调
  // 此处在登录房间成功后，立即进行推流。在实现具体业务时，您可选择其他时机进行推流，只要保证当前房间连接状态是连接成功的即可。
  // 房间状态更新回调
  zg.on('roomStateChanged', async (roomID, reason, errorCode, extendedData) => {
    if (reason == 'LOGINED') {
      console.warn("与房间连接成功，只有当房间状态是连接成功时，才能进行推流、拉流等操作。")
    }
  })

  zg.on('tokenWillExpire', async (roomID: string) => {
    let { token } = await zegoApi.getToken(rtcUserID); // 重新请求开发者服务端获取 Token
    zg.renewToken(token);
  });

  zg.on('roomStreamUpdate', async (roomID, updateType, streamList, extendedData) => {
    // 房间内其他用户音视频流变化的通知
    if (updateType == 'ADD') {
      // 流新增，开始拉流
      // 此处演示拉取流新增的列表中第一条流的音视频
      const streamID = streamList[0].streamID;
      console.warn("[Zego]room stream update: " + streamID)
      // streamList 中有对应流的 streamID
      const remoteStream = await zg.startPlayingStream(streamID);
      // 创建媒体流播放组件
      const remoteView = zg.createRemoteStreamView(remoteStream);
      remoteView.play("remote-video", { enableAutoplayDialog: true });

    } else if (updateType == 'DELETE') {
      // 流删除，通过流删除列表 streamList 中每个流的 streamID 进行停止拉流。
      const streamID = streamList[0].streamID;
      zg.stopPlayingStream(streamID)
    }
  });

  const { token } = await zegoApi.getToken(rtcUserID)

  const result = await zg.loginRoom(rtcRoomID, token, { userID: rtcUserID, userName: rtcUserID }, { userUpdate: true })
  if (result == true) {
    throwTips('RTC initialized')
    return true
  } else {
    throwTips('RTC init failure!!!')
    return false
  }

}

function throwError(code: number, message: string) {
  console.error(`${code}: ${message} \n${getResponseCodeDescriptionSafe(code)}`)
  alert(`${code}: ${getResponseCodeDescriptionEnSafe(code)}`)
  errorMessage.value = `${code}: ${getResponseCodeDescriptionEnSafe(code)}`
}

async function checkAliveDigitalHuman(taskID: string) {
  // 查询视频流任务状态
  let result = await zegoApi.describeMetaHumanLive(taskID);
  console.log(result);
  if (result.Code !== 0) {
    throwError(result.Code, result.Message)
    return false
  }
  // 1：视频流任务初始化中。
  // 2：视频流任务初始化失败。
  // 3：推流中。
  // 4：正在停止推流。
  // 5：已停止推流。
  if (result.Data.Status === 1 || result.Data.Status === 3) {
    // 开始推流了, 可以拉流
    return true
  }
  return false
}

async function createNewDigitalHuman(roomID: string, streamID: string, metaHumanID: string) {
  const result = await zegoApi.createMetaHumanLive({
    RoomId: rtcRoomID,
    StreamId: rtcStreamID,
    MetaHuman: {
      // 楚瑶
      MetaHumanId: metaHumanID,
      Layout: {
        "Top": 120,
        "Left": 1920 - 640,
        "Width": 540,
        "Height": 960,
        "Layer": 1
      },
    },
    Assets: [{
      "AssetType": 1,
      // 图片分辨率 1052 * 592
      "AssetUrl": "https://zego-aigc-test.oss-accelerate.aliyuncs.com/bg/20241025/b7adee2e-efcb-435d-b11d-e4df19c5f0d7.png",
      "Layout": {
        "Top": 0,
        "Left": 0,
        "Width": 1920,
        "Height": 1080,
        "Layer": 0
      }
    }
    ],
    VideoOption: {
      "Width": 1920,
      "Height": 1080
    },
    MaxLiveTime: MaxLiveTime,
  })

  console.log(result);
  if (result.Code !== 0) {
    throwError(result.Code, result.Message)
    return null
  }
  return result.Data.TaskId;
}

async function queryMetaHuman() {
  // 查询有哪些数字人
  let result = await zegoApi.describeMetaHumanModel();
  console.log(result);
  if (result.Code !== 0) {
    throwError(result.Code, result.Message)
    return
  }

  // 从 result.Data 找一个 modelID
  const modelID = result.Data[0].MetaHumanId
  // 查询数字人详情
  result = await zegoApi.describeMetaHumanModelDetail(modelID);
  console.log(result);
  if (result.Code !== 0) {
    throwError(result.Code, result.Message)
    return
  }
}

async function queryMetaHumanVoice(metaHumanId: string) {
  const result = await zegoApi.describeTimbreByMetaHuman(metaHumanId);
  console.log(result);
  if (result.Code !== 0) {
    throwError(result.Code, result.Message)
    return
  }
}

function onInitDigitalHumanSuccess() {
  isInited.value = true;
  timingTimer.start()
  if (localStorage.startTime) {
    // 已经开始过了的, 矫正时间, 
    const useTime = ~~((Date.now() - parseInt(localStorage.startTime)) / 1000)
    remainTime.value = MaxLiveTime - useTime
  }
}

async function loopCheckAliveDigitalHuman(taskID: string) {
  const isAlive = await checkAliveDigitalHuman(taskID)
  if (isAlive) {
    throwTips('DigitalHuman task alive')
    onInitDigitalHumanSuccess()
  } else {
    setTimeout(() => loopCheckAliveDigitalHuman(taskID), 1500)
  }
}

async function initDigitalHuman() {
  throwTips('Initializing DigitalHuman...')

  // 检查一下有没有已经在推流的数字人
  let taskID = localStorage.lastTaskID
  if (taskID) {
    throwTips('Checking last task...')
    const isAlive = await checkAliveDigitalHuman(taskID)
    if (isAlive) {
      // 如果有存活, 就不管了, 拉流就行
      throwTips('Last task is alive')
      onInitDigitalHumanSuccess()
      return
    }
  }
  // 没有在推流的, 重新创建
  throwTips('Creating new task...')
  taskID = await createNewDigitalHuman(rtcRoomID, rtcStreamID, metaHumanID)

  if (taskID) {
    localStorage.lastTaskID = taskID
    localStorage.startTime = Date.now()
    // 创建成功, 等推流, 写个 loop 2s 检测一次 checkAliveDigitalHuman
    throwTips('Waiting new task alive...')
    loopCheckAliveDigitalHuman(taskID)
  } else {
    throwTips('DigitalHuman task create failure')
  }
}


async function sendText(taskID: string, text: string) {
  throwTips('Seding text...')
  const result = await zegoApi.driveMetaHumanLive({
    TaskId: taskID,
    Driver: {
      DriverType: 1,
      Text: text,
      TimbreId: timbreID,
    }
  })

  console.log(result);
  if (result.Code !== 0) {
    throwError(result.Code, result.Message)
    return false
  }
  throwTips('Seding text success')
  return true
}


const remainTime = ref(MaxLiveTime)

const timingTimer = new Timer(elapsed => {
  remainTime.value -= 1
  if (remainTime.value <= 0) {
    throwTips('Time over. Refresh page please!')
    timingTimer.stop()
    // isInited.value = false
  }
}, 1000)

async function onStartClick() {
  console.log("onStartClick");

  if (await initRTC()) {
    await initDigitalHuman()
  }
}

async function onSendClick() {
  console.log("onSendClick: " + inputText.value);
  if (isInited.value) {
    const succeed = await sendText(localStorage.lastTaskID, inputText.value)
    if (succeed) {
      inputText.value = ''
    }

  } else {
    throwTips('Not init, please init and wait')
  }
}

async function onStopClick() {
  console.log("onStopClick");
  if (isInited.value) {
    const result = await zegoApi.stopMetaHumanLive(localStorage.lastTaskID);
    console.log(result);
    if (result.Code !== 0) {
      throwError(result.Code, result.Message)
      return
    } else {
      timingTimer.stop()
      isInited.value = false
      localStorage.clear()
    }
  } else {
    throwTips('Not init, no need stop')
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

.container {
  display: flex;
  height: 100vh;
  /* 使容器高度占满整个视口 */
}

.left-panel {
  width: 30%;
  /* 左侧面板宽度 */
  background-color: #f0f0f0;
  /* 背景颜色 */
  padding: 20px;
  box-sizing: border-box;
}

.right-panel {
  width: 70%;
  /* 右侧面板宽度 */
  background-color: #ffffff;
  /* 背景颜色 */
  padding: 20px;
  box-sizing: border-box;
}

#remote-video {
  width: 960px;
  height: 540px;
  border: 1px solid #dfdfdf;
}

#local-video {
  position: relative;
  margin: 0 auto;
  display: block;
}

#remote-video {
  display: flex;
  margin: auto;
  position: relative !important;
}

.tip-container {
  max-height: 200px;
  /* 设置最大高度 */
  overflow-y: auto;
  /* 添加垂直滚动条 */

  padding: 10px 20px;
  background-color: #f8f9fa;
  /* 浅灰色背景 */
  border: 1px solid #ced4da;
  /* 边框颜色 */
  border-radius: 5px;
  /* 圆角 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* 微弱阴影 */
  font-size: 14px;
  /* 字体大小 */
  color: #006bd6;
  /* 文字颜色 */
  max-width: 300px;
  min-height: 30px;
  /* 最大宽度 */
  margin: 20px auto;
  /* 居中显示 */
  text-align: center;
  /* 文本居中 */
}

.button-container {
  margin-bottom: 20px;
}

.button {
  padding: 10px 20px;
  background-color: #007bff;
  /* 蓝色背景 */
  color: white;
  border: none;
  border-radius: 5px;
  min-width: 150px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.button:hover {
  background-color: #0056b3;
  /* 悬停时更深的蓝色 */
}

.button-container2 {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  margin-bottom: 20px;
}

.stop-button {
  background-color: #d83d4f;
}

.textarea {
  width: 100%;
  height: 100px;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 5px;
  font-size: 14px;
  resize: vertical;
  /* 允许垂直调整大小 */
  margin-bottom: 10px;
  box-sizing: border-box;
}

.error-tip {
  padding: 10px 20px;
  background-color: #f8d7da;
  /* 浅红色背景 */
  border: 1px solid #f5c6cb;
  /* 边框颜色 */
  border-radius: 5px;
  /* 圆角 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* 微弱阴影 */
  font-size: 14px;
  /* 字体大小 */
  color: #721c24;
  /* 文字颜色 */
  max-width: 300px;
  /* 最大宽度 */
  margin: 20px auto;
  /* 居中显示 */
  text-align: center;
  /* 文本居中 */
}

.input-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  margin-bottom: 20px;

}
</style>
