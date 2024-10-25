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


## 附录：配置国内 `npm` 源并安装 `pnpm` 

### 1. 配置国内 npm 源

为了加快依赖包的下载速度，可以将 npm 源切换为国内的镜像源。

```bash
npm config set registry https://registry.npmmirror.com
```

### 2. 安装 pnpm

通过 npm 来安装 pnpm：

```bash
npm install -g pnpm
```

### 3. 验证安装

安装完成后，可以通过以下命令来验证 pnpm 是否安装成功：

```bash
pnpm -v
```

### 4. 安装项目依赖

进入你的项目目录，使用 pnpm 安装项目依赖：

```bash
cd your-project-directory
pnpm install
```