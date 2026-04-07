// import { useEffect, useMemo, useState } from "react";
// import {
//   Eye,
//   X,
//   FileText,
//   Filter,
//   Share2,
//   ChevronLeft,
//   ChevronRight,
//   Search,
//   Download,
//   MapPin,
// } from "lucide-react";
// import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { baseUrl } from "../utils/ApiConstants";
// import SpinLoader from "../components/SpinLoader";
// import c1 from "../img/ISL.png";
// import c2 from "../img/TAL.png";
// import c3 from "../img/UFR.png";
// import ic1 from "../img/TAC1.png";
// import ic2 from "../img/FR.png";
// import ic3 from "../img/UFRC3.png";

// function Pager({ currentPage, totalPages, onPageChange }) {
//   if (totalPages <= 1) return null;

//   const pages = useMemo(() => {
//     const set = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
//     const arr = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
//     const out = [];
//     for (let i = 0; i < arr.length; i++) {
//       out.push(arr[i]);
//       if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) out.push("...");
//     }
//     return out;
//   }, [currentPage, totalPages]);

//   return (
//     <div className="flex items-center justify-center gap-2 px-4 py-4">
//       <button
//         type="button"
//         onClick={() => onPageChange(Math.max(1, currentPage - 1))}
//         disabled={currentPage === 1}
//         className={`h-8 w-8 grid place-items-center rounded-lg border text-sm transition
//           ${currentPage === 1 ? "border-gray-200 text-gray-300" : "border-[#D8C7FF] text-[#5B4CCB] hover:bg-[#F2EEFF]"}
//         `}
//         aria-label="Previous page"
//       >
//         <ChevronLeft className="h-4 w-4" />
//       </button>

//       {pages.map((p, idx) =>
//         p === "..." ? (
//           <span key={`dots-${idx}`} className="px-2 text-sm text-gray-400">
//             ...
//           </span>
//         ) : (
//           <button
//             key={p}
//             type="button"
//             onClick={() => onPageChange(p)}
//             className={`h-8 min-w-8 px-2 rounded-lg border text-sm font-medium transition
//               ${p === currentPage
//                 ? "bg-[#5B4CCB] border-[#5B4CCB] text-white"
//                 : "border-[#D8C7FF] text-[#5B4CCB] hover:bg-[#F2EEFF]"
//               }
//             `}
//           >
//             {p}
//           </button>
//         )
//       )}

//       <button
//         type="button"
//         onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
//         disabled={currentPage === totalPages}
//         className={`h-8 w-8 grid place-items-center rounded-lg border text-sm transition
//           ${currentPage === totalPages ? "border-gray-200 text-gray-300" : "border-[#D8C7FF] text-[#5B4CCB] hover:bg-[#F2EEFF]"}
//         `}
//         aria-label="Next page"
//       >
//         <ChevronRight className="h-4 w-4" />
//       </button>
//     </div>
//   );
// }

// function PriorityPill({ value }) {
//   const v = (value || "").toLowerCase();
//   const styles =
//     v === "critical"
//       ? "bg-red-50 text-red-600 border-red-100"
//       : v === "high"
//         ? "bg-red-50 text-red-600 border-red-100"
//         : v === "medium"
//           ? "bg-amber-50 text-amber-700 border-amber-100"
//           : v === "low"
//             ? "bg-green-50 text-green-700 border-green-100"
//             : "bg-gray-50 text-gray-600 border-gray-100";

//   return (
//     <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>
//       {value || "-"}
//     </span>
//   );
// }

// function ChipsWithPopup({ items = [], max = 3, type = "skill", rowId, openPopup, setOpenPopup, label = "Items" }) {
//   const list = Array.isArray(items) ? items : [];
//   const shown = list.slice(0, max);
//   const remaining = list.slice(max);
//   const hasMore = remaining.length > 0;
//   const popupId = `${type}-${rowId}`;

//   return (
//     <>
//       <div className="flex items-center gap-2 flex-wrap">
//         {shown.map((s, i) => (
//           <span key={i} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 whitespace-nowrap">
//             {s}
//           </span>
//         ))}
//         {hasMore && (
//           <button
//             type="button"
//             onClick={(e) => {
//               e.stopPropagation();
//               setOpenPopup(openPopup === popupId ? null : popupId);
//             }}
//             className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 hover:bg-indigo-200 transition cursor-pointer"
//           >
//             +{remaining.length}
//           </button>
//         )}
//       </div>

//       {openPopup === popupId && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
//           onClick={() => setOpenPopup(null)}
//         >
//           <div
//             className="bg-white rounded-2xl shadow-2xl border border-indigo-200 p-6 min-w-[320px] max-w-[480px] w-[90vw] sm:w-auto"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-sm font-bold text-gray-800">All {label}</h3>
//               <button
//                 type="button"
//                 onClick={() => setOpenPopup(null)}
//                 className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition text-lg leading-none cursor-pointer"
//               >
//                 ✕
//               </button>
//             </div>
//             <div className="flex flex-wrap gap-2">
//               {list.map((s, i) => (
//                 <span
//                   key={i}
//                   className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-800"
//                 >
//                   {s}
//                 </span>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// function StatCard({ title, value, accent = "purple", image, iconImage }) {
//   const map = {
//     purple: { iconBg: "bg-[#EFEAFF]", valueColor: "text-[#5B4CCB]" },
//     pink: { iconBg: "bg-rose-50", valueColor: "text-rose-500" },
//     blue: { iconBg: "bg-indigo-50", valueColor: "text-indigo-500" },
//   };
//   const s = map[accent] || map.purple;

//   const words = title.split(" ");
//   const firstWord = words[0];
//   const restWords = words.slice(1).join(" ");

//   return (
//     <div className="rounded-xl bg-white px-5 py-4 shadow-sm border border-gray-100">
//       <div className="flex items-center justify-between">
//         <p className="text-lg font-medium text-gray-500">
//           {firstWord}
//           {restWords && (
//             <>
//               <br />
//               {restWords}
//             </>
//           )}
//         </p>
//         <div className="h-9 w-9">
//           <img src={iconImage} alt="" className="h-full w-full object-contain" />
//         </div>
//       </div>
//       <div className="mt-3 flex items-center justify-between">
//         <p className={`text-3xl font-bold ${s.valueColor}`}>{value}</p>
//         <img src={image} alt="" className="h-8" />
//       </div>
//     </div>
//   );
// }

