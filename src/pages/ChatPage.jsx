import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '../components/icons.jsx';
import { useLexContext } from '../context/LexContext.jsx';

const SUGGESTION_TEMPLATES = [
    {
        id: 'Daily Life English',
        match: 'Daily Life English',
        prompts: [
            '请带我进入一个关于 "{word}" 的日常对话，比如和朋友闲聊或邻里互动。',
            '设计一个家庭生活场景，让我通过家务或亲子对话练习 "{word}"。',
            '结合社交媒体或线下聚会，模拟使用 "{word}" 的轻松交流场景。',
        ],
    },
    {
        id: 'Business English',
        match: 'Business English',
        prompts: [
            '构建一个项目会议或商务谈判的对话，让我练习在专业场合运用 "{word}"。',
            '帮我写一封职场邮件或汇报稿，把 "{word}" 自然融入其中。',
            '模拟一次绩效面谈或跨部门协作讨论，突出 "{word}" 的表达方式。',
        ],
    },
    {
        id: 'Travel English',
        match: 'Travel English',
        prompts: [
            '请模拟机场值机或过海关的对话场景，让我学会在旅途中使用 "{word}"。',
            '设计一段酒店入住或餐厅点餐的交流，帮助我练习 "{word}"。',
            '创建一个问路或应急求助的场景，指导我灵活运用 "{word}"。',
        ],
    },
    {
        id: 'Academic English',
        match: 'Academic English',
        prompts: [
            '安排一次课堂讨论或学术辩论环节，围绕 "{word}" 展开发言。',
            '请提供一段文献摘录或论文段落，引导我用学术语言释义 "{word}"。',
            '给我布置一个演讲或口头报告任务，要求多次使用 "{word}"。',
        ],
    },
    {
        id: 'Exam Preparation',
        match: 'Exam Preparation',
        prompts: [
            '设计一组填空或改错题，帮助我巩固 "{word}" 在考试中的考法。',
            '请提供 TOEFL/IELTS 口语题目，要求我用 "{word}" 构建答案。',
            '给我一个写作题目大纲，提醒我在段落中有效运用 "{word}"。',
        ],
    },
    {
        id: 'Study Abroad / Immigration',
        match: 'Study Abroad / Immigration',
        prompts: [
            '模拟一次签证面试或入学面试，强调 "{word}" 的地道表达。',
            '请设计课堂回答或小组作业讨论，帮助我在海外课堂中使用 "{word}"。',
            '构建一个海外生活的适应场景，例如租房或银行开户，让我练习 "{word}"。',
        ],
    },
    {
        id: 'Hobby / Pop Culture',
        match: 'Hobby / Pop Culture',
        prompts: [
            '结合电影台词或歌曲歌词，模拟使用 "{word}" 的娱乐对话。',
            '设计一次粉丝见面会或直播互动，让我用 "{word}" 表达观点。',
            '请创建一个影视评论或剧本创作的片段，强调 "{word}" 的用法。',
        ],
    },
    {
        id: 'Speaking Practice',
        match: 'Speaking Practice',
        prompts: [
            '安排一段绕口令式的口语训练，多次重复 "{word}" 来纠正发音。',
            '请扮演口语教练，针对 "{word}" 做角色扮演练习并给我反馈。',
            '设计一个逐步升级的问答练习，从基础到进阶掌握 "{word}"。',
        ],
    },
    {
        id: 'fallback',
        match: null,
        prompts: [
            '请模拟一个职场对话，让我学会如何使用 "{word}"。',
            '帮我区分 "{word}" 和它的常见搭配，并提供练习题。',
            '设计一个包含 "{word}" 的生活场景对话，我来尝试回答。',
        ],
    },
];

const FALLBACK_TEMPLATE = SUGGESTION_TEMPLATES.find(item => item.match === null);

