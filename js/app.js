class App {
    constructor() {
        this.storage = new Storage();
        this.speechManager = new SpeechRecognitionManager();
        this.summaryGenerator = new SummaryGenerator();
        
        this.currentRole = 'judge';
        this.isRecording = false;
        this.isConnected = false;

        this.roleNames = {
            judge: '法官',
            plaintiff: '原告',
            defendant: '被告',
            clerk: '书记员'
        };

        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadTranscripts();
        this.setupSpeechManager();
        this.debugLog('应用初始化完成');
    }

    bindElements() {
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.transcriptContainer = document.getElementById('transcriptContainer');
        this.summaryPanel = document.getElementById('summaryPanel');
        this.summaryContent = document.getElementById('summaryContent');
        this.clearBtn = document.getElementById('clearBtn');
        this.summaryBtn = document.getElementById('summaryBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.statusDot = document.querySelector('.status-dot');
        this.statusText = document.getElementById('statusText');
        this.debugLogEl = document.getElementById('debugLog');
        this.connectBtn = document.getElementById('connectBtn');
        this.wsUrlInput = document.getElementById('wsUrl');
        this.engineTypeEl = document.getElementById('engineType');
    }

    bindEvents() {
        document.querySelectorAll('.speaker-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setRole(btn.dataset.role);
            });
        });

        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.clearBtn.addEventListener('click', () => this.clearTranscripts());
        this.summaryBtn.addEventListener('click', () => this.generateSummary());
        this.exportBtn.addEventListener('click', () => this.exportTranscripts());
        this.connectBtn.addEventListener('click', () => this.connectToServer());

        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addManualTranscript(btn.dataset.text);
            });
        });
    }

    setupSpeechManager() {
        this.speechManager.onTranscript = (text, isFinal) => {
            if (isFinal) {
                this.addTranscript(text);
            }
        };

        this.speechManager.onStatusChange = (status) => {
            this.updateConnectionStatus(status);
        };

        this.speechManager.onDebug = (message) => {
            this.debugLog(message);
        };
    }

    setRole(role) {
        this.currentRole = role;
        document.querySelectorAll('.speaker-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.role === role) {
                btn.classList.add('active');
            }
        });
    }

    async connectToServer() {
        const url = this.wsUrlInput.value.trim();
        if (!url) {
            alert('请输入服务器地址');
            return;
        }

        try {
            this.updateConnectionStatus('connecting');
            await this.speechManager.connect(url);
            this.isConnected = true;
            this.engineTypeEl.textContent = url.includes('8765') ? 'Fun-ASR' : '模拟模式';
        } catch (e) {
            this.debugLog('连接失败，请检查服务器是否启动');
            this.updateConnectionStatus('disconnected');
        }
    }

    updateConnectionStatus(status) {
        this.statusDot.classList.remove('connected', 'connecting');
        
        if (status === 'connected') {
            this.statusDot.classList.add('connected');
            this.statusText.textContent = '已连接';
        } else if (status === 'connecting') {
            this.statusDot.classList.add('connecting');
            this.statusText.textContent = '连接中...';
        } else {
            this.statusText.textContent = '未连接';
        }
    }

    async startRecording() {
        if (!this.isConnected) {
            alert('请先连接到语音识别服务器');
            return;
        }

        const success = await this.speechManager.startRecording();
        if (success) {
            this.isRecording = true;
            this.recordBtn.disabled = true;
            this.recordBtn.classList.add('recording');
            this.stopBtn.disabled = false;
        }
    }

    stopRecording() {
        this.speechManager.stopRecording();
        this.isRecording = false;
        this.recordBtn.disabled = false;
        this.recordBtn.classList.remove('recording');
        this.stopBtn.disabled = true;
    }

    addTranscript(text) {
        const transcript = {
            role: this.currentRole,
            text: text,
            timestamp: new Date().toISOString()
        };

        this.storage.add(transcript);
        this.renderTranscript(transcript);
    }

    addManualTranscript(text) {
        this.addTranscript(text);
    }

    renderTranscript(transcript) {
        const emptyState = this.transcriptContainer.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const item = document.createElement('div');
        item.className = `transcript-item ${transcript.role}`;
        
        const time = new Date(transcript.timestamp).toLocaleTimeString('zh-CN');
        const roleName = this.roleNames[transcript.role] || transcript.role;

        item.innerHTML = `
            <div class="transcript-header">
                <span class="transcript-role">${roleName}</span>
                <span class="transcript-time">${time}</span>
            </div>
            <div class="transcript-text">${this.escapeHtml(transcript.text)}</div>
        `;

        this.transcriptContainer.appendChild(item);
        this.transcriptContainer.scrollTop = this.transcriptContainer.scrollHeight;
    }

    loadTranscripts() {
        const transcripts = this.storage.getAll();
        if (transcripts.length > 0) {
            const emptyState = this.transcriptContainer.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }
            transcripts.forEach(t => this.renderTranscript(t));
        }
    }

    clearTranscripts() {
        if (confirm('确定要清空所有记录吗？')) {
            this.storage.clear();
            this.transcriptContainer.innerHTML = `
                <div class="empty-state">
                    <p>点击"开始录音"开始语音转写</p>
                    <p>或使用快捷输入添加内容</p>
                </div>
            `;
            this.summaryPanel.style.display = 'none';
            this.debugLog('已清空所有记录');
        }
    }

    generateSummary() {
        const transcripts = this.storage.getAll();
        const summary = this.summaryGenerator.generate(transcripts);
        
        if (summary) {
            this.summaryContent.innerHTML = this.summaryGenerator.renderHTML(summary);
            this.summaryPanel.style.display = 'block';
            this.debugLog('已生成庭审总结');
        } else {
            alert('没有可总结的内容');
        }
    }

    exportTranscripts() {
        const transcripts = this.storage.getAll();
        if (transcripts.length === 0) {
            alert('没有可导出的内容');
            return;
        }

        const summary = this.summaryGenerator.generate(transcripts);
        let content = '=' .repeat(50) + '\n';
        content += '           法 庭 庭 审 记 录\n';
        content += '=' . repeat(50) + '\n\n';
        
        if (summary) {
            content += `时间范围: ${summary.timeRange.start} - ${summary.timeRange.end}\n`;
            content += `参与人员: ${summary.participants.join('、')}\n\n`;
            content += '-'.repeat(50) + '\n';
            content += '详细记录:\n\n';
            content += summary.fullText;
            content += '\n\n' + '-'.repeat(50) + '\n';
            content += '庭审总结:\n\n';
            content += '关键点:\n';
            summary.keyPoints.forEach(kp => {
                content += `- [${kp.time}] ${kp.role}: ${kp.text}\n`;
            });
        }

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `庭审记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        this.debugLog('已导出庭审记录');
    }

    debugLog(message) {
        const time = new Date().toLocaleTimeString('zh-CN');
        const entry = document.createElement('div');
        entry.className = 'debug-log-entry';
        entry.innerHTML = `<span class="time">[${time}]</span> ${this.escapeHtml(message)}`;
        this.debugLogEl.appendChild(entry);
        this.debugLogEl.scrollTop = this.debugLogEl.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
