import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

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
]

const STORAGE_KEYS = {
  hotWords: 'lex.hotwords.v1',
  cache: 'lex.dictionary.cache.v1',
}

const isBrowser = typeof window !== 'undefined'

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

  const entry = data[0] ?? {}
  const phonetics = (entry.phonetics ?? [])
    .filter((item) => item.text || item.audio)
    .map((item) => ({
      text: item.text ?? '',
      audio: item.audio ?? '',
      dialect: item.audio?.includes('-us.mp3')
        ? 'us'
        : item.audio?.includes('-uk.mp3')
          ? 'uk'
          : '',
    }))

  const fallbackPhonetic = { text: '暂无音标', audio: '' }
  const usPhonetic = phonetics.find((item) => item.dialect === 'us') ?? phonetics[0] ?? fallbackPhonetic
  const ukPhonetic =
    phonetics.find((item) => item.dialect === 'uk') ?? phonetics.find((item) => item !== usPhonetic) ?? usPhonetic

  const definitionList = []
  const exampleList = []
  const synonymSet = new Set()

  data.forEach((item) => {
    item.meanings?.forEach((meaning) => {
      meaning.definitions?.forEach((definition) => {
        if (definition.definition) {
          definitionList.push({
            title: meaning.partOfSpeech || '释义',
            description: definition.definition,
          })
        }
        if (definition.example) {
          exampleList.push({
            en: definition.example,
            zh: '暂无翻译',
          })
        }
        definition.synonyms?.forEach((synonym) => {
          synonymSet.add(synonym)
        })
      })
    })
  })

  const uniqueDefinitions = []
  const definitionKeys = new Set()
  for (const item of definitionList) {
    const key = `${item.title}|${item.description}`
    if (definitionKeys.has(key)) continue
    definitionKeys.add(key)
    uniqueDefinitions.push(item)
    if (uniqueDefinitions.length >= 4) break
  }

  const uniqueExamples = []
  const exampleKeys = new Set()
  for (const item of exampleList) {
    if (exampleKeys.has(item.en)) continue
    exampleKeys.add(item.en)
    uniqueExamples.push(item)
    if (uniqueExamples.length >= 3) break
  }

  const synonyms = Array.from(synonymSet).slice(0, 6)

  return {
    word: entry.word ?? '',
    translation: uniqueDefinitions[0]?.description ?? '暂无释义',
    phonetic: {
      us: { text: usPhonetic.text || '暂无音标', audio: usPhonetic.audio ?? '' },
      uk: { text: ukPhonetic.text || '暂无音标', audio: ukPhonetic.audio ?? '' },
    },
    partOfSpeech: entry.meanings?.[0]?.partOfSpeech ?? '暂无词性',
    frequency: '暂无数据',
    inflections:
      entry.meanings?.[0]?.definitions?.[0]?.antonyms?.slice(0, 3).join(', ')?.trim() || '暂无数据',
    meanings: uniqueDefinitions.length > 0 ? uniqueDefinitions : [{ title: '释义', description: '暂无释义' }],
    examples:
      uniqueExamples.length > 0
        ? uniqueExamples
        : [
            {
              en: '暂无例句',
              zh: '稍后再试',
            },
          ],
    phrases: synonyms,
    sourceUrls: entry.sourceUrls ?? [],
  }
}

const LexContext = createContext(null)

export const LexProvider = ({ children }) => {
  const [hotWords, setHotWords] = useState(() => safeReadFromStorage(STORAGE_KEYS.hotWords, DEFAULT_HOT_WORDS))
  const [cache, setCache] = useState(() => safeReadFromStorage(STORAGE_KEYS.cache, {}))

  const cacheRef = useRef(cache)

  useEffect(() => {
    cacheRef.current = cache
    if (isBrowser) {
      window.localStorage.setItem(STORAGE_KEYS.cache, JSON.stringify(cache))
    }
  }, [cache])

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
        translation: detail.translation || '暂无释义',
        pronunciation: detail.phonetic?.us?.text || detail.phonetic?.uk?.text || '',
        likes: detail.likes ?? '—',
        practices: detail.practices ?? '—',
      }
      const filtered = list.filter((item) => item.word.toLowerCase() !== summary.word.toLowerCase())
      return [summary, ...filtered].slice(0, 12)
    })
  }, [])

  const fetchWordDetail = useCallback(
    async (rawWord) => {
      const normalized = rawWord?.trim().toLowerCase()
      if (!normalized) {
        throw new Error('请输入要查询的单词')
      }

      const cachedEntry = cacheRef.current[normalized]
      if (cachedEntry) {
        updateHotWords(cachedEntry.detail)
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
      updateHotWords(detail)
      return detail
    },
    [updateHotWords],
  )

  const value = useMemo(
    () => ({
      hotWords,
      fetchWordDetail,
    }),
    [hotWords, fetchWordDetail],
  )

  return <LexContext.Provider value={value}>{children}</LexContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLexContext = () => {
  const context = useContext(LexContext)
  if (!context) {
    throw new Error('useLexContext must be used within a LexProvider')
  }
  return context
}
