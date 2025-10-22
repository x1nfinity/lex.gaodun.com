import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const DEFAULT_HOT_WORDS = [
  {
    word: 'abandon',
    definition: 'to leave something or someone behind intentionally',
    phonetic: '/əˈbændən/',
  },
  {
    word: 'serendipity',
    definition: 'the occurrence of events by chance in a happy way',
    phonetic: '/ˌsɛrənˈdɪpɪti/',
  },
  {
    word: 'tenacious',
    definition: 'tending to keep a firm hold or adhere closely',
    phonetic: '/təˈneɪʃəs/',
  },
  {
    word: 'resilient',
    definition: 'able to withstand or recover quickly from difficulties',
    phonetic: '/rɪˈzɪljənt/',
  },
  {
    word: 'eloquent',
    definition: 'fluent or persuasive in speaking or writing',
    phonetic: '/ˈɛləkwənt/',
  },
  {
    word: 'catalyst',
    definition: 'something that precipitates an event or change',
    phonetic: '/ˈkætəlɪst/',
  },
]

const STORAGE_KEYS = {
  hotWords: 'lex.hotwords.v1',
  cache: 'lex.dictionary.cache.v1',
  progress: 'lex.progress.v1',
}

const PROGRESS_INTERVALS_HOURS = [1, 2, 4, 8, 24]

const isBrowser = typeof window !== 'undefined'

const SoundIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M5 9V15H8L13 20V4L8 9H5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 9.5C16.6439 10.2885 17 11.2406 17 12.2222C17 13.2039 16.6439 14.156 16 14.9444"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.9999 21L16.6499 16.65"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const SparkleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 4L13.4 8.6L18 10L13.4 11.4L12 16L10.6 11.4L6 10L10.6 8.6L12 4Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 17L6.6 18.8L8.4 19.4L6.6 20L6 21.8L5.4 20L3.6 19.4L5.4 18.8L6 17Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 15L18.4 16.2L19.6 16.6L18.4 17L18 18.2L17.6 17L16.4 16.6L17.6 16.2L18 15Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ClockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 5V12L16.5 14.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const formatDueTime = (timestamp) => {
  if (!timestamp) return '尚未安排'
  const now = Date.now()
  const diff = timestamp - now
  if (diff <= 0) {
    return '随时可以复习'
  }
  const minutes = Math.round(diff / 60000)
  if (minutes < 60) {
    return `${Math.max(minutes, 1)} 分钟后`
  }
  const hours = Math.round(diff / 3600000)
  if (hours < 24) {
    return `${hours} 小时后`
  }
  const days = Math.round(diff / 86400000)
  return `${days} 天后`
}

