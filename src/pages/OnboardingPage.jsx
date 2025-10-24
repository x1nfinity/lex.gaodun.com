import { useLexContext } from '../context/LexContext.jsx';
import ProfileForm from '../components/ProfileForm.jsx';
import './OnboardingPage.css';
import '../components/ProfileForm.css';

const OnboardingPage = ({ onComplete }) => {
    const { userProfile, saveUserProfile } = useLexContext();

    const handleSubmit = profile => {
        saveUserProfile(profile);
        onComplete?.();
    };

    return (
        <div className='onboarding'>
            <header className='onboarding-top'>
                <span className='onboarding-logo-dot' aria-hidden='true' />
                <span className='onboarding-logo'>LexWord</span>
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
