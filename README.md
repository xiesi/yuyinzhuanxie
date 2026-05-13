# 法庭语音转写系统

集成 Fun-ASR 的法庭语音转写系统，支持实时语音识别、角色标记、时间戳记录和庭审总结生成。

## 功能特性

- 🎤 实时语音转写
- 👥 多角色支持（法官、原告、被告、书记员）
- ⏱️ 自动时间戳记录
- 📝 庭审总结生成
- 📄 记录导出功能
- 🔌 WebSocket 实时通信
- 🐍 Fun-ASR 集成（可选）

## 系统架构

```
┌─────────────────┐         WebSocket         ┌─────────────────┐
│   浏览器前端    │ ◄───────────────────────► │ 后端 ASR 服务   │
│  (HTML/JS/CSS)  │                           │  (Node/Python)  │
└─────────────────┘                           └─────────────────┘
```

## 快速开始

### 方式一：使用模拟模式（快速测试）

1. 安装依赖：
```bash
npm install
```

2. 启动服务器：
```bash
npm start
```

3. 在浏览器中打开：`http://localhost:3000`

### 方式二：集成 Fun-ASR（推荐）

#### 前置要求

- Python 3.7+
- Node.js 14+

#### 1. 安装 Fun-ASR

```bash
pip install funasr modelscope websockets
```

#### 2. 启动 Fun-ASR 服务器

```bash
python funasr_server.py
```

服务器将在 `ws://localhost:8765` 启动。

#### 3. 启动前端服务器（新终端）

```bash
npm install
npm start
```

#### 4. 使用系统

1. 在浏览器打开 `http://localhost:3000`
2. 将服务器地址改为 `ws://localhost:8765`
3. 点击"连接"
4. 选择发言角色，点击"开始录音"

## 项目结构

```
/workspace/
├── index.html              # 主页面
├── server.js               # Node.js 后端服务器（模拟模式）
├── funasr_server.py        # Fun-ASR Python 服务器
├── package.json            # Node.js 依赖配置
├── css/
│   └── styles.css          # 样式文件
└── js/
    ├── app.js              # 主应用逻辑
    ├── speech.js           # 语音识别管理
    ├── storage.js          # 本地存储管理
    └── summary.js          # 总结生成器
```

## 使用说明

### 基本操作

1. **连接服务器**
   - 输入 WebSocket 服务器地址
   - 点击"连接"按钮

2. **选择角色**
   - 点击左侧角色按钮（法官/原告/被告/书记员）

3. **开始录音**
   - 点击"开始录音"按钮
   - 允许浏览器访问麦克风
   - 开始说话，系统会实时转写

4. **快捷输入**
   - 使用快捷按钮快速添加常用法庭用语

5. **生成总结**
   - 点击"生成总结"查看庭审摘要

6. **导出记录**
   - 点击"导出文档"保存庭审记录

## 配置说明

### 修改服务器端口

**Node.js 服务器**：编辑 `server.js`
```javascript
const PORT = process.env.PORT || 3000;  // 修改这里
```

**Fun-ASR 服务器**：
```bash
python funasr_server.py --port 8766
```

### 更换 Fun-ASR 模型

编辑 `funasr_server.py`：
```python
self.model = AutoModel(
    model="paraformer-zh",  # 可更换为其他模型
    model_revision="v2.0.4"
)
```

## 技术栈

- **前端**：HTML5, CSS3, Vanilla JavaScript
- **后端**：Node.js + Express / Python
- **语音识别**：Fun-ASR (阿里巴巴开源)
- **通信协议**：WebSocket
- **存储**：LocalStorage

## Fun-ASR 说明

[Fun-ASR](https://github.com/alibaba-damo-academy/FunASR) 是阿里巴巴达摩院开源的语音识别工具包，支持中文语音识别，具有识别准确率高、速度快等特点。

### 支持的模型

- `paraformer-zh`：中文通用模型（推荐）
- `paraformer-zh-streaming`：中文流式模型
- 更多模型请参考 Fun-ASR 文档

## 常见问题

### Q: 浏览器无法访问麦克风？

A: 请确保使用 HTTPS 或 localhost 访问，并在浏览器提示时允许麦克风权限。

### Q: Fun-ASR 模型下载慢？

A: 可以配置 ModelScope 镜像源，或手动下载模型到本地。

### Q: 识别准确率不高？

A: 可以尝试：
1. 使用更专业的模型
2. 提高录音质量
3. 在安静环境下使用

## 许可证

MIT License
