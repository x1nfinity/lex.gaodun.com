import { useEffect, useMemo, useState } from 'react';
import './ProfileForm.css';

const ENGLISH_LEVEL_OPTIONS = ['小白', '过了4级', '过了6级', '雅思7+', '初高中'];

const CONTENT_PREFERENCE_OPTIONS = ['商务会议', '日常生活', '职场沟通', '学术写作', '出国旅行', '兴趣社交'];

const DEFAULT_PROFILE = {
    nickname: '',
    englishLevel: '',
    contentPreferences: [],
};

const ProfileForm = ({
    initialProfile = DEFAULT_PROFILE,
    title = '让我们先了解你',
    subtitle = '个性化的学习建议将依据你的基础和喜好给出',
    submitLabel = '保存',
    titleId,
    subtitleId,
    helperText,
    onSubmit,
    onCancel,
    onReset,
    maxPreferences = 4,
    isSubmitting = false,
}) => {
    const [nickname, setNickname] = useState(initialProfile.nickname || '');
    const [englishLevel, setEnglishLevel] = useState(initialProfile.englishLevel || '');
    const [preferences, setPreferences] = useState(() => [...(initialProfile.contentPreferences ?? [])]);
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);

    useEffect(() => {
        setNickname(initialProfile.nickname || '');
        setEnglishLevel(initialProfile.englishLevel || '');
        setPreferences(Array.isArray(initialProfile.contentPreferences) ? [...initialProfile.contentPreferences] : []);
    }, [initialProfile]);

    const isFormValid = useMemo(() => Boolean(nickname.trim() && englishLevel.trim()), [englishLevel, nickname]);
    const isSaving = isSubmitting || pending;

    const togglePreference = value => {
        setPreferences(prev => {
            const list = Array.isArray(prev) ? prev : [];
            if (list.includes(value)) {
                return list.filter(item => item !== value);
            }
            if (list.length >= maxPreferences) {
                return list;
            }
            return [...list, value];
        });
    };

    const handleSubmit = async event => {
        event.preventDefault();
        if (!isFormValid) {
            setError('请填写昵称并选择英语水平');
            return;
        }

        setError('');
        if (!onSubmit) return;

        const payload = {
            nickname: nickname.trim(),
            englishLevel: englishLevel.trim(),
            contentPreferences: preferences,
        };

        setPending(true);
        try {
            await onSubmit(payload);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : '保存失败，请稍后再试');
        } finally {
            setPending(false);
        }
    };

    const handleReset = async () => {
        if (isSaving) return;
        const clearState = () => {
            setNickname('');
            setEnglishLevel('');
            setPreferences([]);
        };

        setError('');

        if (!onReset) {
            clearState();
            return;
        }

        setPending(true);
        try {
            await onReset();
            clearState();
        } catch (resetError) {
            setError(resetError instanceof Error ? resetError.message : '重置失败，请稍后再试');
        } finally {
            setPending(false);
        }
    };

    return (
        <form className='onboarding-card' onSubmit={handleSubmit}>
            <h1 className='onboarding-title' id={titleId}>
                {title}
            </h1>
            {subtitle ? (
                <p className='onboarding-subtitle' id={subtitleId}>
                    {subtitle}
                </p>
            ) : null}
            {helperText ? <p className='onboarding-helper'>{helperText}</p> : null}

            <label className='onboarding-field'>
                <span className='onboarding-label'>昵称</span>
                <input
                    type='text'
                    placeholder='请填写你的昵称'
                    value={nickname}
                    onChange={event => setNickname(event.target.value)}
                    disabled={isSaving}
                />
            </label>

            <div className='onboarding-field'>
                <span className='onboarding-label'>英语水平</span>
                <div className='onboarding-options'>
                    {ENGLISH_LEVEL_OPTIONS.map(option => (
                        <button
                            key={option}
                            type='button'
                            className={`onboarding-option ${englishLevel === option ? 'selected' : ''}`}
                            onClick={() => setEnglishLevel(option)}
                            disabled={isSaving}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            <div className='onboarding-field'>
                <span className='onboarding-label'>
                    内容偏好
                    <small>（最多选择 {maxPreferences} 项，可选）</small>
                </span>
                <div className='onboarding-options'>
                    {CONTENT_PREFERENCE_OPTIONS.map(option => {
                        const selected = preferences.includes(option);
                        const disabled = !selected && preferences.length >= maxPreferences;
                        return (
                            <button
                                key={option}
                                type='button'
                                className={`onboarding-option ${selected ? 'selected' : ''}`}
                                onClick={() => togglePreference(option)}
                                disabled={isSaving || disabled}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>

            {error ? <p className='onboarding-error'>{error}</p> : null}

            <div className='onboarding-actions'>
                {onReset ? (
                    <button className='onboarding-reset' type='button' onClick={handleReset} disabled={isSaving}>
                        重置默认
                    </button>
                ) : null}
                {onCancel ? (
                    <button className='onboarding-cancel' type='button' onClick={onCancel} disabled={isSaving}>
                        取消
                    </button>
                ) : null}
                <button className='onboarding-submit' type='submit' disabled={isSaving}>
                    {isSaving ? '保存中...' : submitLabel}
                </button>
            </div>
        </form>
    );
};

export default ProfileForm;
