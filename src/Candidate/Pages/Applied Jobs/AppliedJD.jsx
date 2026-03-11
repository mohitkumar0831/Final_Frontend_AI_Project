import { useEffect, useState } from 'react';
import Pagination from '../../../components/LandingPage/Pagination';
import axios from 'axios';
import { baseUrl } from '../../../utils/ApiConstants';
import AppliedJobsHeader from './AppliedJobsHeader';
import AppliedJobsTable from './AppliedJobsTable';
import AppliedJobsSkillsModal from './AppliedJobsSkillsModal';

function AppliedJD() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState(null);
    const [showSkillsPopup, setShowSkillsPopup] = useState(false);
    const [candidateId, setCandidateId] = useState(null);
    const [loading, setLoading] = useState(true);

    const itemsPerPage = 8;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('candidateToken');
                const headers = { Authorization: `Bearer ${token}` };

                
                const [appliedRes, allJdRes] = await Promise.all([
                    axios.get(`${baseUrl}/candidate/applied-jds`, { headers }),
                    axios.get(`${baseUrl}/jd/all-jd`, { headers }).catch(() => ({ data: { data: [] } }))
                ]);

                const appliedData = appliedRes.data?.data || [];
                const allJdData = allJdRes.data?.data || [];

                const offerLookup = {};
                for (const jd of allJdData) {
                    const offerId = jd.offerId?._id || jd.offerId;
                    if (offerId) {
                        offerLookup[offerId] = jd.offerId;
                    }
                    if (jd._id && jd.offerId) {
                        offerLookup[`jd_${jd._id}`] = jd.offerId;
                    }
                }
                const enrichedJobs = appliedData.map(job => {
                    const jobOfferId = job.offerId?._id || job.offerId;
                    const fullOffer = offerLookup[jobOfferId] || offerLookup[`jd_${job._id}`] || null;

                    return {
                        ...job,
                        // Use location from the full offer lookup
                        _location: fullOffer?.location || [],
                        _workMode: fullOffer?.workMode || null,
                        _salary: fullOffer?.salary || null,
                        _employmentType: fullOffer?.employmentType || null,
                        _experience: fullOffer?.experience || null,
                        _description: fullOffer?.description || null,
                    };
                });

                setAppliedJobs(enrichedJobs);
            } catch (error) {
                console.error('Error fetching applied JDs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Get Candidate ID
    useEffect(() => {
        const raw = sessionStorage.getItem('candidateData') || localStorage.getItem('candidateData') || localStorage.getItem('candidate');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                const id = parsed?.cid || parsed?.id || parsed?._id || null;
                if (id) setCandidateId(id);
            } catch (e) { /* ignore */ }
        }
    }, []);

    const getApplicationStatus = (job) => {
        if (!candidateId || !job.appliedCandidates?.length) return 'pending';
        const appliedCandidate = job.appliedCandidates.find(
            (c) => (c.candidate?.toString() || c.candidate) === candidateId
        );
        return appliedCandidate?.status || 'pending';
    };

    const getStatusBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'accepted':
            case 'filtered':
            case 'completed':
                return 'bg-green-50 text-green-500 border border-green-100';
            case 'rejected':
            case 'unfiltered':
                return 'bg-red-50 text-red-500 border border-red-100';
            case 'link_sent':
                return 'bg-blue-50 text-blue-500 border border-blue-100';
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
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-GB').replace(/\//g, '-');
    };

    const filteredCandidates = appliedJobs
        .filter((job) => {
            const searchLower = searchTerm.toLowerCase();
            const locationStr = Array.isArray(job._location) ? job._location.join(' ') : '';
            return (
                (job.companyName || '').toLowerCase().includes(searchLower) ||
                (job.offerId?.jobTitle || job.jobTitle || '').toLowerCase().includes(searchLower) ||
                locationStr.toLowerCase().includes(searchLower) ||
                (job.requirements || []).some(skill => skill.toLowerCase().includes(searchLower))
            );
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredCandidates.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <AppliedJobsHeader 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                setCurrentPage={setCurrentPage}
            />

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                        <p className="text-gray-500 text-sm font-medium">Loading applied jobs...</p>
                    </div>
                </div>
            ) : (
                <>
                    <AppliedJobsTable
                        currentData={currentData}
                        startIndex={startIndex}
                        formatDate={formatDate}
                        getApplicationStatus={getApplicationStatus}
                        getStatusBadgeClass={getStatusBadgeClass}
                        handleViewSkills={handleViewSkills}
                    />

                    <div className="mt-6 flex justify-center">
                        {totalPages > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </div>
                </>
            )}

            {showSkillsPopup && (
                <AppliedJobsSkillsModal
                    selectedSkills={selectedSkills}
                    closeSkillsPopup={closeSkillsPopup}
                />
            )}
        </div>
    );
}

export default AppliedJD;
