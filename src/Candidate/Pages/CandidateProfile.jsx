import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { baseUrl } from '../../utils/ApiConstants';
import { Check, FileText } from 'lucide-react';

function CandidateProfile() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        resume: '',
        skills: '',
        yearsOfExperience: '',
        professionalSummary: '',
    });
    const [originalData, setOriginalData] = useState({});
    const [resumeFile, setResumeFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const resumeRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("candidateToken");
                const res = await axios.get(`${baseUrl}/candidate/profile/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const candidate = res.data.candidate;
                console.log(candidate);
                
                const profileData = {
                    name: candidate.name || '',
                    email: candidate.email || '',
                    phone: candidate.phone || '',
                    resume: candidate.resume || '',
                    skills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : '',
                    yearsOfExperience: candidate.yearsOfExperience != null ? String(candidate.yearsOfExperience) : '',
                    professionalSummary: candidate.professionalSummary || '',
                };
                setFormData(profileData);
                setOriginalData(profileData);
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const phoneValue = value.replace(/[^0-9]/g, '').slice(0, 10);
            setFormData((prev) => ({ ...prev, [name]: phoneValue }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) setResumeFile(file);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("candidateToken");
            const formDataToSend = new FormData();
            formDataToSend.append("phone", formData.phone);
            formDataToSend.append("skills", formData.skills || '');
            formDataToSend.append("yearsOfExperience", formData.yearsOfExperience || '');
            formDataToSend.append("professionalSummary", formData.professionalSummary || '');
            if (resumeFile) formDataToSend.append("resume", resumeFile);
            
            const res = await axios.put(`${baseUrl}/candidate/profile/me`, formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            const c = res.data.candidate;
            const updatedData = {
                ...formData,
                phone: c.phone || '',
                resume: c.resume || '',
                skills: Array.isArray(c.skills) ? c.skills.join(', ') : (formData.skills || ''),
                yearsOfExperience: c.yearsOfExperience != null ? String(c.yearsOfExperience) : '',
                professionalSummary: c.professionalSummary || '',
            };
            setFormData(updatedData);
            setOriginalData(updatedData);
            setResumeFile(null);
            alert("Profile updated successfully!");
        } catch (err) {
            alert("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(originalData);
        setResumeFile(null);
    };

    const getInitials = (name) => {
        if (!name) return 'NA';
        const words = name.trim().split(' ');
        if (words.length === 1) {
            return words[0][0].toUpperCase();
        }
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    if (loading) {
        return (
            <div className="p-4 md:p-6 lg:p-8 shadow-[0px_0px_10px_0px_rgba(0,_0,_0,_0.1)] max-w-3xl mx-auto rounded-xl">
                <p className="text-center text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 shadow-[0px_0px_10px_0px_rgba(0,_0,_0,_0.1)] max-w-3xl mx-auto rounded-xl bg-white">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">Profile</h1>

            <div className="flex flex-col md:flex-row items-center mb-8 md:space-x-8">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold mb-4 md:mb-0">
                    {getInitials(formData.name)}
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <span>Upload Image</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-red-300 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            <form className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            readOnly
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                        <Check className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-xs text-purple-500">(Editable)</span>
                    </label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        maxLength={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skills for job matching <span className="text-xs text-purple-500">(comma-separated)</span>
                    </label>
                    <input
                        type="text"
                        name="skills"
                        value={formData.skills}
                        onChange={handleInputChange}
                        placeholder="e.g. React, Node.js, MongoDB, AWS"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Used to match you with jobs by requirements and descriptions.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Years of experience <span className="text-xs text-purple-500">(optional)</span>
                    </label>
                    <input
                        type="number"
                        name="yearsOfExperience"
                        value={formData.yearsOfExperience}
                        onChange={handleInputChange}
                        placeholder="e.g. 3"
                        min={0}
                        max={60}
                        step={0.5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Professional summary <span className="text-xs text-purple-500">(from your resume)</span>
                    </label>
                    <textarea
                        name="professionalSummary"
                        value={formData.professionalSummary}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Paste a short summary or key phrases from your resume — we match these to job descriptions."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y min-h-[100px]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resume <span className="text-xs text-purple-500">(Editable)</span>
                    </label>
                    
                    {formData.resume && (
                        <div className="mb-3">
                            <a
                                href={formData.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
                            >
                                <FileText size={18} />
                                View Current Resume
                            </a>
                        </div>
                    )}
                    
                    <div className="relative">
                        <input
                            ref={resumeRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                        />
                        {resumeFile && (
                            <p className="mt-2 text-sm text-green-600">
                                Selected: {resumeFile.name}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CandidateProfile;