import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    ENGLISH_LEVEL_OPTIONS,
    LEARNING_CONTEXT_OPTIONS,
    MAX_CONTEXT_SELECTIONS,
    getEnglishLevelByValue,
    getLearningContextByValue,
    mapLegacyContextValues,
    mapLegacyEnglishLevel,
} from '../data/profileFormOptions.js';

const DEFAULT_HOT_WORDS = [
    {
        word: 'abandon',
        translation: 'v. 放弃；抛弃',
        pronunciation: '/əˈbændən/',
        videoUrl: 'https://simg01.gaodunwangxiao.com/uploadfiles/tmp/upload/202510/24/81464_20251024150316.mp4',
    },
    {
        word: 'ambulance',
        translation: 'n. 救护车',
        pronunciation: '/ˈæmbjələns/',
        videoUrl: 'https://simg01.gaodunwangxiao.com/uploadfiles/tmp/upload/202510/24/f081a_20251024150831.mp4',
    },
    {
        word: 'charger',
        translation: 'n. 充电器；充电线',
        pronunciation: '/ˈtʃɑːrdʒər/',
        videoUrl: 'https://simg01.gaodunwangxiao.com/uploadfiles/tmp/upload/202510/24/6ed68_20251024150944.mov',
    },
    {
        word: 'chicken',
        translation: 'n. 鸡；鸡肉',
        pronunciation: '/ˈtʃɪkɪn/',
        videoUrl: 'https://simg01.gaodunwangxiao.com/uploadfiles/tmp/upload/202510/24/344be_20251024151004.mp4',
    },
    {
        word: 'crab',
        translation: 'n. 螃蟹',
        pronunciation: '/kræb/',
        videoUrl: 'https://simg01.gaodunwangxiao.com/uploadfiles/tmp/upload/202510/24/120e8_20251024161150.mp4',
    },
    {
        word: 'labor',
        translation: 'n. 劳动；工作',
        pronunciation: '/ˈleɪbər/',
        videoUrl: 'https://simg01.gaodunwangxiao.com/uploadfiles/tmp/upload/202510/24/63a5a_20251024161336.mp4',
    },
    {
        word: 'pest',
        translation: 'n. 害虫；讨厌的人',
        pronunciation: '/pest/',
        videoUrl: 'https://simg01.gaodunwangxiao.com/uploadfiles/tmp/upload/202510/24/8a022_20251024161326.mp4',
    },
    {
        word: 'shrimp',
        translation: 'n. 虾；小虾',
        pronunciation: '/ʃrɪmp/',
        videoUrl: 'https://simg01.gaodunwangxiao.com/uploadfiles/tmp/upload/202510/24/7dd44_20251024161350.mp4',
    },
];

const STORAGE_KEYS = {
    hotWords: 'lex.hotwords.v1',
    cache: 'lex.dictionary.cache.v1',
    profile: 'lex.user.profile.v1',
    dictionaryCache: 'lex.dictionary.api.cache.v1',
};

const DEFAULT_PROFILE = {
    nickname: '',
    englishLevel: '',
    contentPreferences: [],
};

const normalizeEnglishLevelValue = raw => {
    if (!raw) return '';
    if (typeof raw === 'string') {
        const mapped = mapLegacyEnglishLevel(raw);
        const normalized = getEnglishLevelByValue(mapped) || ENGLISH_LEVEL_OPTIONS.find(item => item.label === mapped);
        return normalized ? normalized.value : mapped.trim();
    }
    if (typeof raw === 'object') {
        if (raw === null) return '';
        if (typeof raw.value === 'string') {
            return normalizeEnglishLevelValue(raw.value);
        }
        if (typeof raw.label === 'string') {
            return normalizeEnglishLevelValue(raw.label);
        }
    }
    return '';
};

