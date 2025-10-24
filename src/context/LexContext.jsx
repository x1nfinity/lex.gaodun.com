import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_HOT_WORDS = [
    {
        word: 'charger',
        translation: 'n. 充电器；充电线',
        pronunciation: '/ˈtʃɑːrdʒər/',
        likes: '12K',
        practices: '9.3K',
    },
    {
        word: 'prototype',
        translation: 'n. 原型；样机',
        pronunciation: '/ˈproʊtəˌtaɪp/',
        likes: '8.4K',
        practices: '6.1K',
    },
    {
        word: 'landscape',
        translation: 'n. 风景；地貌',
        pronunciation: '/ˈlændˌskeɪp/',
        likes: '9.8K',
        practices: '7.6K',
    },
    {
        word: 'sprint',
        translation: 'v. 冲刺；加速完成',
        pronunciation: '/sprɪnt/',
        likes: '6.7K',
        practices: '5.2K',
    },
    {
        word: 'spectrum',
        translation: 'n. 光谱；范围',
        pronunciation: '/ˈspɛktrəm/',
        likes: '7.4K',
        practices: '5.9K',
    },
    {
        word: 'momentum',
        translation: 'n. 动量；发展势头',
        pronunciation: '/moʊˈmɛntəm/',
        likes: '11K',
        practices: '8.1K',
    },
];

const STORAGE_KEYS = {
    hotWords: 'lex.hotwords.v1',
    cache: 'lex.dictionary.cache.v1',
    profile: 'lex.user.profile.v1',
};

const DEFAULT_PROFILE = {
    nickname: '',
    englishLevel: '',
    contentPreferences: [],
};

const DOUBAO_CONFIG = {
    apiKey: 'bd747896-e89b-46f4-a5ab-0a232d086845',
    endpointId: 'ep-20251015101857-wc8xz',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
};

const isBrowser = typeof window !== 'undefined';

const safeReadFromStorage = (key, fallback) => {
    if (!isBrowser) return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
    } catch (error) {
        console.warn(`Failed to read ${key} from storage`, error);
        return fallback;
    }
};

const mergeMeaningList = meanings => {
    if (!Array.isArray(meanings)) {
        if (typeof meanings === 'string' && meanings.trim()) {
            return [{ title: '释义', description: meanings.trim() }];
        }
        return [];
    }

    return meanings
        .map(item => {
            if (typeof item === 'string') {
                return { title: '释义', description: item.trim() };
            }
            if (!item || typeof item !== 'object') return null;
            const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : '释义';
            const description = typeof item.description === 'string' && item.description.trim() ? item.description.trim() : '';
            if (!description) return null;
            return { title, description };
        })
        .filter(Boolean)
        .slice(0, 6);
};

const mergeExampleList = examples => {
    if (!Array.isArray(examples)) {
        if (typeof examples === 'string' && examples.trim()) {
            return [{ en: examples.trim(), zh: '暂无翻译' }];
        }
        return [];
    }

    return examples
        .map(item => {
            if (typeof item === 'string') {
                return { en: item.trim(), zh: '暂无翻译' };
            }
            if (!item || typeof item !== 'object') return null;
            const en = typeof item.en === 'string' && item.en.trim() ? item.en.trim() : '';
            const zh = typeof item.zh === 'string' && item.zh.trim() ? item.zh.trim() : '暂无翻译';
            if (!en) return null;
            return { en, zh };
        })
        .filter(Boolean)
        .slice(0, 4);
};

const mergePhraseList = phrases => {
    if (!Array.isArray(phrases)) {
        if (typeof phrases === 'string' && phrases.trim()) {
            return [phrases.trim()];
        }
        return [];
    }
    return phrases
        .map(item => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
        .slice(0, 8);
};

const normalizeMessageContent = content => {
    if (!content) return '';
    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
        return content
            .map(item => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object' && typeof item.text === 'string') {
                    return item.text;
                }
                return '';
            })
            .join('')
            .trim();
    }
    if (typeof content === 'object' && typeof content.text === 'string') {
        return content.text.trim();
    }
    return '';
};

