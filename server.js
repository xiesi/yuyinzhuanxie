const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

const clients = new Map();

wss.on('connection', (ws) => {
  console.log('新客户端连接');
  
  const clientId = Date.now().toString();
  clients.set(clientId, ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'audio') {
        handleAudioData(clientId, data);
      } else if (data.type === 'start') {
        console.log('客户端开始录音');
        ws.send(JSON.stringify({
          type: 'status',
          status: 'connected'
        }));
      } else if (data.type === 'stop') {
        console.log('客户端停止录音');
      }
    } catch (error) {
      console.error('消息处理错误:', error);
    }
  });

  ws.on('close', () => {
    console.log('客户端断开连接');
    clients.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
  });
});

function handleAudioData(clientId, data) {
  const ws = clients.get(clientId);
  if (!ws) return;

  const mockTranscriptions = [
    '现在开庭',
    '请原告陈述诉讼请求',
    '请被告进行答辩',
    '请出示证据',
    '现在进行法庭调查',
    '我不同意这个观点',
    '同意',
    '现在休庭'
  ];

  if (Math.random() > 0.7) {
    const text = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    ws.send(JSON.stringify({
      type: 'transcript',
      text: text,
      isFinal: true,
      timestamp: new Date().toISOString()
    }));
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '法庭语音转写系统运行中' });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     法庭语音转写系统 - 服务器已启动                         ║
║                                                            ║
║     访问地址: http://localhost:${PORT}                        ║
║                                                            ║
║     注意: 本版本使用模拟转写，如需集成 Fun-ASR              ║
║           请参考 README.md 文档                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