// function JD() {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [jdData, setJdData] = useState([]);
//   const [incomingJDs, setIncomingJDs] = useState([]);
//   const [loadingIncoming, setLoadingIncoming] = useState(false);
//   const [assignedSearch, setAssignedSearch] = useState("");
//   const [createdSearch, setCreatedSearch] = useState("");
//   const [stats, setStats] = useState({
//     totalJD: 0,
//     filteredResumes: 0,
//     unfilteredResumes: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [showSummaryPopup, setShowSummaryPopup] = useState(false);
//   const [selectedJDSummary, setSelectedJDSummary] = useState(null);
//   const [openSkillPopup, setOpenSkillPopup] = useState(null);
//   const [openLocationPopup, setOpenLocationPopup] = useState(null);
//   const navigate = useNavigate();

//   const rowsPerPage = 5;

//   const [incomingCurrentPage, setIncomingCurrentPage] = useState(1);
//   const incomingRowsPerPage = 5;

//   const location = useLocation();
//   const highlightJdId = location.state?.highlightJdId || null;

//   useEffect(() => {
//     fetchJDs();
//     fetchIncomingJDs();
//   }, []);

//   const fetchJDs = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("token");
//       const response = await axios.get(`${baseUrl}/jd//created-by/hr`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       console.log("jd page data", response.data);


//       if (response.data.success && response.data.data) {
//         const data = response.data.data
//           .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//           .map((item) => {
//             const dueDate =
//               item.dueDate ||
//               item.offerId?.dueDate ||
//               item.offer?.dueDate ||
//               item.offerId?.expiryDate ||
//               item.expiryDate ||
//               null;
//             return { ...item, dueDate };
//           });

//         setJdData(data);

//         let totalFiltered = 0;
//         let totalUnfiltered = 0;

//         data.forEach((jd) => {
//           const appliedCandidates = jd.appliedCandidates || [];

//           const filteredFromApplied = appliedCandidates.filter(
//             (c) => c.status === "filtered"
//           ).length;

//           const unfilteredFromApplied = appliedCandidates.filter(
//             (c) => c.status === "unfiltered"
//           ).length;

//           totalFiltered += filteredFromApplied || (jd.filteredCandidates?.length || 0);
//           totalUnfiltered += unfilteredFromApplied || (jd.unfilteredCandidates?.length || 0);
//         });

