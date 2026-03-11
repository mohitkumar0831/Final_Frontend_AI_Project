import { MapPin, X, Search, Calendar, Briefcase, IndianRupee, Clock, GraduationCap, ClipboardList, Building2 } from "lucide-react";

function AllJDsModal({ selectedJob, handleCloseModal, handleApplyFromModal }) {
    if (!selectedJob) return null;

    return (
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
                                {selectedJob.offerId?.description || selectedJob.description || 'Not Specified'}
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
    );
}

export default AllJDsModal;
