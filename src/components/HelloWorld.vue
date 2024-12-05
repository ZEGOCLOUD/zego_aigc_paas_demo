<template>
    <div class="container">
        <div class="left-panel ">
            <!-- 左侧内容 -->
            <div class="panel-header clearfix">
                <div class="human-selector">
                    <select v-model="selectedHuman" class="custom-select">
                        <option v-for="human in humanList" :key="human.value" :value="human.value">
                            {{ human.label }}
                        </option>
                    </select>
                </div>
                <div class="voice-selector">
                    <select v-model="selectedTimbre" class="custom-select">
                        <option v-for="voice in timbreList" :key="voice.value" :value="voice.value">
                            {{ voice.label }}
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
                <div class="preset-container">Presets: <select v-model="selectedPreset" class="custom-select">
                        <option v-for="voice in presetList" :key="voice.value" :value="voice.value">
                            {{ voice.label }}
                        </option>
                    </select></div>
                <textarea v-model="inputText" class="textarea"
                    placeholder="Input text to drive digital human"></textarea>
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

import config from '../config'
import { getResponseCodeDescriptionEnSafe, getResponseCodeDescriptionSafe } from '@/network/APIError';

const getUrlParam = (key: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key) || '';
};

const isTest = parseInt(getUrlParam('test')) === 1

const { AppID, RtcServer, ApiServer, Humans, Voices } = config

const { SignatureServer, MaxLiveTime } = config[isTest ? 'Test' : 'Prod']

const zegoApi = new ZegoAPI(SignatureServer, ApiServer);

const tipMessages = ref<string[]>([])
const errorMessage = ref('')

const presetList = ref([
    { label: 'English', value: "Good morning! Today, I stand before you to talk about the power of unity. In a world that often seems divided, it's easy to forget that we are all part of the same human family. Our differences should be celebrated, not feared. " },
    { label: 'Spanish', value: "Una vez, en un pueblo lejano, vivía un niño llamado José. José tenía un gran deseo de explorar el mundo. Un día, encontró un mapa antiguo que le mostró el camino hacia una isla misteriosa. Con valentía y esperanza, partió en su aventura, aprendiendo que cada viaje es una historia que nos enseña a crecer." },
])

const selectedPreset = ref(presetList.value[0].value)
const inputText = ref(selectedPreset.value)

watch(selectedPreset, (newVal, oldVal) => {
    inputText.value = newVal
});


function getDefaultItem<T extends { default?: boolean }>(list: T[]): T {
    const defaultItem = list.find(item => item.default === true);
    console.log(defaultItem || list[0])
    return defaultItem || list[0];
}

const seed = parseInt(getUrlParam('seed'), 10) || localStorage.seed || Date.now();
localStorage.seed = seed
const rtcRoomID = 'zego_test_' + seed
const rtcUserID = 'test_user_' + seed
const rtcStreamID = 'stream_digitalhuman_' + seed

const humanList = ref(Humans);

const selectedHuman = ref(getDefaultItem(Humans).value)

watch(selectedHuman, (newVal, oldVal) => {
    throwTips('Selected new human, need to stop and start again')
});

const timbreList = ref(Voices);

const selectedTimbre = ref(getDefaultItem(Voices).value)

watch(selectedTimbre, (newVal, oldVal) => {
    throwTips('Selected new voice, need to stop and start again')
});

