import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useLexContext, LexProvider } from './context/LexContext.jsx';
import './App.css';
import AppLayout from './components/AppLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import WordDetailPage from './pages/WordDetailPage.jsx';

const AppRoutes = () => {
    const { isProfileComplete } = useLexContext();

    if (!isProfileComplete) {
        return <OnboardingPage />;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<AppLayout />}>
                    <Route index element={<HomePage />} />
                    <Route path='word/:word' element={<WordDetailPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

const App = () => (
    <LexProvider>
        <AppRoutes />
    </LexProvider>
);

export default App;
