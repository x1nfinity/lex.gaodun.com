import { useLexContext } from '../context/LexContext.jsx';
import { useNavigate } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm.jsx';
import logo from '../assets/logo.png';
import './OnboardingPage.css';
import '../components/ProfileForm.css';

const OnboardingPage = ({ onComplete }) => {
    const { userProfile, saveUserProfile } = useLexContext();
    const navigate = useNavigate();

    const handleSubmit = profile => {
        saveUserProfile(profile);
        onComplete?.();
    };

    return (
        <div className='onboarding'>
            <header className='onboarding-top'>
                <span className='onboarding-logo-dot' aria-hidden='true' />
                <img src={logo} alt='LexWord' className='onboarding-logo' onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
            </header>
            <main className='onboarding-body'>
                <ProfileForm
                    initialProfile={userProfile}
                    onSubmit={handleSubmit}
                    submitLabel='开启学习英语之旅'
                    title='让我们先了解你'
                    subtitle='个性化的学习建议将依据你的基础和喜好给出'
                />
            </main>
        </div>
    );
};

export default OnboardingPage;
