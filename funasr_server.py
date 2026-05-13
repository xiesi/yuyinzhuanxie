#!/usr/bin/env python3
"""
Fun-ASR 语音识别服务器
用于法庭语音转写系统
"""

import asyncio
import websockets
import json
import argparse
from funasr import AutoModel
import numpy as np

class FunASRServer:
    def __init__(self, host='0.0.0.0', port=8765):
        self.host = host
        self.port = port
        self.model = None
        self.load_model()
    
    def load_model(self):
        print("正在加载 Fun-ASR 模型...")
        try:
            self.model = AutoModel(model="paraformer-zh", 
                                   model_revision="v2.0.4",
                                   disable_update=True)
            print("✓ Fun-ASR 模型加载成功")
        except Exception as e:
            print(f"✗ 模型加载失败: {e}")
            print("提示: 请先安装 FunASR: pip install funasr modelscope")
    
    async def handle_client(self, websocket, path):
        print(f"新客户端连接: {websocket.remote_address}")
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    
                    if data['type'] == 'start':
                        await websocket.send(json.dumps({
                            'type': 'status',
                            'status': 'connected'
                        }))
                        print("录音开始")
                    
                    elif data['type'] == 'audio':
                        result = self.process_audio(data)
                        if result:
                            await websocket.send(json.dumps({
                                'type': 'transcript',
                                'text': result,
                                'isFinal': True,
                                'timestamp': data.get('timestamp', '')
                            }))
                    
                    elif data['type'] == 'stop':
                        print("录音停止")
                
                except json.JSONDecodeError:
                    print("JSON 解析错误")
                except Exception as e:
                    print(f"处理错误: {e}")
        
        except websockets.exceptions.ConnectionClosed:
            print(f"客户端断开连接: {websocket.remote_address}")
    
    def process_audio(self, data):
        if not self.model:
            return None
        
        try:
            audio_data = np.array(data['data'], dtype=np.float32)
            
            result = self.model.generate(
                input=audio_data,
                batch_size_s=0,
                batch_size_threshold_s=60
            )
            
            if result and len(result) > 0:
                return result[0]['text']
            return None
            
        except Exception as e:
            print(f"音频处理错误: {e}")
            return None
    
    def start(self):
        print(f"""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     Fun-ASR 语音识别服务器                                  ║
║                                                            ║
║     监听地址: ws://{self.host}:{self.port}                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
        """)
        
        start_server = websockets.serve(self.handle_client, self.host, self.port)
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()

def main():
    parser = argparse.ArgumentParser(description='Fun-ASR 语音识别服务器')
    parser.add_argument('--host', default='0.0.0.0', help='监听地址')
    parser.add_argument('--port', type=int, default=8765, help='监听端口')
    args = parser.parse_args()
    
    server = FunASRServer(host=args.host, port=args.port)
    server.start()

if __name__ == '__main__':
    main()
