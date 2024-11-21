# 数字人标准 PaaS Demo

[English](./README_EN.md)

本项目包含前端页面和后端接口，旨在为开发者提供参考示例。

该工程要正常运行起来，需要通时把后端服务和前端服务都启动起来。后端服务在 server 目录下, 负责为调用数字人PaaS接口提供生成token的能力.
前端服务在 src 目录下，负责显示页面和完成UI交互逻辑, 并从 server 获取 token 后调用数字人PaaS接口，创建数字人和使用文本驱动, 同时也创了 Express 示例, 拉取数字人生成的视频流进行显示.

页面的主要逻辑集中在`src/components/HelloWorld.vue`文件中。

## 快速开始

### 1. 配置后端服务

- **复制配置文件**：将 `./server/tokens.json.example` 复制并重命名为 `./server/tokens.json`。
- **修改配置**：编辑 `./server/tokens.json` 文件，将 `appid` 和 `serverSecret` 替换为您的实际值。

### 2. 启动后端服务

- **进入目录**：`cd ./server`
- **安装依赖**：`npm install`
- **启动服务**：`npm start`

### 3. 配置前端应用

- **修改配置文件**：编辑 `./src/config.ts` 文件，按需修改 `AppId` 和 `RtcServer` 的值。`ApiServer` 一般不需要修改, 如果ZEGO提供了其他域名才需要变更.

### 4. 启动前端应用

- **进入目录**：`cd ./src`
- **安装依赖**：`npm install`
- **启动服务**：`npm run serve`

### 5. 访问应用

- **访问本地服务**: `./src/config.ts` 中配置了 `Test` 和 `Prod` 两个环境, 如果是本地运行的 `server`, 那么页面的url需要加上 `?test=1`, 如: `http://localhost:8081/?test=1`.


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