import { useState } from 'react';
import { MapPin, Building2, Calendar } from 'lucide-react';

function AppliedJobsTable({ 
    currentData, 
    startIndex, 
    formatDate, 
    getApplicationStatus, 
    getStatusBadgeClass, 
    handleViewSkills 
}) {
    const [expandedLocRow, setExpandedLocRow] = useState(null);

    return (
        <div className="bg-[#F9F8FF] rounded-2xl border border-purple-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto min-w-full">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gray-600 text-sm font-semibold">
                            <th className="px-6 py-5">Serial No.</th>
                            <th className="px-4 py-5">Job Title <span className="text-[10px]">↕</span></th>
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
                                const rowIndex = startIndex + index;

                                const locArr = Array.isArray(job._location) && job._location.length > 0
                                    ? job._location
                                    : (job._workMode ? [job._workMode] : []);

                                const firstLoc = locArr.length > 0 ? locArr[0] : 'N/A';
                                const extraCount = locArr.length > 1 ? locArr.length - 1 : 0;
                                const isExpanded = expandedLocRow === rowIndex;

                                return (
                                    <tr key={job._id || index} className="border-t border-gray-50 hover:bg-gray-50/80 transition-colors duration-200">
                                        <td className="px-6 py-4 text-gray-700 text-sm">
                                            {rowIndex + 1}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-gray-700 text-sm font-medium">
                                                {job.jobTitle || job?.offerId?.jobTitle || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1">
                                                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="text-gray-600 text-sm">{job.companyName || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <span className="flex items-center gap-1 px-3 py-1 bg-[#F6F6FF] text-[#654CB7] rounded-full text-xs border border-purple-100">
                                                    <MapPin className="w-3 h-3" />
                                                    {firstLoc}
                                                </span>
                                                {extraCount > 0 && !isExpanded && (
                                                    <button
                                                        onClick={() => setExpandedLocRow(rowIndex)}
                                                        className="text-xs text-[#654CB7] font-medium cursor-pointer hover:underline px-1"
                                                    >
                                                        +{extraCount}
                                                    </button>
                                                )}
                                                {isExpanded && locArr.slice(1).map((loc, i) => (
                                                    <span key={i} className="flex items-center gap-1 px-3 py-1 bg-[#F6F6FF] text-[#654CB7] rounded-full text-xs border border-purple-100">
                                                        <MapPin className="w-3 h-3" />
                                                        {loc}
                                                    </span>
                                                ))}
                                                {isExpanded && (
                                                    <button
                                                        onClick={() => setExpandedLocRow(null)}
                                                        className="text-xs text-gray-400 font-medium cursor-pointer hover:underline px-1"
                                                    >
                                                        less
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-[#654CB7] flex-shrink-0" />
                                                <span className="text-[#654CB7] font-medium text-sm">
                                                    {job.appliedDate ? formatDate(job.appliedDate) : (job.createdAt ? formatDate(job.createdAt) : '—')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-0.2 flex-wrap">
                                                {job.requirements?.slice(0, 3).map((skill, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs uppercase">
                                                        {skill.length > 25 ? skill.substring(0, 6) + ".." : skill}
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
                                                {(!job.requirements || job.requirements.length === 0) && (
                                                    <span className="text-gray-400 text-xs italic">No skills listed</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize ${getStatusBadgeClass(status)}`}>
                                                {status === 'link_sent' ? 'Invited' : status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center py-16">
                                    <div className="flex flex-col items-center gap-3">
                                        <p className="text-gray-400 font-medium">No applied jobs found</p>
                                        <p className="text-gray-300 text-sm">Your applied job listings will appear here</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AppliedJobsTable;
