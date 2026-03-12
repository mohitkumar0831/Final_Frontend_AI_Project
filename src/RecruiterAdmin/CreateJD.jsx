import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, X, Copy, Check, Linkedin, Edit3, Save } from 'lucide-react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import SpinLoader from '../components/SpinLoader';
import { baseUrl } from '../utils/ApiConstants';
import summary from '../img/summary-check.png'
import graduation from '../img/graduation-cap.png'
import user from '../img/user-trust.png'
import overview from '../img/overview.png'
import bag from '../img/bag.png'
import exp from '../img/exp-check.png'
import map from '../img/map.png'
import calender from '../img/calender.png'
import city from '../img/city.png'
import benefitsimg from '../img/benefits.png'


function CreateJD() {
    const location = useLocation();

    const [formData, setFormData] = useState({
        offerId: '',
        companyName: '',
        keyResponsibilities: '',
        qualifications: '',
        benefits: '',
        additionalNotes: '',
        location: '',
        dueDate: '',
        employmentType: '',
    });

    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generatedJD, setGeneratedJD] = useState(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [jdUrl, setJdUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editableJD, setEditableJD] = useState({
        jobSummary: '',
        responsibilities: [],
        requirements: [],
        benefits: [],
        additionalInfo: ''
    });

    const [keyRespDraft, setKeyRespDraft] = useState('');

    useEffect(() => {
        if (location.state?.offerId) {
            let locationStr = '';
            if (Array.isArray(location.state.location)) {
                locationStr = location.state.location.join(', ');
            } else if (location.state.location) {
                locationStr = location.state.location;
            }

            let dueDateStr = '';
            if (location.state.dueDate) {
                const date = new Date(location.state.dueDate);
                dueDateStr = date.toISOString().split('T')[0];
            }

            setFormData((prev) => ({
                ...prev,
                offerId: location.state.offerId,
                companyName: location.state.companyName || '',
                location: locationStr,
                dueDate: dueDateStr,
                employmentType: location.state.employmentType || '',
            }));
        }
    }, [location.state]);

    useEffect(() => {
        if (generatedJD) {
            setEditableJD({
                jobSummary: generatedJD.jobSummary || '',
                responsibilities: generatedJD.responsibilities || [],
                requirements: generatedJD.requirements || [],
                benefits: generatedJD.benefits || [],
                additionalInfo: generatedJD.additionalInfo || ''
            });
        }
    }, [generatedJD]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.offerId) {
            alert('Please select an offer from the JD page table');
            return;
        }

        try {
            setCreating(true);
            const response = await axios.post(
                `${baseUrl}/jd/${formData.offerId}/ai`,
                {
                    companyName: formData.companyName,
                    keyResponsibilities: formData.keyResponsibilities,
                    qualifications: formData.qualifications,
                    benefits: formData.benefits,
                    additionalNotes: formData.additionalNotes,
                    location: formData.location,
                    dueDate: formData.dueDate,
                    employmentType: formData.employmentType,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('JD Creation Response:', response.data);

            if (response.data.success) {
                setGeneratedJD(response.data.jd);
                const generatedUrl = `https://recruterai.netfotech.in/JDDetail/${response.data.jd._id}`;
                setJdUrl(generatedUrl);
                setShowSuccessPopup(true);
            }
        } catch (error) {
            console.error('Error creating JD:', error);
            alert(error.response?.data?.error || 'Failed to create JD');
        } finally {
            setCreating(false);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (generatedJD) {
            setEditableJD({
                jobSummary: generatedJD.jobSummary || '',
                responsibilities: generatedJD.responsibilities || [],
                requirements: generatedJD.requirements || [],
                benefits: generatedJD.benefits || [],
                additionalInfo: generatedJD.additionalInfo || ''
            });
        }
    };

    const handleSaveEdit = async () => {
        if (!generatedJD?._id) {
            alert('No JD ID found. Please create a JD first.');
            return;
        }

        try {
            setSaving(true);
            const response = await axios.put(
                `${baseUrl}/jd/editjd/${generatedJD._id}`,
                {
                    jobSummary: editableJD.jobSummary,
                    responsibilities: editableJD.responsibilities,
                    requirements: editableJD.requirements,
                    benefits: editableJD.benefits,
                    additionalInfo: editableJD.additionalInfo
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setGeneratedJD(response.data.jd);
                setIsEditing(false);
                alert('JD updated successfully!');
            }
        } catch (error) {
            console.error('Error updating JD:', error);
            alert(error.response?.data?.error || 'Failed to update JD');
        } finally {
            setSaving(false);
        }
    };

    const handleEditableChange = (field, value) => {
        setEditableJD(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleArrayFieldChange = (field, index, value) => {
        setEditableJD(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => i === index ? value : item)
        }));
    };

    const handleAddArrayItem = (field) => {
        setEditableJD(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const handleRemoveArrayItem = (field, index) => {
        setEditableJD(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const getFullJDContent = () => {
        let jdContent = '';

        if (generatedJD) {
            jdContent = `📋 Job Description\n${'─'.repeat(30)}\n`;

            if (generatedJD.jobSummary) {
                jdContent += `\n📌 Job Summary:\n${generatedJD.jobSummary}\n`;
            }

            if (generatedJD.responsibilities && generatedJD.responsibilities.length > 0) {
                jdContent += `\n📌 Responsibilities:\n`;
                generatedJD.responsibilities.forEach((item) => {
                    jdContent += `  • ${item}\n`;
                });
            }

            if (generatedJD.requirements && generatedJD.requirements.length > 0) {
                jdContent += `\n📌 Requirements:\n`;
                generatedJD.requirements.forEach((item) => {
                    jdContent += `  • ${item}\n`;
                });
            }

            if (generatedJD.benefits && generatedJD.benefits.length > 0) {
                jdContent += `\n📌 Benefits:\n`;
                generatedJD.benefits.forEach((item) => {
                    jdContent += `  • ${item}\n`;
                });
            }

            if (generatedJD.additionalInfo) {
                jdContent += `\n📌 Additional Information:\n${generatedJD.additionalInfo}\n`;
            }

            jdContent += `\n🔗 Apply Here: ${jdUrl}`;
        }

        return jdContent;
    };

    const handleCopyLink = async () => {
        try {
            const fullCopyText = getFullJDContent();
            await navigator.clipboard.writeText(fullCopyText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShareWithCopy = async (platformName, platformUrl) => {
        try {
            const fullCopyText = getFullJDContent();
            await navigator.clipboard.writeText(fullCopyText);
            alert(`Job description copied! You can now paste it on ${platformName}.`);
            window.open(platformUrl, '_blank');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleClosePopup = () => {
        setShowSuccessPopup(false);
        setCopied(false);
    };

    const handleCloseSharePopup = () => {
        setShowSharePopup(false);
        setCopied(false);
    };

    const handleShareLinkClick = () => {
        if (generatedJD && jdUrl) {
            setShowSharePopup(true);
        }
    };

    const companyInitials = useMemo(() => {
        const name = (formData.companyName || '').trim();
        if (!name) return 'NS';
        const parts = name.split(/\s+/).filter(Boolean);
        const a = parts[0]?.[0] || '';
        const b = parts[1]?.[0] || '';
        return (a + b).toUpperCase() || 'NS';
    }, [formData.companyName]);

    const keyRespItems = useMemo(() => {
        return (formData.keyResponsibilities || '')
            .split(/,|\n/)
            .map(s => s.trim())
            .filter(Boolean);
    }, [formData.keyResponsibilities]);

    const setKeyRespItems = (items) => {
        setFormData(prev => ({
            ...prev,
            keyResponsibilities: items.join(', ')
        }));
    };

    const addKeyRespItem = (raw) => {
        const v = (raw || '').trim();
        if (!v) return;
        if (keyRespItems.some(x => x.toLowerCase() === v.toLowerCase())) return;
        setKeyRespItems([...keyRespItems, v]);
    };

    const removeKeyRespItem = (idx) => {
        setKeyRespItems(keyRespItems.filter((_, i) => i !== idx));
    };

    const onKeyRespKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addKeyRespItem(keyRespDraft);
            setKeyRespDraft('');
        }
        if (e.key === 'Backspace' && !keyRespDraft && keyRespItems.length) {
            removeKeyRespItem(keyRespItems.length - 1);
        }
    };

    const [showFullSummary, setShowFullSummary] = useState(false);
    const summaryText = generatedJD?.jobSummary || '';
    const summaryShort = summaryText.length > 260 ? `${summaryText.slice(0, 260)}...` : summaryText;

    const extractExperience = useMemo(() => {
        if (!generatedJD?.aiGenerationDetails?.rawAIResponse) return '—';

        const raw = generatedJD.aiGenerationDetails.rawAIResponse;

        const patterns = [
            /(\d+)\s*(?:\+)?\s*years?\s*(?:of)?\s*experience/i,
            /minimum\s*(?:of)?\s*(\d+)\s*years?/i,
            /at\s*least\s*(\d+)\s*years?/i,
            /(\d+)\s*-\s*(\d+)\s*years?/i
        ];

        for (const pattern of patterns) {
            const match = raw.match(pattern);
            if (match) {
                if (match[2]) {
                    return `${match[1]}-${match[2]} Years`;
                }
                return `${match[1]}+ Years`;
            }
        }

        return '—';
    }, [generatedJD]);

    const formatDueDate = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const displayLocation = useMemo(() => {
        if (generatedJD?.location) {
            return Array.isArray(generatedJD.location)
                ? generatedJD.location.join(', ')
                : generatedJD.location;
        }
        return formData.location || '—';
    }, [generatedJD, formData.location]);

    const displayEmploymentType = useMemo(() => {
        return generatedJD?.employmentType || formData.employmentType || 'Full-Time';
    }, [generatedJD, formData.employmentType]);

    const displayDueDate = useMemo(() => {
        const dateStr = generatedJD?.dueDate || formData.dueDate;
        return formatDueDate(dateStr);
    }, [generatedJD, formData.dueDate]);

    return (
        <div className="min-h-screen ">
            {(creating || saving) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 backdrop-blur-sm bg-black/10"></div>
                    <div className="relative z-10">
                        <SpinLoader />
                    </div>
                </div>
            )}

            {showSharePopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={handleCloseSharePopup}
                    ></div>
                    <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                        <button
                            onClick={handleCloseSharePopup}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">
                            Share Job Description
                        </h3>
                        <p className="text-sm text-center text-gray-500 mb-6">
                            Copy the job description below or share directly to social platforms.
                        </p>

                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 mb-4">
                            <input
                                type="text"
                                value={jdUrl}
                                readOnly
                                className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
                            />

                            <button
                                onClick={handleCopyLink}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${copied
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-black text-white hover:bg-gray-800'
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <Check size={16} />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <button
                                onClick={() => handleShareWithCopy('LinkedIn', 'https://www.linkedin.com/feed/')}
                                className="w-10 h-10 bg-[#0A66C2] text-white rounded-lg flex items-center justify-center hover:bg-[#004182] transition-all"
                                title="Share on LinkedIn"
                            >
                                <Linkedin size={20} />
                            </button>

                            <button
                                onClick={() => handleShareWithCopy('WhatsApp', 'https://web.whatsapp.com/')}
                                className="w-10 h-10 bg-[#25D366] text-white rounded-lg flex items-center justify-center hover:bg-[#128C7E] transition-all"
                                title="Share on WhatsApp"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => handleShareWithCopy('Facebook', 'https://www.facebook.com/')}
                                className="w-10 h-10 bg-[#1877F2] text-white rounded-lg flex items-center justify-center hover:bg-[#0d65d9] transition-all"
                                title="Share on Facebook"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => handleShareWithCopy('Instagram', 'https://www.instagram.com/')}
                                className="w-10 h-10 bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white rounded-lg flex items-center justify-center hover:opacity-80 transition-all"
                                title="Share on Instagram"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => handleShareWithCopy('Naukri', 'https://www.naukri.com/')}
                                className="w-10 h-10 bg-[#0D47A1] text-white rounded-lg flex items-center justify-center hover:bg-[#0a3880] transition-all"
                                title="Share on Naukri"
                            >
                                <span className="text-xs font-bold">N</span>
                            </button>

                            <button
                                onClick={() => handleShareWithCopy('Indeed', 'https://www.indeed.com/')}
                                className="w-10 h-10 bg-[#2164f3] text-white rounded-lg flex items-center justify-center hover:bg-[#1a4fc2] transition-all"
                                title="Share on Indeed"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M11.566 21.563v-8.762c.821.131 1.674.2 2.544.2 1.003 0 1.987-.094 2.942-.279v8.841c0 .642-.117 1.136-.354 1.473-.234.337-.569.507-1.003.507-.413 0-.737-.17-.978-.507-.24-.337-.36-.831-.36-1.473h-2.79zm-.005-10.85c-.856-.372-1.62-.869-2.286-1.486A8.377 8.377 0 017.51 6.908a8.87 8.87 0 01-.75-2.28A9.284 9.284 0 016.5 2.187C6.5.98 7.312.375 8.937.375c.813 0 1.444.202 1.894.608.45.403.675 1.019.675 1.845 0 1.331-.45 2.588-1.35 3.768-.9 1.181-2.081 2.128-3.544 2.841a14.09 14.09 0 004.95-2.335v4.611zm5.489-5.4c0 1.256-.422 2.316-1.266 3.178-.844.862-1.894 1.294-3.15 1.294-.478 0-.956-.063-1.434-.188v-3.89c.478.125.956.188 1.434.188.844 0 1.547-.263 2.11-.788.562-.525.843-1.2.843-2.025 0-.825-.281-1.5-.844-2.025-.562-.525-1.265-.788-2.109-.788-.478 0-.956.063-1.434.188V.375c.478-.125.956-.188 1.434-.188 1.256 0 2.306.431 3.15 1.294.844.862 1.266 1.922 1.266 3.178z" />
                                </svg>
                            </button>

                            <a
                                href={`mailto:?subject=${encodeURIComponent('Job Opportunity')}&body=${encodeURIComponent(getFullJDContent())}`}
                                className="w-10 h-10 bg-[#EA4335] text-white rounded-lg flex items-center justify-center hover:bg-[#d33426] transition-all"
                                title="Share via Email"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </a>
                        </div>

                        <button
                            onClick={handleCloseSharePopup}
                            className="w-full mt-4 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className="">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Create Job Description
                    </h1>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleShareLinkClick}
                            disabled={!generatedJD || !jdUrl}
                            className={`h-9 px-4 rounded-lg border text-sm font-medium transition-colors
                                ${(!generatedJD || !jdUrl)
                                    ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400 bg-white'
                                    : 'border-[#624AB3] text-[#624AB3] bg-white hover:bg-[#F0EFFF]'
                                }`}
                        >
                            Share Link
                        </button>

                        <button
                            form="create-jd-form"
                            type="submit"
                            disabled={creating || !formData.offerId || generatedJD}
                            className={`h-9 px-5 rounded-lg text-sm font-medium shadow-sm transition-colors
                                ${(creating || !formData.offerId || generatedJD)
                                    ? 'opacity-50 cursor-not-allowed bg-gradient-to-r from-[#5D46AD] to-[#9778FA] text-white'
                                    : 'bg-gradient-to-r from-[#5D46AD] to-[#9778FA] text-white hover:from-[#4A3CF0] hover:to-[#8A6DFB]'
                                }`}
                        >
                            {creating ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>

                <form id="create-jd-form" onSubmit={handleCreate} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <div className="hidden">
                            <label htmlFor="offerId" className="block text-sm font-medium mb-2">
                                Offer ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="offerId"
                                name="offerId"
                                value={formData.offerId}
                                onChange={handleInputChange}
                                readOnly
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                    Company Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="companyName"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        readOnly
                                        className="w-full h-11 px-4 pr-10 border border-gray-200 rounded-xl
                                            outline-none text-sm bg-gray-50 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                    Key Responsibilities
                                </label>

                                <div className="">
                                    {keyRespItems.map((tag, idx) => (
                                        <span
                                            key={`${tag}-${idx}`}
                                            className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-[#F0EFFF] text-[#3D2FFF] text-xs font-medium"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeKeyRespItem(idx)}
                                                className="text-[#3D2FFF]/70 hover:text-[#3D2FFF]"
                                                aria-label="Remove"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}

                                    <input
                                        value={keyRespDraft}
                                        onChange={(e) => setKeyRespDraft(e.target.value)}
                                        onKeyDown={onKeyRespKeyDown}
                                        placeholder={keyRespItems.length ? 'Add more...' : 'Type and press Enter'}
                                        className="w-full h-11 px-4 pr-10 border border-gray-200 rounded-xl
                                            outline-none text-sm bg-white focus:ring-2 focus:ring-[#5B4BFF]/20 focus:border-[#5B4BFF]/40"
                                    />
                                </div>

                                <textarea
                                    name="keyResponsibilities"
                                    value={formData.keyResponsibilities}
                                    onChange={handleInputChange}
                                    className="hidden"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                    Qualifications
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="qualifications"
                                        name="qualifications"
                                        value={formData.qualifications}
                                        onChange={handleInputChange}
                                        placeholder="Enter Required Qualifications"
                                        className="w-full h-11 px-4 pr-10 border border-gray-200 rounded-xl
                                            outline-none text-sm bg-white focus:ring-2 focus:ring-[#5B4BFF]/20 focus:border-[#5B4BFF]/40"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                    Benefits
                                </label>
                                <input
                                    type="text"
                                    id="benefits"
                                    name="benefits"
                                    value={formData.benefits}
                                    onChange={handleInputChange}
                                    placeholder="Enter benefits"
                                    className="w-full h-11 px-4 border border-gray-200 rounded-xl
                                        outline-none text-sm bg-white focus:ring-2 focus:ring-[#5B4BFF]/20 focus:border-[#5B4BFF]/40"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                    About This Company
                                </label>
                                <input
                                    type="text"
                                    id="additionalNotes"
                                    name="additionalNotes"
                                    value={formData.additionalNotes}
                                    onChange={handleInputChange}
                                    placeholder="Enter about company"
                                    className="w-full h-11 px-4 border border-gray-200 rounded-xl
                                        outline-none text-sm bg-white focus:ring-2 focus:ring-[#5B4BFF]/20 focus:border-[#5B4BFF]/40"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#5B4BFF] text-white flex items-center justify-center font-semibold">
                                    {companyInitials}
                                </div>
                                <div className="leading-tight">
                                    <div className="font-semibold text-gray-900">
                                        {location.state?.jobTitle || 'Developer'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formData.companyName || '—'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {generatedJD && !isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleEditClick}
                                        className="h-9 px-3 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
                                    >
                                        <Edit3 size={16} />
                                        Edit
                                    </button>
                                )}

                                {generatedJD && isEditing && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleSaveEdit}
                                            disabled={saving}
                                            className={`h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-2
                                                ${saving ? 'opacity-50 cursor-not-allowed bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                        >
                                            <Save size={16} />
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="h-9 px-3 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
                                        >
                                            <X size={16} />
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-5 bg-white">
                            {!generatedJD ? (
                                <div className="rounded-xl bg-[#F6F7FF] border border-[#E9EAFE] min-h-[280px] flex items-center justify-center">
                                    <p className="text-sm text-gray-500">
                                        Job description will appear here after creation
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                    <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white overflow-hidden">
                                        <div className="p-5 space-y-6 relative max-h-[560px] overflow-y-auto pr-4
                                            [&::-webkit-scrollbar]:w-1.5
                                            [&::-webkit-scrollbar-track]:bg-gray-100
                                            [&::-webkit-scrollbar-track]:rounded-full
                                            [&::-webkit-scrollbar-thumb]:bg-[#5B4BFF]
                                            [&::-webkit-scrollbar-thumb]:rounded-full
                                            [&::-webkit-scrollbar-thumb]:hover:bg-[#4A3CF0]"
                                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#5B4BFF #f3f4f6' }}>

                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-7 h-7 flex items-center justify-center">
                                                        <img src={summary} alt="" />
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900">Job Summary</h3>
                                                </div>

                                                {isEditing ? (
                                                    <textarea
                                                        value={editableJD.jobSummary}
                                                        onChange={(e) => handleEditableChange('jobSummary', e.target.value)}
                                                        rows={4}
                                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm
                                                            focus:ring-2 focus:ring-[#5B4BFF]/20 focus:border-[#5B4BFF]/40 resize-none"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                        {showFullSummary ? summaryText : summaryShort}{' '}
                                                        {summaryText.length > 260 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowFullSummary(v => !v)}
                                                                className="text-[#5B4BFF] font-medium hover:underline"
                                                            >
                                                                {showFullSummary ? 'See less' : 'See More...'}
                                                            </button>
                                                        )}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-7 h-7 flex items-center justify-center">
                                                        <img src={graduation} alt="" />
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900">Qualification</h3>
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-500">Requirements</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddArrayItem('requirements')}
                                                                className="text-xs font-medium text-[#5B4BFF] hover:underline"
                                                            >
                                                                + Add
                                                            </button>
                                                        </div>

                                                        {editableJD.requirements.map((item, index) => (
                                                            <div key={index} className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={item}
                                                                    onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                                                                    className="flex-1 h-10 px-4 border border-gray-200 rounded-xl outline-none text-sm
                                                                        focus:ring-2 focus:ring-[#5B4BFF]/20 focus:border-[#5B4BFF]/40"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveArrayItem('requirements', index)}
                                                                    className="h-10 w-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <ul className="space-y-2">
                                                        {(generatedJD.requirements || []).map((item, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#5B4BFF] flex-shrink-0"></span>
                                                                <span>{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 rounded-lg bg-[#F0EFFF] flex items-center justify-center text-[#5B4BFF]">
                                                        <div className="w-7 h-7 flex items-center justify-center">
                                                            <img src={user} alt="" />
                                                        </div>
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900">Responsibilities</h3>
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-500">Responsibilities</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddArrayItem('responsibilities')}
                                                                className="text-xs font-medium text-[#5B4BFF] hover:underline"
                                                            >
                                                                + Add
                                                            </button>
                                                        </div>

                                                        {editableJD.responsibilities.map((item, index) => (
                                                            <div key={index} className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={item}
                                                                    onChange={(e) => handleArrayFieldChange('responsibilities', index, e.target.value)}
                                                                    className="flex-1 h-10 px-4 border border-gray-200 rounded-xl outline-none text-sm
                                                                        focus:ring-2 focus:ring-[#5B4BFF]/20 focus:border-[#5B4BFF]/40"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveArrayItem('responsibilities', index)}
                                                                    className="h-10 w-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <ul className="space-y-2">
                                                        {(generatedJD.responsibilities || []).map((item, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#5B4BFF] flex-shrink-0"></span>
                                                                <span>{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 rounded-lg bg-[#F0EFFF] flex items-center justify-center text-[#5B4BFF]">
                                                        <div className="w-7 h-7 flex items-center justify-center">
                                                            <img src={benefitsimg} alt="" />
                                                        </div>
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900">Benefits</h3>
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-500">Benefits</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddArrayItem('benefits')}
                                                                className="text-xs font-medium text-[#5B4BFF] hover:underline"
                                                            >
                                                                + Add
                                                            </button>
                                                        </div>

                                                        {editableJD.benefits.map((item, index) => (
                                                            <div key={index} className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={item}
                                                                    onChange={(e) => handleArrayFieldChange('benefits', index, e.target.value)}
                                                                    className="flex-1 h-10 px-4 border border-gray-200 rounded-xl outline-none text-sm
                                                                        focus:ring-2 focus:ring-[#5B4BFF]/20 focus:border-[#5B4BFF]/40"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveArrayItem('benefits', index)}
                                                                    className="h-10 w-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <ul className="space-y-2">
                                                        {(generatedJD.benefits || []).map((item, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#5B4BFF] flex-shrink-0"></span>
                                                                <span>{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="rounded-2xl border border-gray-200 bg-white py-5 px-3">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                                    <img src={overview} alt="" />
                                                </div>
                                                <h3 className="font-semibold text-gray-900">Overview</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-sm">
                                                    <div className='flex gap-2'>
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                                            <img src={bag} alt="" />
                                                        </div>
                                                        <div className=''>
                                                            <div className="text-xs text-gray-500 mb-1">Employment <br /> Type</div>
                                                            <div className="font-medium text-gray-900">
                                                                {displayEmploymentType}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-sm">
                                                    <div className='flex gap-2'>
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                                            <img src={exp} alt="" />
                                                        </div>
                                                        <div className=''>
                                                            <div className="text-xs text-gray-500 mb-1">Experience</div>
                                                            <div className="font-medium text-gray-900">{extractExperience}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-sm">
                                                    <div className='flex gap-2'>
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                                            <img src={map} alt="" />
                                                        </div>
                                                        <div className=''>
                                                            <div className="text-xs text-gray-500 mb-1">Location</div>
                                                            <div className="font-medium text-gray-900">
                                                                {displayLocation}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-sm">
                                                    <div className='flex gap-2'>
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                                            <img src={calender} alt="" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-500 mb-1">Deadline</div>
                                                            <div className="font-medium text-gray-900">
                                                                {displayDueDate}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-gray-200 bg-white p-5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center">
                                                    <img src={city} alt="" />
                                                </div>
                                                <h3 className="font-semibold text-gray-900">About The Company</h3>
                                            </div>

                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {formData.additionalNotes || '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateJD;