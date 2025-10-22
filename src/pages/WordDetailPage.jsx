import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, SoundIcon, SparkleIcon } from '../components/icons.jsx'
import { useLexContext } from '../context/LexContext.jsx'

const WordDetailPage = () => {
  const { word } = useParams()
  const navigate = useNavigate()
  const { fetchWordDetail } = useLexContext()
  const [status, setStatus] = useState('loading')
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!word) return
      setStatus('loading')
      setError('')
      try {
        const result = await fetchWordDetail(word)
        if (!cancelled) {
          setDetail(result)
          setStatus('success')
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '查询失败，请稍后再试')
          setStatus('error')
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [word, fetchWordDetail])

  const recommendedPhrases = useMemo(
    () => detail?.phrases?.slice(0, 3) ?? [],
    [detail?.phrases],
  )

  const handleBack = () => {
    navigate(-1)
  }

  const handlePlayAudio = (audioUrl) => {
    if (!audioUrl) return
    const audio = new Audio(audioUrl)
    audio.play().catch((err) => {
      console.warn('音频播放失败', err)
    })
  }

  const renderContent = () => {
    if (status === 'loading') {
      return <p className="word-detail-message">正在查询，请稍候...</p>
    }

    if (status === 'error') {
      return <p className="word-detail-message">{error}</p>
    }

    if (!detail) {
      return <p className="word-detail-message">暂无数据，请返回重试。</p>
    }

    return (
      <>
        <header className="word-detail-header">
          <div>
            <h1>{detail.word}</h1>
            <p className="word-detail-translation">{detail.translation}</p>
          </div>
          <div className="word-detail-pronunciation">
            <button
              className="tone-tag"
              type="button"
              onClick={() => handlePlayAudio(detail.phonetic?.us?.audio)}
              disabled={!detail.phonetic?.us?.audio}
              aria-label={detail.phonetic?.us?.audio ? '播放美式发音' : '暂无美式音频'}
            >
              <SoundIcon />
              美 {detail.phonetic?.us?.text}
            </button>
            <button
              className="tone-tag"
              type="button"
              onClick={() => handlePlayAudio(detail.phonetic?.uk?.audio)}
              disabled={!detail.phonetic?.uk?.audio}
              aria-label={detail.phonetic?.uk?.audio ? '播放英式发音' : '暂无英式音频'}
            >
              <SoundIcon />
              英 {detail.phonetic?.uk?.text}
            </button>
          </div>
        </header>

        <div className="word-detail-meta">
          <span>词性：{detail.partOfSpeech}</span>
          <span>常用度：{detail.frequency}</span>
          <span>词形变化：{detail.inflections}</span>
        </div>

        <section className="meaning-section">
          <h2>核心释义</h2>
          <div className="meaning-list">
            {detail.meanings.map((item) => (
              <article className="meaning-card" key={`${item.title}-${item.description}`}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="example-section">
          <div className="section-heading">
            <h2>AI 情景例句</h2>
            <span>贴近你的生活场景</span>
          </div>
          <ul className="example-list">
            {detail.examples.map((item) => (
              <li key={item.en}>
                <p className="example-en">{item.en}</p>
                <p className="example-zh">{item.zh}</p>
              </li>
            ))}
          </ul>
        </section>

        {recommendedPhrases.length > 0 && (
          <section className="phrase-section">
            <div className="section-heading">
              <h2>常见搭配</h2>
              <span>助你灵活运用</span>
            </div>
            <div className="phrase-tags">
              {recommendedPhrases.map((item) => (
                <span className="phrase-tag" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="ai-cards">
          <article className="ai-card memory">
            <div>
              <h3>谐音记忆法</h3>
              <p>AI 帮你生成趣味故事，让发音和释义一听就懂。</p>
            </div>
            <button className="ai-action" type="button">
              立即生成
            </button>
          </article>
          <article className="ai-card dialogue">
            <div>
              <h3>AI 场景对话</h3>
              <p>模拟真实交流环境，迅速掌握单词在对话中的运用。</p>
            </div>
            <button className="ai-action" type="button">
              去实战
            </button>
          </article>
        </div>
      </>
    )
  }

  return (
    <section className="word-detail">
      <div className="word-detail-bar">
        <button className="back-button" type="button" onClick={handleBack}>
          <ArrowLeftIcon />
          返回探索
        </button>
        <button className="sync-button" type="button">
          <SparkleIcon />
          同步收藏
        </button>
      </div>

      <div className="word-detail-card">{renderContent()}</div>
    </section>
  )
}

export default WordDetailPage