//         setStats({
//           totalJD: response.data.count || data.length,
//           filteredResumes: totalFiltered,
//           unfilteredResumes: totalUnfiltered,
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching JDs:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getFilteredCount = (jd) => {
//     const appliedCandidates = jd.appliedCandidates || [];
//     const fromApplied = appliedCandidates.filter((c) => c.status === "filtered").length;
//     return(jd.filteredCandidates?.length || 0);
//   };

//   const getUnfilteredCount = (jd) => {
//     const appliedCandidates = jd.appliedCandidates || [];
//     const fromApplied = appliedCandidates.filter((c) => c.status === "unfiltered").length;
//     return fromApplied || (jd.unfilteredCandidates?.length || 0);
//   };

//   const fetchIncomingJDs = async () => {
//     try {
//       setLoadingIncoming(true);
//       const response = await axios.get(`${baseUrl}/jd/assigned-offers/hr`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });
// // console.log("incoming jds", response.data);

//       if (response.data.success) {
//         const filteredData = response.data.data
//           .filter((jd) => jd.isJDCreated === false)
//           .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//         setIncomingJDs(filteredData);
//       }
//     } catch (error) {
//       console.log("Error fetching incoming JDs:", error);
//     } finally {
//       setLoadingIncoming(false);
//     }
//   };

//   const handleSelectJD = (jd) => {
//     navigate("/RecruiterAdmin-Dashboard/JD/CreateJD", {
//       state: {
//         offerId: jd._id,
//         companyName: jd.companyName,
//         location: jd.location,
//         dueDate: jd.dueDate,
//         employmentType: jd.employmentType,
//       },
//     });
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-GB");
//   };

//   const isExpired = (dateString) => {
//     if (!dateString) return false;
//     try {
//       return new Date(dateString) < new Date();
//     } catch {
//       return false;
//     }
//   };

//   const nonExpiredIncomingJDs = incomingJDs.filter((jd) => !isExpired(jd.dueDate));

//   const filteredAssignedJDs = useMemo(() => {
//     if (!assignedSearch.trim()) return nonExpiredIncomingJDs;
//     const q = assignedSearch.toLowerCase().trim();
//     return nonExpiredIncomingJDs.filter(
//       (jd) =>
//         (jd.jobTitle || "").toLowerCase().includes(q) ||
//         (jd.companyName || "").toLowerCase().includes(q) ||
//         (jd.priority || "").toLowerCase().includes(q) ||
//         (jd.experience || "").toLowerCase().includes(q) ||
//         (jd.skills || []).some((s) => s.toLowerCase().includes(q)) ||
//         (jd.location || []).some((l) => l.toLowerCase().includes(q))
//     );
//   }, [nonExpiredIncomingJDs, assignedSearch]);

//   const incomingTotalPages = Math.ceil(filteredAssignedJDs.length / incomingRowsPerPage);
//   const incomingStartIndex = (incomingCurrentPage - 1) * incomingRowsPerPage;
//   const incomingEndIndex = incomingStartIndex + incomingRowsPerPage;
//   const currentIncomingData = filteredAssignedJDs.slice(incomingStartIndex, incomingEndIndex);

//   const filteredCreatedJDs = useMemo(() => {
//     if (!createdSearch.trim()) return jdData;
//     const q = createdSearch.toLowerCase().trim();
//     return jdData.filter(
//       (row) =>
//         (row.offerId?.jobTitle || "").toLowerCase().includes(q) ||
//         (row.companyName || row.offerId?.company || "").toLowerCase().includes(q)
//     );
//   }, [jdData, createdSearch]);

//   const totalPages = Math.ceil(filteredCreatedJDs.length / rowsPerPage);
//   const startIndex = (currentPage - 1) * rowsPerPage;
//   const endIndex = startIndex + rowsPerPage;
//   const currentData = filteredCreatedJDs.slice(startIndex, endIndex);

//   const handleViewJD = (jd) => {
//     localStorage.setItem("selectedJD", JSON.stringify(jd));
//     navigate("/RecruiterAdmin-Dashboard/JDDetails", { state: { jdData: jd } });
//   };

//   const handleShowSummary = (jd) => {
//     setSelectedJDSummary({
//       jobTitle: jd.offerId?.jobTitle || "N/A",
//       companyName: jd.companyName || jd.offerId?.company || "N/A",
//       jobSummary: jd.jobSummary || null,
//       requirements: jd.requirements || [],
//       responsibilities: jd.responsibilities || [],
//       benefits: jd.benefits || [],
//       additionalInfo: jd.additionalInfo || null,
//     });
//     setShowSummaryPopup(true);
//   };

//   const handleCloseSummary = () => {
//     setShowSummaryPopup(false);
//     setSelectedJDSummary(null);
//   };

//   const getAssignedSrClass = (jd) => {
//     return "bg-gray-200 text-gray-700";
//   };

//   const getCreatedSrClass = (row) => {
//     if (highlightJdId && row._id === highlightJdId) {
//       return "bg-green-500 text-white animate-blink";
//     }
//     if (
//       row.appliedCandidates?.some(
//         (c) => c.status === "applied" || c.status === "pending"
//       )
//     ) {
//       return "bg-yellow-400 text-yellow-900 animate-blink";
//     }
//     return "bg-gray-200 text-gray-700";
//   };

//   if (loading && loadingIncoming) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <SpinLoader />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#F6F7FB]">
//       <style>{`
//         @keyframes blink {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.3; }
//         }
//         .animate-blink {
//           animation: blink 1s ease-in-out infinite;
//         }
//       `}</style>

//       {showSummaryPopup && selectedJDSummary && (
//         <div className="fixed inset-0 z-[9999] flex items-center justify-center">
//           <div
//             className="fixed inset-0 bg-black/50 backdrop-blur-sm"
//             onClick={handleCloseSummary}
//           />

//           <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden">
//             <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
//               <div>
//                 <h2 className="text-xl font-bold text-gray-900">{selectedJDSummary.jobTitle}</h2>
//                 <p className="text-sm text-gray-500">{selectedJDSummary.companyName}</p>
//               </div>
//               <button onClick={handleCloseSummary} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
//                 <X className="w-5 h-5 text-gray-500" />
//               </button>
//             </div>

//             <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
//               <div className="space-y-6">
//                 {selectedJDSummary.jobSummary && (
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
//                       <FileText className="w-5 h-5 text-blue-500" />
//                       Job Summary
//                     </h3>
//                     <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg">{selectedJDSummary.jobSummary}</p>
//                   </div>
//                 )}

//                 {selectedJDSummary.requirements?.length > 0 && (
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
//                       <Filter className="w-5 h-5 text-purple-500" />
//                       Requirements
//                     </h3>
//                     <ul className="space-y-2">
//                       {selectedJDSummary.requirements.map((item, index) => (
//                         <li key={index} className="flex items-start gap-2 text-gray-700">
//                           <span className="text-purple-500 mt-1">•</span>
//                           <span>{item}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}

//                 {selectedJDSummary.responsibilities?.length > 0 && (
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-2">Responsibilities</h3>
//                     <ul className="space-y-2">
//                       {selectedJDSummary.responsibilities.map((item, index) => (
//                         <li key={index} className="flex items-start gap-2 text-gray-700">
//                           <span className="text-green-500 mt-1">•</span>
//                           <span>{item}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}

//                 {selectedJDSummary.benefits?.length > 0 && (
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-2">Benefits</h3>
//                     <ul className="space-y-2">
//                       {selectedJDSummary.benefits.map((item, index) => (
//                         <li key={index} className="flex items-start gap-2 text-gray-700">
//                           <span className="text-amber-500 mt-1">•</span>
//                           <span>{item}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}

//                 {selectedJDSummary.additionalInfo && (
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Information</h3>
//                     <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
//                       {selectedJDSummary.additionalInfo}
//                     </p>
//                   </div>
//                 )}

//                 {!selectedJDSummary.jobSummary &&
//                   selectedJDSummary.requirements?.length === 0 &&
//                   selectedJDSummary.responsibilities?.length === 0 &&
//                   selectedJDSummary.benefits?.length === 0 &&
//                   !selectedJDSummary.additionalInfo && (
//                     <div className="text-center py-8 text-gray-500">No JD details available</div>
//                   )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="py-6">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
//           <StatCard title="Total Applications" value={stats.totalJD.toString()} accent="purple" image={c1} iconImage={ic1} />
//           <StatCard title="Filtered Resumes" value={stats.filteredResumes.toString()} accent="pink" image={c2} iconImage={ic2} />
//           <StatCard title="Un-Filtered Resumes" value={stats.unfilteredResumes.toString()} accent="blue" image={c3} iconImage={ic3} />
//         </div>

//         <div className="mb-6">
//           <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
//             <h2 className="text-sm sm:text-base font-semibold text-gray-900">Your Assigned Job Descriptions</h2>
//             <div className="flex items-center gap-3">
//               <div className="relative w-full sm:w-64">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search"
//                   value={assignedSearch}
//                   onChange={(e) => {
//                     setAssignedSearch(e.target.value);
//                     setIncomingCurrentPage(1);
//                   }}
//                   className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-[#D8C7FF]"
//                 />
//               </div>
//               {/* <button
//                 type="button"
//                 className="inline-flex items-center gap-2 rounded-lg border border-[#D8C7FF] bg-white px-3 py-2 text-sm font-medium text-[#5B4CCB] hover:bg-[#F2EEFF] transition"
//               >
//                 <Download className="h-4 w-4" />
//                 Export
//               </button> */}
//             </div>
//           </div>

//           <div className="rounded-xl bg-white shadow-sm border border-[#E6DAFF] overflow-hidden">
//             <div className="overflow-x-auto">
//               {loadingIncoming ? (
//                 <div className="flex items-center justify-center py-12">
//                   <SpinLoader />
//                 </div>
//               ) : filteredAssignedJDs.length === 0 ? (
//                 <div className="flex items-center justify-center py-12">
//                   <p className="text-sm text-gray-500">
//                     {assignedSearch.trim() ? "No matching results" : "No incoming JD data available"}
//                   </p>
//                 </div>
//               ) : (
//                 <table className="w-full min-w-[980px]">
//                   <thead className="bg-[#F3F4F6]">
//                     <tr className="text-left text-xs font-semibold text-gray-600">
//                       <th className="px-5 py-3">Serial No.</th>
//                       <th className="px-5 py-3">Job Title</th>
//                       <th className="px-5 py-3">Company Name</th>
//                       <th className="px-5 py-3">Priority</th>
//                       <th className="px-5 py-3">Due Date</th>
//                       <th className="px-5 py-3">City</th>
//                       <th className="px-5 py-3">Experience</th>
//                       <th className="px-5 py-3">Skills</th>
//                       <th className="px-5 py-3">Action</th>
//                     </tr>
//                   </thead>

//                   <tbody className="divide-y divide-gray-100">
//                     {currentIncomingData.map((jd, index) => {
//                       const incomingExpired = isExpired(jd.dueDate);
//                       const city = jd.location?.length > 0 ? jd.location[0] : "-";

//                       return (
//                         <tr key={jd._id} className="hover:bg-[#FAFAFF]">
//                           <td className="px-5 py-4 text-sm text-gray-900 font-medium">
//                             <span
//                               className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getAssignedSrClass(jd)}`}
//                             >
//                               {incomingStartIndex + index + 1}
//                             </span>
//                           </td>
//                           <td className="px-5 py-4 text-sm text-gray-900">{jd.jobTitle || "-"}</td>
//                           <td className="px-5 py-4 text-sm text-gray-700">{jd.companyName || "-"}</td>
//                           <td className="px-5 py-4 text-sm">
//                             <PriorityPill value={jd.priority} />
//                           </td>
//                           <td className="px-5 py-4 text-sm text-gray-700">{formatDate(jd.dueDate) || "-"}</td>
//                           <td className="px-5 min-w-[300px] py-4 text-sm text-gray-700">
//                             <ChipsWithPopup
//                               items={jd.location || []}
//                               max={3}
//                               type="location"
//                               rowId={jd._id}
//                               openPopup={openLocationPopup}
//                               setOpenPopup={setOpenLocationPopup}
//                               label="Locations"
//                             />
//                           </td>
//                           <td className="px-5 py-4 text-sm text-gray-700">{jd.experience || "-"}</td>
//                           <td className="px-5 min-w-[300px] py-4 text-sm text-gray-700">
//                             <ChipsWithPopup
//                               items={jd.skills || []}
//                               max={3}
//                               type="skill"
//                               rowId={jd._id}
//                               openPopup={openSkillPopup}
//                               setOpenPopup={setOpenSkillPopup}
//                               label="Skills"
//                             />
//                           </td>
//                           <td className="px-5 py-4 text-sm">
//                             <button
//                               type="button"
//                               onClick={() => !incomingExpired && handleSelectJD(jd)}
//                               disabled={incomingExpired}
//                               title={incomingExpired ? "Due date passed — cannot select" : "Select"}
//                               className={`rounded-full px-5 py-2 text-xs font-semibold transition
//                                 ${incomingExpired
//                                   ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                                   : "bg-[#5B4CCB] text-white hover:bg-[#4C3FB7]"
//                                 }`}
//                             >
//                               Select
//                             </button>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               )}
//             </div>

//             <Pager
//               currentPage={incomingCurrentPage}
//               totalPages={incomingTotalPages}
//               onPageChange={setIncomingCurrentPage}
//             />
//           </div>
//         </div>

//         <div>
//           <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
//             <h2 className="text-sm sm:text-base font-semibold text-gray-900">Created Job Descriptions</h2>
//             <div className="flex items-center gap-3">
//               <div className="relative w-full sm:w-64">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search"
//                   value={createdSearch}
//                   onChange={(e) => {
//                     setCreatedSearch(e.target.value);
//                     setCurrentPage(1);
//                   }}
//                   className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-[#D8C7FF]"
//                 />
//               </div>
//               {/* <button
//                 type="button"
//                 className="inline-flex items-center gap-2 rounded-lg border border-[#D8C7FF] bg-white px-3 py-2 text-sm font-medium text-[#5B4CCB] hover:bg-[#F2EEFF] transition"
//               >
//                 <Download className="h-4 w-4" />
//                 Export
//               </button> */}
//             </div>
//           </div>

//           <div className="rounded-xl bg-white shadow-sm border border-[#E6DAFF] overflow-hidden">
//             <div className="overflow-x-auto">
//               {loading ? (
//                 <div className="flex justify-center items-center py-10">
//                   <SpinLoader />
//                 </div>
//               ) : (
//                 <table className="w-full min-w-[980px]">
//                   <thead className="bg-[#F3F4F6]">
//                     <tr className="text-left text-xs font-semibold text-gray-600">
//                       <th className="px-5 py-3">Serial No.</th>
//                       <th className="px-5 py-3">Job Title</th>
//                       <th className="px-5 py-3">Company Name</th>
//                       <th className="px-5 py-3">Created On</th>
//                       <th className="px-5 py-3">Due Date</th>
//                       <th className="px-5 py-3">Filtered</th>
//                       <th className="px-5 py-3">Unfiltered</th>
//                       <th className="px-5 py-3">Actions</th>
//                     </tr>
//                   </thead>

//                   <tbody className="divide-y divide-gray-100">
//                     {currentData.length > 0 ? (
//                       currentData.map((row, index) => {
//                         const rowExpired = isExpired(row.dueDate);
//                         const isNew = highlightJdId && row._id === highlightJdId;

//                         return (
//                           <tr key={row._id || index} className="hover:bg-[#FAFAFF]">
//                             <td className="px-5 py-4 text-sm text-gray-900">
//                               <div className="flex items-center gap-2">
//                                 <span
//                                   className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getCreatedSrClass(row)}`}
//                                 >
//                                   {startIndex + index + 1}
//                                 </span>
//                                 {isNew && (
//                                   <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
//                                     new
//                                   </span>
//                                 )}
//                               </div>
//                             </td>

//                             <td className="px-5 py-4 text-sm text-gray-900">{row.offerId?.jobTitle || "N/A"}</td>
//                             <td className="px-5 py-4 text-sm text-gray-700">{row.companyName || row.offerId?.company || "N/A"}</td>
//                             <td className="px-5 py-4 text-sm text-gray-700">{formatDate(row.createdAt)}</td>
//                             <td className={`px-5 py-4 text-sm ${rowExpired ? "text-red-500" : "text-gray-700"}`}>
//                               {formatDate(row.dueDate)}
//                             </td>

//                             <td className="px-5 py-4 text-sm">
//                               <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-green-100 px-2 text-xs font-semibold text-green-700">
//                                 {getFilteredCount(row)}
//                               </span>
//                             </td>

//                             <td className="px-5 py-4 text-sm">
//                               <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-red-100 px-2 text-xs font-semibold text-red-700">
//                                 {getUnfilteredCount(row)}
//                               </span>
//                             </td>
//                             <td className="px-5 py-4">
//                               <div className="flex items-center gap-3">
//                                 <button
//                                   onClick={() => handleShowSummary(row)}
//                                   className="h-7 w-7 grid place-items-center rounded-lg bg-[#F2EEFF] text-[#5B4CCB] transition"
//                                   aria-label="View JD Summary"
//                                 >
//                                   <Eye className="h-4 w-4" />
//                                 </button>

//                                 <button
//                                   onClick={() =>
//                                     navigate("/RecruiterAdmin-Dashboard/NonCandidateList", { state: { jdId: row._id } })
//                                   }
//                                   title="Send Invite"
//                                   className="h-7 w-7 grid place-items-center rounded-lg bg-[#F2EEFF] text-[#5B4CCB] transition"
//                                   aria-label="Send Invite"
//                                 >
//                                   <Share2 className="h-4 w-4" />
//                                 </button>

//                                 <button
//                                   onClick={() => handleViewJD(row)}
//                                   className="h-7 w-7 grid place-items-center rounded-lg bg-[#F2EEFF] text-[#5B4CCB] transition"
//                                   aria-label="View JD"
//                                 >
//                                   <ChevronRight className="h-4 w-4" />
//                                 </button>
//                               </div>
//                             </td>
//                           </tr>
//                         );
//                       })
//                     ) : (
//                       <tr>
//                         <td colSpan="8" className="py-10 text-center text-sm text-gray-500">
//                           {createdSearch.trim() ? "No matching results" : "No JDs found"}
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               )}
//             </div>

