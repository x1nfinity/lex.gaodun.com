import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import AppLayout from './components/AppLayout.jsx'
import { LexProvider } from './context/LexContext.jsx'
import HomePage from './pages/HomePage.jsx'
import WordDetailPage from './pages/WordDetailPage.jsx'

function App() {
  return (
    <LexProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="word/:word" element={<WordDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LexProvider>
  )
}

export default App