function throwTips(message: string) {
    tipMessages.value.push('[*] ' + message)
    nextTick(() => nextTick(scrollToBottom))
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
    // Initialize the instance
    const zg = new ZegoExpressEngine(AppID, RtcServer);

    // Room state update callback
    // In this example, we start streaming immediately after logging into the room. In a real-world application, you can choose to start streaming at any time as long as the room connection is successful.
    // Room state update callback
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
        // Notification of changes in audio and video streams of other users in the room
        if (updateType == 'ADD') {
            // Stream added, start pulling the stream
            // This example demonstrates how to pull the audio and video of the first stream in the list of added streams.
            const streamID = streamList[0].streamID;
            console.warn("[Zego]room stream update: " + streamID)
            // streamList contains the streamID of the corresponding stream
            const remoteStream = await zg.startPlayingStream(streamID);
            // Create a media stream playback component
            const remoteView = zg.createRemoteStreamView(remoteStream);
            remoteView.play("remote-video", { enableAutoplayDialog: true });

        } else if (updateType == 'DELETE') {
            // Stream deleted, stop pulling the stream by the streamID of each stream in the stream deletion list streamList.
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
    console.error(`${code}: ${getResponseCodeDescriptionSafe(code)}\n${message}`)
    alert(`${code}: ${getResponseCodeDescriptionEnSafe(code)}\n${message}`)
    errorMessage.value = `${code}: ${getResponseCodeDescriptionEnSafe(code)} - ${message}`
}

// 1: The video streaming task is initializing.
// 2: The video streaming task initialization failed.
// 3: Streaming.
// 4: Stopping streaming.
// 5: Streaming has stopped.

enum DigitalHumanStatus {
    Initializing = 1,
    InitFailed = 2,
    Pushing = 3,
    Stopping = 4,
    Stopped = 5
}

async function checkAliveDigitalHuman(taskID: string): Promise<[DigitalHumanStatus, string]> {
    // Query the status of the video streaming task
    let result = await zegoApi.describeMetaHumanLive(taskID);
    console.log(result);
    if (result.Code !== 0) {
        throwError(result.Code, result.Message)
        return [DigitalHumanStatus.InitFailed, result.Message]
    }
    return [result.Data.Status, result.Data.FailReason];

}

async function createNewDigitalHuman(roomID: string, streamID: string, metaHumanID: string) {
    const result = await zegoApi.createMetaHumanLive({
        RoomId: roomID,
        StreamId: streamID,
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
            // The resolution of this picture is 1052 * 592
            "AssetUrl": "https://zego-aigc-test.oss-accelerate.aliyuncs.com/bg/20241025/b7adee2e-efcb-435d-b11d-e4df19c5f0d7.png",
            "Layout": {
                "Top": 0,
                "Left": 0,
                "Width": 1920,
                "Height": 1080,
                "Layer": 0
            }
        }],
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
    // Query the number of digital humans
    let result = await zegoApi.describeMetaHumanModel();
    console.log(result);
    if (result.Code !== 0) {
        throwError(result.Code, result.Message)
        return
    }

    // Find a modelID from result.Data
    const modelID = result.Data[0].MetaHumanId
    // Query digital human details
    result = await zegoApi.describeMetaHumanModelDetail(modelID);
    console.log(result);
    if (result.Code !== 0) {
        throwError(result.Code, result.Message)
        return
    }
}

// Query what timbres this digital human has
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
        // It has already started, correct the time,
        const useTime = ~~((Date.now() - parseInt(localStorage.startTime)) / 1000)
        remainTime.value = MaxLiveTime - useTime
    }
}

async function loopCheckAliveDigitalHuman(taskID: string) {
    const [status, message] = await checkAliveDigitalHuman(taskID)
    if (status === DigitalHumanStatus.Pushing) {
        throwTips('DigitalHuman task alive, taskID: ' + taskID)
        onInitDigitalHumanSuccess()
    } else if (status === DigitalHumanStatus.Initializing) {
        setTimeout(() => loopCheckAliveDigitalHuman(taskID), 1500)
    } else {
        // The task has already failed, no need to poll
        throwError(-1, 'DigitalHuman task dead: ' + message)
    }
}


// Main digital human logic
async function initDigitalHuman() {
    throwTips('Initializing DigitalHuman...')

    // Check if there is a digital human already pushing a stream
    let taskID = localStorage.lastTaskID
    if (taskID) {
        throwTips('Checking last task...')
        const [status] = await checkAliveDigitalHuman(taskID)
        if (status === DigitalHumanStatus.Pushing) {
            // If there is an active task, ignore it and just pull the stream
            throwTips('Last task is alive, taskID: ' + taskID)
            onInitDigitalHumanSuccess()
            return
        } else if (status === DigitalHumanStatus.Initializing) {
            // If the task is still initializing, wait for it to become active
            throwTips('Waiting new task alive...')
            loopCheckAliveDigitalHuman(taskID)
            return
        }
    }
    // No active task, create a new one
    throwTips('Creating new task...')
    taskID = await createNewDigitalHuman(rtcRoomID, rtcStreamID, selectedHuman.value)

    if (taskID) {
        localStorage.lastTaskID = taskID
        localStorage.startTime = Date.now()
        // Task created successfully, wait for it to become active
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
        isInited.value = false
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
    min-width: 380px;
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
    text-align: left;
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
    width: 150px;
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

.preset-container {
    padding: 10px 0;
}
</style>