const normalizeProfile = raw => {
    if (!raw || typeof raw !== 'object') {
        return { ...DEFAULT_PROFILE };
    }

    const nickname = typeof raw.nickname === 'string' && raw.nickname.trim() ? raw.nickname.trim() : '';
    const englishLevel = typeof raw.englishLevel === 'string' && raw.englishLevel.trim() ? raw.englishLevel.trim() : '';
    const contentPreferences = Array.isArray(raw.contentPreferences)
        ? Array.from(new Set(raw.contentPreferences.map(item => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)))
        : [];

    return {
        nickname,
        englishLevel,
        contentPreferences,
    };
};

const extractJsonPayload = raw => {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch {
                // swallow and fall through to null
            }
        }
    }
    return null;
};

const normalizeDoubaoDetail = (rawDetail, fallbackWord) => {
    if (!rawDetail || typeof rawDetail !== 'object') {
        throw new Error('模型返回内容格式不正确');
    }
    console.log(rawDetail, 'rawDetail');

    const meanings = mergeMeaningList(rawDetail.meanings);
    if (meanings.length === 0) {
        const fallbackTranslation =
            typeof rawDetail.translation === 'string' && rawDetail.translation.trim() ? rawDetail.translation.trim() : '暂无释义';
        meanings.push({ title: '释义', description: fallbackTranslation });
    }

    const examples = mergeExampleList(rawDetail.examples);
    if (examples.length === 0) {
        examples.push({
            en: '暂无例句',
            zh: '稍后再试',
        });
    }

    const phrases = mergePhraseList(rawDetail.phrases);

    const phonetic = rawDetail.phonetic && typeof rawDetail.phonetic === 'object' ? rawDetail.phonetic : {};
    const us = phonetic.us && typeof phonetic.us === 'object' ? phonetic.us : {};
    const uk = phonetic.uk && typeof phonetic.uk === 'object' ? phonetic.uk : {};

    return {
        word: typeof rawDetail.word === 'string' && rawDetail.word.trim() ? rawDetail.word.trim() : fallbackWord,
        translation:
            typeof rawDetail.translation === 'string' && rawDetail.translation.trim()
                ? rawDetail.translation.trim()
                : (meanings[0]?.description ?? '暂无释义'),
        phonetic: {
            us: {
                text: typeof us.text === 'string' && us.text.trim() ? us.text.trim() : '暂无音标',
                audio: typeof us.audio === 'string' ? us.audio : '',
            },
            uk: {
                text: typeof uk.text === 'string' && uk.text.trim() ? uk.text.trim() : '暂无音标',
                audio: typeof uk.audio === 'string' ? uk.audio : '',
            },
        },
        partOfSpeech: typeof rawDetail.partOfSpeech === 'string' && rawDetail.partOfSpeech.trim() ? rawDetail.partOfSpeech.trim() : '',
        frequency: typeof rawDetail.frequency === 'string' && rawDetail.frequency.trim() ? rawDetail.frequency.trim() : '',
        inflections: typeof rawDetail.inflections === 'string' && rawDetail.inflections.trim() ? rawDetail.inflections.trim() : '',
        meanings,
        examples,
        phrases,
        source: 'doubao',
    };
};

const buildDoubaoPrompt = (word, profile) => {
    const nickname = typeof profile?.nickname === 'string' && profile.nickname.trim() ? profile.nickname.trim() : '学习者';
    const englishLevel =
        typeof profile?.englishLevel === 'string' && profile.englishLevel.trim() ? profile.englishLevel.trim() : '未知水平';
    const contentPreferences =
        Array.isArray(profile?.contentPreferences) && profile.contentPreferences.length > 0
            ? profile.contentPreferences.join('、')
            : '未提供';

    return `请扮演英文词典专家，为英文单词 "${word}" 提供精确的中文词典词条。
用户画像：
- 昵称：${nickname}
- 英语水平：${englishLevel}
- 内容偏好：${contentPreferences}
请根据用户英语水平控制释义与例句难度，并在例句中优先选用符合用户偏好的情境。
你必须仅返回一个 JSON 对象，不得包含多余文本或说明。
JSON 需要包含以下字段：
- word: 单词原文
- translation: 最常用的中文释义，简洁明了
- phonetic: 包含 us 和 uk 两个子字段，每个字段包含 text（音标）和 audio（若无则留空字符串）
- partOfSpeech: 主要词性
- frequency: 以中文描述单词使用频率（如“较常用”），若无数据返回为空白字符串
- inflections: 常见词形变化，无数据写返回空白字符串
- meanings: 数组，每项为 { "title": "词性或标签", "description": "中文释义" }，按重要性排序，至多 6 条
- examples: 数组，每项为 { "en": "英文例句", "zh": "对应中文翻译" }，提供 2-4 条，与用户水平相符并贴合其偏好情境
- phrases: 数组，列出 3-6 个常见搭配或近义短语，中文或英文均可`;
};

