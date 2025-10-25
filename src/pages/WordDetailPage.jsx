import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, SoundIcon } from '../components/icons.jsx';
import { useLexContext } from '../context/LexContext.jsx';
import { useText2Video } from '../text2video/lib.ts';
import ChatPage from './ChatPage.jsx';

const LOADING_HINTS = [
    { label: '正在连接权威词库...', delay: 0 },
    { label: 'AI 正在生成符合你水平的释义与例句...', delay: 1600 },
    { label: '正在挑选贴合你偏好的用法与搭配...', delay: 3200 },
];

const LoadingSkeleton = ({ word, phase }) => {
    const displayWord = word || 'AI 正在准备词条';
    return (
        <div className='word-detail-loading' aria-live='polite' aria-busy='true'>
            <div className='loading-card'>
                <div className='loading-word'>
                    <span className='loading-chip'>AI 正在准备</span>
                    <h1 className='loading-title'>{displayWord}</h1>
                    <div className='loading-steps' role='status'>
                        {LOADING_HINTS.map((hint, index) => (
                            <div key={hint.label} className={`loading-step ${index <= phase ? 'active' : ''}`}>
                                <span className='loading-dot' />
                                <span>{hint.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className='skeleton-block skeleton-md' />
                </div>

                <div className='loading-meta'>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={`meta-${index}`} className='skeleton-block skeleton-pill' />
                    ))}
                </div>
            </div>

            <div className='loading-card'>
                <div className='skeleton-block skeleton-heading' />
                <div className='skeleton-grid'>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={`meaning-${index}`} className='skeleton-block skeleton-meaning' />
                    ))}
                </div>
            </div>

            <div className='loading-card'>
                <div className='skeleton-block skeleton-heading' />
                <div className='skeleton-list'>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={`example-${index}`} className='skeleton-block skeleton-example' />
                    ))}
                </div>
            </div>

            {/* <div className='loading-steps' role='status'>
                {LOADING_HINTS.map((hint, index) => (
                    <div key={hint.label} className={`loading-step ${index <= phase ? 'active' : ''}`}>
                        <span className='loading-dot' />
                        <span>{hint.label}</span>
                    </div>
                ))}
            </div> */}
        </div>
    );
};

