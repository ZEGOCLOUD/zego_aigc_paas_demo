import axios from 'axios';



interface IRequestOptions {
    action: string;
    params?: Record<string, any>;
    method?: 'GET' | 'POST';
}

interface IResponse {
    Code: number;
    Message: string;
    Data: Record<string, any>;
}

export class ZegoAPI {
    private signatureServerUrl: string;
    private apiServerUrl: string;

    constructor(signatureServerUrl: string, apiServerUrl: string) {
        this.signatureServerUrl = signatureServerUrl;
        this.apiServerUrl = apiServerUrl
    }

    private async getSignature(): Promise<{ appID: string, signature: string, signatureNonce: string, timeStamp: number }> {

        try {
            const response = await axios.post(`${this.signatureServerUrl}/signature`, {
            });

            return response.data;
        } catch (error) {
            console.error('Failed to get signature:', error);
            throw error;
        }
    }


    // 获取 express 的token
    public async getToken(userID: string): Promise<{ token: string }> {

        try {
            const response = await axios.post(`${this.signatureServerUrl}/token`, {
                userID
            });

            return response.data;
        } catch (error) {
            console.error('Failed to get token:', error);
            throw error;
        }
    }

    public async sendRequest(options: IRequestOptions): Promise<IResponse> {
        const { appID, signature, signatureNonce, timeStamp } = await this.getSignature();

        const url = `${this.apiServerUrl}?Action=${options.action}&AppId=${appID}&Signature=${signature}&SignatureNonce=${signatureNonce}&Timestamp=${timeStamp}&SignatureVersion=2.0`;

        try {
            const response = await axios({
                method: options.method || 'GET',
                url: url,
                data: options.params,
            });

            return response.data;
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }
    // 查询数字人模特列表
    public async describeMetaHumanModel(): Promise<IResponse> {
        return this.sendRequest({
            action: 'DescribeMetaHumanModel',
            method: 'POST',
        });
    }

    // 查询数字人模特详情
    public async describeMetaHumanModelDetail(metaHumanModelId: string): Promise<IResponse> {
        return this.sendRequest({
            action: 'DescribeMetaHumanModelDetail',
            params: {
                MetaHumanModelId: metaHumanModelId,
            },
            method: 'POST',
        });
    }

    // 查询音色列表
    public async describeTimbreByMetaHuman(metaHumanId?: string): Promise<IResponse> {
        const params = metaHumanId ? { MetaHumanId: metaHumanId } : {};
        return this.sendRequest({
            action: 'DescribeTimbreByMetaHuman',
            params,
            method: 'POST',
        });
    }
    // 创建数字人视频任务
    public async createMetaHumanLive(params: {
        RoomId: string;
        StreamId: string;
        MetaHuman: {
            MetaHumanId: string;
            Layout: object;
        };
        Assets?: object[];
        VideoOption: object;
        MaxLiveTime: number;
    }): Promise<IResponse> {
        return this.sendRequest({
            action: 'CreateMetaHumanLive',
            params,
            method: 'POST',
        });
    }

    // 查询视频流任务状态
    public async describeMetaHumanLive(taskId: string): Promise<IResponse> {
        return this.sendRequest({
            action: 'DescribeMetaHumanLive',
            params: {
                TaskId: taskId,
            },
            method: 'POST',
        });
    }

    // 驱动数字人
    public async driveMetaHumanLive(params: {
        TaskId: string;
        Driver: {
            DriverType: number;
            TimbreId?: string;
            Text?: string;
            SpeechRate?: number;
            PitchRate?: number;
            Volume?: number;
            AudioUrl?: string;
            Strategy?: number;
            Actions?: Array<{ ActionName: string; StartPos: number }>;
            RTCProvider?: string;
            RTCOptions?: { RoomId: string; StreamId: string; UserId?: string };
        };
    }): Promise<IResponse> {
        return this.sendRequest({
            action: 'DriveMetaHumanLive',
            params,
            method: 'POST',
        });
    }

    // 停止数字人视频流任务
    public async stopMetaHumanLive(taskId: string): Promise<IResponse> {
        return this.sendRequest({
            action: 'StopMetaHumanLive',
            params: {
                TaskId: taskId,
            },
            method: 'POST',
        });
    }
}