const normalizeLearningContexts = rawList => {
    if (!rawList) return [];
    if (Array.isArray(rawList)) {
        const normalized = mapLegacyContextValues(rawList)
            .map(item => {
                const option = getLearningContextByValue(item) || LEARNING_CONTEXT_OPTIONS.find(ctx => ctx.label === item);
                return option ? option.value : '';
            })
            .filter(Boolean);
        return normalized.slice(0, MAX_CONTEXT_SELECTIONS);
    }
    if (typeof rawList === 'object') {
        const { values } = rawList;
        if (Array.isArray(values)) {
            return normalizeLearningContexts(values);
        }
    }
    if (typeof rawList === 'string') {
        return normalizeLearningContexts(rawList.split(/[、,]/));
    }
    return [];
};

const formatEnglishLevelForPrompt = value => {
    const option = getEnglishLevelByValue(value);
    if (!option) {
        return value ? `${value}（未匹配到预设等级，按自定义水平处理）` : '未提供';
    }
    const exampleHint = option.examples.join('；');
    return `${option.label}（CEFR ${option.value}）
- 能力标签：${option.description}
- 学习示例：${exampleHint}`;
};

const formatLearningContextsForPrompt = values => {
    if (!Array.isArray(values) || values.length === 0) {
        return '未提供';
    }
    return values
        .map(value => {
            const option = getLearningContextByValue(value);
            if (!option) return `其他：${value}`;
            const exampleHint = option.examples.join('；');
            return `- ${option.label}（关注：${exampleHint}）`;
        })
        .join('\n');
};

const indentMultiline = (text, indent = '  ') =>
    String(text || '')
        .split('\n')
        .map(line => `${indent}${line}`)
        .join('\n');

const describeLearningContexts = values => {
    if (!Array.isArray(values) || values.length === 0) return '';
    return values
        .map(value => {
            const option = getLearningContextByValue(value);
            return option ? option.label : value;
        })
        .join('、');
};

const DOUBAO_CONFIG = {
    apiKey: import.meta.env.VITE_REACT_APP_DOUBAO_TOKEN, // 'bd747896-e89b-46f4-a5ab-0a232d086845',
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
    const englishLevel = normalizeEnglishLevelValue(raw.englishLevel);
    const contentPreferences = normalizeLearningContexts(raw.contentPreferences);

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
    const englishLevelValue = normalizeEnglishLevelValue(profile?.englishLevel);
    const englishLevelBlock = formatEnglishLevelForPrompt(englishLevelValue);
    const preferenceValues = normalizeLearningContexts(profile?.contentPreferences);
    const preferenceBlock = formatLearningContextsForPrompt(preferenceValues);
    const preferenceLabels = describeLearningContexts(preferenceValues);
    const difficultyHint = englishLevelValue
        ? `例句语法与词汇需符合 ${getEnglishLevelByValue(englishLevelValue)?.label ?? englishLevelValue} 的理解范围，必要时提供简明中文解释。`
        : '例句语法与词汇保持中等难度，必要时提供简明中文解释。';
    const contextHint = preferenceLabels
        ? `例句应优先覆盖以下场景：${preferenceLabels}，并展示单词的不同词性或搭配用法。`
        : '例句需覆盖不同词性和常见搭配，体现多元语境。';

    return `请扮演英文词典专家，为英文单词 "${word}" 提供精确的中文词典词条。
用户画像：
- 昵称：${nickname}
- 英语水平：
${indentMultiline(englishLevelBlock)}
- 学习场景优先级：
${indentMultiline(preferenceBlock)}

写作准则：
1. ${difficultyHint}
2. ${contextHint}
3. 释义需条理清晰，突出中文关键词，可适度补充英文同义表达。
4. 输出必须为合法 JSON 字符串，字段齐全，不附加额外解释或 Markdown。

你必须仅返回一个 JSON 对象，不得包含多余文本或说明。
JSON 需要包含以下字段：
- word: 单词原文
- translation: 最常用的中文释义，简洁明了
- phonetic: 包含 us 和 uk 两个子字段，每个字段包含 text（音标）和 audio（若无则留空字符串）
- partOfSpeech: 主要词性
- frequency: 以中文描述单词使用频率（如"较常用"），若无数据返回为空白字符串
- inflections: 常见词形变化，无数据写返回空白字符串
- meanings: 数组，每项为 { "title": "词性或标签", "description": "中文释义" }，按重要性排序，以词性（v. n. adj.）为维度, 列出3-6个最常用的中文/英文释义。
- examples: 数组，每项为 { "en": "英文例句", "zh": "对应中文翻译" }，提供 3-5 条，与用户水平相符并贴合其偏好情境， 例句应覆盖单词的不同词性、不同常用搭配和不同语境，避免同质化。
- phrases: 数组，列出 3-6 个常见搭配或近义短语，中文或英文均可`;
};

