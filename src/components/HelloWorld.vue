<template>
  <div class="container">
    <div class="left-panel">
      <!-- 左侧内容 -->
      <h1>
        Actions
      </h1>
      <div class="button-container">
        <button @click="onStartClick" class="start-button">1. Init First</button>
      </div>

      <div class="tip">
        {{ tipMessage }}
      </div>
      <div v-if="errorMessage" class="error-tip">
        {{ errorMessage }}
      </div>

      <div class="input-container">
        <textarea v-model="inputText" class="textarea"></textarea>
        <button @click="onSendClick" class="send-button">2. Send Text</button>
      </div>

    </div>
    <div class="right-panel">
      <!-- 右侧内容 -->
      <h1>
        Digital Human
      </h1>
      <h4>Time Limit {{ remainTime }}s</h4>
      <div id="remote-video"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ZegoExpressEngine } from 'zego-express-engine-webrtc'
import { ZegoAPI } from "../network/ZegoAPI";
import { ref } from 'vue';
import { Timer } from '@/utils/Timer';

import {AppID, RtcServer, SignatureServer} from '../config.json'

const zegoApi = new ZegoAPI(SignatureServer);

const tipMessage = ref('')
const errorMessage = ref('')
const inputText = ref("Good morning! Today, I stand before you to talk about the power of unity. In a world that often seems divided, it's easy to forget that we are all part of the same human family. Our differences should be celebrated, not feared. ")


const seed = localStorage.seed || Date.now()
localStorage.seed = seed
const rtcRoomID = 'zego_test_' + seed
const rtcUserID = 'test_user_' + seed
const rtcStreamID = 'stream_digitalhuman_' + seed

// 楚瑶的MetaHumanID
const metaHumanID = "59fe268f-4c17-4bcf-963a-335dfdfd96e1"
// 音色: 活力甜妹
const timbreID = "721fc3e5-7f43-4da1-887b-1db26435eafd"
// 最大推流时长
const maxLiveTime = 3 * 60

let isInited = false

async function initRTC() {
  tipMessage.value = 'Initializing RTC...'
  // 初始化实例
  const zg = new ZegoExpressEngine(AppID, RtcServer);

  // 房间状态更新回调
  // 此处在登录房间成功后，立即进行推流。在实现具体业务时，您可选择其他时机进行推流，只要保证当前房间连接状态是连接成功的即可。
  // 房间状态更新回调
  zg.on('roomStateChanged', async (roomID, reason, errorCode, extendedData) => {
    if (reason == 'LOGINED') {
      console.log("与房间连接成功，只有当房间状态是连接成功时，才能进行推流、拉流等操作。")
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
      console.log("[Zego]room stream update: " + streamID)
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
    tipMessage.value = 'RTC initialized'
    return true
  } else {
    tipMessage.value = 'RTC init failure!!!'
    return false
  }

}

function throwError(message: string){
  alert(message)
  errorMessage.value = message
}

async function checkAliveDigitalHuman(taskID: string) {
  // 查询视频流任务状态
  let result = await zegoApi.describeMetaHumanLive(taskID);
  console.log(result);
  if (result.Code !== 0) {
    throwError(`${result.Code}: ${result.Message}`)
    return false
  }
  // 1：视频流任务初始化中。
  // 2：视频流任务初始化失败。
  // 3：推流中。
  // 4：正在停止推流。
  // 5：已停止推流。
  if (result.Data.Status === 3) {
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
        "Top": 0,
        "Left": 0,
        "Width": 1080,
        "Height": 1920,
        "Layer": 0
      },
    },
    VideoOption: {
      "Width": 1080,
      "Height": 1920
    },
    MaxLiveTime: maxLiveTime,
  })

  console.log(result);
  if (result.Code !== 0) {
    throwError(`${result.Code}: ${result.Message}`)
    return null
  }
  return result.Data.TaskId;
}

async function queryMetaHuman() {
  // 查询有哪些数字人
  let result = await zegoApi.describeMetaHumanModel();
  console.log(result);
  if (result.Code !== 0) {
    throwError(`${result.Code}: ${result.Message}`)
    return
  }

  // 从 result.Data 找一个 modelID
  const modelID = result.Data[0].MetaHumanId
  // 查询数字人详情
  result = await zegoApi.describeMetaHumanModelDetail(modelID);
  console.log(result);
  if (result.Code !== 0) {
    throwError(`${result.Code}: ${result.Message}`)
    return
  }
}

async function queryMetaHumanVoice(metaHumanId: string) {
  const result = await zegoApi.describeTimbreByMetaHuman(metaHumanId);
  console.log(result);
  if (result.Code !== 0) {
    throwError(`${result.Code}: ${result.Message}`)
    return
  }
}

function onInitDigitalHumanSuccess() {
  isInited = true;
  timingTimer.start()
  if (localStorage.startTime) {
    // 已经开始过了的, 矫正时间, 
    const useTime = ~~((Date.now() - parseInt(localStorage.startTime)) / 1000)
    remainTime.value = maxLiveTime - useTime
  }
}

async function initDigitalHuman() {
  tipMessage.value = 'Initializing DigitalHuman...'

  // 检查一下有没有已经在推流的数字人
  let taskID = localStorage.lastTaskID
  if (taskID) {
    tipMessage.value = 'Checking last task...'
    const isAlive = await checkAliveDigitalHuman(taskID)
    if (isAlive) {
      // 如果有存活, 就不管了, 拉流就行
      tipMessage.value = 'Last task is alive'
      onInitDigitalHumanSuccess()
      return
    }
  }
  // 没有在推流的, 重新创建
  tipMessage.value = 'Creating new task...'
  taskID = await createNewDigitalHuman(rtcRoomID, rtcStreamID, metaHumanID)

  if (taskID) {
    localStorage.lastTaskID = taskID
    localStorage.startTime = Date.now()
    // 创建成功, 等推流, 写个loop 1s 检测一次 checkAliveDigitalHuman
    tipMessage.value = 'Waiting new task alive...'
    const interval = setInterval(async () => {
      const isAlive = await checkAliveDigitalHuman(taskID)
      if (isAlive) {
        clearInterval(interval)
        tipMessage.value = 'DigitalHuman task alive'
        onInitDigitalHumanSuccess()
      }
    }, 1000)
  } else {
    tipMessage.value = 'DigitalHuman task create failure'
  }
}


async function sendText(taskID: string, text: string) {
  tipMessage.value = 'Seding text...'
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
    throwError(`${result.Code}: ${result.Message}`)
    return
  }
  tipMessage.value = 'Seding text success'
}


const remainTime = ref(maxLiveTime)

const timingTimer = new Timer(elapsed => {
  remainTime.value -= 1
  if (remainTime.value <= 0) {
    tipMessage.value = 'Time over. Refresh page please!'
    timingTimer.stop()
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
  if (isInited) {
    sendText(localStorage.lastTaskID, inputText.value)
  } else {
    tipMessage.value = 'Not init, please wait'
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
  width: 540px;
  height: 720px;
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


.tip {
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

.start-button,
.send-button {
  padding: 10px 20px;
  background-color: #007bff;
  /* 蓝色背景 */
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.start-button:hover,
.send-button:hover {
  background-color: #0056b3;
  /* 悬停时更深的蓝色 */
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

}
</style>
