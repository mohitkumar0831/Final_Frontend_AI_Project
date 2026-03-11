import { Calendar, X, MapPin, Briefcase, Clock } from "lucide-react";
import { useState } from "react";

function AllJDsCard({ candidate, handleApplyClick }) {
    const [showSkillsPopup, setShowSkillsPopup] = useState(false);
    const [showAllLocations, setShowAllLocations] = useState(false);

    // offerId is the full populated Offer object from the all-jd API
    const offer = candidate.offerId || {};

   


    // Location from Offer model is [String] array
    const locArr = Array.isArray(offer.location) ? offer.location : 
                   (typeof offer.location === 'string' ? [offer.location] : []);
    const firstLoc = locArr.length > 0 ? locArr[0] : (offer.workMode || 'N/A');
    const extraLocCount = locArr.length > 1 ? locArr.length - 1 : 0;

    // Dynamic data from offer
    const workMode = offer.workMode || 'Remote';
    const employmentType = offer.employmentType || 'Full-Time';
    const experience = offer.experience ? `${offer.experience} yrs` : 'Not specified';

    // Format due date from offer
    const dueDate = (() => {
        const d = offer.dueDate || candidate.dueDate;
        if (!d) return 'Apply Soon';
        try {
            const date = new Date(d);
            if (isNaN(date.getTime())) return String(d);
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return String(d); }
    })();

    // Format salary from offer
    const salary = (() => {
        const val = offer.salary || candidate.salary;
        if (!val) return '₹ Not Specified';
        if (typeof val === 'number') {
            if (val >= 100000) return `₹ ${(val / 100000).toFixed(1)}L`;
            if (val >= 1000) return `₹ ${(val / 1000).toFixed(0)}K`;
            return `₹ ${val}`;
        }
        return String(val);
    })();

    // About the company from offer description
    const aboutCompany = offer.description || candidate.description || '';



    

    return (
        <>
        <div className="bg-white rounded-[20px] md:rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 md:p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all relative flex flex-col justify-between">
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
                        <div className="flex items-center text-gray-500 text-xs md:text-sm gap-1 flex-wrap">
                            <span className="line-clamp-1">{candidate.company}</span>
                          
                            <span className="flex items-center gap-0.5 capitalize line-clamp-1">
                                  <span>•</span>
                                  <MapPin className="w-3 h-3 text-indigo-400" />
                                {firstLoc}
                            </span>
                            {extraLocCount > 0 && !showAllLocations && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowAllLocations(true); }}
                                    className="text-indigo-500 font-medium hover:underline"
                                >
                                    +{extraLocCount}
                                </button>
                            )}
                            {showAllLocations && locArr.slice(1).map((loc, i) => (
                                <span key={i} className="flex items-center gap-0.5">
                                    <span>•</span>
                                    <MapPin className="w-3 h-3 text-indigo-400" />
                                    {loc}
                                </span>
                            ))}
                            {showAllLocations && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowAllLocations(false); }}
                                    className="text-gray-400 font-medium text-xs hover:underline"
                                >
                                    less
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                {/* Tags from backend */}
                <div className="flex flex-wrap gap-2 mb-5 md:mb-6">
                    <span className="px-2.5 md:px-3 py-1 bg-indigo-50 text-indigo-600 text-[11px] md:text-xs font-semibold rounded-lg flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {workMode}
                    </span>
                    <span className="px-2.5 md:px-3 py-1 bg-orange-50 text-orange-600 text-[11px] md:text-xs font-semibold rounded-lg">
                        {employmentType}
                    </span>
                    <span className="px-2.5 md:px-3 py-1 bg-green-50 text-green-600 text-[11px] md:text-xs font-semibold rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {experience}
                    </span>
                </div>

                {/* About The Company - from offer description */}
                {/* {aboutCompany && (
                    <div className="mb-4 md:mb-5">
                        <h3 className="text-[11px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">About The Company</h3>
                        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{aboutCompany}</p>
                    </div>
                )} */}

                <div className="mb-5 md:mb-6">
                    <h3 className="text-[11px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Requirements</h3>
                    <div className="flex flex-wrap gap-2">
                        {candidate.skillsArray?.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-3 md:px-4 py-1 md:py-1.5 bg-gray-100 text-gray-700 text-[11px] md:text-xs font-medium rounded-full">
                                {skill.length > 20 ? skill.substring(0,6) + ".." : skill}
                            </span>
                        ))}
                        {candidate.skillsArray?.length > 3 && (
                            <button
                                onClick={() => setShowSkillsPopup(true)}
                                className="px-2 md:px-4 py-1 md:py-1.5 bg-indigo-50 text-indigo-600 text-[8px] md:text-xs rounded-full hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-100"
                            >
                                +{candidate.skillsArray.length - 3} 
                            </button>
                        )}
                        {(!candidate.skillsArray || candidate.skillsArray.length === 0) && (
                            <span className="text-gray-400 text-xs italic">No requirements listed</span>
                        )}
                    </div>
                </div>
            </div>

            

            <div className="pt-3 md:pt-4 border-t border-gray-200 flex items-center justify-between mt-auto">
                <div>
                    <div className="text-base md:text-lg font-bold text-gray-900">  {salary} </div>
                    <div className="flex items-center text-red-500 text-[10px] md:text-[11px] font-semibold mt-0.5 bg-red-50 px-2 py-0.5 rounded-md w-fit">
                        <Calendar className="w-3 h-3 mr-1" />
                        {dueDate}
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

        {/* Skills Popup */}
        {showSkillsPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSkillsPopup(false)}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Technical Requirements</h3>
                        <button onClick={() => setShowSkillsPopup(false)} className="p-1 hover:bg-gray-100 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {candidate.skillsArray?.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

export default AllJDsCard;
