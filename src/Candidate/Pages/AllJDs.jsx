import React, { useEffect, useState, useRef } from "react";
import { Search, MapPin, X, Calendar, Briefcase, IndianRupee, Clock, GraduationCap,SlidersHorizontal,  ClipboardList, Building2, Filter } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import Pagination from "../../components/LandingPage/Pagination";
import axios from "axios";
import { baseUrl } from "../../utils/ApiConstants";

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
    const uniqueLocations = [...new Set(jdData.map(jd => Array.isArray(jd.location) ? jd.location[0] : jd.location))].filter(Boolean);
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
                            companyId: `#${item._id.slice(-6)}`,
                            skills: item.requirements?.slice(0, 4).join(', ') + (item.requirements?.length > 4 ? ', etc.' : '') || 'Skills not specified',
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
        const matchesSearch = jd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            jd.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            jd.skills.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = filterLocation ? jd.location === filterLocation : true;
        const matchesCompany = filterCompany ? jd.company === filterCompany : true;
        return matchesSearch && matchesLocation && matchesCompany;
    });
    const currentCandidates = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <header className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                    <h1 className="text-2xl sm:text-3xl text-gray-900 font-bold tracking-tight">All Available Jobs</h1>
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">
                        <div className="flex gap-2 flex-1 md:flex-initial">
                            <div className="relative flex-1 md:w-80">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search by title, company, or skills"
                                    className="w-full pl-4 pr-12 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Search className="w-5 h-5" />
                                </span>
                            </div>
                            <div className="relative" ref={filterRef}>
                                <button
                                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                    className={`px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm flex items-center gap-2 ${
                                        (filterLocation || filterCompany) ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
                                    }`}
                                >
                                    <SlidersHorizontal className="w-5 h-5" />
                                    <span className="hidden sm:inline">Filter</span>
                                    {(filterLocation || filterCompany) && (
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                    )}
                                </button>
                                
                                {/* Filter Dropdown */}
                                {showFilterDropdown && (
                                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                            <h3 className="font-bold text-gray-900">Filters</h3>
                                            <button
                                                onClick={() => setShowFilterDropdown(false)}
                                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                            <select
                                                value={filterLocation}
                                                onChange={e => setFilterLocation(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                                            >
                                                <option value="">All Locations</option>
                                                {uniqueLocations.map(loc => (
                                                    <option key={loc} value={loc}>{loc}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                                            <select
                                                value={filterCompany}
                                                onChange={e => setFilterCompany(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                                            >
                                                <option value="">All Companies</option>
                                                {uniqueCompanies.map(comp => (
                                                    <option key={comp} value={comp}>{comp}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => {
                                                    setFilterLocation("");
                                                    setFilterCompany("");
                                                }}
                                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={() => setShowFilterDropdown(false)}
                                                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7058C5] to-[#A9A9FB] text-white rounded-lg hover:opacity-90 transition-all font-medium text-sm"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {(filterLocation || filterCompany || searchTerm) && (
                            <button
                                className="px-4 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
                                onClick={() => { setFilterLocation(""); setFilterCompany(""); setSearchTerm(""); }}
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto mt-8">
                {currentCandidates.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        No job descriptions found matching your criteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {currentCandidates.map((candidate) => (
                            <div
                                key={candidate.id}
                                className="bg-white rounded-[20px] md:rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 md:p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all relative flex flex-col justify-between"
                            >
                                <div className="absolute top-1 md:top-4 right-1 text-fuchsia-600 text-[10px] md:text-[11px] font-semibold px-1 md:px-3 py-1 rounded-full uppercase tracking-wider z-10">
                                    {candidate.appliedCandidates?.length || 0}+ Applicants
                                </div>

                                <div className="pr-20 md:pr-24">
                                    <div className="flex gap-3 md:gap-4 mb-4">
                                        <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-indigo-600 font-bold text-lg md:text-xl">
                                                {candidate.company.substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="pt-1 min-w-0">
                                            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{candidate.title}</h2>
                                            <div className="flex items-center text-gray-500 text-xs md:text-sm gap-1">
                                                <span className="line-clamp-1">{candidate.company}</span>
                                                <span>•</span>
                                                <span className="capitalize line-clamp-1">{Array.isArray(candidate.location) ? candidate.location[0] : candidate.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex flex-wrap gap-2 mb-5 md:mb-6">
                                        <span className="px-2.5 md:px-3 py-1 bg-indigo-50 text-indigo-600 text-[11px] md:text-xs font-semibold rounded-lg">Remote</span>
                                        <span className="px-2.5 md:px-3 py-1 bg-orange-50 text-orange-600 text-[11px] md:text-xs font-semibold rounded-lg">Full Time</span>
                                        <span className="px-2.5 md:px-3 py-1 bg-green-50 text-green-600 text-[11px] md:text-xs font-semibold rounded-lg">2 years+</span>
                                    </div>

                                    <div className="mb-5 md:mb-6">
                                        <h3 className="text-[11px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Requirements</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {candidate.skillsArray?.slice(0, 3).map((skill, idx) => (
                                                <span key={idx} className="px-3 md:px-4 py-1 md:py-1.5 bg-gray-100 text-gray-700 text-[11px] md:text-xs font-medium rounded-full">
                                                    {skill}
                                                </span>
                                            ))}
                                            {candidate.skillsArray?.length > 3 && (
                                                <span className="px-3 md:px-4 py-1 md:py-1.5 bg-gray-100 text-gray-700 text-[11px] md:text-xs font-medium rounded-full">
                                                    +{candidate.skillsArray.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 md:pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                                    <div>
                                        <div className="text-base md:text-lg font-bold text-gray-900">
                                            {candidate.offerId?.salary || candidate.salary || '₹ Not Specified'}
                                        </div>
                                        <div className="flex items-center text-red-500 text-[10px] md:text-[11px] font-semibold mt-0.5 bg-red-50 px-2 py-0.5 rounded-md w-fit">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {candidate.dueDate || candidate.offerId?.dueDate || 'Apply Soon'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleApplyClick(candidate)}
                                        className="px-6 md:px-8 bg-gradient-to-r from-[#7058C5] to-[#A9A9FB] text-white py-2 md:py-2.5 rounded-sm hover:bg-indigo-600 transition-all font-bold shadow-md shadow-indigo-200 text-sm md:text-base min-h-[44px] md:min-h-0"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
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

            {/* UPDATED MODAL STYLING TO MATCH FIGMA */}
            {showModal && selectedJob && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-2 md:p-4">
                    <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden relative flex flex-col">
                        
                        {/* Header Section */}
                        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#7058C5] rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl flex-shrink-0">
                                    {selectedJob.company.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 line-clamp-1">{selectedJob.title}</h2>
                                    <p className="text-gray-500 text-xs md:text-sm font-medium line-clamp-1">{selectedJob.company}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                                <span className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-gray-50 text-gray-600 rounded-full text-[10px] md:text-xs font-medium">
                                    <MapPin size={12} className="text-indigo-500" /> {Array.isArray(selectedJob.location) ? selectedJob.location[0] : selectedJob.location}
                                </span>
                                <span className="px-2 md:px-3 py-1 md:py-1.5 bg-red-50 text-red-500 rounded-full text-[10px] md:text-xs font-bold">
                                    {selectedJob.dueDate || selectedJob.offerId?.dueDate || 'Apply Soon'}
                                </span>
                                <span className="px-2 md:px-3 py-1 md:py-1.5 bg-fuchsia-50 text-fuchsia-600 rounded-full text-[10px] md:text-xs font-bold uppercase">
                                    {selectedJob.appliedCandidates?.length || 0}+ Applicants
                                </span>
                                <button onClick={handleCloseModal} className="ml-auto sm:ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                            {/* Left Scrollable Column */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar" style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                WebkitOverflowScrolling: 'touch'
                            }}>
                                <section>
                                    <div className="flex items-center gap-2 mb-4">
                                        <ClipboardList className="text-gray-900" size={18} />
                                        <h3 className="text-lg md:text-xl font-bold text-gray-900">Job Summary</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed text-sm md:text-[15px]">
                                        {selectedJob.jobSummary || 'Details not available.'}
                                       
                                    </p>
                                </section>

                                <section>
                                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                                        <GraduationCap className="text-gray-900" size={18} />
                                        <h3 className="text-lg md:text-xl font-bold text-gray-900">Qualification</h3>
                                    </div>
                                    <ul className="space-y-3 md:space-y-4">
                                        {(selectedJob.requirements && selectedJob.requirements.length > 0) ? (
                                            selectedJob.requirements.map((req, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-gray-600 text-sm md:text-[15px]">
                                                    <div className="w-2 h-2 rounded-full bg-[#7058C5] mt-2 flex-shrink-0" />
                                                    {req}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-gray-500 text-sm">No specific requirements listed</li>
                                        )}
                                    </ul>
                                </section>
                            </div>

                            {/* Right Sidebar Column */}
                            <div className="w-full lg:w-[380px] bg-[#F9F9FB] border-t lg:border-t-0 lg:border-l-[6px] border-[#A9A9FB] p-6 lg:p-8 space-y-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-4 md:mb-6">
                                        <div className="p-1 bg-white rounded shadow-sm"><Search size={14}/></div>
                                        <h3 className="text-lg md:text-xl font-bold text-gray-900">Overview</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                                                <Briefcase size={16} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase">Employment Type</p>
                                                <p className="text-xs md:text-sm font-bold text-gray-700">
                                                    {selectedJob.offerId?.employmentType || selectedJob.employmentType || 'Full Time'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                                                <Clock size={16} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase">Experience</p>
                                                <p className="text-xs md:text-sm font-bold text-gray-700">
                                                    {selectedJob.offerId?.experience || selectedJob.experience || 'Not Specified'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                                                <IndianRupee size={16} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase">Salary</p>
                                                <p className="text-xs md:text-sm font-bold text-gray-700">
                                                    {selectedJob.offerId?.salary || selectedJob.salary || 'Not Disclosed'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                                                <Calendar size={16} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase">Due Date</p>
                                                <p className="text-xs md:text-sm font-bold text-gray-700">
                                                    {selectedJob.dueDate || selectedJob.offerId?.dueDate || 'Apply Soon'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Building2 size={18} className="text-gray-900" />
                                        <h3 className="text-lg md:text-xl font-bold text-gray-900">About The Company</h3>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        {selectedJob.companyDescription || 'Details not available.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Apply Button */}
                        <div className="p-4 lg:p-6 bg-white border-t border-gray-50 flex justify-center">
                            <button
                                onClick={handleApplyFromModal}
                                className="w-full sm:w-2/3 lg:w-1/3 bg-gradient-to-r from-[#7058C5] to-[#A9A9FB] hover:bg-[#5d47a8] text-white font-bold py-3 lg:py-4 rounded-xl transition-all shadow-lg shadow-indigo-100 text-base lg:text-lg"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllJDs;