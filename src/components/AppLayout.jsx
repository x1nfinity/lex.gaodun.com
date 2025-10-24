import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLexContext } from '../context/LexContext.jsx';
import ProfileEditor from './ProfileEditor.jsx';

const AppLayout = () => {
    const { userProfile } = useLexContext();
    const [showEditor, setShowEditor] = useState(false);
    const displayName = userProfile?.nickname || '学习者';
    const initial = displayName?.trim() ? displayName.trim()[0].toUpperCase() : '学';

    return (
        <div className='page'>
            <header className='top-bar'>
                <div className='brand'>LexWord</div>
                <button
                    className='profile-button'
                    type='button'
                    aria-label='个人信息'
                    onClick={() => setShowEditor(true)}
                >
                    <span className='profile-avatar'>{initial}</span>
                    <span className='profile-name'>{displayName}</span>
                </button>
            </header>

            <main className='content'>
                <Outlet />
            </main>

            <ProfileEditor open={showEditor} onClose={() => setShowEditor(false)} />
        </div>
    );
};

export default AppLayout;
