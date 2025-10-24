import { useEffect, useMemo, useState } from 'react';
import {
    ENGLISH_LEVEL_OPTIONS,
    LEARNING_CONTEXT_OPTIONS,
    MAX_CONTEXT_SELECTIONS,
    getEnglishLevelByValue,
    getLearningContextByValue,
} from '../data/profileFormOptions.js';
import './ProfileForm.css';

const DEFAULT_PROFILE = {
    nickname: '',
    englishLevel: '',
    contentPreferences: [],
};

const resolveEnglishLevelValue = value => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    const match = getEnglishLevelByValue(trimmed) || ENGLISH_LEVEL_OPTIONS.find(item => item.label === trimmed);
    return match ? match.value : trimmed;
};

const resolvePreferenceValue = value => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    const match = getLearningContextByValue(trimmed) || LEARNING_CONTEXT_OPTIONS.find(item => item.label === trimmed);
    return match ? match.value : trimmed;
};

const normalizePreferences = (list, limit) => {
    if (!Array.isArray(list)) return [];
    const normalized = Array.from(
        new Set(
            list
                .map(resolvePreferenceValue)
                .filter(Boolean),
        ),
    );
    if (limit === 1) {
        return normalized.length > 0 ? [normalized[0]] : [];
    }
    if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
        return normalized.slice(0, limit);
    }
    return normalized;
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
    maxPreferences = MAX_CONTEXT_SELECTIONS,
    isSubmitting = false,
}) => {
    const [nickname, setNickname] = useState(initialProfile.nickname || '');
    const [englishLevel, setEnglishLevel] = useState(resolveEnglishLevelValue(initialProfile.englishLevel));
    const [preferences, setPreferences] = useState(() =>
        normalizePreferences(initialProfile.contentPreferences, maxPreferences),
    );
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);

    useEffect(() => {
        setNickname(initialProfile.nickname || '');
        setEnglishLevel(resolveEnglishLevelValue(initialProfile.englishLevel));
        setPreferences(normalizePreferences(initialProfile.contentPreferences, maxPreferences));
    }, [initialProfile, maxPreferences]);

    const isFormValid = useMemo(() => Boolean(nickname.trim() && englishLevel.trim()), [englishLevel, nickname]);
    const isSaving = isSubmitting || pending;

    const togglePreference = value => {
        setPreferences(prev => {
            if (maxPreferences === 1) {
                return prev.includes(value) ? [] : [value];
            }
            const list = Array.isArray(prev) ? prev : [];
            if (list.includes(value)) {
                return list.filter(item => item !== value);
            }
            if (typeof maxPreferences === 'number' && maxPreferences > 0 && list.length >= maxPreferences) {
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
                            key={option.value}
                            type='button'
                            className={`onboarding-option rich-card ${englishLevel === option.value ? 'selected' : ''}`}
                            onClick={() => setEnglishLevel(option.value)}
                            disabled={isSaving}
                        >
                            <span className='option-title'>{option.label}</span>
                            <span className='option-description'>{option.description}</span>
                            <ul className='option-examples'>
                                {option.examples.map(example => (
                                    <li key={example}>{example}</li>
                                ))}
                            </ul>
                        </button>
                    ))}
                </div>
            </div>

            <div className='onboarding-field'>
                <span className='onboarding-label'>
                    内容偏好
                    {maxPreferences === 1 ? <small>（可选，单选）</small> : <small>（最多选择 {maxPreferences} 项，可选）</small>}
                </span>
                <div className='onboarding-options'>
                    {LEARNING_CONTEXT_OPTIONS.map(option => {
                        const selected = preferences.includes(option.value);
                        const disabled =
                            maxPreferences !== 1 &&
                            !selected &&
                            typeof maxPreferences === 'number' &&
                            maxPreferences > 0 &&
                            preferences.length >= maxPreferences;
                        return (
                            <button
                                key={option.value}
                                type='button'
                                className={`onboarding-option compact ${selected ? 'selected' : ''}`}
                                onClick={() => togglePreference(option.value)}
                                disabled={isSaving || disabled}
                            >
                                <span className='option-title'>{option.label}</span>
                                <span className='option-hint'>{option.examples[0]}</span>
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
