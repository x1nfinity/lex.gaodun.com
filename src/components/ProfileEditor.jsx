import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLexContext } from '../context/LexContext.jsx';
import ProfileForm from './ProfileForm.jsx';
import './ProfileEditor.css';
import './ProfileForm.css';

const modalRootId = 'profile-editor-root';

const ensureModalRoot = () => {
    if (typeof document === 'undefined') return null;
    let root = document.getElementById(modalRootId);
    if (!root) {
        root = document.createElement('div');
        root.setAttribute('id', modalRootId);
        document.body.appendChild(root);
    }
    return root;
};

const ProfileEditor = ({ open, onClose }) => {
    const { userProfile, saveUserProfile } = useLexContext();

    useEffect(() => {
        if (!open) return undefined;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [open]);

    if (!open) return null;

    const modalRoot = ensureModalRoot();
    if (!modalRoot) return null;

    const handleSubmit = async profile => {
        saveUserProfile(profile);
        onClose?.();
    };

    const handleReset = async () => {
        saveUserProfile({
            nickname: '',
            englishLevel: '',
            contentPreferences: [],
        });
    };

    const content = (
        <div
            className='profile-editor'
            role='dialog'
            aria-modal='true'
            aria-labelledby='profile-editor-title'
            aria-describedby='profile-editor-subtitle'
        >
            <div className='profile-editor-backdrop' onClick={onClose} aria-hidden='true' />
            <div className='profile-editor-panel'>
                <button className='profile-editor-close' type='button' onClick={onClose} aria-label='关闭'>
                    ×
                </button>
                <ProfileForm
                    initialProfile={userProfile}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    submitLabel='保存偏好'
                    title='编辑你的学习资料'
                    subtitle='调整英语水平与偏好，让 AI 提供更贴近你的内容'
                    titleId='profile-editor-title'
                    subtitleId='profile-editor-subtitle'
                    helperText='档案信息会直接影响大模型生成的释义和例句，请保持信息准确。'
                    onReset={handleReset}
                />
            </div>
        </div>
    );

    return createPortal(content, modalRoot);
};

export default ProfileEditor;
