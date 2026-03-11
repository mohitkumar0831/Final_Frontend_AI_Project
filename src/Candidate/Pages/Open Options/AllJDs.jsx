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

    // Get unique locations and companies for filter options
    // Location from Offer model is [String] array — flatten all locations
    const uniqueLocations = [...new Set(jdData.flatMap(jd => {
        const loc = jd.offerId?.location || jd.location;
        if (Array.isArray(loc)) return loc;
        if (typeof loc === 'string') return [loc];
        return [];
    }))].filter(Boolean);
    const uniqueCompanies = [...new Set(jdData.map(jd => jd.company))].filter(Boolean);

    // Close filter dropdown when clicking outside
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

    const itemsPerPage = 6;
    const totalPages = Math.ceil(jdData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

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

    const filteredCandidates = jdData.filter(jd => {
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
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
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
                {currentCandidates.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        No job descriptions found matching your criteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {currentCandidates.map((candidate) => (
                            <AllJDsCard
                                key={candidate.id}
                                candidate={candidate}
                                handleApplyClick={handleApplyClick}
                            />
                        ))}
                    </div>
                )}

                {jdData.length > 0 && (
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
