class Storage {
    constructor() {
        this.key = 'court_transcripts';
        this.transcripts = this.load();
    }

    load() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('加载数据失败:', e);
            return [];
        }
    }

    save() {
        try {
            localStorage.setItem(this.key, JSON.stringify(this.transcripts));
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    }

    add(transcript) {
        this.transcripts.push({
            id: Date.now(),
            ...transcript
        });
        this.save();
    }

    clear() {
        this.transcripts = [];
        this.save();
    }

    getAll() {
        return this.transcripts;
    }

    export() {
        return JSON.stringify(this.transcripts, null, 2);
    }
}