const selectSuggestions = (preferences = []) => {
    if (!Array.isArray(preferences) || preferences.length === 0) {
        return FALLBACK_TEMPLATE?.prompts ?? [];
    }

    const matchedPrompts = preferences.reduce((accumulator, preference) => {
        if (typeof preference !== 'string' || !preference.trim()) return accumulator;
        const template = SUGGESTION_TEMPLATES.find(item => item.match === preference.trim());
        if (template) {
            accumulator.push(...template.prompts);
        }
        return accumulator;
    }, []);

    if (matchedPrompts.length === 0) {
        return FALLBACK_TEMPLATE?.prompts ?? [];
    }

    return matchedPrompts;
};

const ChatPage = () => {
    const { word: routeWord } = useParams();
    const navigate = useNavigate();
    const { fetchWordDetail, sendWordChatMessage, userProfile } = useLexContext();
    const [wordDetail, setWordDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [chatError, setChatError] = useState('');
    const conversationRef = useRef([]);
    const endRef = useRef(null);

    const displayWord = routeWord ?? '';

    useEffect(() => {
        const welcomeMessage = {
            id: `assistant-welcome-${displayWord}`,
            role: 'assistant',
            content: `你好！我是你的 AI 会话伙伴，一起练习 "${displayWord}"。告诉我你想在哪个场景使用它？`,
        };
        setMessages([welcomeMessage]);
        conversationRef.current = [welcomeMessage];
        setChatError('');
        setWordDetail(null);
        setDetailError('');
    }, [displayWord]);

    useEffect(() => {
        if (!displayWord) return;
        let cancelled = false;

        const loadDetail = async () => {
            setDetailLoading(true);
            setDetailError('');
            try {
                const detail = await fetchWordDetail(displayWord);
                if (!cancelled) {
                    setWordDetail(detail);
                }
            } catch (error) {
                if (!cancelled) {
                    const message = error instanceof Error ? error.message : '单词信息获取失败，请稍后重试';
                    setDetailError(message);
                }
            } finally {
                if (!cancelled) {
                    setDetailLoading(false);
                }
            }
        };

        loadDetail();

        return () => {
            cancelled = true;
        };
    }, [displayWord, fetchWordDetail]);

    useEffect(() => {
        if (!wordDetail) return;
        setMessages(prev => {
            if (!prev.length) return prev;
            const [firstMessage, ...rest] = prev;
            if (firstMessage.role !== 'assistant') {
                return prev;
            }
            const translationHint = wordDetail.translation ? `（释义：${wordDetail.translation}）` : '';
            const upgraded = {
                ...firstMessage,
                content: `你好！我是你的 AI 会话伙伴，一起练习 "${displayWord}"${translationHint}。告诉我你想在哪个场景使用它？`,
            };
            const nextMessages = [upgraded, ...rest];
            conversationRef.current = nextMessages;
            return nextMessages;
        });
    }, [wordDetail, displayWord]);

    useEffect(() => {
        conversationRef.current = messages;
    }, [messages]);

    useEffect(() => {
        if (endRef.current) {
            endRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, sending]);

    const preferenceSignature = useMemo(() => {
        if (!Array.isArray(userProfile?.contentPreferences) || userProfile.contentPreferences.length === 0) {
            return '[]';
        }
        const unique = Array.from(new Set(userProfile.contentPreferences.filter(item => typeof item === 'string' && item.trim())));
        return JSON.stringify(unique);
    }, [userProfile?.contentPreferences]);

    const suggestions = useMemo(() => {
        const values = JSON.parse(preferenceSignature);
        const pool = selectSuggestions(values);
        const unique = Array.from(new Set(pool));
        return unique.slice(0, 3).map(item => item.replace('{word}', displayWord));
    }, [displayWord, preferenceSignature]);

    const handleSend = async overrideText => {
        const text = typeof overrideText === 'string' ? overrideText.trim() : inputValue.trim();
        if (!text || sending) return;

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
        };

        const baseMessages = conversationRef.current;
        const nextMessages = [...baseMessages, userMessage];
        setMessages(nextMessages);
        conversationRef.current = nextMessages;
        setInputValue('');
        setSending(true);
        setChatError('');

        try {
            const assistant = await sendWordChatMessage({
                word: displayWord,
                translation: wordDetail?.translation,
                conversation: nextMessages.map(({ role, content }) => ({ role, content })),
            });

            const assistantMessage = {
                id: `assistant-${Date.now()}`,
                ...assistant,
            };

            setMessages(prev => {
                const finalMessages = [...prev, assistantMessage];
                conversationRef.current = finalMessages;
                return finalMessages;
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : '对话失败，请稍后再试';
            setChatError(message);
        } finally {
            setSending(false);
        }
    };

    const handleSuggestionClick = suggestion => {
        handleSend(suggestion);
    };

    const handleSubmit = event => {
        event.preventDefault();
        handleSend();
    };

    const handleKeyDown = event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const messageItems = messages.map(message => {
        const isAssistant = message.role === 'assistant';
        const pieces = message.content.split('\n').filter(Boolean);
        return (
            <div key={message.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                        isAssistant ? 'bg-white text-slate-900 ring-1 ring-slate-100' : 'bg-indigo-600 text-indigo-50'
                    }`}
                >
                    {pieces.map((line, index) => (
                        <p key={`${message.id}-${index}`} className='whitespace-pre-wrap'>
                            {line}
                        </p>
                    ))}
                </div>
            </div>
        );
    });

    return (
        <section className='flex flex-col gap-6'>
            <div className='flex items-center justify-between'>
                <button
                    className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md'
                    type='button'
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeftIcon />
                    返回单词页
                </button>
                <div className='text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400'>AI 场景对话</div>
            </div>

            <div className='rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-xl backdrop-blur'>
                <header className='flex flex-col gap-3 border-b border-slate-100 pb-4'>
                    <div className='text-sm font-semibold text-indigo-500'>练习单词</div>
                    <h1 className='text-3xl font-bold text-slate-900'>
                        {displayWord}
                        {wordDetail?.phonetic?.us?.text ? (
                            <span className='ml-3 text-base font-medium text-slate-500'>{wordDetail.phonetic.us.text}</span>
                        ) : null}
                    </h1>
                    <p className='text-base text-slate-600'>
                        {detailLoading ? '正在加载释义...' : wordDetail?.translation || '暂无释义，尽情与我对话探索它的用法吧。'}
                    </p>
                    {detailError ? (
                        <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600'>{detailError}</div>
                    ) : null}
                    {wordDetail?.phrases?.length ? (
                        <div className='flex flex-wrap gap-2 pt-1'>
                            {wordDetail.phrases.slice(0, 4).map(item => (
                                <span key={item} className='rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600'>
                                    {item}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </header>

                <div className='mt-6 flex flex-col gap-4'>
                    <div className='max-h-[55vh] min-h-[320px] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-4'>
                        <div className='flex flex-col gap-3'>
                            {messageItems}
                            {sending ? (
                                <div className='flex justify-start'>
                                    <div className='max-w-[70%] rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-100'>
                                        AI 正在思考...
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <div ref={endRef} />
                    </div>

                    <div className='grid gap-2 sm:grid-cols-3'>
                        {suggestions.map(suggestion => (
                            <button
                                key={suggestion}
                                type='button'
                                className='rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-100'
                                onClick={() => handleSuggestionClick(suggestion)}
                                disabled={sending}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className='flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm'
                    >
                        <textarea
                            className='min-h-[100px] w-full resize-none rounded-xl border border-transparent bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-200 focus:bg-white focus:ring-2 focus:ring-indigo-100'
                            placeholder='输入你的问题或练习需求，按 Enter 发送（Shift+Enter 换行）'
                            value={inputValue}
                            onChange={event => setInputValue(event.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={sending}
                        />
                        {chatError ? (
                            <div className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600'>{chatError}</div>
                        ) : null}
                        <div className='flex items-center justify-end gap-3'>
                            <span className='text-xs text-slate-400'>按 Enter 发送 · Shift+Enter 换行</span>
                            <button
                                className='inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300'
                                type='submit'
                                disabled={sending}
                            >
                                {sending ? '正在生成...' : '发送'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default ChatPage;
