<template>
  <div class="container">
    <div class="left-panel ">
      <!-- 左侧内容 -->
      <div class="panel-header clearfix">
        <div class="voice-selector">
          <select v-model="selectedTimbre" class="custom-select">
            <option v-for="voice in timbreList" :key="voice.value" :value="voice.value">
              {{ voice.label }}
            </option>
          </select>
        </div>
        <div class="human-selector">
          <select v-model="selectedHuman" class="custom-select">
            <option v-for="human in humanList" :key="human.value" :value="human.value">
              {{ human.label }}
            </option>
          </select>
        </div>
      </div>
      <h1>
        Actions
      </h1>

      <p></p>
      <div class="button-container">
        <button @click="onStartClick" class="button start-button">1. Start Init</button>
        &nbsp;<sub>v: {{ seed }}</sub>
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
        PaaS Digital Human
      </h1>
      <h4>Time Limit {{ remainTime }}s</h4>
      <div id="remote-video"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ZegoExpressEngine } from 'zego-express-engine-webrtc'
import { ZegoAPI } from "../network/ZegoAPI";
import { nextTick, ref, watch } from 'vue';
import { Timer } from '@/utils/Timer';

import config from '../config.json'
import { getResponseCodeDescriptionEnSafe, getResponseCodeDescriptionSafe } from '@/network/APIError';

const getUrlParam = (key: string) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key) || '';
};

const isTest = parseInt(getUrlParam('test')) === 1

const { AppID, RtcServer, ApiServer } = config

const { SignatureServer, MaxLiveTime } = config[isTest ? 'Test' : 'Prod']


const zegoApi = new ZegoAPI(SignatureServer, ApiServer);

const tipMessages = ref<string[]>([])
const errorMessage = ref('')
const inputText = ref("Good morning! Today, I stand before you to talk about the power of unity. In a world that often seems divided, it's easy to forget that we are all part of the same human family. Our differences should be celebrated, not feared. ")


const seed = parseInt(getUrlParam('seed'), 10) || localStorage.seed || Date.now();
localStorage.seed = seed
const rtcRoomID = 'zego_test_' + seed
const rtcUserID = 'test_user_' + seed
const rtcStreamID = 'stream_digitalhuman_' + seed

const humanList = ref([
  { value: '2929ebf1-a443-4d41-b414-81d9f107992a', label: 'Man(1.6)' },
  { value: '14c12c0a-5b9f-4a2c-a381-861142e51593', label: 'Woman(2.0)' },
]);

const selectedHuman = ref(humanList.value[1].value)

const timbreList = ref([
  { value: '5611f5db-42ea-435f-8f02-0562833c3717', label: 'ManVoice1' },
  { value: '358f2618-1eb5-4306-99e9-28efb02d5094', label: 'ManVoice2' },

  { value: 'd88b47af-ef58-485f-a9e1-e1dbfeae3879', label: 'WomanVoice1' },
  { value: '2974dd0a-00c5-4000-8421-715753e36c07', label: 'WomanVoice2' },
  { value: 'aef8a17e-4a22-42d7-8057-a72acd3b19f4', label: 'WomanVoice3' },
  { value: '2c15780e-2e04-4e92-8e3d-75f5fd762e6a', label: 'WomanVoice4' },
]);

const selectedTimbre = ref(timbreList.value[2].value)

watch(selectedTimbre, (newVal, oldVal) => {
  throwTips('Selected new voice, need to stop and start again')
});

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

// 1：视频流任务初始化中。
// 2：视频流任务初始化失败。
// 3：推流中。
// 4：正在停止推流。
// 5：已停止推流。
enum DigitalHumanStatus {
  Initializing = 1,
  InitFailed = 2,
  Pushing = 3,
  Stopping = 4,
  Stopped = 5
}

async function checkAliveDigitalHuman(taskID: string): Promise<DigitalHumanStatus> {
  // 查询视频流任务状态
  let result = await zegoApi.describeMetaHumanLive(taskID);
  console.log(result);
  if (result.Code !== 0) {
    throwError(result.Code, result.Message)
    return DigitalHumanStatus.InitFailed
  }

  return result.Data.Status;

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
  const status = await checkAliveDigitalHuman(taskID)
  if (status === DigitalHumanStatus.Pushing) {
    throwTips('DigitalHuman task alive')
    onInitDigitalHumanSuccess()
  } else if (status === DigitalHumanStatus.Initializing) {
    setTimeout(() => loopCheckAliveDigitalHuman(taskID), 1500)
  } else {
    // 已经出错了, 不要轮训了
    throwError(-1, 'DigitalHuman task dead')
  }
}

async function initDigitalHuman() {
  throwTips('Initializing DigitalHuman...')

  // 检查一下有没有已经在推流的数字人
  let taskID = localStorage.lastTaskID
  if (taskID) {
    throwTips('Checking last task...')
    const status = await checkAliveDigitalHuman(taskID)
    if (status === DigitalHumanStatus.Pushing) {
      // 如果有存活, 就不管了, 拉流就行
      throwTips('Last task is alive')
      onInitDigitalHumanSuccess()
      return
    } else if (status === DigitalHumanStatus.Initializing) {
      // 还在初始化, 等检测
      throwTips('Waiting new task alive...')
      loopCheckAliveDigitalHuman(taskID)
      return
    }
  }
  // 没有在推流的, 重新创建
  throwTips('Creating new task...')
  taskID = await createNewDigitalHuman(rtcRoomID, rtcStreamID, selectedHuman.value)

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
      TimbreId: selectedTimbre.value,
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
    if (!inputText.value) {
      throwTips('Please input text!')
      return
    }
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
  position: relative;
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

  padding: 10px;
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

.panel-header {
  position: relative;
}

.human-selector {
  float: left;
  margin: 10px;
}

.voice-selector {
  float: right;
  margin: 10px;
}

.custom-select {
  /* 基本样式 */
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  color: #333;
  appearance: none;
  /* 移除默认的下拉箭头 */
  -webkit-appearance: none;
  /* Safari 和 Chrome */
  -moz-appearance: none;
  /* Firefox */
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 20px;
  /* 调整宽度 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.human-selector .custom-select {
  width: 150px;
}

.voice-selector .custom-select {
  width: 150px;
}


.custom-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: none;
}

.clearfix::after {
  content: "";
  display: table;
  clear: both;
}
</style>
