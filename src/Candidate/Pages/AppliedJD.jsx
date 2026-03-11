import { useEffect, useState } from 'react';
import { Search, X, MapPin } from 'lucide-react'; // Added MapPin for the location icon
import Pagination from '../../components/LandingPage/Pagination';
import axios from 'axios';
import { baseUrl } from '../../utils/ApiConstants';

function AppliedJD() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState(null);
    const [showSkillsPopup, setShowSkillsPopup] = useState(false);
    const [candidateId, setCandidateId] = useState(null);

    const itemsPerPage = 8; 
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                    `${baseUrl}/candidate/applied-jds`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('candidateToken')}`,
                        },
                    }
                );

                if (response.data.success) {
                    setAppliedJobs(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching applied JDs:', error);
            }
        };
        fetchData();
    }, []);

    // Get Candidate ID
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('candidate'));
        if (user && user.id) {
            setCandidateId(user.id);
        }
    }, []);

    const getApplicationStatus = (job) => {
        if (!candidateId || !job.appliedCandidates?.length) return 'pending';
        const appliedCandidate = job.appliedCandidates.find(
            (c) => c.candidate === candidateId
        );
        return appliedCandidate?.status || 'pending';
    };

    // Updated status classes to match Figma (Accepted/Pending/Rejected)
    const getStatusBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'accepted':
            case 'filtered':
                return 'bg-green-50 text-green-500 border border-green-100';
            case 'rejected':
            case 'unfiltered':
                return 'bg-red-50 text-red-500 border border-red-100';
            default:
                return 'bg-orange-50 text-orange-400 border border-orange-100';
        }
    };

    const handleViewSkills = (requirements) => {
        setSelectedSkills(requirements);
        setShowSkillsPopup(true);
    };

    const closeSkillsPopup = () => {
        setShowSkillsPopup(false);
        setSelectedSkills(null);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB').replace(/\//g, '-');
    };

    const filteredCandidates = appliedJobs
        .filter((job) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                job.companyName?.toLowerCase().includes(searchLower) ||
                job.offerId?.jobTitle?.toLowerCase().includes(searchLower) ||
                job.location?.toLowerCase().includes(searchLower) ||
                job.requirements?.some(skill => skill.toLowerCase().includes(searchLower))
            );
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredCandidates.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Applied Jobs</h2>
                <div className="relative w-full sm:w-72">
                    <input
                        type="text"
                        placeholder="Search by company, job, location, or skills"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-[#F9F8FF] rounded-2xl border border-purple-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto min-w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-600 text-sm font-semibold">
                                <th className="px-6 py-5">Serial No.</th>
                                <th className="px-4 py-5 flex items-center gap-1">Job Title <span className="text-[10px]">↕</span></th>
                                <th className="px-4 py-5">Company <span className="text-[10px]">↕</span></th>
                                <th className="px-4 py-5">Location</th>
                                <th className="px-4 py-5">Applied on</th>
                                <th className="px-4 py-5">Skills</th>
                                <th className="px-6 py-5 text-right">Status <span className="text-[10px]">↕</span></th>
                            </tr>
                        </thead>

                        <tbody className="bg-white">
                            {currentData.length ? (
                                currentData.map((job, index) => {
                                    const status = getApplicationStatus(job);
                                    return (
                                        <tr key={index} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-700 text-sm">
                                                {startIndex + index + 1}
                                            </td>
                                            <td className="px-4 py-4 text-gray-700 text-sm font-medium">
                                                {job?.offerId?.jobTitle || "Developer"}
                                            </td>
                                            <td className="px-4 py-4 text-gray-600 text-sm">
                                                {job.companyName}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs border border-purple-100">
                                                        <MapPin className="w-3 h-3" /> 
                                                        {Array.isArray(job.location) ? job.location[0] : (job.location || job.offerId?.location || 'Not Specified')}
                                                    </span>
                                                    {Array.isArray(job.location) && job.location.length > 1 && (
                                                        <span className="text-xs text-purple-400 font-medium">
                                                            +{job.location.length - 1}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-purple-700 font-medium text-sm">
                                                {job.appliedDate ? formatDate(job.appliedDate) : (job.createdAt ? formatDate(job.createdAt) : '—')}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex gap-2 flex-wrap">
                                                    {job.requirements?.slice(0, 3).map((skill, idx) => (
                                                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs uppercase">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {job.requirements?.length > 3 && (
                                                        <span 
                                                            className="px-2 py-1 bg-gray-50 text-gray-400 rounded-full text-xs cursor-pointer hover:bg-gray-100 transition-colors" 
                                                            onClick={() => handleViewSkills(job.requirements)}
                                                        >
                                                            +{job.requirements.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize ${getStatusBadgeClass(status)}`}>
                                                    {status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-gray-400">No JDs found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Section */}
            <div className="mt-6 flex justify-center">
                {totalPages > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* Skills Popup */}
            {showSkillsPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeSkillsPopup} />
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Technical Requirements</h3>
                            <button onClick={closeSkillsPopup} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedSkills?.map((skill, i) => (
                                <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AppliedJD;