import React, { useEffect, useState } from 'react';
import { Search, ArrowUpDown, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { baseUrl } from '../../utils/ApiConstants';
import SpinLoader from '../../components/SpinLoader';
import arrow from "../../img/double-arrow.png";

export default function AssignedRecruiters() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const jobsPerPage = 8;
  const pagesPerGroup = 5;

  useEffect(() => {
    const fetchAllOffer = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}/offer/overview`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data.success && response.data.data) {
          const mappedJobs = response.data.data.map((job) => ({
            id: job._id,
            jobId: `#${job._id.slice(-6)}`,
            title: job.jobTitle,
            deadline: new Date(job.dueDate).toLocaleDateString('en-GB'),
            status: job.status,
            assignedTo: job.assignedTo?.name || 'Unassigned',
            fullData: job,
          }));
          setJobs(mappedJobs);
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllOffer();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        const response = await axios.delete(`${baseUrl}/offer/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data.success) {
          setJobs(jobs.filter((job) => job.id !== id));
          alert('Offer deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting offer:', error);
        alert('Failed to delete offer');
      }
    }
  };

  const filteredJobs = [...jobs]
    .reverse()
    .filter((job) => job.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const statusUI = (status) => {
    const normalized = (status || '').toLowerCase();

    if (normalized === 'jd created') {
      return { label: 'JD Created', cls: 'bg-[#E9FFE7] text-[#1A7F2E]' };
    }
    if (normalized === 'jd pending' || normalized === 'pending') {
      return { label: 'Pending', cls: 'bg-[#FFF5E6] text-[#C67A00]' };
    }
    if (normalized === 'expired') {
      return { label: 'Expired', cls: 'bg-red-50 text-red-600' };
    }
    if (normalized === 'open') {
      return { label: 'Open', cls: 'bg-green-50 text-green-700' };
    }
    if (normalized === 'closed') {
      return { label: 'Closed', cls: 'bg-yellow-50 text-yellow-700' };
    }
    return { label: status || '—', cls: 'bg-gray-100 text-gray-700' };
  };

  const currentGroup = Math.floor((currentPage - 1) / pagesPerGroup);
  const groupStart = currentGroup * pagesPerGroup + 1;
  const groupEnd = Math.min(groupStart + pagesPerGroup - 1, totalPages);
  const pageNumbers = [];
  for (let i = groupStart; i <= groupEnd; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SpinLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[16px] font-semibold text-[#111827]">
            JD and recruiters
          </h1>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="h-9 w-[220px] rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#6D5BD0]"
              />
            </div>

            <button
              onClick={() => navigate('/RMGAdmin-Dashboard/RequirementForm')}
              className="h-9 px-4 rounded-md bg-[#6D5BD0] text-white text-sm font-medium hover:bg-[#5B4BC4] transition-colors"
            >
              Create
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#CFC7FF] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full">
              <thead className="bg-[#F5F5FF]">
                <tr className="text-left">
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#374151] w-[120px]">
                    <div className="inline-flex items-center gap-2">
                      Serial No. <img src={arrow} size={14} />
                    </div>
                  </th>

                  <th className="px-6 py-4 text-[13px] font-semibold text-[#374151] w-[280px]">
                    <div className="inline-flex items-center gap-2">
                      Job Title <img src={arrow} size={14} />
                    </div>
                  </th>

                  <th className="px-6 py-4 text-[13px] font-semibold text-[#374151] w-[180px]">
                    <div className="inline-flex items-center gap-2">
                      Dead-line <img src={arrow} size={14} />
                    </div>
                  </th>

                  <th className="px-6 py-4 text-[13px] font-semibold text-[#374151] w-[220px]">
                    Assigned to
                  </th>

                  <th className="px-6 py-4 text-[13px] font-semibold text-[#374151] w-[160px]">
                    Status
                  </th>

                  <th className="px-6 py-4 text-[13px] font-semibold text-[#374151] w-[220px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentJobs.map((job, index) => {
                  const st = statusUI(job.status);
                  return (
                    <tr key={job.id} className="border-t border-gray-100">
                      <td className="px-6 py-4 text-sm text-[#111827]">
                        {startIndex + index + 1}
                      </td>

                      <td className="px-6 py-4 text-sm text-[#111827]">
                        {job.title}
                      </td>

                      <td className="px-6 py-4 text-sm text-[#FF0000]">
                        {job.deadline}
                      </td>

                      <td className="px-6 py-4 text-sm text-[#111827]">
                        {job.assignedTo}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-medium ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              navigate('/RMGAdmin-Dashboard/AssignedRecruiters/SeeHistory', {
                                state: { jdData: job },
                              })
                            }
                            className="h-8 px-4 rounded-full bg-[#6D5BD0] text-white text-xs font-semibold hover:bg-[#5B4BC4] transition-colors"
                          >
                            See History
                          </button>

                          <button
                            onClick={() => handleDelete(job.id)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-transparent text-red-600 bg-red-50 transition-colors"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {currentJobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      No results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-2 py-4 bg-white">
            <button
              type="button"
              onClick={() => {
                if (groupStart > 1) {
                  handlePageChange(groupStart - 1);
                }
              }}
              disabled={groupStart === 1}
              className={`flex justify-center items-center h-8 w-8 rounded-md border text-sm font-medium ${
                groupStart === 1
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-[#CFC7FF] text-[#6D5BD0] hover:bg-[#F3F1FF]'
              }`}
            >
             <ChevronLeft size={16} />
            </button>

            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePageChange(p)}
                className={`h-8 w-8 rounded-md text-sm font-medium border transition-colors ${
                  p === currentPage
                    ? 'bg-[#6D5BD0] border-[#6D5BD0] text-white'
                    : 'bg-white border-[#CFC7FF] text-[#6D5BD0] hover:bg-[#F3F1FF]'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                if (groupEnd < totalPages) {
                  handlePageChange(groupEnd + 1);
                }
              }}
              disabled={groupEnd >= totalPages}
              className={`flex justify-center items-center h-8 w-8 rounded-md border text-sm font-medium ${
                groupEnd >= totalPages
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-[#CFC7FF] text-[#6D5BD0] hover:bg-[#F3F1FF]'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------

// import React, { useEffect, useState } from 'react';
// import { Search, SlidersHorizontal, Edit, Eye, Trash2 } from 'lucide-react';
// import Pagination from '../../components/LandingPage/Pagination';
// import RequirementAddNote from './RequirementAddNote';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { baseUrl } from '../../utils/ApiConstants';
// import SpinLoader from '../../components/SpinLoader';

// export default function AssignedRecruiters() {
//     const navigate = useNavigate();
//     const [searchQuery, setSearchQuery] = useState('');
//     const [currentPage, setCurrentPage] = useState(1);
//     const [jobs, setJobs] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const jobsPerPage = 5;

//     useEffect(() => {
//         const fetchAllOffer = async () => {
//             try {
//                 setLoading(true);
//                 const response = await axios.get(`${baseUrl}/api/offer/overview`, {
//                     headers: {
//                         Authorization: `Bearer ${localStorage.getItem('token')}`,
//                     },
//                 });

//                 if (response.data.success && response.data.data) {

//                     // ✅ SORT BY LATEST DUE DATE FIRST
//                     const sortedData = [...response.data.data].sort(
//                         (a, b) => new Date(b.dueDate) - new Date(a.dueDate)
//                     );

//                     const mappedJobs = sortedData.map((job) => ({
//                         id: job._id,
//                         jobId: `#${job._id.slice(-6)}`,
//                         title: job.jobTitle,
//                         deadline: new Date(job.dueDate).toLocaleDateString('en-GB'),
//                         status: job.status,
//                         assignedTo: job.assignedTo?.name || 'Unassigned',
//                         fullData: job, // 🔒 hidden from UI but available
//                     }));

//                     setJobs(mappedJobs);
//                 }
//             } catch (error) {
//                 console.error('Error fetching offers:', error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchAllOffer();
//     }, []);

//     const handleDelete = async (id) => {
//         if (window.confirm('Are you sure you want to delete this offer?')) {
//             try {
//                 const response = await axios.delete(`${baseUrl}/api/offer/${id}`, {
//                     headers: {
//                         Authorization: `Bearer ${localStorage.getItem('token')}`,
//                     },
//                 });

//                 if (response.data.success) {
//                     setJobs(jobs.filter(job => job.id !== id));
//                     alert('Offer deleted successfully');
//                 }
//             } catch (error) {
//                 console.error('Error deleting offer:', error);
//                 alert('Failed to delete offer');
//             }
//         }
//     };

//     const filteredJobs = jobs.filter((job) =>
//         job.title.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
//     const startIndex = (currentPage - 1) * jobsPerPage;
//     const currentJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

//     const handlePageChange = (page) => {
//         if (page >= 1 && page <= totalPages) {
//             setCurrentPage(page);
//         }
//     };

//     const getStatusColor = (status) => {
//         switch (status) {
//             case 'Closed': return 'bg-yellow-100 text-yellow-700';
//             case 'Open': return 'bg-green-100 text-green-700';
//             case 'Expired': return 'bg-red-100 text-red-700';
//             case 'JD pending': return 'bg-yellow-100 text-yellow-700';
//             case 'JD created': return 'bg-green-100 text-green-700';
//             default: return 'bg-gray-100 text-gray-700';
//         }
//     };

//     if (loading) {
//         return (
//             <div className="min-h-screen flex items-center justify-center">
//                 <SpinLoader />
//             </div>
//         );
//     }

//     return (
//         <div className="min-h-screen">
//             <div className="max-w-7xl mx-auto rounded-2xl border border-gray-300 shadow-lg p-6">

//                 {/* HEADER */}
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
//                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full sm:w-auto">

//                         {/* SEARCH */}
//                         <div className="relative w-[260px] sm:w-[280px]">
//                             <input
//                                 type="text"
//                                 placeholder="Search by Job Title"
//                                 value={searchQuery}
//                                 onChange={(e) => setSearchQuery(e.target.value)}
//                                 className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             />
//                             <button className="absolute right-0 top-0 h-full px-4 bg-black text-white rounded-r-lg hover:bg-gray-800 transition-colors">
//                                 <Search size={18} />
//                             </button>
//                         </div>

//                         {/* STATUS LEGEND */}
//                         <div className="flex items-center gap-4 flex-wrap">
//                             <div className="flex items-center gap-2">
//                                 <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
//                                 <span className="text-sm text-gray-700">Closed</span>
//                             </div>
//                             <div className="flex items-center gap-2">
//                                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
//                                 <span className="text-sm text-gray-700">Open</span>
//                             </div>
//                             <div className="flex items-center gap-2">
//                                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
//                                 <span className="text-sm text-gray-700">Expired</span>
//                             </div>
//                         </div>
//                     </div>

//                     {/* CREATE BUTTON */}
//                     <button
//                         onClick={() => navigate("/RMGAdmin-Dashboard/RequirementForm")}
//                         className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
//                     >
//                         Create
//                     </button>
//                 </div>

//                 {/* TABLE */}
//                 <div className="overflow-x-auto rounded-2xl border border-gray-300 shadow-lg">
//                     <table className="min-w-[900px] w-full border-collapse">
//                         <thead>
//                             <tr className="border-b border-gray-200">
//                                 <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Sl.No</th>
//                                 {/* <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">ID</th> */}
//                                 <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Job Title</th>
//                                 <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Deadline</th>
//                                 <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
//                                 <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Assigned To</th>
//                                 <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Action</th>
//                             </tr>
//                         </thead>

//                         <tbody>
//                             {currentJobs.map((job, index) => (
//                                 <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
//                                     <td className="py-4 px-6 text-sm">{startIndex + index + 1}.</td>
//                                     {/* <td className="py-4 px-6 text-sm">{job.jobId}</td> */}
//                                     <td className="py-4 px-6 text-sm">{job.title}</td>
//                                     <td className="py-4 px-6 text-sm">{job.deadline}</td>
//                                     <td className="py-4 px-6">
//                                         <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(job.status)}`}>
//                                             {job.status}
//                                         </span>
//                                     </td>
//                                     <td className="py-4 px-6 text-sm">{job.assignedTo}</td>
//                                     <td className="py-4 px-6">
//                                         <button
//                                             onClick={() => handleDelete(job.id)}
//                                             className="p-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
//                                         >
//                                             <Trash2 size={16} />
//                                         </button>

//                                         <button
//                                             onClick={() => navigate('/RMGAdmin-Dashboard/SeeHistory', {
//                                                 state: { jdData: job }
//                                             })}
//                                             className="ml-2 px-3 py-1.5 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
//                                         >
//                                             See History
//                                         </button>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>

//                 <Pagination
//                     currentPage={currentPage}
//                     totalPages={totalPages}
//                     onPageChange={handlePageChange}
//                 />
//             </div>
//         </div>
//     );
// }