const LexContext = createContext(null);

export const LexProvider = ({ children }) => {
    const [hotWords, setHotWords] = useState(() => safeReadFromStorage(STORAGE_KEYS.hotWords, DEFAULT_HOT_WORDS));
    const [cache, setCache] = useState(() => safeReadFromStorage(STORAGE_KEYS.cache, {}));
    const [profile, setProfile] = useState(() => normalizeProfile(safeReadFromStorage(STORAGE_KEYS.profile, DEFAULT_PROFILE)));

    const cacheRef = useRef(cache);
    const profileRef = useRef(profile);

    useEffect(() => {
        cacheRef.current = cache;
        if (isBrowser) {
            window.localStorage.setItem(STORAGE_KEYS.cache, JSON.stringify(cache));
        }
    }, [cache]);

    useEffect(() => {
        profileRef.current = profile;
        if (isBrowser) {
            window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
        }
    }, [profile]);

    useEffect(() => {
        if (isBrowser) {
            window.localStorage.setItem(STORAGE_KEYS.hotWords, JSON.stringify(hotWords));
        }
    }, [hotWords]);

    const saveUserProfile = useCallback(nextProfile => {
        setProfile(normalizeProfile(nextProfile));
    }, []);

    const isProfileComplete = Boolean(profile?.nickname && profile?.englishLevel);

    const updateHotWords = useCallback(detail => {
        setHotWords(prevHotWords => {
            const list = Array.isArray(prevHotWords) ? prevHotWords : [];
            const summary = {
                word: detail.word,
                translation: detail.translation || '暂无释义',
                pronunciation: detail.phonetic?.us?.text || detail.phonetic?.uk?.text || '',
                likes: detail.likes ?? '—',
                practices: detail.practices ?? '—',
            };
            const filtered = list.filter(item => item.word.toLowerCase() !== summary.word.toLowerCase());
            return [summary, ...filtered].slice(0, 12);
        });
    }, []);

    const fetchWordDetail = useCallback(
        async rawWord => {
            const normalized = rawWord?.trim().toLowerCase();
            if (!normalized) {
                throw new Error('请输入要查询的单词');
            }

            const cachedEntry = cacheRef.current[normalized];
            if (cachedEntry) {
                updateHotWords(cachedEntry.detail);
                return cachedEntry.detail;
            }

            const response = await fetch(DOUBAO_CONFIG.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${DOUBAO_CONFIG.apiKey}`,
                },
                body: JSON.stringify({
                    model: DOUBAO_CONFIG.endpointId,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的英汉词典专家。始终仅返回 JSON 对象，不要包含额外文本。',
                        },
                        {
                            role: 'user',
                            content: buildDoubaoPrompt(normalized, profileRef.current),
                        },
                    ],
                }),
            });
            const data = await response.json();

            if (!response.ok) {
                const message = data?.error?.message || data?.message || (typeof data === 'string' ? data : '') || '查询失败，请稍后再试';
                throw new Error(message);
            }

            const choice = data?.choices?.[0];
            if (!choice || !choice.message) {
                throw new Error('未从模型获取到结果');
            }

            const contentText = normalizeMessageContent(choice.message.content);
            const payload = extractJsonPayload(contentText);
            if (!payload) {
                throw new Error('模型返回内容无法解析，请稍后再试');
            }

            const detail = normalizeDoubaoDetail(payload, normalized);

            setCache(prev => ({
                ...prev,
                [normalized]: {
                    detail,
                    fetchedAt: Date.now(),
                },
            }));
            updateHotWords(detail);
            return detail;
        },
        [updateHotWords]
    );

    const value = useMemo(
        () => ({
            hotWords,
            fetchWordDetail,
            userProfile: profile,
            isProfileComplete,
            saveUserProfile,
        }),
        [hotWords, fetchWordDetail, profile, isProfileComplete, saveUserProfile]
    );

    return <LexContext.Provider value={value}>{children}</LexContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLexContext = () => {
    const context = useContext(LexContext);
    if (!context) {
        throw new Error('useLexContext must be used within a LexProvider');
    }
    return context;
};
