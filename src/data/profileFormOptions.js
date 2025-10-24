export const ENGLISH_LEVEL_OPTIONS = [
    {
        label: '初级 (Beginner)',
        value: 'A1-A2',
        description: '能理解常见词汇与简单句式，适合基础日常交流。',
        examples: ['认识常见单词，如 family, food, work', "能进行简单问候，如 “How are you?”"],
    },
    {
        label: '中级 (Intermediate)',
        value: 'B1-B2',
        description: '可以就熟悉话题交流，在学习或工作中使用英语。',
        examples: ['能描述经历、兴趣或计划', '能处理会议、邮件或社交沟通'],
    },
    {
        label: '高级 (Advanced)',
        value: 'C1',
        description: '能流利表达复杂观点，理解高难度材料。',
        examples: ['理解学术讲座或商务报告', '能深入讨论抽象主题并表达见解'],
    },
    {
        label: '精通 (Proficient)',
        value: 'C2',
        description: '接近母语水平，可在任何场景自然使用英语。',
        examples: ['阅读专业文献并精准用词', '参与文化或哲学类深度讨论'],
    },
];

export const LEARNING_CONTEXT_OPTIONS = [
    {
        label: '日常生活英语',
        value: 'Daily Life English',
        examples: ['超市购物、点餐、寒暄', '看电影、与朋友闲聊'],
    },
    {
        label: '职场英语',
        value: 'Business English',
        examples: ['商务会议表达、写英文邮件', '面试沟通、项目汇报'],
    },
    {
        label: '出国旅游',
        value: 'Travel English',
        examples: ['订酒店、问路、机场沟通', '餐厅点餐、购物退税'],
    },
    {
        label: '学术英语',
        value: 'Academic English',
        examples: ['撰写论文、学术演讲', '阅读英文研究资料'],
    },
    {
        label: '考试准备',
        value: 'Exam Preparation',
        examples: ['托福、雅思、CET、GRE 词汇与写作训练', '模拟听力与口语考试'],
    },
    {
        label: '留学 / 移民',
        value: 'Study Abroad / Immigration',
        examples: ['签证面试、文化适应、课堂表达', '日常沟通与学术交流'],
    },
    {
        label: '兴趣学习（影视、音乐等）',
        value: 'Hobby / Pop Culture',
        examples: ['电影对白学习、歌词解析', '娱乐节目听力与表达模仿'],
    },
    {
        label: '口语练习',
        value: 'Speaking Practice',
        examples: ['AI 对话练习、语音纠错', '模拟真实交流场景'],
    },
];

export const getEnglishLevelByValue = value => ENGLISH_LEVEL_OPTIONS.find(option => option.value === value) || null;

export const getLearningContextByValue = value =>
    LEARNING_CONTEXT_OPTIONS.find(option => option.value === value) || null;

export const MAX_CONTEXT_SELECTIONS = 3;

const legacyEnglishLevelMap = new Map([
    ['小白', 'A1-A2'],
    ['过了4级', 'B1-B2'],
    ['过了六级', 'C1'],
    ['过了6级', 'C1'],
    ['雅思7+', 'C2'],
    ['初高中', 'B1-B2'],
]);

export const mapLegacyEnglishLevel = raw => {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (legacyEnglishLevelMap.has(trimmed)) {
        return legacyEnglishLevelMap.get(trimmed);
    }
    const match = ENGLISH_LEVEL_OPTIONS.find(item => item.label === trimmed || item.value === trimmed);
    return match ? match.value : trimmed;
};

const legacyContextMap = new Map([
    ['商务会议', 'Business English'],
    ['职场沟通', 'Business English'],
    ['日常生活', 'Daily Life English'],
    ['出国旅行', 'Travel English'],
    ['学术写作', 'Academic English'],
    ['兴趣社交', 'Hobby / Pop Culture'],
]);

export const mapLegacyContextValues = list => {
    if (!Array.isArray(list)) return [];
    const normalized = [];
    list.forEach(item => {
        if (typeof item !== 'string') return;
        const trimmed = item.trim();
        if (!trimmed) return;
        if (legacyContextMap.has(trimmed)) {
            normalized.push(legacyContextMap.get(trimmed));
            return;
        }
        const match = LEARNING_CONTEXT_OPTIONS.find(option => option.value === trimmed || option.label === trimmed);
        normalized.push(match ? match.value : trimmed);
    });
    return Array.from(new Set(normalized));
};