const buildChatSystemPrompt = (word, translation, profile) => {
    const nickname = typeof profile?.nickname === 'string' && profile.nickname.trim() ? profile.nickname.trim() : '学习者';
    const englishLevelValue = normalizeEnglishLevelValue(profile?.englishLevel);
    const englishLevelBlock = formatEnglishLevelForPrompt(englishLevelValue);
    const preferenceValues = normalizeLearningContexts(profile?.contentPreferences);
    const preferenceBlock = formatLearningContextsForPrompt(preferenceValues);
    const preferenceLabels = describeLearningContexts(preferenceValues);
    const toneHint = englishLevelValue
        ? `语言难度需对标 ${getEnglishLevelByValue(englishLevelValue)?.label ?? englishLevelValue} 学习者，遇到生词可提供中文解释。`
        : '语言难度保持中等，遇到生词可提供中文解释。';
    const sceneHint = preferenceLabels
        ? `对话场景优先围绕：${preferenceLabels}。每轮至少使用一次目标单词或其搭配。`
        : '每轮至少使用一次目标单词或其常见搭配，场景可在日常、职场、旅行间轮换。';
    const safeWord = typeof word === 'string' && word.trim() ? word.trim() : 'unknown';
    const safeTranslation = typeof translation === 'string' && translation.trim() ? translation.trim() : '暂无释义，请你自行补充';

    return `你是豆包智能语言教练，需要围绕英文单词 "${safeWord}" 进行场景化对话练习。
对话目标：
- 帮助学员理解并熟练运用 "${safeWord}"（释义：${safeTranslation}）
- 根据学员水平与偏好调整语速、解释深度与场景

学员画像：
- 昵称：${nickname}
- 英语水平：
${indentMultiline(englishLevelBlock)}
- 学习场景优先级：
${indentMultiline(preferenceBlock)}

对话规则：
1. ${toneHint}
2. ${sceneHint}
3. 回复中中英文结合：核心句用英文表达，必要时追加 1 句中文提示。
4. 每次回复控制在 2-4 句，语气自然友好，可设置角色或场景代入感。
5. 适时追问或布置小练习，引导学员继续对话。`;
};

const sanitizeChatMessage = message => {
    if (!message || typeof message !== 'object') return null;
    const role = message.role === 'assistant' ? 'assistant' : message.role === 'user' ? 'user' : null;
    if (!role) return null;
    const rawContent = message.content;
    const content = typeof rawContent === 'string' ? rawContent.trim() : normalizeMessageContent(rawContent);
    if (!content) return null;
    return { role, content };
};

const pickRecentMessages = conversation => {
    if (!Array.isArray(conversation)) return [];
    const sanitized = conversation.map(sanitizeChatMessage).filter(Boolean);
    return sanitized.slice(-12);
};

const LexContext = createContext(null);

