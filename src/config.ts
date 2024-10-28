export default {
    "AppID": 2508486932,
    "RtcServer": "wss://webliveroom2508486932-api.imzego.com/ws",
    "ApiServer": "https://aigc-api.zegotech.cn",
    "Prod": {
        "SignatureServer": "//feedeo-robot-demo.spreading.ai/api",
        "MaxLiveTime": 180
    },
    "Test": {
        "SignatureServer": "//localhost:3000/api",
        "MaxLiveTime": 60
    },
    "Humans": [
        // {
        //     "value": "2929ebf1-a443-4d41-b414-81d9f107992a",
        //     "label": "Male(v1.6)"
        // },
        {
            "value": "14c12c0a-5b9f-4a2c-a381-861142e51593",
            "label": "Female(v2.0)",
            "default": true,
        }
    ],
    "Voices": [
        // {
        //     "value": "5611f5db-42ea-435f-8f02-0562833c3717",
        //     "label": "Male1"
        // },
        // {
        //     "value": "358f2618-1eb5-4306-99e9-28efb02d5094",
        //     "label": "Male2"
        // },
        {
            "value": "d88b47af-ef58-485f-a9e1-e1dbfeae3879",
            "label": "Female(English1)",
        },
        {
            "value": "2974dd0a-00c5-4000-8421-715753e36c07",
            "label": "Female(English2)",
            "default": true,
        },
        {
            "value": "aef8a17e-4a22-42d7-8057-a72acd3b19f4",
            "label": "Female(English3)"
        },
        {
            "value": "2c15780e-2e04-4e92-8e3d-75f5fd762e6a",
            "label": "Female(English4)"
        },
        {
            "value": "e01a388d-4f1d-4401-b5ee-b4e14e02d626",
            "label": "Female(Spanish)"
        }
    ]
}