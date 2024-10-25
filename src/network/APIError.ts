// 定义枚举类型
enum ResponseCode {
    Success = 0,
    SignatureExpired = 100000004,
    SignatureError = 100000005,
    InvalidParameters = 400000001,
    ServiceNotActivated = 400000002,
    MetaHumanNotFound = 400000003,
    TimbreNotFound = 400000004,
    TaskNotFound = 400000005,
    LiveStreamNotStarted = 400000006,
    LiveStreamStopped = 400000007,
    ConcurrencyLimitExceeded = 400000008,
    UnsupportedTimbre = 400000009,
    InternalConfigurationError = 400000010,
    AIContentGenerationError = 400000011,
    OverduePayment = 400000012,
    StreamTTSError = 400000013,
    TimbreResourceError = 400000014,
    StreamIDExists = 400000015,
    ModelVersionError = 400000016,
    ContentReviewFailed = 400000017,
    ResolutionError = 400000018,
    ResourceDownloadError = 400000019,
    ImageSizeExceeded = 400000020,
    VideoUrlsError = 400000021,
    SystemError = 400010000,
    NoInterfacePermission = 400010001,
    ResourceInsufficient = 400010002,
    AuditServerError = 400010003,
    ParameterIllegal = 400004001,
    ConcurrencyLimitExceededForAccount = 400004006,
    AudioDecodingFailed = 400004007,
    NoAudioDataSent = 400004008,
    ClientDisconnected = 400004009,
    UnknownTextMessage = 400004010,
    ASRFailedDueToLoad = 400004011,
    ASRParameterError = 400004012,
    ASRTimeout = 400004013,
}

// 获取错误码的中文描述
function getResponseCodeDescription(code: ResponseCode): string {
    const descriptions = {
        [ResponseCode.Success]: "成功。",
        [ResponseCode.SignatureExpired]: "签名过期。请重新生成签名。",
        [ResponseCode.SignatureError]: "签名错误。请确认生成签名的参数是否正确。",
        [ResponseCode.InvalidParameters]: "输入参数无效。请根据 Message 提示，调整对应参数的取值。",
        [ResponseCode.ServiceNotActivated]: "数字人PaaS服务未开通。请联系ZEGO技术支持开通权限。",
        [ResponseCode.MetaHumanNotFound]: "未找到数字人形象。请确认设置的MetaHumanId是否正确。",
        [ResponseCode.TimbreNotFound]: "未找到音色。请确认设置的TimbreId是否正确。",
        [ResponseCode.TaskNotFound]: "未找到任务。请确认设置的TaskId是否正确。",
        [ResponseCode.LiveStreamNotStarted]: "数字人视频流未开始。请等待数字人视频流开始后再进行操作。",
        [ResponseCode.LiveStreamStopped]: "数字人视频流已停止。无需重复调用停止数字人视频流任务接口。",
        [ResponseCode.ConcurrencyLimitExceeded]: "数字人视频流并发数超出限制。请确认当前并发数量是否超过上限。",
        [ResponseCode.UnsupportedTimbre]: "数字人视频流不支持当前音色。请使用其他音色。",
        [ResponseCode.InternalConfigurationError]: "数字人形象内部配置出错。可先使用其他MetaHumanId及时创建数字人视频流任务，随后联系ZEGO技术支持调整内部配置。",
        [ResponseCode.AIContentGenerationError]: "AI文案生成错误。请根据Message提示，调整对应参数的取值。",
        [ResponseCode.OverduePayment]: "欠费。请联系ZEGO技术支持续费。",
        [ResponseCode.StreamTTSError]: "流式TTS错误。请联系ZEGO技术支持处理。",
        [ResponseCode.TimbreResourceError]: "音色资源错误。请联系ZEGO技术支持处理。",
        [ResponseCode.StreamIDExists]: "当前流ID已存在。请更换流ID或结束当前流任务。",
        [ResponseCode.ModelVersionError]: "数字人模型版本错误。请联系ZEGO技术支持处理。",
        [ResponseCode.ContentReviewFailed]: "审核内容不通过。请校验相关资源，可能存在涉黄、涉恐等问题。",
        [ResponseCode.ResolutionError]: "资源分辨率错误。请调整资源分辨率，保证图片单边分辨率不超过2560p。",
        [ResponseCode.ResourceDownloadError]: "资源下载错误。请确认资源可以下载。",
        [ResponseCode.ImageSizeExceeded]: "图片资源超过200M。请保证图片资源不超过200M。",
        [ResponseCode.VideoUrlsError]: "VideoUrls数组参数小于1个或大于5个会报错。请保证VideoUrls数组参数不小于1个且不大于5个。",
        [ResponseCode.SystemError]: "系统错误。请联系ZEGO技术支持处理。",
        [ResponseCode.NoInterfacePermission]: "未获得接口（异步文件合成、视频流创建、异步语音合成等）调用权限。请联系ZEGO技术支持开通权限。",
        [ResponseCode.ResourceInsufficient]: "资源不足。请稍后重试。",
        [ResponseCode.AuditServerError]: "审核服务器错误，请联系ZEGO技术支持处理。",
        [ResponseCode.ParameterIllegal]: "参数不合法，具体详情参考Message。请确认参数是否正确。",
        [ResponseCode.ConcurrencyLimitExceededForAccount]: "账号当前调用并发超出上限。请重新发起识别。",
        [ResponseCode.AudioDecodingFailed]: "音频解码失败，请检查上传音频数据格式与调用参数一致。请确认音频数据格式是否正确。",
        [ResponseCode.NoAudioDataSent]: "客户端超过15秒未发送音频数据。请确认是否有发送数据。",
        [ResponseCode.ClientDisconnected]: "客户端连接断开。请检查客户端是否正确断开。",
        [ResponseCode.UnknownTextMessage]: "客户端上传未知文本消息。请确认音频数据格式是否正确。",
        [ResponseCode.ASRFailedDueToLoad]: "因机器负载过高、网络抖动等导致识别失败，请重新发起新识别。请重新发起识别。",
        [ResponseCode.ASRParameterError]: "语音转文本（ASR）流参数错误。请确认参数是否正确。",
        [ResponseCode.ASRTimeout]: "语音转文本（ASR）识别超时。请检查数据是否正确，内容是否过长。",
    };

    return descriptions[code];
}

