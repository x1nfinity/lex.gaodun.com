import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLexContext } from '../context/LexContext.jsx';
import { LEARNING_CONTEXT_OPTIONS, getEnglishLevelByValue } from '../data/profileFormOptions.js';

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

const contextsByValue = new Map(LEARNING_CONTEXT_OPTIONS.map(option => [option.value, option]));

const stripParentheses = text => (text || '').replace(/\s*\(.*?\)\s*/g, '').replace(/（.*?）/g, '').trim();

const ProfileEditor = ({ open, onClose }) => {
    const { userProfile } = useLexContext();

    const nickname = userProfile?.nickname?.trim() || '学习者';
    const englishLevelValue = userProfile?.englishLevel?.trim() || '';
    const englishLevelOption = englishLevelValue ? getEnglishLevelByValue(englishLevelValue) : null;
    const englishLevelLabel = englishLevelOption ? stripParentheses(englishLevelOption.label) : '未填写';
    const englishLevelDescription = englishLevelOption?.description || '你还没有设置英语水平';
    const englishLevelExamples = englishLevelOption?.examples || [];
    const preferenceDetails = useMemo(() => {
        if (!Array.isArray(userProfile?.contentPreferences) || userProfile.contentPreferences.length === 0) return [];
        return userProfile.contentPreferences
            .map(value => {
                const option = contextsByValue.get(value);
                if (!option) {
                    return {
                        label: stripParentheses(value),
                        examples: [],
                    };
                }
                return {
                    label: stripParentheses(option.label),
                    examples: Array.isArray(option.examples) ? option.examples : [],
                };
            })
            .filter(item => item.label);
    }, [userProfile?.contentPreferences]);

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

    const content = (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center px-4 py-10 sm:px-6 sm:py-12'
            role='dialog'
            aria-modal='true'
            aria-labelledby='profile-editor-title'
            aria-describedby='profile-editor-subtitle'
        >
            <div className='absolute inset-0 bg-slate-900/55 backdrop-blur-sm transition-opacity' onClick={onClose} aria-hidden='true' />
            <div className='relative flex w-full max-w-[960px] flex-col overflow-hidden rounded-[36px] bg-white/96 shadow-[0_42px_120px_rgba(79,70,229,0.18)] ring-1 ring-indigo-100/80 backdrop-blur'>
                <div className='relative bg-gradient-to-br from-indigo-100 via-white to-indigo-50 px-10 py-10'>
                    <div className='absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-sky-500/10' aria-hidden='true' />
                    <div className='relative flex items-start justify-between gap-6'>
                        <div className='space-y-3'>
                            <h2 className='text-[28px] font-semibold text-slate-900'>编辑你的学习资料</h2>
                            <p className='text-sm text-slate-500'>调整英语水平与偏好，让 AI 提供更贴近你的内容</p>
                            <div className='inline-flex rounded-2xl bg-indigo-100/60 px-5 py-3 text-sm text-indigo-600 shadow-inner shadow-indigo-200/40'>
                                档案信息会直接影响大模型生成的释义和例句，请保持信息准确。
                            </div>
                        </div>
                        <button
                            type='button'
                            onClick={onClose}
                            aria-label='关闭'
                            className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 text-lg text-indigo-400 transition hover:bg-white hover:text-indigo-500'
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className='max-h-[60vh] space-y-6 overflow-y-auto px-10 pb-10 pt-6'>
                    <section className='rounded-3xl border border-indigo-100/70 bg-white px-6 py-5 shadow-[0_12px_32px_rgba(79,70,229,0.06)]'>
                        <label className='block text-sm font-medium text-indigo-500/90'>昵称</label>
                        <p className='mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-lg font-semibold text-slate-900'>
                            {nickname}
                        </p>
                    </section>

                    <section className='overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 p-6 shadow-[0_16px_48px_rgba(79,70,229,0.08)]'>
                        <div className='flex items-start justify-between gap-6'>
                            <div className='space-y-2'>
                                <span className='text-sm font-medium text-indigo-500'>英语水平</span>
                                <h3 className='text-xl font-semibold text-slate-900'>{englishLevelLabel}</h3>
                                <p className='text-sm leading-relaxed text-slate-600'>{englishLevelDescription}</p>
                            </div>
                            <span className='rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-500 shadow-sm ring-1 ring-indigo-100/80'>
                                CEFR {englishLevelOption?.value ?? '—'}
                            </span>
                        </div>
                        {englishLevelExamples.length > 0 ? (
                            <ul className='mt-4 space-y-3 text-sm text-slate-600'>
                                {englishLevelExamples.map(example => (
                                    <li key={example} className='flex items-start gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm shadow-indigo-100'>
                                        <span className='mt-[6px] h-2 w-2 rounded-full bg-indigo-400/70' aria-hidden='true' />
                                        <span>{example}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </section>

                    <section className='rounded-3xl border border-indigo-100/70 bg-white px-6 py-6 shadow-[0_16px_48px_rgba(79,70,229,0.08)]'>
                        <div className='flex items-center justify-between gap-4'>
                            <div>
                                <span className='text-sm font-medium text-indigo-500'>内容偏好</span>
                                <h3 className='mt-2 text-xl font-semibold text-slate-900'>优先学习场景</h3>
                                <p className='mt-2 text-sm text-slate-500'>我们会在释义、例句与互动中优先融入这些场景。</p>
                            </div>
                            <span className='rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-500 ring-1 ring-indigo-100/80'>
                                {preferenceDetails.length} 项
                            </span>
                        </div>
                        {preferenceDetails.length > 0 ? (
                            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                                {preferenceDetails.map(item => (
                                    <article
                                        key={item.label}
                                        className='rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-indigo-50/40 p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-lg'
                                    >
                                        <h4 className='text-sm font-semibold text-slate-900'>{item.label}</h4>
                                        {item.examples.length > 0 ? (
                                            <ul className='mt-3 space-y-2 text-xs text-slate-600'>
                                                {item.examples.slice(0, 2).map(example => (
                                                    <li key={`${item.label}-${example}`} className='flex items-start gap-2'>
                                                        <span className='mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400/70' aria-hidden='true' />
                                                        <span>{example}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className='mt-4 rounded-2xl border border-dashed border-indigo-100 bg-indigo-50/60 px-4 py-8 text-center text-sm text-indigo-500'>
                                暂未选择具体偏好场景。完成偏好设置后，AI 将主动精选更贴近你的学习内容。
                            </p>
                        )}
                    </section>
                </div>

            </div>
        </div>
    );

    return createPortal(content, modalRoot);
};

export default ProfileEditor;
