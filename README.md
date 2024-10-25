# 数字人标准 PaaS Demo

本项目包含前端页面和后端接口，旨在为开发者提供参考示例。

## 快速开始

### 1. 配置后端服务

- **复制配置文件**：将 `./server/tokens.json.example` 复制并重命名为 `./server/tokens.json`。
- **修改配置**：编辑 `./server/tokens.json` 文件，将 `appid` 和 `serverSecret` 替换为您的实际值。

### 2. 启动后端服务

- **进入目录**：`cd ./server`
- **安装依赖**：`npm install`
- **启动服务**：`npm start`

### 3. 配置前端应用

- **修改配置文件**：编辑 `./src/config.json` 文件，按需修改 `AppId`、`ApiServer` 和 `RtcServer` 的值。

### 4. 启动前端应用

- **进入目录**：`cd ./src`
- **安装依赖**：`npm install`
- **启动服务**：`npm run serve`