// 获取错误码的中文描述（考虑到实际API调用可能返回非枚举值，这里增加了错误处理）
function getResponseCodeDescriptionSafe(code: number): string {
    const description = getResponseCodeDescription(code as ResponseCode);
    return description || `未知错误码：${code}`;
}

// 获取错误码的英文描述
function getResponseCodeDescriptionEn(code: ResponseCode): string {
    const descriptionsEn = {
        [ResponseCode.Success]: "Success.",
        [ResponseCode.SignatureExpired]: "Signature expired. Please regenerate the signature.",
        [ResponseCode.SignatureError]: "Signature error. Please check the parameters used to generate the signature.",
        [ResponseCode.InvalidParameters]: "Invalid input parameters. Please adjust the corresponding parameter values according to the Message prompt.",
        [ResponseCode.ServiceNotActivated]: "The Digital Human PaaS service is not activated. Please contact ZEGO technical support to activate the service.",
        [ResponseCode.MetaHumanNotFound]: "Digital human model not found. Please check if the MetaHumanId is correct.",
        [ResponseCode.TimbreNotFound]: "Timbre not found. Please check if the TimbreId is correct.",
        [ResponseCode.TaskNotFound]: "Task not found. Please check if the TaskId is correct.",
        [ResponseCode.LiveStreamNotStarted]: "The digital human live stream has not started. Please wait until the digital human live stream starts before proceeding.",
        [ResponseCode.LiveStreamStopped]: "The digital human live stream has stopped. There is no need to call the stop live stream task interface repeatedly.",
        [ResponseCode.ConcurrencyLimitExceeded]: "The digital human live stream concurrency limit has been exceeded. Please check if the current concurrency exceeds the limit.",
        [ResponseCode.UnsupportedTimbre]: "The digital human live stream does not support the current timbre. Please use a different timbre.",
        [ResponseCode.InternalConfigurationError]: "Internal configuration error with the digital human model. You can use a different MetaHumanId to create a digital human live stream task in time, and then contact ZEGO technical support to adjust the internal configuration.",
        [ResponseCode.AIContentGenerationError]: "AI content generation error. Please adjust the corresponding parameter values according to the Message prompt.",
        [ResponseCode.OverduePayment]: "Overdue payment. Please contact ZEGO technical support for renewal.",
        [ResponseCode.StreamTTSError]: "Stream TTS error. Please contact ZEGO technical support for assistance.",
        [ResponseCode.TimbreResourceError]: "Timbre resource error. Please contact ZEGO technical support for assistance.",
        [ResponseCode.StreamIDExists]: "The current stream ID already exists. Please change the stream ID or end the current stream task.",
        [ResponseCode.ModelVersionError]: "Digital human model version error. Please contact ZEGO technical support for assistance.",
        [ResponseCode.ContentReviewFailed]: "Content review failed. Please check the related resources for any issues such as pornography or terrorism.",
        [ResponseCode.ResolutionError]: "Resource resolution error. Please adjust the resource resolution to ensure that the image resolution does not exceed 2560p on one side.",
        [ResponseCode.ResourceDownloadError]: "Resource download error. Please confirm that the resource can be downloaded.",
        [ResponseCode.ImageSizeExceeded]: "Image resource exceeds 200M. Please ensure that the image resource does not exceed 200M.",
        [ResponseCode.VideoUrlsError]: "The VideoUrls array parameter should not be less than 1 and not more than 5. Please ensure the VideoUrls array parameter is not less than 1 and not more than 5.",
        [ResponseCode.SystemError]: "System error. Please contact ZEGO technical support for assistance.",
        [ResponseCode.NoInterfacePermission]: "No permission to call the interface (asynchronous file synthesis, live stream creation, asynchronous speech synthesis, etc.). Please contact ZEGO technical support to activate the service.",
        [ResponseCode.ResourceInsufficient]: "Resource insufficient. Please try again later.",
        [ResponseCode.AuditServerError]: "Audit server error. Please contact ZEGO technical support for assistance.",
        [ResponseCode.ParameterIllegal]: "Parameter is illegal. Please check if the parameters are correct.",
        [ResponseCode.ConcurrencyLimitExceededForAccount]: "The account's current call concurrency exceeds the limit. Please re-initiate the recognition.",
        [ResponseCode.AudioDecodingFailed]: "Audio decoding failed. Please check if the uploaded audio data format is consistent with the call parameters and if the audio data format is correct.",
        [ResponseCode.NoAudioDataSent]: "The client has not sent audio data for more than 15 seconds. Please confirm if data is being sent.",
        [ResponseCode.ClientDisconnected]: "Client disconnected. Please check if the client is disconnected correctly.",
        [ResponseCode.UnknownTextMessage]: "The client uploaded an unknown text message. Please confirm if the audio data format is correct.",
        [ResponseCode.ASRFailedDueToLoad]: "Recognition failed due to high machine load or network jitter. Please re-initiate a new recognition.",
        [ResponseCode.ASRParameterError]: "Speech-to-text (ASR) stream parameter error. Please check if the parameters are correct.",
        [ResponseCode.ASRTimeout]: "Speech-to-text (ASR) recognition timeout. Please check if the data is correct and if the content is too long.",
    };

    return descriptionsEn[code];
}

// 获取错误码的英文描述（考虑到实际API调用可能返回非枚举值，这里增加了错误处理）
function getResponseCodeDescriptionEnSafe(code: number): string {
    const description = getResponseCodeDescriptionEn(code as ResponseCode);
    return description || `Unknown error code: ${code}`;
}


export { ResponseCode, getResponseCodeDescription, getResponseCodeDescriptionSafe, getResponseCodeDescriptionEn, getResponseCodeDescriptionEnSafe };