//             <Pager currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default JD;


import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  X,
  FileText,
  Filter,
  Share2,
  Share,
  ChevronLeft,
  Linkedin,
  Mail,
  ChevronRight,
  Send,
  Search,
  Download,
  MapPin,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { baseUrl } from "../utils/ApiConstants";
import SpinLoader from "../components/SpinLoader";
import c1 from "../img/ISL.png";
import c2 from "../img/TAL.png";
import c3 from "../img/UFR.png";
import ic1 from "../img/TAC1.png";
import ic2 from "../img/FR.png";
import ic3 from "../img/UFRC3.png";

function Pager({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = useMemo(() => {
    const set = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const arr = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      out.push(arr[i]);
      if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) out.push("...");
    }
    return out;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-4">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`h-8 w-8 grid place-items-center rounded-lg border text-sm transition
          ${currentPage === 1 ? "border-gray-200 text-gray-300" : "border-[#D8C7FF] text-[#5B4CCB] hover:bg-[#F2EEFF]"}
        `}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`dots-${idx}`} className="px-2 text-sm text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-8 min-w-8 px-2 rounded-lg border text-sm font-medium transition
              ${p === currentPage
                ? "bg-[#5B4CCB] border-[#5B4CCB] text-white"
                : "border-[#D8C7FF] text-[#5B4CCB] hover:bg-[#F2EEFF]"
              }
            `}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`h-8 w-8 grid place-items-center rounded-lg border text-sm transition
          ${currentPage === totalPages ? "border-gray-200 text-gray-300" : "border-[#D8C7FF] text-[#5B4CCB] hover:bg-[#F2EEFF]"}
        `}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function PriorityPill({ value }) {
  const v = (value || "").toLowerCase();
  const styles =
    v === "critical"
      ? "bg-red-50 text-red-600 border-red-100"
      : v === "high"
        ? "bg-red-50 text-red-600 border-red-100"
        : v === "medium"
          ? "bg-amber-50 text-amber-700 border-amber-100"
          : v === "low"
            ? "bg-green-50 text-green-700 border-green-100"
            : "bg-gray-50 text-gray-600 border-gray-100";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>
      {value || "-"}
    </span>
  );
}

