import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLexContext } from '../context/LexContext.jsx'
import { HeartIcon, SearchIcon, SoundIcon } from '../components/icons.jsx'

const HomePage = () => {
  const { hotWords } = useLexContext()
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleNavigate = (targetWord) => {
    const normalized = targetWord?.trim()
    if (!normalized) {
      setError('请输入要查询的单词')
      return
    }
    setError('')
    navigate(`/word/${encodeURIComponent(normalized.toLowerCase())}`)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    handleNavigate(query)
  }

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1 className="hero-title">Welcome ,Jackson</h1>
          <p className="hero-subtitle">智慧查询，理解更高一筹</p>
        </div>

        <form className="hero-search" onSubmit={handleSubmit}>
          <SearchIcon />
          <input
            id="word-search"
            type="text"
            placeholder="在此输入单词，立即理解并学会运用"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          <button className="search-action" type="submit">
            开始探索
          </button>
        </form>
        {error && <p className="search-hint">{error}</p>}
      </section>

      <section className="daily-words">
        <div className="daily-header">
          <h2>今日热词</h2>
          <button className="view-all" type="button">
            查看全部
          </button>
        </div>
        <div className="word-grid">
          {hotWords.map((item) => (
            <article
              className="word-card"
              key={item.word}
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate(item.word)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleNavigate(item.word)
                }
              }}
            >
              <div className="word-card-header">
                <h3>{item.word}</h3>
                <button className="icon-button" type="button" aria-label="收藏">
                  <HeartIcon />
                </button>
              </div>
              <p className="word-translation">{item.translation}</p>
              <div className="word-meta">
                <div className="word-meta-item">
                  <SoundIcon />
                  <span>{item.pronunciation || '暂无音标'}</span>
                </div>
                <div className="word-meta-item">
                  <HeartIcon />
                  <span>{item.likes ?? '—'}</span>
                </div>
                <div className="word-meta-item">
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
                  <span>{item.practices ?? '—'}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

export default HomePage