export const LexProvider = ({ children }) => {
    const [hotWords, setHotWords] = useState(() => {
        return DEFAULT_HOT_WORDS; // 这里不走缓存
    });
    const [cache, setCache] = useState(() => safeReadFromStorage(STORAGE_KEYS.cache, {}));
    const [profile, setProfile] = useState(() => normalizeProfile(safeReadFromStorage(STORAGE_KEYS.profile, DEFAULT_PROFILE)));
    const [dictionaryCache, setDictionaryCache] = useState(() => safeReadFromStorage(STORAGE_KEYS.dictionaryCache, {}));

    const cacheRef = useRef(cache);
    const profileRef = useRef(profile);
    const pendingRequestsRef = useRef(Object.create(null));
    const dictionaryCacheRef = useRef(dictionaryCache);

    useEffect(() => {
        cacheRef.current = cache;
        if (isBrowser) {
            window.localStorage.setItem(STORAGE_KEYS.cache, JSON.stringify(cache));
        }
    }, [cache]);

    useEffect(() => {
        dictionaryCacheRef.current = dictionaryCache;
        if (isBrowser) {
            window.localStorage.setItem(STORAGE_KEYS.dictionaryCache, JSON.stringify(dictionaryCache));
        }
    }, [dictionaryCache]);

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

    const validateWord = useCallback(async rawWord => {
        const normalized = rawWord?.trim().toLowerCase();
        if (!normalized) {
            throw new Error('请输入要查询的单词');
        }

        // 检查缓存
        const cachedData = dictionaryCacheRef.current[normalized];
        if (cachedData) {
            return cachedData;
        }

        // 调用 Free Dictionary API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`);

        if (!response.ok) {
            if (response.status === 404) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || '抱歉，未找到该单词的定义。请检查拼写或稍后再试。');
            }
            throw new Error('查询服务暂时不可用，请稍后再试。');
        }

        const data = await response.json();

        // 提取音频URL
        const phonetics = data[0]?.phonetics || [];
        const usPhonetic = phonetics.find(p => p.audio && p.audio.includes('-us')) || phonetics.find(p => p.audio);
        const ukPhonetic =
            phonetics.find(p => p.audio && p.audio.includes('-uk')) || phonetics.find(p => p.audio && p.audio !== usPhonetic?.audio);

        const validatedData = {
            word: data[0]?.word || normalized,
            phonetics: {
                us: usPhonetic?.audio || '',
                uk: ukPhonetic?.audio || '',
            },
            rawData: data,
            validatedAt: Date.now(),
        };

        // 缓存结果
        setDictionaryCache(prev => ({
            ...prev,
            [normalized]: validatedData,
        }));

        return validatedData;
    }, []);

    const updateHotWords = useCallback(detail => {
        setHotWords(prevHotWords => {
            const list = Array.isArray(prevHotWords) ? prevHotWords : [];
            const summary = {
                word: detail.word,
                translation: detail.translation || '暂无释义',
                pronunciation: detail.phonetic?.us?.text || detail.phonetic?.uk?.text || '',
                videoUrl: detail.videoUrl || '',
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
                return cachedEntry.detail;
            }

            if (pendingRequestsRef.current[normalized]) {
                return pendingRequestsRef.current[normalized];
            }

            const requestPromise = (async () => {
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
                    const message =
                        data?.error?.message || data?.message || (typeof data === 'string' ? data : '') || '查询失败，请稍后再试';
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
                return detail;
            })();

            pendingRequestsRef.current[normalized] = requestPromise;

            try {
                const detail = await requestPromise;
                return detail;
            } finally {
                delete pendingRequestsRef.current[normalized];
            }
        },
        [updateHotWords]
    );

    const sendWordChatMessage = useCallback(async ({ word, translation, conversation }) => {
        const normalizedWord = typeof word === 'string' ? word.trim() : '';
        if (!normalizedWord) {
            throw new Error('缺少对话目标单词');
        }

        const history = pickRecentMessages(conversation);
        if (history.length === 0 || history[history.length - 1]?.role !== 'user') {
            throw new Error('请先输入你的问题');
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
                        content: buildChatSystemPrompt(normalizedWord, translation, profileRef.current),
                    },
                    ...history,
                ],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            const message = data?.error?.message || data?.message || '对话失败，请稍后再试';
            throw new Error(message);
        }

        const choice = data?.choices?.[0];
        if (!choice?.message) {
            throw new Error('未从模型收到回复');
        }

        const assistantMessage = normalizeMessageContent(choice.message.content);
        if (!assistantMessage) {
            throw new Error('模型回复内容为空，请稍后再试');
        }

        return {
            role: 'assistant',
            content: assistantMessage,
        };
    }, []);

    const value = useMemo(
        () => ({
            hotWords,
            fetchWordDetail,
            validateWord,
            userProfile: profile,
            isProfileComplete,
            saveUserProfile,
            sendWordChatMessage,
        }),
        [hotWords, fetchWordDetail, validateWord, profile, isProfileComplete, saveUserProfile, sendWordChatMessage]
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
