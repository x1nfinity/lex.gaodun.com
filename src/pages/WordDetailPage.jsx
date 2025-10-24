import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, SoundIcon, SparkleIcon } from '../components/icons.jsx';
import { useLexContext } from '../context/LexContext.jsx';

const WordDetailPage = () => {
    const { word } = useParams();
    const navigate = useNavigate();
    const { fetchWordDetail, generateMemoryStoryVideo } = useLexContext();
    const [status, setStatus] = useState('loading');
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState('');
    const [videoStatus, setVideoStatus] = useState('idle'); // idle, loading, success, error
    const [videoResult, setVideoResult] = useState(null);
    const [videoError, setVideoError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!word) return;
            setStatus('loading');
            setError('');
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
        if (!detail || videoStatus === 'loading') return;

        setVideoStatus('loading');
        setVideoError('');

        try {
            const result = await generateMemoryStoryVideo(detail.word, detail.translation, {
                model: 'kling-v2-1-master',
                aspectRatio: '16:9',
                duration: '5',
                promptMagic: 1,
            });

            setVideoResult(result);
            setVideoStatus('success');
        } catch (err) {
            setVideoError(err instanceof Error ? err.message : '生成视频失败，请稍后再试');
            setVideoStatus('error');
        }
    };

    const handleStartChat = () => {
        if (!detail) return;
        // 导航到对话页面，并传递单词信息
        navigate(`/chat/${detail.word}`);
    };

    const renderContent = () => {
        if (status === 'loading') {
            return <p className='word-detail-message'>正在查询，请稍候...</p>;
        }

        if (status === 'error') {
            return <p className='word-detail-message'>{error}</p>;
        }

        if (!detail) {
            return <p className='word-detail-message'>暂无数据，请返回重试。</p>;
        }
        console.log(detail);

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
                            onClick={() => handlePlayAudio(detail.phonetic?.us?.audio)}
                            disabled={!detail.phonetic?.us?.audio}
                            aria-label={detail.phonetic?.us?.audio ? '播放美式发音' : '暂无美式音频'}
                        >
                            <SoundIcon />美 {detail.phonetic?.us?.text}
                        </button>
                        <button
                            className='tone-tag'
                            type='button'
                            onClick={() => handlePlayAudio(detail.phonetic?.uk?.audio)}
                            disabled={!detail.phonetic?.uk?.audio}
                            aria-label={detail.phonetic?.uk?.audio ? '播放英式发音' : '暂无英式音频'}
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
                        <div>
                            <h3>谐音记忆法</h3>
                            <p>AI 帮你生成趣味故事，让发音和释义一听就懂。</p>
                        </div>
                        <button className='ai-action' type='button' onClick={handleGenerateVideo} disabled={videoStatus === 'loading'}>
                            {videoStatus === 'loading' ? '生成中...' : '立即生成'}
                        </button>
                    </article>
                    <article className='ai-card dialogue'>
                        <div>
                            <h3>AI 场景对话</h3>
                            <p>模拟真实交流环境，迅速掌握单词在对话中的运用。</p>
                        </div>
                        <button className='ai-action' type='button' onClick={handleStartChat}>
                            去实战
                        </button>
                    </article>
                </div>

                {/* 视频生成结果展示 */}
                {videoStatus === 'loading' && (
                    <div className='video-result loading'>
                        <p>正在生成谐音记忆视频，请稍候...</p>
                    </div>
                )}

                {videoStatus === 'error' && (
                    <div className='video-result error'>
                        <p>生成失败：{videoError}</p>
                        <button className='retry-button' type='button' onClick={handleGenerateVideo}>
                            重试
                        </button>
                    </div>
                )}

                {videoStatus === 'success' && videoResult && (
                    <div className='video-result success'>
                        <h3>视频生成成功</h3>
                        <p>任务ID：{videoResult.generateUuid}</p>
                        <p className='video-note'>视频正在后台生成中，请稍后查看结果</p>
                    </div>
                )}
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
                <button className='sync-button' type='button'>
                    <SparkleIcon />
                    同步收藏
                </button>
            </div>

            <div className='word-detail-card'>{renderContent()}</div>
        </section>
    );
};

export default WordDetailPage;
