import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../../components/LandingPage/Pagination";
import axios from "axios";
import { baseUrl } from "../../../utils/ApiConstants";
import AllJDsHeader from "./AllJDsHeader";
import AllJDsCard from "./AllJDsCard";
import AllJDsModal from "./AllJDsModal";

const AllJDs = () => {
    const navigate = useNavigate();
    const [jdData, setJdData] = useState([]);
    const [appliedJdIds, setAppliedJdIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [filterCompany, setFilterCompany] = useState("");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const filterRef = useRef(null);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [recLoading, setRecLoading] = useState(true);
    const [recMessage, setRecMessage] = useState(null);

    const uniqueLocations = [...new Set(jdData.flatMap(jd => {
        const loc = jd.offerId?.location || jd.location;
        if (Array.isArray(loc)) return loc;
        if (typeof loc === 'string') return [loc];
        return [];
    }))].filter(Boolean);
    const uniqueCompanies = [...new Set(jdData.map(jd => jd.company))].filter(Boolean);

   
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilterDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const fetchRecommendations = async () => {
            try {
                setRecLoading(true);
                const token = localStorage.getItem("candidateToken");
                if (!token) {
                    if (!cancelled) {
                        setRecommendedJobs([]);
                        setRecMessage(null);
                    }
                    return;
                }
                // Two-segment path avoids accidental match with GET /:id + HR protect (401 on candidate JWT)
                const res = await axios.get(`${baseUrl}/candidate/me/job-recommendations`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (cancelled) return;
                if (res.data?.success && Array.isArray(res.data.recommendedJobs)) {
                    setRecommendedJobs(res.data.recommendedJobs);
                    setRecMessage(
                        res.data.recommendedJobs.length === 0 && res.data.message
                            ? res.data.message
                            : null
                    );
                } else {
                    setRecommendedJobs([]);
                    setRecMessage(null);
                }
            } catch (e) {
                console.error("Error fetching job recommendations:", e);
                if (!cancelled) {
                    setRecommendedJobs([]);
                    setRecMessage(null);
                }
            } finally {
                if (!cancelled) setRecLoading(false);
            }
        };
        fetchRecommendations();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const fetchAppliedJDs = async () => {
            try {
                const response = await axios.get(`${baseUrl}/candidate/applied-jobs`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('candidateToken')}`,
                    },
                });
                if (response.data.success && response.data.jobs) {
                    const appliedIds = response.data.jobs.map(job => job._id);
                    setAppliedJdIds(appliedIds);
                }
            } catch (error) {
                console.error('Error fetching applied JDs:', error);
            }
        };
        fetchAppliedJDs();
    }, []);

    useEffect(() => {
        const fetchJDs = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${baseUrl}/jd/all-jd`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('candidateToken')}`,
                    }
                });

                if (response.data.success && response.data.data) {
                    const mappedData = response.data.data
                        .filter(item => item._id)
                        .filter(item => !appliedJdIds.includes(item._id))
                        .map(item => ({
                            id: item._id,
                            _id: item._id,
                            title: item.offerId?.jobTitle || 'Job Title Not Available',
                            location: item.offerId?.location || 'Location Not Specified',
                            company: item.companyName || 'Company Not Specified',
                            description : item.offerId?.description || 'Description Not Available',
                            companyId: `#${item._id.slice(-6)}`,
                            skills: item.requirements?.slice(0, 4).join(', ') + (   item.requirements?.length > 4 ? ', etc.' : '') || 'Skills not specified',
                            skillsArray: item.requirements?.slice(0, 6) || [],
                            primaryLocation: item.offerId?.location || 'Location Not Specified',
                            jobSummary: item.jobSummary || '',
                            responsibilities: item.responsibilities || [],
                            requirements: item.requirements || [],
                            benefits: item.benefits || [],
                            additionalInfo: item.additionalInfo || '',
                            department: item.department || '',
                            createdBy: item.createdBy || {},
                            publicToken: item.publicToken || '',
                            createdAt: item.createdAt || '',
                            offerId: item.offerId,
                            appliedCandidates: item.appliedCandidates,
                            dueDate: item.dueDate,
                            salary: item.salary,
                        }))
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setJdData(mappedData);
                }
            } catch (error) {
                console.error('Error fetching JDs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJDs();
    }, [appliedJdIds]);

    const recommendedIds = new Set(
        recommendedJobs.map((r) => r.mappedJob?._id).filter(Boolean)
    );
    const jdDataForListing = jdData.filter((jd) => !recommendedIds.has(jd._id));

    const itemsPerPage = 6;
    const totalPages = Math.ceil(jdDataForListing.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const handleApplyClick = (candidate) => {
        setSelectedJob(candidate);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setSelectedJob(null);
        setShowModal(false);
    };

    const handleApplyFromModal = () => {
        setShowModal(false);
        navigate(`/Candidate-Dashboard/AllJDs/ApplyToJob/${selectedJob._id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600 font-medium">Loading...</div>
            </div>
        );
    }

    const filteredCandidates = jdDataForListing.filter(jd => {
        const searchLower = searchTerm.toLowerCase();
        const locationStr = Array.isArray(jd.offerId?.location) ? jd.offerId.location.join(' ') : (jd.offerId?.location || '');
        const matchesSearch = jd.title.toLowerCase().includes(searchLower) ||
            jd.company.toLowerCase().includes(searchLower) ||
            (jd.skills || '').toLowerCase().includes(searchLower) ||
            locationStr.toLowerCase().includes(searchLower);
        const matchesLocation = filterLocation ? (() => {
            const loc = jd.offerId?.location || jd.location;
            if (Array.isArray(loc)) return loc.some(l => l.toLowerCase() === filterLocation.toLowerCase());
            return String(loc).toLowerCase() === filterLocation.toLowerCase();
        })() : true;
        const matchesCompany = filterCompany ? jd.company === filterCompany : true;
        return matchesSearch && matchesLocation && matchesCompany;
    });
    const currentCandidates = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6">
            <AllJDsHeader
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterLocation={filterLocation}
                filterCompany={filterCompany}
                setFilterLocation={setFilterLocation}
                setFilterCompany={setFilterCompany}
                showFilterDropdown={showFilterDropdown}
                setShowFilterDropdown={setShowFilterDropdown}
                filterRef={filterRef}
                uniqueLocations={uniqueLocations}
                uniqueCompanies={uniqueCompanies}
            />

            <main className="max-w-7xl mx-auto mt-8">
                <section className="mb-12" aria-labelledby="recommended-jobs-heading">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
                        <div>
                            <h2 id="recommended-jobs-heading" className="text-xl font-bold text-gray-900 tracking-tight">
                                Recommended jobs
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Matched from your resume, skills, experience, and job descriptions
                            </p>
                        </div>
                    </div>
                    {recLoading ? (
                        <div className="rounded-2xl border border-indigo-100 bg-white/80 px-5 py-10 text-center text-gray-500 text-sm">
                            Analyzing your profile and open roles…
                        </div>
                    ) : recommendedJobs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-5 py-8 text-sm text-gray-600 space-y-2">
                            <p className="font-medium text-gray-800">No recommendations to show yet</p>
                            <p>
                                {recMessage ||
                                    "Either there are no open roles you haven’t applied to (with a future due date), or your profile needs a bit more detail. Add skills and a short summary under Profile, or scroll to All available jobs below."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-5">
                            {recommendedJobs.map((row) => (
                                <AllJDsCard
                                    key={row.jdId}
                                    candidate={row.mappedJob}
                                    handleApplyClick={handleApplyClick}
                                    // matchPercent={row.matchPercentage}
                                    // matchReason={row.reason}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <h2 className="text-lg font-bold text-gray-900 mb-4">All available jobs</h2>

                {currentCandidates.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        No job descriptions found matching your criteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-5">
                        {currentCandidates.map((candidate) => (
                            <AllJDsCard
                                key={candidate.id}
                                candidate={candidate}
                                handleApplyClick={handleApplyClick}
                            />
                        ))}
                    </div>
                )}

                {jdDataForListing.length > 0 && (
                    <div className="mt-12 pb-12">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </main>

            {/* Modal */}
            {showModal && selectedJob && (
                <AllJDsModal
                    selectedJob={selectedJob}
                    handleCloseModal={handleCloseModal}
                    handleApplyFromModal={handleApplyFromModal}
                />
            )}
        </div>
    );
};

export default AllJDs;