const formatHistoryTime = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date
    .toTimeString()
    .slice(0, 5)}`
}

const safeReadFromStorage = (key, fallback) => {
  if (!isBrowser) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch (error) {
    console.warn(`Failed to read ${key} from storage`, error)
    return fallback
  }
}

const transformDictionaryResponse = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('未找到该单词的释义，请检查拼写')
  }

  const phoneticSet = new Map()
  const highlightDefinitions = []
  const examples = []
  const synonymsSet = new Set()

  data.forEach((entry) => {
    entry.phonetics?.forEach((item) => {
      if (!item.text && !item.audio) return
      const key = `${item.text ?? ''}|${item.audio ?? ''}`
      if (!phoneticSet.has(key)) {
        phoneticSet.set(key, {
          text: item.text ?? '',
          audio: item.audio ?? '',
        })
      }
    })

    entry.meanings?.forEach((meaning) => {
      const partOfSpeech = meaning.partOfSpeech
      meaning.definitions?.forEach((definition) => {
        if (definition.definition) {
          highlightDefinitions.push({
            partOfSpeech,
            definition: definition.definition,
          })
        }
        if (definition.example) {
          examples.push({
            en: definition.example,
          })
        }
        definition.synonyms?.forEach((synonym) => {
          synonymsSet.add(synonym)
        })
      })
    })
  })

  const phonetics = Array.from(phoneticSet.values())
  const primaryDefinition = highlightDefinitions[0]?.definition ?? ''

  return {
    word: data[0]?.word ?? '',
    phonetics,
    primaryDefinition,
    highlights: highlightDefinitions.slice(0, 8),
    examples: examples.slice(0, 6),
    synonyms: Array.from(synonymsSet).slice(0, 16),
    sourceUrls: data[0]?.sourceUrls ?? [],
  }
}

const WordDetailView = ({ detail, progressInfo, onProgressUpdate, onPlayAudio }) => {
  const recommendedPhonetics = detail.phonetics.length
    ? detail.phonetics
    : [{ text: '暂无音标', audio: '' }]

  return (
    <section className="word-detail">
      <div className="word-detail-card">
        <header className="word-detail-header">
          <div className="word-header-text">
            <span className="word-label">查询结果</span>
            <h1>{detail.word}</h1>
            <p className="word-detail-translation">
              {detail.primaryDefinition || '暂无释义，试着查看其它释义'}
            </p>
          </div>
          <div className="word-detail-pronunciation">
            {recommendedPhonetics.map((item, index) => (
              <button
                key={`${item.text}-${item.audio}-${index}`}
                className="tone-tag"
                type="button"
                onClick={() => onPlayAudio(item.audio)}
                disabled={!item.audio}
                aria-label={item.audio ? `播放 ${item.text || '发音'}` : '暂无音频'}
              >
                <SoundIcon />
                {item.text || '暂无音标'}
              </button>
            ))}
          </div>
        </header>

        <section className="progress-section">
          <div className="section-heading">
            <h2>学习进度</h2>
            <span>根据回答自动安排下次复习时间</span>
          </div>
          <div className="progress-body">
            <div className="progress-stats">
              <div>
                <span className="progress-label">当前等级</span>
                <strong>Lv.{progressInfo.level}</strong>
              </div>
              <div>
                <span className="progress-label">下次复习</span>
                <strong>{progressInfo.dueLabel}</strong>
              </div>
            </div>
            <div className="progress-actions">
              <button
                className="progress-button success"
                type="button"
                onClick={() => onProgressUpdate(true)}
              >
                我记住了
              </button>
              <button
                className="progress-button retry"
                type="button"
                onClick={() => onProgressUpdate(false)}
              >
                需要复习
              </button>
            </div>
          </div>
          {progressInfo.history.length > 0 && (
            <ul className="progress-history">
              {progressInfo.history.map((item) => (
                <li key={item.t}>
                  <span className={item.correct ? 'history-correct' : 'history-wrong'}>
                    {item.correct ? '✔︎' : '✘'}
                  </span>
                  <span>{formatHistoryTime(item.t)}</span>
                  <span>{item.correct ? '记住了' : '没记住'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="meaning-section">
          <h2>核心释义</h2>
          <div className="meaning-list">
            {detail.highlights.length === 0 ? (
              <article className="meaning-card empty">暂无释义信息</article>
            ) : (
              detail.highlights.map((item, index) => (
                <article className="meaning-card" key={`${item.definition}-${index}`}>
                  <h3>{item.partOfSpeech || '释义'}</h3>
                  <p>{item.definition}</p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="example-section">
          <div className="section-heading">
            <h2>例句</h2>
            <span>理解使用场景</span>
          </div>
          {detail.examples.length === 0 ? (
            <p className="examples-empty">暂无例句，可尝试其他词形</p>
          ) : (
            <ul className="example-list">
              {detail.examples.map((item) => (
                <li key={item.en}>
                  <p className="example-en">{item.en}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {detail.synonyms.length > 0 && (
          <section className="phrase-section">
            <div className="section-heading">
              <h2>同义拓展</h2>
              <span>拓宽表达方式</span>
            </div>
            <div className="phrase-tags">
              {detail.synonyms.map((item) => (
                <span className="phrase-tag" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}

        {detail.sourceUrls.length > 0 && (
          <footer className="source-footer">
            <span>数据来源：</span>
            {detail.sourceUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                {url}
              </a>
            ))}
          </footer>
        )}
      </div>
    </section>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [cache, setCache] = useState(() => safeReadFromStorage(STORAGE_KEYS.cache, {}))
  const [hotWords, setHotWords] = useState(() =>
    safeReadFromStorage(STORAGE_KEYS.hotWords, DEFAULT_HOT_WORDS),
  )
  const [progress, setProgress] = useState(() =>
    safeReadFromStorage(STORAGE_KEYS.progress, {}),
  )

  const cacheRef = useRef(cache)

  useEffect(() => {
    cacheRef.current = cache
    if (isBrowser) {
      window.localStorage.setItem(STORAGE_KEYS.cache, JSON.stringify(cache))
    }
  }, [cache])

  useEffect(() => {
    if (isBrowser) {
      window.localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress))
    }
  }, [progress])

  useEffect(() => {
    if (isBrowser) {
      window.localStorage.setItem(STORAGE_KEYS.hotWords, JSON.stringify(hotWords))
    }
  }, [hotWords])

  const updateHotWords = useCallback((detail) => {
    setHotWords((prevHotWords) => {
      const list = Array.isArray(prevHotWords) ? prevHotWords : []
      const summary = {
        word: detail.word,
        definition: detail.primaryDefinition || '暂无释义',
        phonetic: detail.phonetics[0]?.text ?? '',
      }
      const filtered = list.filter(
        (item) => item.word.toLowerCase() !== summary.word.toLowerCase(),
      )
      return [summary, ...filtered].slice(0, 12)
    })
  }, [])

  const handlePlayAudio = useCallback((audioUrl) => {
    if (!audioUrl) return
    const audio = new Audio(audioUrl)
    audio.play().catch((err) => {
      console.warn('音频播放失败', err)
    })
  }, [])

  const fetchWordDetail = useCallback(async (targetWord) => {
    if (!targetWord) {
      throw new Error('请输入要查询的单词')
    }

    const normalized = targetWord.trim().toLowerCase()
    if (!normalized) {
      throw new Error('请输入要查询的单词')
    }

    const cachedEntry = cacheRef.current[normalized]
    if (cachedEntry) {
      return cachedEntry.detail
    }

    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${normalized}`)
    const data = await response.json()
    if (!response.ok) {
      const message = data?.title || data?.message || '未查询到结果'
      throw new Error(message)
    }

    const detail = transformDictionaryResponse(data)
    setCache((prev) => ({
      ...prev,
      [normalized]: {
        detail,
        fetchedAt: Date.now(),
      },
    }))
    return detail
  }, [])

  const handleSearch = useCallback(
    async (word) => {
      setError('')
      setStatus('loading')
      try {
        const detail = await fetchWordDetail(word || query)
        setResult(detail)
        setStatus('success')
        updateHotWords(detail)
      } catch (err) {
        setStatus('error')
        setResult(null)
        setError(err instanceof Error ? err.message : '查询失败，请稍后再试')
      }
    },
    [fetchWordDetail, query, updateHotWords],
  )

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault()
      handleSearch()
    },
    [handleSearch],
  )

  const handleProgressUpdate = useCallback(
    (correct) => {
      if (!result?.word) return
      const key = result.word.toLowerCase()
      setProgress((prev) => {
        const entry = prev[key] ?? { level: 0, due: Date.now(), history: [] }
        const nextLevel = correct ? Math.min(entry.level + 1, 5) : 0
        const intervalIndex = Math.max(Math.min(nextLevel || 1, PROGRESS_INTERVALS_HOURS.length), 1) - 1
        const dueOffsetHours = PROGRESS_INTERVALS_HOURS[intervalIndex]
        const due = Date.now() + dueOffsetHours * 60 * 60 * 1000
        const history = [...(entry.history ?? []), { t: Date.now(), correct }].slice(-10)
        return {
          ...prev,
          [key]: {
            level: nextLevel,
            due,
            history,
          },
        }
      })
    },
    [result?.word],
  )

  const reviewQueue = useMemo(() => {
    const now = Date.now()
    return Object.entries(progress)
      .map(([word, entry]) => ({
        word,
        level: entry.level ?? 0,
        due: entry.due ?? now,
      }))
      .sort((a, b) => a.due - b.due)
      .slice(0, 5)
  }, [progress])

  const currentProgress = useMemo(() => {
    if (!result?.word) {
      return {
        level: 0,
        dueLabel: '尚未安排',
        history: [],
      }
    }
    const key = result.word.toLowerCase()
    const entry = progress[key]
    if (!entry) {
      return {
        level: 0,
        dueLabel: '尚未安排',
        history: [],
      }
    }
    return {
      level: entry.level ?? 0,
      dueLabel: formatDueTime(entry.due),
      history: entry.history ?? [],
    }
  }, [progress, result?.word])

  const handleHotWordSelect = useCallback(
    (word) => {
      setQuery(word)
      handleSearch(word)
    },
    [handleSearch],
  )

  const searchStatusMessage = useMemo(() => {
    if (status === 'loading') return '正在查询词典数据...'
    if (status === 'error' && error) return error
    if (status === 'success' && result) return `查询完成：${result.word}`
    return '输入单词，立即查阅释义和例句'
  }, [status, error, result])

  return (
    <div className="page">
      <header className="top-bar">
        <div className="brand">LexWord</div>
        <button className="profile-button" type="button">
          <span className="profile-avatar">J</span>
          <span className="profile-name">Jackson</span>
        </button>
      </header>

      <main className="content">
        <section className="hero">
          <div className="hero-text">
            <h1 className="hero-title">你的智能词典伙伴</h1>
            <p className="hero-subtitle">结合开源词典与间隔重复系统，帮你高效背单词</p>
          </div>

          <form className="hero-search" onSubmit={handleSubmit}>
            <SearchIcon />
            <input
              id="word-search"
              type="text"
              placeholder="输入英文单词，按 Enter 查询"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
            <button className="search-action" type="submit">
              开始探索
            </button>
          </form>
          <p
            className={`search-status ${
              status === 'loading' ? 'loading' : status === 'error' ? 'error' : 'idle'
            }`}
          >
            {searchStatusMessage}
          </p>
        </section>

        <section className="daily-words">
          <div className="daily-header">
            <h2>热点单词</h2>
            <span className="daily-subtitle">最近搜索与常用词，点击即可复习</span>
          </div>
          <div className="word-grid">
            {hotWords.map((item) => {
              const progressEntry = progress[item.word.toLowerCase()]
              return (
                <article
                  className="word-card"
                  key={item.word}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleHotWordSelect(item.word)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleHotWordSelect(item.word)
                    }
                  }}
                >
                  <div className="word-card-header">
                    <h3>{item.word}</h3>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleHotWordSelect(item.word)
                      }}
                      aria-label={`重新查询 ${item.word}`}
                    >
                      <SearchIcon />
                    </button>
                  </div>
                  <p className="word-translation">{item.definition}</p>
                  <div className="word-meta">
                    {item.phonetic && (
                      <div className="word-meta-item">
                        <SoundIcon />
                        <span>{item.phonetic}</span>
                      </div>
                    )}
                    <div className="word-meta-item">
                      <SparkleIcon />
                      <span>Lv.{progressEntry?.level ?? 0}</span>
                    </div>
                    <div className="word-meta-item">
                      <ClockIcon />
                      <span>{formatDueTime(progressEntry?.due)}</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {reviewQueue.length > 0 && (
          <section className="review-section">
            <div className="section-heading">
              <h2>待复习列表</h2>
              <span>按照到期时间排序</span>
            </div>
            <ul className="review-list">
              {reviewQueue.map((item) => (
                <li key={item.word}>
                  <div>
                    <strong>{item.word}</strong>
                    <span className="review-meta">Lv.{item.level}</span>
                  </div>
                  <span>{formatDueTime(item.due)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {result ? (
          <WordDetailView
            detail={result}
            progressInfo={currentProgress}
            onProgressUpdate={handleProgressUpdate}
            onPlayAudio={handlePlayAudio}
          />
        ) : (
          <div className="result-placeholder">
            <h2>开始探索你的词汇宇宙</h2>
            <p>查询任意单词即可看到释义、例句、发音与学习进度。</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
