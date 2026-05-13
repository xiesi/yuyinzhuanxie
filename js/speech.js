class SpeechRecognitionManager {
    constructor() {
        this.ws = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.onTranscript = null;
        this.onStatusChange = null;
        this.onDebug = null;
    }

    log(message) {
        if (this.onDebug) {
            this.onDebug(message);
        }
        console.log(message);
    }

    connect(url) {
        return new Promise((resolve, reject) => {
            this.log(`正在连接到 ${url}...`);
            
            try {
                this.ws = new WebSocket(url);
                
                this.ws.onopen = () => {
                    this.log('✓ WebSocket 连接成功');
                    if (this.onStatusChange) {
                        this.onStatusChange('connected');
                    }
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                };

                this.ws.onerror = (error) => {
                    this.log('✗ WebSocket 错误');
                    console.error(error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    this.log('WebSocket 连接已关闭');
                    if (this.onStatusChange) {
                        this.onStatusChange('disconnected');
                    }
                };
            } catch (e) {
                this.log('✗ WebSocket 连接失败');
                reject(e);
            }
        });
    }

    handleMessage(data) {
        if (data.type === 'status') {
            this.log(`服务器状态: ${data.status}`);
        } else if (data.type === 'transcript') {
            this.log(`收到转写: ${data.text}`);
            if (this.onTranscript) {
                this.onTranscript(data.text, data.isFinal);
            }
        }
    }

    async startRecording() {
        try {
            this.log('正在请求麦克风权限...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1
                }
            });

            this.log('✓ 麦克风权限获取成功');

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    this.sendAudioChunk(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.log('录音已停止');
            };

            this.mediaRecorder.start(1000);
            this.isRecording = true;

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'start',
                    timestamp: new Date().toISOString()
                }));
            }

            this.log('✓ 开始录音');
            return true;

        } catch (e) {
            this.log('✗ 无法获取麦克风权限');
            console.error(e);
            return false;
        }
    }

    sendAudioChunk(chunk) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const arrayBuffer = reader.result;
            const audioData = new Float32Array(arrayBuffer);
            
            this.ws.send(JSON.stringify({
                type: 'audio',
                data: Array.from(audioData),
                timestamp: new Date().toISOString()
            }));
        };
        reader.readAsArrayBuffer(chunk);
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'stop',
                    timestamp: new Date().toISOString()
                }));
            }

            this.log('录音已停止');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
