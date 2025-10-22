import { useMemo, useState } from 'react'
import './App.css'

const dailyWords = [
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
]

const HeartIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 20.5C12 20.5 4 14.5 4 9.5C4 7.01472 6.01472 5 8.5 5C10.0523 5 11.438 5.83267 12 7.05882C12.562 5.83267 13.9477 5 15.5 5C17.9853 5 20 7.01472 20 9.5C20 14.5 12 20.5 12 20.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

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

const ArrowLeftIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M5 12H19"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 7L5 12L10 17"
      stroke="currentColor"
      strokeWidth="1.6"
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

const LandingView = ({ onNavigate }) => (
  <>
    <section className="hero">
      <div className="hero-text">
        <h1 className="hero-title">Welcome ,Jackson</h1>
        <p className="hero-subtitle">智慧查询，理解更高一筹</p>
      </div>
      <label className="hero-search" htmlFor="word-search">
        <SearchIcon />
        <input
          id="word-search"
          type="text"
          placeholder="在此输入单词，立即理解并学会运用"
        />
        <button className="search-action" type="button" onClick={onNavigate}>
          开始探索
        </button>
      </label>
    </section>

    <section className="daily-words">
      <div className="daily-header">
        <h2>今日热词</h2>
        <button className="view-all" type="button">
          查看全部
        </button>
      </div>
      <div className="word-grid">
        {dailyWords.map((item) => (
          <article
            className="word-card"
            key={item.word}
            role="button"
            tabIndex={0}
            onClick={onNavigate}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onNavigate()
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
                <span>{item.pronunciation}</span>
              </div>
              <div className="word-meta-item">
                <HeartIcon />
                <span>{item.likes}</span>
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
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <span>{item.practices}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  </>
)

const WordDetailView = ({ detail, onBack }) => {
  const recommendedPhrases = useMemo(
    () => detail.phrases.slice(0, 3),
    [detail.phrases],
  )

  return (
    <section className="word-detail">
      <div className="word-detail-bar">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeftIcon />
          返回探索
        </button>
        <button className="sync-button" type="button">
          <SparkleIcon />
          同步收藏
        </button>
      </div>

      <div className="word-detail-card">
        <header className="word-detail-header">
          <div>
            <h1>{detail.word}</h1>
            <p className="word-detail-translation">{detail.translation}</p>
          </div>
          <div className="word-detail-pronunciation">
            <button className="tone-tag" type="button">
              <SoundIcon />
              美 /{detail.phonetic.us}/
            </button>
            <button className="tone-tag" type="button">
              <SoundIcon />
              英 /{detail.phonetic.uk}/
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
              <article className="meaning-card" key={item.title}>
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
      </div>
    </section>
  )
}

const wordDetail = {
  word: 'charger',
  translation: 'n. 充电器；充电线',
  phonetic: {
    us: "ˈtʃɑːrdʒər",
    uk: "ˈtʃɑːdʒə",
  },
  partOfSpeech: '名词',
  frequency: '旅行必备',
  inflections: 'chargers',
  meanings: [
    {
      title: '给电子设备补充能量的工具',
      description:
        '最常见的含义，指为手机、电脑等电子设备供电的充电头或充电器。',
    },
    {
      title: '交通、旅途必带的随身物品',
      description:
        '在旅行场景下常指随身携带的便携式充电器或充电宝。',
    },
    {
      title: '引申：为某事提供动力的人或物',
      description:
        '在团队语境中可表示“动力来源”，用于形容鼓舞士气的人。',
    },
  ],
  examples: [
    {
      en: "I forgot to pack my phone charger, so I need to buy one at the airport.",
      zh: '我忘了带手机充电器，只能在机场赶紧买一个。',
    },
    {
      en: 'This hotel provides a universal charger for international travelers.',
      zh: '这家酒店为国际旅客提供通用充电器。',
    },
    {
      en: 'My power bank can charge multiple devices; it’s a real life-saver during long trips.',
      zh: '我的充电宝能给多台设备充电，长途旅行时特别靠谱。',
    },
  ],
  phrases: ['portable charger', 'wireless charger', 'charging cable', 'fast charger'],
}

function App() {
  const [view, setView] = useState('landing')

  const handleNavigate = () => {
    setView('detail')
  }

  const handleBack = () => {
    setView('landing')
  }

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
        {view === 'landing' ? (
          <LandingView onNavigate={handleNavigate} />
        ) : (
          <WordDetailView detail={wordDetail} onBack={handleBack} />
        )}
      </main>
    </div>
  )
}

export default App
