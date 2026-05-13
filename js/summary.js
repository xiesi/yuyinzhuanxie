class SummaryGenerator {
    constructor() {
        this.roleNames = {
            judge: '法官',
            plaintiff: '原告',
            defendant: '被告',
            clerk: '书记员'
        };
    }

    generate(transcripts) {
        if (!transcripts || transcripts.length === 0) {
            return null;
        }

        const summary = {
            timeRange: this.getTimeRange(transcripts),
            participants: this.getParticipants(transcripts),
            keyPoints: this.extractKeyPoints(transcripts),
            evidence: this.extractEvidence(transcripts),
            fullText: this.getFullText(transcripts)
        };

        return summary;
    }

    getTimeRange(transcripts) {
        const times = transcripts.map(t => new Date(t.timestamp));
        return {
            start: times[0].toLocaleString('zh-CN'),
            end: times[times.length - 1].toLocaleString('zh-CN')
        };
    }

    getParticipants(transcripts) {
        const roles = new Set();
        transcripts.forEach(t => roles.add(t.role));
        return Array.from(roles).map(r => this.roleNames[r] || r);
    }

    extractKeyPoints(transcripts) {
        const keywords = ['请求', '答辩', '事实', '理由', '证据', '同意', '不同意', '承认', '否认'];
        const keyPoints = [];

        transcripts.forEach(t => {
            const text = t.text || '';
            const hasKeyword = keywords.some(kw => text.includes(kw));
            
            if (hasKeyword || text.length > 20) {
                keyPoints.push({
                    role: this.roleNames[t.role] || t.role,
                    text: text,
                    time: new Date(t.timestamp).toLocaleTimeString('zh-CN')
                });
            }
        });

        return keyPoints;
    }

    extractEvidence(transcripts) {
        const evidence = [];
        transcripts.forEach(t => {
            const text = t.text || '';
            if (text.includes('证据') || text.includes('证明')) {
                evidence.push({
                    role: this.roleNames[t.role] || t.role,
                    text: text,
                    time: new Date(t.timestamp).toLocaleTimeString('zh-CN')
                });
            }
        });
        return evidence;
    }

    getFullText(transcripts) {
        return transcripts.map(t => {
            const roleName = this.roleNames[t.role] || t.role;
            const time = new Date(t.timestamp).toLocaleTimeString('zh-CN');
            return `[${time}] ${roleName}: ${t.text}`;
        }).join('\n');
    }

    renderHTML(summary) {
        if (!summary) return '<p>没有可总结的内容</p>';

        return `
            <div class="summary-section">
                <h4>📅 时间范围</h4>
                <p><strong>开始:</strong> ${summary.timeRange.start}</p>
                <p><strong>结束:</strong> ${summary.timeRange.end}</p>
            </div>
            <div class="summary-section">
                <h4>👥 参与人员</h4>
                <p>${summary.participants.join('、')}</p>
            </div>
            <div class="summary-section">
                <h4>📝 关键点</h4>
                ${summary.keyPoints.length > 0 ? 
                    summary.keyPoints.map(kp => `
                        <p><strong>[${kp.time}] ${kp.role}:</strong> ${kp.text}</p>
                    `).join('') :
                    '<p>未识别到明显关键点</p>'
                }
            </div>
            <div class="summary-section">
                <h4>📋 证据相关</h4>
                ${summary.evidence.length > 0 ?
                    summary.evidence.map(e => `
                        <p><strong>[${e.time}] ${e.role}:</strong> ${e.text}</p>
                    `).join('') :
                    '<p>未识别到证据相关内容</p>'
                }
            </div>
            <div class="summary-section">
                <h4>📄 完整记录</h4>
                <pre style="white-space: pre-wrap; background: #f8f9fa; padding: 15px; border-radius: 8px;">${summary.fullText}</pre>
            </div>
        `;
    }
}