function ChipsWithPopup({ items = [], max = 3, type = "skill", rowId, openPopup, setOpenPopup, label = "Items" }) {
  const list = Array.isArray(items) ? items : [];
  const shown = list.slice(0, max);
  const remaining = list.slice(max);
  const hasMore = remaining.length > 0;
  const popupId = `${type}-${rowId}`;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {shown.map((s, i) => (
          <span key={i} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 whitespace-nowrap">
            {s}
          </span>
        ))}
        {hasMore && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenPopup(openPopup === popupId ? null : popupId);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 hover:bg-indigo-200 transition cursor-pointer"
          >
            +{remaining.length}
          </button>
        )}
      </div>

      {openPopup === popupId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setOpenPopup(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-indigo-200 p-6 min-w-[320px] max-w-[480px] w-[90vw] sm:w-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">All {label}</h3>
              <button
                type="button"
                onClick={() => setOpenPopup(null)}
                className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {list.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs font-medium text-indigo-800"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({ title, value, accent = "purple", image, iconImage }) {
  const map = {
    purple: { iconBg: "bg-[#EFEAFF]", valueColor: "text-[#5B4CCB]" },
    pink: { iconBg: "bg-rose-50", valueColor: "text-rose-500" },
    blue: { iconBg: "bg-indigo-50", valueColor: "text-indigo-500" },
  };
  const s = map[accent] || map.purple;

  const words = title.split(" ");
  const firstWord = words[0];
  const restWords = words.slice(1).join(" ");

  return (
    <div className="rounded-xl bg-white px-5 py-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <p className="text-lg font-medium text-gray-500">
          {firstWord}
          {restWords && (
            <>
              <br />
              {restWords}
            </>
          )}
        </p>
        <div className="h-9 w-9">
          <img src={iconImage} alt="" className="h-full w-full object-contain" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className={`text-3xl font-bold ${s.valueColor}`}>{value}</p>
        <img src={image} alt="" className="h-8" />
      </div>
    </div>
  );
}

function JD() {
  const [currentPage, setCurrentPage] = useState(1);
  const [jdData, setJdData] = useState([]);
  const [incomingJDs, setIncomingJDs] = useState([]);
  const [loadingIncoming, setLoadingIncoming] = useState(false);
  const [assignedSearch, setAssignedSearch] = useState("");
  const [createdSearch, setCreatedSearch] = useState("");
  const [stats, setStats] = useState({
    totalJD: 0,
    filteredResumes: 0,
    unfilteredResumes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [selectedJDForShare, setSelectedJDForShare] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [selectedJDSummary, setSelectedJDSummary] = useState(null);
  const [openSkillPopup, setOpenSkillPopup] = useState(null);
  const [openLocationPopup, setOpenLocationPopup] = useState(null);
  const navigate = useNavigate();

  const rowsPerPage = 5;

  const [incomingCurrentPage, setIncomingCurrentPage] = useState(1);
  const incomingRowsPerPage = 5;

  const location = useLocation();
  const highlightJdId = location.state?.highlightJdId || null;

  useEffect(() => {
    fetchJDs();
    fetchIncomingJDs();
  }, []);

  const fetchJDs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseUrl}/jd//created-by/hr`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("jd page data", response.data);


      if (response.data.success && response.data.data) {
        const data = response.data.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((item) => {
            const dueDate =
              item.dueDate ||
              item.offerId?.dueDate ||
              item.offer?.dueDate ||
              item.offerId?.expiryDate ||
              item.expiryDate ||
              null;
            return { ...item, dueDate };
          });

        setJdData(data);

        let totalFiltered = 0;
        let totalUnfiltered = 0;

        data.forEach((jd) => {
          const appliedCandidates = jd.appliedCandidates || [];

          const filteredFromApplied = appliedCandidates.filter(
            (c) => c.status === "filtered"
          ).length;

          const unfilteredFromApplied = appliedCandidates.filter(
            (c) => c.status === "unfiltered"
          ).length;

          totalFiltered += filteredFromApplied || (jd.filteredCandidates?.length || 0);
          totalUnfiltered += unfilteredFromApplied || (jd.unfilteredCandidates?.length || 0);
        });

        setStats({
          totalJD: response.data.count || data.length,
          filteredResumes: totalFiltered,
          unfilteredResumes: totalUnfiltered,
        });
      }
    } catch (error) {
      console.error("Error fetching JDs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareJD = (jd) => {
    const jdUrl = `https://recruterai.in/JDDetail/${jd._id}`;

    setSelectedJDForShare({
      ...jd,
      jdUrl
    });

    setShowSharePopup(true);
  };

  const getFullJDContent = () => {
    if (!selectedJDForShare) return '';

    const jd = selectedJDForShare;

    let content = `📋 Job Description\n${'─'.repeat(30)}\n`;

    if (jd.jobSummary) {
      content += `\n📌 Job Summary:\n${jd.jobSummary}\n`;
    }

    if (jd.responsibilities?.length) {
      content += `\n📌 Responsibilities:\n`;
      jd.responsibilities.forEach(i => content += `• ${i}\n`);
    }

    if (jd.requirements?.length) {
      content += `\n📌 Requirements:\n`;
      jd.requirements.forEach(i => content += `• ${i}\n`);
    }

    if (jd.benefits?.length) {
      content += `\n📌 Benefits:\n`;
      jd.benefits.forEach(i => content += `• ${i}\n`);
    }

    content += `\n🔗 Apply Here: ${jd.jdUrl}`;

    return content;
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(getFullJDContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWithCopy = async (platformName, url) => {
    try {
      await navigator.clipboard.writeText(getFullJDContent());
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
    }
  };

  const getFilteredCount = (jd) => {
    const appliedCandidates = jd.appliedCandidates || [];
    const fromApplied = appliedCandidates.filter((c) => c.status === "filtered").length;
    return jd.filteredCandidates?.length || 0;
  };

  const getUnfilteredCount = (jd) => {
    const appliedCandidates = jd.appliedCandidates || [];
    const fromApplied = appliedCandidates.filter((c) => c.status === "unfiltered").length;
    return fromApplied || (jd.unfilteredCandidates?.length || 0);
  };

  const fetchIncomingJDs = async () => {
    try {
      setLoadingIncoming(true);
      const response = await axios.get(`${baseUrl}/jd/assigned-offers/hr`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // console.log("incoming jds", response.data);

      if (response.data.success) {
        const filteredData = response.data.data
          .filter((jd) => jd.isJDCreated === false)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setIncomingJDs(filteredData);
      }
    } catch (error) {
      console.log("Error fetching incoming JDs:", error);
    } finally {
      setLoadingIncoming(false);
    }
  };

  const handleSelectJD = (jd) => {
    navigate("/RecruiterAdmin-Dashboard/JD/CreateJD", {
      state: {
        offerId: jd._id,
        companyName: jd.companyName,
        location: jd.location,
        dueDate: jd.dueDate,
        employmentType: jd.employmentType,
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    try {
      return new Date(dateString) < new Date();
    } catch {
      return false;
    }
  };

  const nonExpiredIncomingJDs = incomingJDs.filter((jd) => !isExpired(jd.dueDate));

  const filteredAssignedJDs = useMemo(() => {
    if (!assignedSearch.trim()) return nonExpiredIncomingJDs;
    const q = assignedSearch.toLowerCase().trim();
    return nonExpiredIncomingJDs.filter(
      (jd) =>
        (jd.jobTitle || "").toLowerCase().includes(q) ||
        (jd.companyName || "").toLowerCase().includes(q) ||
        (jd.priority || "").toLowerCase().includes(q) ||
        (jd.experience || "").toLowerCase().includes(q) ||
        (jd.skills || []).some((s) => s.toLowerCase().includes(q)) ||
        (jd.location || []).some((l) => l.toLowerCase().includes(q))
    );
  }, [nonExpiredIncomingJDs, assignedSearch]);

  const incomingTotalPages = Math.ceil(filteredAssignedJDs.length / incomingRowsPerPage);
  const incomingStartIndex = (incomingCurrentPage - 1) * incomingRowsPerPage;
  const incomingEndIndex = incomingStartIndex + incomingRowsPerPage;
  const currentIncomingData = filteredAssignedJDs.slice(incomingStartIndex, incomingEndIndex);

  const filteredCreatedJDs = useMemo(() => {
    if (!createdSearch.trim()) return jdData;
    const q = createdSearch.toLowerCase().trim();
    return jdData.filter(
      (row) =>
        (row.offerId?.jobTitle || "").toLowerCase().includes(q) ||
        (row.companyName || row.offerId?.company || "").toLowerCase().includes(q)
    );
  }, [jdData, createdSearch]);

  const totalPages = Math.ceil(filteredCreatedJDs.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = filteredCreatedJDs.slice(startIndex, endIndex);

  const handleViewJD = (jd) => {
    localStorage.setItem("selectedJD", JSON.stringify(jd));
    navigate("/RecruiterAdmin-Dashboard/JDDetails", { state: { jdData: jd } });
  };

  const handleShowSummary = (jd) => {
    setSelectedJDSummary({
      jobTitle: jd.offerId?.jobTitle || "N/A",
      companyName: jd.companyName || jd.offerId?.company || "N/A",
      jobSummary: jd.jobSummary || null,
      requirements: jd.requirements || [],
      responsibilities: jd.responsibilities || [],
      benefits: jd.benefits || [],
      additionalInfo: jd.additionalInfo || null,
    });
    setShowSummaryPopup(true);
  };

  const handleCloseSummary = () => {
    setShowSummaryPopup(false);
    setSelectedJDSummary(null);
  };

  const getAssignedSrClass = (jd) => {
    return "bg-gray-200 text-gray-700";
  };

  const getCreatedSrClass = (row) => {
    if (highlightJdId && row._id === highlightJdId) {
      return "bg-green-500 text-white animate-blink";
    }
    if (
      row.appliedCandidates?.some(
        (c) => c.status === "applied" || c.status === "pending"
      )
    ) {
      return "bg-yellow-400 text-yellow-900 animate-blink";
    }
    return "bg-gray-200 text-gray-700";
  };

  if (loading && loadingIncoming) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SpinLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-blink {
          animation: blink 1s ease-in-out infinite;
        }
      `}</style>

      {showSummaryPopup && selectedJDSummary && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseSummary}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedJDSummary.jobTitle}</h2>
                <p className="text-sm text-gray-500">{selectedJDSummary.companyName}</p>
              </div>
              <button onClick={handleCloseSummary} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="space-y-6">
                {selectedJDSummary.jobSummary && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Job Summary
                    </h3>
                    <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg">{selectedJDSummary.jobSummary}</p>
                  </div>
                )}

                {selectedJDSummary.requirements?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-purple-500" />
                      Requirements
                    </h3>
                    <ul className="space-y-2">
                      {selectedJDSummary.requirements.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-purple-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJDSummary.responsibilities?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Responsibilities</h3>
                    <ul className="space-y-2">
                      {selectedJDSummary.responsibilities.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJDSummary.benefits?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Benefits</h3>
                    <ul className="space-y-2">
                      {selectedJDSummary.benefits.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJDSummary.additionalInfo && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Information</h3>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {selectedJDSummary.additionalInfo}
                    </p>
                  </div>
                )}

                {!selectedJDSummary.jobSummary &&
                  selectedJDSummary.requirements?.length === 0 &&
                  selectedJDSummary.responsibilities?.length === 0 &&
                  selectedJDSummary.benefits?.length === 0 &&
                  !selectedJDSummary.additionalInfo && (
                    <div className="text-center py-8 text-gray-500">No JD details available</div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Applications" value={stats.totalJD.toString()} accent="purple" image={c1} iconImage={ic1} />
          <StatCard title="Filtered Resumes" value={stats.filteredResumes.toString()} accent="pink" image={c2} iconImage={ic2} />
          <StatCard title="Un-Filtered Resumes" value={stats.unfilteredResumes.toString()} accent="blue" image={c3} iconImage={ic3} />
        </div>

        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">Your Assigned Job Descriptions</h2>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={assignedSearch}
                  onChange={(e) => {
                    setAssignedSearch(e.target.value);
                    setIncomingCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-[#D8C7FF]"
                />
              </div>
              {/* <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#D8C7FF] bg-white px-3 py-2 text-sm font-medium text-[#5B4CCB] hover:bg-[#F2EEFF] transition"
              >
                <Download className="h-4 w-4" />
                Export
              </button> */}
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-[#E6DAFF] overflow-hidden">
            <div className="overflow-x-auto">
              {loadingIncoming ? (
                <div className="flex items-center justify-center py-12">
                  <SpinLoader />
                </div>
              ) : filteredAssignedJDs.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-gray-500">
                    {assignedSearch.trim() ? "No matching results" : "No incoming JD data available"}
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[980px]">
                  <thead className="bg-[#F3F4F6]">
                    <tr className="text-left text-xs font-semibold text-gray-600">
                      <th className="px-5 py-3">Serial No.</th>
                      <th className="px-5 py-3">Job Title</th>
                      <th className="px-5 py-3">Company Name</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Due Date</th>
                      <th className="px-5 py-3">City</th>
                      <th className="px-5 py-3">Experience</th>
                      <th className="px-5 py-3">Skills</th>
                      <th className="px-5 py-3">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {currentIncomingData.map((jd, index) => {
                      const incomingExpired = isExpired(jd.dueDate);
                      const city = jd.location?.length > 0 ? jd.location[0] : "-";

                      return (
                        <tr key={jd._id} className="hover:bg-[#FAFAFF]">
                          <td className="px-5 py-4 text-sm text-gray-900 font-medium">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getAssignedSrClass(jd)}`}
                            >
                              {incomingStartIndex + index + 1}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-900">{jd.jobTitle || "-"}</td>
                          <td className="px-5 py-4 text-sm text-gray-700">{jd.companyName || "-"}</td>
                          <td className="px-5 py-4 text-sm">
                            <PriorityPill value={jd.priority} />
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700">{formatDate(jd.dueDate) || "-"}</td>
                          <td className="px-5 min-w-[300px] py-4 text-sm text-gray-700">
                            <ChipsWithPopup
                              items={jd.location || []}
                              max={3}
                              type="location"
                              rowId={jd._id}
                              openPopup={openLocationPopup}
                              setOpenPopup={setOpenLocationPopup}
                              label="Locations"
                            />
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700">{jd.experience || "-"}</td>
                          <td className="px-5 min-w-[300px] py-4 text-sm text-gray-700">
                            <ChipsWithPopup
                              items={jd.skills || []}
                              max={3}
                              type="skill"
                              rowId={jd._id}
                              openPopup={openSkillPopup}
                              setOpenPopup={setOpenSkillPopup}
                              label="Skills"
                            />
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <button
                              type="button"
                              onClick={() => !incomingExpired && handleSelectJD(jd)}
                              disabled={incomingExpired}
                              title={incomingExpired ? "Due date passed — cannot select" : "Select"}
                              className={`rounded-full px-5 py-2 text-xs font-semibold transition
                                ${incomingExpired
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-[#5B4CCB] text-white hover:bg-[#4C3FB7]"
                                }`}
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <Pager
              currentPage={incomingCurrentPage}
              totalPages={incomingTotalPages}
              onPageChange={setIncomingCurrentPage}
            />
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">Created Job Descriptions</h2>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={createdSearch}
                  onChange={(e) => {
                    setCreatedSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-[#D8C7FF]"
                />
              </div>
              {/* <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#D8C7FF] bg-white px-3 py-2 text-sm font-medium text-[#5B4CCB] hover:bg-[#F2EEFF] transition"
              >
                <Download className="h-4 w-4" />
                Export
              </button> */}
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-[#E6DAFF] overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <SpinLoader />
                </div>
              ) : (
                <table className="w-full min-w-[980px]">
                  <thead className="bg-[#F3F4F6]">
                    <tr className="text-left text-xs font-semibold text-gray-600">
                      <th className="px-5 py-3">Serial No.</th>
                      <th className="px-5 py-3">Job Title</th>
                      <th className="px-5 py-3">Company Name</th>
                      <th className="px-5 py-3">Created On</th>
                      <th className="px-5 py-3">Due Date</th>
                      <th className="px-5 py-3">Filtered</th>
                      <th className="px-5 py-3">Unfiltered</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {currentData.length > 0 ? (
                      currentData.map((row, index) => {
                        const rowExpired = isExpired(row.dueDate);
                        const isNew = highlightJdId && row._id === highlightJdId;

                        return (
                          <tr key={row._id || index} className="hover:bg-[#FAFAFF]">
                            <td className="px-5 py-4 text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getCreatedSrClass(row)}`}
                                >
                                  {startIndex + index + 1}
                                </span>
                                {isNew && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                    new
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-900">{row.offerId?.jobTitle || "N/A"}</td>
                            <td className="px-5 py-4 text-sm text-gray-700">{row.companyName || row.offerId?.company || "N/A"}</td>
                            <td className="px-5 py-4 text-sm text-gray-700">{formatDate(row.createdAt)}</td>
                            <td className={`px-5 py-4 text-sm ${rowExpired ? "text-red-500" : "text-gray-700"}`}>
                              {formatDate(row.dueDate)}
                            </td>

                            <td className="px-5 py-4 text-sm">
                              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-green-100 px-2 text-xs font-semibold text-green-700">
                                {getFilteredCount(row)}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm">
                              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-red-100 px-2 text-xs font-semibold text-red-700">
                                {getUnfilteredCount(row)}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleShowSummary(row)}
                                  className="h-7 w-7 grid place-items-center rounded-lg bg-[#F2EEFF] text-[#5B4CCB] transition"
                                  aria-label="View JD Summary"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={() =>
                                    !rowExpired &&
                                    navigate("/RecruiterAdmin-Dashboard/NonCandidateList", {
                                      state: { jdId: row._id },
                                    })
                                  }
                                  disabled={rowExpired}
                                  title={rowExpired ? "JD expired" : "Send Invite"}
                                  className={`h-7 w-7 grid place-items-center rounded-lg transition
    ${rowExpired
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-[#F2EEFF] text-[#5B4CCB] hover:bg-[#E6E0FF]"
                                    }`}
                                >
                                  <Share2 className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={() => !rowExpired && handleShareJD(row)}
                                  disabled={rowExpired}
                                  title={rowExpired ? "JD expired" : "Share JD"}
                                  className={`h-7 w-7 grid place-items-center rounded-lg transition
    ${rowExpired
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-[#F2EEFF] text-[#5B4CCB] hover:bg-[#E6E0FF]"
                                    }`}
                                >
                                  <Share className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={() => !rowExpired && handleViewJD(row)}
                                  disabled={rowExpired}
                                  title={rowExpired ? "JD expired" : "View JD"}
                                  className={`h-7 w-7 grid place-items-center rounded-lg transition
    ${rowExpired
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-[#F2EEFF] text-[#5B4CCB] hover:bg-[#E6E0FF]"
                                    }`}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-10 text-center text-sm text-gray-500">
                          {createdSearch.trim() ? "No matching results" : "No JDs found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <Pager currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>

      {showSharePopup && selectedJDForShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowSharePopup(false)}
          ></div>

          <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <button
              onClick={() => setShowSharePopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">
              Share Job Description
            </h3>

            <p className="text-sm text-center text-gray-500 mb-5">
              Copy or share this job across platforms
            </p>

            {/* Copy Link */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border mb-5">
              <input
                value={selectedJDForShare.jdUrl}
                readOnly
                className="flex-1 bg-transparent text-sm outline-none truncate"
              />

              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${copied
                  ? "bg-green-100 text-green-600"
                  : "bg-[#5B4CCB] text-white hover:bg-[#4C3FB7]"
                  }`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Social Buttons */}
            <div className="flex flex-wrap justify-center gap-3">

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

            {/* Close */}
            <button
              onClick={() => setShowSharePopup(false)}
              className="w-full mt-5 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>

  );
}

export default JD;