const WordDetailPage = () => {
    const { word } = useParams();
    const navigate = useNavigate();
    const { fetchWordDetail, hotWords } = useLexContext();
    const [status, setStatus] = useState('loading');
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState('');
    const [loadingPhase, setLoadingPhase] = useState(0);
    const [dictionaryAudio, setDictionaryAudio] = useState({ us: null, uk: null });
    const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
    const [hasGeneratedVideo, setHasGeneratedVideo] = useState(false);
    const [showGenerateHint, setShowGenerateHint] = useState(false);
    const [showContactMessage, setShowContactMessage] = useState(false);

    // 使用 text2video hook
    const { isLoading: isVideoGenerating, progressMessage, error: videoError, result: videoResult, generateVideo } = useText2Video();

    // 检查当前单词是否是热词，如果是则使用预设的视频URL
    const presetVideoUrl = useMemo(() => {
        if (!word) return null;
        const hotWord = hotWords.find(item => item.word.toLowerCase() === word.toLowerCase());
        return hotWord?.videoUrl || null;
    }, [word, hotWords]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!word) return;
            setStatus('loading');
            setError('');

            // 从localStorage读取缓存的音频数据
            try {
                const cacheKey = 'lex.dictionary.api.cache.v1';
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    const normalizedWord = word.trim().toLowerCase();
                    const wordCache = parsedCache[normalizedWord];
                    if (wordCache?.phonetics) {
                        setDictionaryAudio({
                            us: wordCache.phonetics.us || null,
                            uk: wordCache.phonetics.uk || null,
                        });
                    }
                }
            } catch (err) {
                console.warn('读取音频缓存失败', err);
            }

            try {
                const result = await fetchWordDetail(word);
                if (!cancelled) {
                    setDetail(result);
                    setStatus('success');
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : '查询失败，请稍后再试');
                    setStatus('error');
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [word, fetchWordDetail]);

    // 检查用户是否已经生成过视频
    useEffect(() => {
        const hasGenerated = localStorage.getItem('lex.video.generated') === 'true';
        setHasGeneratedVideo(hasGenerated);
    }, []);

    useEffect(() => {
        if (status !== 'loading') {
            setLoadingPhase(0);
            return undefined;
        }

        setLoadingPhase(0);
        const timers = LOADING_HINTS.slice(1).map((hint, index) =>
            setTimeout(() => {
                setLoadingPhase(index + 1);
            }, hint.delay)
        );
        return () => {
            timers.forEach(timer => clearTimeout(timer));
        };
    }, [status]);

    const recommendedPhrases = useMemo(() => detail?.phrases?.slice(0, 3) ?? [], [detail?.phrases]);

    const handleBack = () => {
        navigate(-1);
    };

    const handlePlayAudio = audioUrl => {
        if (!audioUrl) return;
        const audio = new Audio(audioUrl);
        audio.play().catch(err => {
            console.warn('音频播放失败', err);
        });
    };

    const handleGenerateVideo = async () => {
        if (!detail?.word) return;

        // 检查用户是否已经生成过视频
        if (hasGeneratedVideo) {
            setShowContactMessage(true);
            // 3秒后自动隐藏联系客服消息
            setTimeout(() => setShowContactMessage(false), 10000);
            return;
        }

        // 第一次生成，显示提示消息
        setShowGenerateHint(true);
        // // 10秒后自动隐藏提示消息
        setTimeout(() => setShowGenerateHint(false), 10000);

        try {
            await generateVideo(detail.word);
            // 标记用户已经生成过视频
            setHasGeneratedVideo(true);
            // 保存到localStorage，确保刷新页面后仍然有效
            localStorage.setItem('lex.video.generated', 'true');
        } catch (err) {
            console.error('视频生成失败:', err);
        } finally {
            setShowGenerateHint(false);
        }
    };

    const handleStartChat = () => {
        if (!detail) return;
        // 打开抽屉而不是导航到新页面
        setIsChatDrawerOpen(true);
    };

    const renderContent = () => {
        if (status === 'loading') {
            return <LoadingSkeleton word={word} phase={loadingPhase} />;
        }

        if (status === 'error') {
            return <p className='word-detail-message'>{error}</p>;
        }

        if (!detail) {
            return <p className='word-detail-message'>暂无数据，请返回重试。</p>;
        }
        return (
            <>
                <header className='word-detail-header'>
                    <div>
                        <h1>{detail.word}</h1>
                        <p className='word-detail-translation'>{detail.translation}</p>
                    </div>
                    <div className='word-detail-pronunciation'>
                        <button
                            className='tone-tag'
                            type='button'
                            onClick={() => handlePlayAudio(dictionaryAudio.us || detail.phonetic?.us?.audio)}
                            disabled={!dictionaryAudio.us && !detail.phonetic?.us?.audio}
                            aria-label={dictionaryAudio.us || detail.phonetic?.us?.audio ? '播放美式发音' : '暂无美式音频'}
                        >
                            <SoundIcon />美 {detail.phonetic?.us?.text}
                        </button>
                        <button
                            className='tone-tag'
                            type='button'
                            onClick={() => handlePlayAudio(dictionaryAudio.uk || detail.phonetic?.uk?.audio)}
                            disabled={!dictionaryAudio.uk && !detail.phonetic?.uk?.audio}
                            aria-label={dictionaryAudio.uk || detail.phonetic?.uk?.audio ? '播放英式发音' : '暂无英式音频'}
                        >
                            <SoundIcon />英 {detail.phonetic?.uk?.text}
                        </button>
                    </div>
                </header>

                <div className='word-detail-meta'>
                    {detail.partOfSpeech && <span>词性：{detail.partOfSpeech}</span>}
                    {detail.frequency && <span>常用度：{detail.frequency}</span>}
                    {detail.inflections && <span>词形变化：{detail.inflections}</span>}
                </div>

                <section className='meaning-section'>
                    <h2>核心释义</h2>
                    <div className='meaning-list'>
                        {detail.meanings
                            ? detail.meanings.map(item => (
                                  <article className='meaning-card' key={`${item.title}-${item.description}`}>
                                      <h3>{item.title}</h3>
                                      <p>{item.description}</p>
                                  </article>
                              ))
                            : null}
                    </div>
                </section>

                <section className='example-section'>
                    <div className='section-heading'>
                        <h2>AI 情景例句</h2>
                        <span>贴近你的生活场景</span>
                    </div>
                    <ul className='example-list'>
                        {detail.examples.map(item => (
                            <li key={item.en}>
                                <p className='example-en'>{item.en}</p>
                                <p className='example-zh'>{item.zh}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {recommendedPhrases.length > 0 && (
                    <section className='phrase-section'>
                        <div className='section-heading'>
                            <h2>常见搭配</h2>
                            <span>助你灵活运用</span>
                        </div>
                        <div className='phrase-tags'>
                            {recommendedPhrases.map(item => (
                                <span className='phrase-tag' key={item}>
                                    {item}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                <div className='ai-cards'>
                    <article className='ai-card memory'>
                        <div className='ai-card-header'>
                            <span className='ai-card-icon' aria-hidden='true'>
                                🎬
                            </span>
                            <div>
                                <p className='ai-card-tag'>智能谐音短片</p>
                                <h3>谐音记忆法</h3>
                            </div>
                        </div>
                        {(!presetVideoUrl && !videoResult?.videoUrl) && (
                            <>
                                <p className='ai-card-description'>生成 10 秒创意故事，把发音、释义与画面一次记住。</p>
                                <ul className='ai-card-list'>
                                    <li>结合你的水平与偏好，匹配台词语气</li>
                                    <li>免费用户仅限一次生成机会</li>
                                </ul>
                            </>
                        )}

                        {/* 视频错误显示 */}
                        {videoError && (
                            <div className='video-error' style={{ color: '#ef4444', marginTop: '12px', fontSize: '14px' }}>
                                <p>视频生成失败</p>
                            </div>
                        )}

                        {/* 视频播放器 */}
                        {(presetVideoUrl || videoResult?.videoUrl) && (
                            <div className='video-player' style={{ marginTop: '16px' }}>
                                <video controls style={{ width: '100%', borderRadius: '8px' }} src={presetVideoUrl || videoResult?.videoUrl}>
                                    您的浏览器不支持视频播放。
                                </video>
                            </div>
                        )}

                        {/* 提示消息 */}
                        {showGenerateHint && (
                            <div
                                className='contact-message'
                                style={{
                                    position: 'absolute',
                                    bottom: '88px',
                                    left: '16px',
                                    padding: '12px 16px',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    color: '#1e293b',
                                    boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                                    maxWidth: '240px',
                                    zIndex: 10,
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '-8px',
                                        left: '50%',
                                        transform: 'translateX(-50%) rotate(45deg)',
                                        width: '16px',
                                        height: '16px',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                        zIndex: -1,
                                    }}
                                ></div>
                                <p style={{ margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <p>⏳ 生成比较慢，建议等待生成完成，每个用户只有一次免费生成机会</p>
                                </p>
                            </div>
                            // <div
                            //     className='generate-hint'
                            //     style={{
                            //         marginTop: '12px',
                            //         padding: '8px',
                            //         backgroundColor: '#fef3c7',
                            //         borderRadius: '6px',
                            //         fontSize: '14px',
                            //         color: '#92400e',
                            //     }}
                            // >
                            //     <p>⏳ 生成比较慢，建议等待生成完成，每个用户只有一次免费生成机会</p>
                            // </div>
                        )}

                        {showContactMessage && (
                            <div
                                className='contact-message'
                                style={{
                                    position: 'absolute',
                                    bottom: '88px',
                                    left: '16px',
                                    padding: '12px 16px',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    color: '#1e293b',
                                    boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
                                    maxWidth: '240px',
                                    zIndex: 10,
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '-8px',
                                        left: '50%',
                                        transform: 'translateX(-50%) rotate(45deg)',
                                        width: '16px',
                                        height: '16px',
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                        zIndex: -1,
                                    }}
                                ></div>
                                <p style={{ margin: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '16px' }}>📞</span>
                                    您已经使用过免费生成机会，如需再次生成请联系客服
                                </p>
                            </div>
                        )}

                        {/* 如果是预设视频，显示提示信息而不是生成按钮 */}
                        {presetVideoUrl ? (
                            <div className='preset-video-info' style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
                                <p>📹 此单词已预设谐音记忆视频</p>
                            </div>
                        ) : (
                            <button className='ai-action' type='button' onClick={handleGenerateVideo} disabled={isVideoGenerating}>
                                {isVideoGenerating
                                    ? progressMessage || '创作中…'
                                    : hasGeneratedVideo
                                      ? '已使用免费机会'
                                      : videoResult?.videoUrl
                                        ? '重新生成'
                                        : '生成谐音短片'}
                            </button>
                        )}
                    </article>
                    <article className='ai-card dialogue'>
                        <div className='ai-card-header'>
                            <span className='ai-card-icon' aria-hidden='true'>
                                💬
                            </span>
                            <div>
                                <p className='ai-card-tag'>多轮场景演练</p>
                                <h3>AI 场景对话</h3>
                            </div>
                        </div>
                        <p className='ai-card-description'>沉浸式对话练习，随时切换到最贴近你的真实场景。</p>
                        <ul className='ai-card-list'>
                            <li>自动嵌入目标单词与常见搭配</li>
                            <li>实时中文提示 + 下一步追问</li>
                        </ul>
                        <button className='ai-action secondary' type='button' onClick={handleStartChat}>
                            开始对话
                        </button>
                    </article>
                </div>
            </>
        );
    };

    return (
        <section className='word-detail'>
            <div className='word-detail-bar'>
                <button className='back-button' type='button' onClick={handleBack}>
                    <ArrowLeftIcon />
                    返回探索
                </button>
                {/* <button className='sync-button' type='button'>
                    <SparkleIcon />
                    同步收藏
                </button> */}
            </div>

            <div className='word-detail-card'>{renderContent()}</div>

            {/* 抽屉遮罩层 */}
            {isChatDrawerOpen && <div className='drawer-overlay' onClick={() => setIsChatDrawerOpen(false)} />}

            {/* 抽屉组件 */}
            <div className={`chat-drawer ${isChatDrawerOpen ? 'open' : ''}`}>
                <div className='drawer-header'>
                    <button className='drawer-close-button' onClick={() => setIsChatDrawerOpen(false)}>
                        <ArrowLeftIcon />
                        返回单词详情
                    </button>
                </div>
                <div className='drawer-content'>{detail && <ChatPage word={detail.word} isDrawer={true} />}</div>
            </div>
        </section>
    );
};

export default WordDetailPage;
