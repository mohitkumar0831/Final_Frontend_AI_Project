// import { useState, useEffect, useRef, useMemo } from 'react';
// import { Search, Eye, Trash2, X, FileText } from 'lucide-react';
// import Pagination from '../components/LandingPage/Pagination';
// import ViewResults from './ViewResults';
// import SpinLoader from '../components/SpinLoader';
// import { baseUrl } from '../utils/ApiConstants';
// import { pythonUrl } from '../utils/ApiConstants';
// import { testApi } from './api/tests';
// import playicon from "../img/play.png"

// function Results() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showViewResults, setShowViewResults] = useState(false);
//   const [selectedJob, setSelectedJob] = useState(null);
//   const [attemptsLoading, setAttemptsLoading] = useState(false);
//   const [videoSrc, setVideoSrc] = useState(null);
//   const [videoLoading, setVideoLoading] = useState(false);
//   const [videoError, setVideoError] = useState(null);
//   const [videoType, setVideoType] = useState(null);
//   const videoRef = useRef(null);
//   const [playAttemptId, setPlayAttemptId] = useState(null);
//   const [selectedAttempt, setSelectedAttempt] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [attemptsError, setAttemptsError] = useState(null);
//   const mountedRef = useRef(true);

//   const rowsPerPage = 8;

//   const computeAttemptScore = (attempt) => {
//     try {
//       const rd = attempt && attempt.results_data;
//       if (Array.isArray(rd)) {
//         return rd.reduce((sum, it) => sum + (Number(it && it.score) || 0), 0);
//       } else if (rd && typeof rd === 'number') {
//         return Number(rd) || 0;
//       }
//     } catch (e) {
//       return 0;
//     }
//     return 0;
//   };

//   const formatDate = (val) => {
//     if (!val) return 'N/A';
//     try {
//       const dt = new Date(val);
//       if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
//     } catch (e) {
//       // fallthrough
//     }
//     try {
//       // remove GMT part if present
//       return String(val).split('GMT')[0].trim();
//     } catch (e) {
//       return String(val);
//     }
//   };

//   const [jobs, setJobs] = useState([]);
//   const [hrJDs, setHrJDs] = useState([]);
//   const [hrRaw, setHrRaw] = useState(null);

//   // Fetch recruiter-created JDs and log response on page load
//   const fetchMyJDs = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       const headers = token ? { Authorization: `Bearer ${token}` } : {};
//       const res = await fetch(`${baseUrl}/jd/created-by/hr`, { headers });
//       const text = await res.text();
//       try {
//         const json = JSON.parse(text);
//         console.log('[Results] /api/jd/created-by/hr response:', json);
//         // store HR response for mapping
//         const list = Array.isArray(json) ? json : (json.data || (json.data === undefined ? json : []));
//         setHrJDs(Array.isArray(list) ? list : []);
//         setHrRaw(json);
//       } catch (e) {
//         console.log('[Results] /api/jd/created-by/hr raw response:', text);
//         // fallback: if endpoint returns plain array text
//         try {
//           const parsed = JSON.parse(text);
//           if (Array.isArray(parsed)) setHrJDs(parsed);
//           setHrRaw(parsed);
//         } catch (_) {
//           setHrRaw(text);
//         }
//       }
//     } catch (e) {
//       console.error('[Results] failed to fetch recruiter JDs', e);
//     }
//   };

//   const loadFinalized = async () => {
//     setError(null);
//     setLoading(true);
//     try {
//       const orgId = localStorage.getItem('org_id') || localStorage.getItem('orgId');
//       const headers = {};
//       if (orgId) headers['X-Org-Id'] = orgId;

//       const res = await fetch(`${pythonUrl}/v1/finalise/finalized-tests`, { headers });
//       if (!res.ok) {
//         const txt = await res.text().catch(() => 'Failed');
//         throw new Error(txt || 'Failed loading finalized tests');
//       }
//       const data = await res.json();
//       console.log("[Result] finalized-tests result:", data);

//       const rawArr = Array.isArray(data) ? data : [];
//       const counts = rawArr.reduce((acc, t) => {
//         const key = t.job_id || t.question_set_id || '';
//         acc[key] = (acc[key] || 0) + 1;
//         return acc;
//       }, {});
//       const counters = {};

//       // Pehle basic mapping karo
//       const mapped = rawArr.map((t, idx) => {
//         const key = t.job_id || t.question_set_id || '';
//         counters[key] = (counters[key] || 0) + 1;
//         const groupCount = counts[key] || 0;
//         const baseTitle = t.title || 'Untitled Test';
//         const numberedTitle = groupCount > 1 ? `${baseTitle} - Test ${counters[key]}` : baseTitle;

//         return {
//           id: idx + 1,
//           jobId: t.job_id ? `#${t.job_id}` : `#${(t.question_set_id || '').slice(0, 6)}`,
//           jobTitle: numberedTitle,
//           totalCandidates: 0, // baad me update hoga
//           testDate: formatDate(t.exam_date || t.createdAt),
//           createdAt: formatDate(t.createdAt),
//           raw: t
//         };
//       });

//       // Ab har test ke liye attempts API call karke actual count lo
//       const mappedWithCounts = await Promise.all(
//         mapped.map(async (job) => {
//           try {
//             if (!job.raw || !job.raw.question_set_id) return job;
//             const qsid = encodeURIComponent(job.raw.question_set_id);
//             const orgId = localStorage.getItem('org_id') || localStorage.getItem('orgId');
//             const headers = {};
//             if (orgId) headers['X-Org-Id'] = orgId;

//             const attRes = await fetch(`${pythonUrl}/v1/test/attempts/${qsid}`, { headers });
//             if (!attRes.ok) return job;
//             const attData = await attRes.json();

//             let attemptsArr = [];
//             if (Array.isArray(attData)) {
//               attemptsArr = attData;
//             } else if (attData && Array.isArray(attData.attempts)) {
//               attemptsArr = attData.attempts;
//             }

//             // Unique candidates count karo - use both candidate_id and cid for robustness
//             const uniqueCandidates = new Set(
//               attemptsArr
//                 .map(a => {
//                   const id = a.candidate_id || a.cid;
//                   return id ? String(id) : null;
//                 })
//                 .filter(Boolean)
//             );

//             return {
//               ...job,
//               totalCandidates: uniqueCandidates.size
//             };
//           } catch (e) {
//             console.error('Failed to fetch attempts count for', job.jobTitle, e);
//             return job;
//           }
//         })
//       );

//       console.log('[Results] mapped with actual counts:', mappedWithCounts);
//       const sortedMapped = mappedWithCounts.sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
//       if (mountedRef.current) setJobs(sortedMapped);
//     } catch (e) {
//       console.error('Failed loading finalized tests', e);
//       setError((e && e.message) ? String(e.message) : 'Failed loading finalized tests');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     mountedRef.current = true;
//     loadFinalized();
//     fetchMyJDs();
//     return () => { mountedRef.current = false };
//   }, []);

//   const retryLoad = () => {
//     setError(null);
//     loadFinalized();
//   };

//   const displayedJobs = useMemo(() => {
//     if (!hrJDs || hrJDs.length === 0) return jobs;
//     return jobs.filter((j) => {
//       try {
//         const rawJobId = j.raw?.job_id || j.raw?.jobId || j.jobId || '';
//         const normalized = String(rawJobId).replace(/^#/, '');
//         return hrJDs.some((h) => String(h._id) === normalized || String(h._id) === String(j.raw?.job_id));
//       } catch (e) {
//         return false;
//       }
//     });
//   }, [jobs, hrJDs]);

//   const filteredJobs = displayedJobs.filter((job) =>
//     (job.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const totalPages = Math.max(1, Math.ceil(filteredJobs.length / rowsPerPage));
//   const indexOfLastRow = currentPage * rowsPerPage;
//   const indexOfFirstRow = indexOfLastRow - rowsPerPage;
//   const currentRows = filteredJobs.slice(indexOfFirstRow, indexOfLastRow);

//   const handlePageChange = (page) => {
//     if (page >= 1 && page <= totalPages) {
//       setCurrentPage(page);
//     }
//   };

//   const handleViewResults = (job) => {
//     // fetch attempts for this test and candidate details
//     (async () => {
//       if (!job || !job.raw || !job.raw.question_set_id) return;
//       setAttemptsLoading(true);
//       setAttemptsError(null);
//       try {
//         const qsid = encodeURIComponent(job.raw.question_set_id);
//         const orgId = localStorage.getItem('org_id') || localStorage.getItem('orgId');
//         const headers = {};
//         if (orgId) headers['X-Org-Id'] = orgId;

//         const res = await fetch(`${pythonUrl}/v1/test/attempts/${qsid}`, { headers });
//         if (!res.ok) {
//           const txt = await res.text().catch(() => 'Failed');
//           console.error('Failed to load attempts', txt);
//           setAttemptsError(txt || 'Failed to load attempts');
//           setAttemptsLoading(false);
//           return;
//         }
//         const attempts = await res.json();

//         // Normalize response: backend may return an array, an object {attempts: [...]},
//         // or a message when no data exists. Treat 'no data' as empty attempts.
//         let attemptsArr = [];
//         if (Array.isArray(attempts)) {
//           attemptsArr = attempts;
//         } else if (attempts && Array.isArray(attempts.attempts)) {
//           attemptsArr = attempts.attempts;
//         } else if (attempts && attempts.message) {
//           // No data for this test — show empty attempts modal
//           setSelectedJob({ ...job, attempts: [], rawAttempts: [] });
//           setShowViewResults(true);
//           setAttemptsLoading(false);
//           return;
//         }

//         // enrich each attempt with candidate info from public candidate API
//         const enriched = await Promise.all((attemptsArr || []).map(async (a) => {
//           let candidate = null;
//           const identifier = a.cid || a.candidate_id;
//           if (identifier) {
//             try {
//               const r2 = await fetch(`${baseUrl}/candidate/public/${encodeURIComponent(identifier)}`);
//               if (r2.ok) {
//                 const cdata = await r2.json();
//                 // API may return { success: true, candidate: { ... } } or the candidate object directly
//                 candidate = (cdata && cdata.candidate) ? cdata.candidate : cdata;
//               }
//             } catch (e) {
//               // ignore
//             }
//           }
//           return { ...a, candidate };
//         }));

//         // debug logs: show what we received and enriched
//         console.log('Results.jsx: raw attemptsArr=', attemptsArr);
//         console.log('Results.jsx: enriched attempts=', enriched);

//         // Aggregate by candidate_id: sum scores and cheating counts into a single row per candidate
//         const aggMap = {};
//         const computeAttemptScore = (attempt) => {
//           try {
//             const rd = attempt.results_data;
//             if (Array.isArray(rd)) {
//               return rd.reduce((sum, it) => sum + (Number(it && it.score) || 0), 0);
//             } else if (rd && typeof rd === 'number') {
//               return Number(rd) || 0;
//             }
//           } catch (e) {
//             return 0;
//           }
//           return 0;
//         };

//         for (const a of enriched) {
//           const cidValue = a.cid || a.candidate_id || (a.candidate && (a.candidate.id || a.candidate.candidate_id)) || 'unknown';
//           const key = String(cidValue);
//           const score = computeAttemptScore(a);
//           const ts = a.created_at ? new Date(String(a.created_at)) : null;
//           if (!aggMap[key]) {
//             aggMap[key] = {
//               candidate_id: key,
//               candidate: a.candidate || null,
//               totalScore: score,
//               tab_switches: Number(a.tab_switches) || 0,
//               inactivities: Number(a.inactivities) || 0,
//               face_not_visible: Number(a.face_not_visible) || 0,
//               multiple_faces: Number(a.multiple_faces) || 0,
//               attempts_count: 1,
//               created_at: ts,
//               // keep a representative recording/audio URL and raw qa_data for viewing
//               video_url: a.video_url || a.video || a.videoUrl || null,
//               audio_url: a.audio_url || a.audio || a.audioUrl || null,
//               qa_data: a.qa_data || a.qaData || null,
//             };
//           } else {
//             aggMap[key].totalScore += score;
//             aggMap[key].tab_switches += Number(a.tab_switches) || 0;
//             aggMap[key].inactivities += Number(a.inactivities) || 0;
//             aggMap[key].face_not_visible += Number(a.face_not_visible) || 0;
//             aggMap[key].multiple_faces += Number(a.multiple_faces) || 0;
//             aggMap[key].attempts_count += 1;
//             // keep latest submitted time
//             if (ts && (!aggMap[key].created_at || ts > aggMap[key].created_at)) aggMap[key].created_at = ts;
//             // prefer populated candidate object
//             if (!aggMap[key].candidate && a.candidate) aggMap[key].candidate = a.candidate;
//             // prefer newer recording/audio if this attempt is newer
//             const existingTs = aggMap[key].created_at;
//             if (ts && (!existingTs || ts >= existingTs)) {
//               aggMap[key].video_url = a.video_url || a.video || a.videoUrl || aggMap[key].video_url;
//               aggMap[key].audio_url = a.audio_url || a.audio || a.audioUrl || aggMap[key].audio_url;
//               aggMap[key].qa_data = a.qa_data || a.qaData || aggMap[key].qa_data;
//             }
//           }
//         }

//         const aggregated = Object.values(aggMap).map((v) => ({
//           ...v,
//           // format created_at back to ISO/string for display code
//           created_at: v.created_at ? v.created_at.toISOString() : null,
//         }));

//         setSelectedJob({ ...job, attempts: aggregated, rawAttempts: enriched });
//         setShowViewResults(true);
//       } catch (e) {
//         console.error('Error loading attempts', e);
//         setAttemptsError((e && e.message) ? String(e.message) : 'Error loading attempts');
//       } finally {
//         setAttemptsLoading(false);
//       }
//     })();
//   };

//   // Try to resolve a relative or partial media path to a working absolute URL by probing common prefixes.
//   const resolveMediaUrl = async (raw) => {
//     if (!raw) return null;
//     const s = String(raw).trim();
//     if (!s) return null;
//     // if already absolute, return as-is
//     if (/^https?:\/\//i.test(s)) return s;

//     const prefixes = [
//       baseUrl.replace(/\/$/, ''),
//       pythonUrl.replace(/\/$/, ''),
//       window.location.origin.replace(/\/$/, ''),
//       // also try removing '/api' if present in baseUrl
//       baseUrl.replace(/\/api\/?$/, ''),
//     ];

//     for (const p of prefixes) {
//       try {
//         const candidate = `${p}${s.startsWith('/') ? '' : '/'}${s}`;
//         // First try HEAD to avoid downloading full file
//         const headResp = await fetch(candidate, { method: 'HEAD' });
//         if (headResp && headResp.ok) return candidate;
//         // fallback: try GET for servers that don't support HEAD but allow byte ranges
//         const getResp = await fetch(candidate, { method: 'GET', headers: { Range: 'bytes=0-0' } });
//         if (getResp && (getResp.ok || getResp.status === 206)) return candidate;
//       } catch (e) {
//         // ignore and try next prefix
//       }
//     }

//     // last resort: return original raw as relative (browser may still resolve if served)
//     return s;
//   };

//   // Lightweight endpoint-backed video player that queries the server for a full URL.
//   const VideoPlayer = ({ attemptId }) => {
//     const [url, setUrl] = useState(null);
//     const [loadingUrl, setLoadingUrl] = useState(false);
//     useEffect(() => {
//       let mounted = true;
//       if (!attemptId) {
//         setUrl(null);
//         return () => { mounted = false; };
//       }
//       const orgId = localStorage.getItem('org_id') || localStorage.getItem('orgId');
//       testApi.getVideoUrl(attemptId, orgId)
//         .then((j) => {
//           if (!mounted) return;
//           const v = j && (j.video_url || j.videoUrl || j.url || (j.data && j.data.video_url));
//           setUrl(v || null);
//         })
//         .catch((e) => {
//           console.error('VideoPlayer getVideoUrl failed', e);
//           if (mounted) setUrl(null);
//         })
//         .finally(() => { if (mounted) setLoadingUrl(false); });
//       return () => { mounted = false; };
//     }, [attemptId]);

//     if (loadingUrl) return <div className="text-white p-4">Loading video...</div>;
//     if (!url) return <div className="text-white p-4">No video available</div>;
//     return (
//       <video controls autoPlay muted playsInline style={{ maxWidth: '100%' }}>
//         <source src={url} />
//         Your browser does not support the video tag.
//       </video>
//     );
//   };

//   const handleDelete = async (job) => {
//     if (!job || !job.raw || !job.raw.question_set_id) return;
//     const ok = window.confirm(`Delete test "${job.jobTitle}"? This cannot be undone.`);
//     if (!ok) return;
//     try {
//       const qsid = encodeURIComponent(job.raw.question_set_id);
//       const orgId = localStorage.getItem('org_id') || localStorage.getItem('orgId');
//       const headers = { 'Content-Type': 'application/json' };
//       if (orgId) headers['X-Org-Id'] = orgId;

//       const res = await fetch(`${pythonUrl}/v1/finalise/finalized-test/${qsid}`, { 
//         method: 'DELETE',
//         headers
//       });
//       if (!res.ok) {
//         const txt = await res.text();
//         alert('Delete failed: ' + txt);
//         return;
//       }
//       // remove from UI
//       setJobs(prev => prev.filter(j => j.id !== job.id));
//     } catch (e) {
//       console.error('Delete failed', e);
//       alert('Delete failed');
//     }
//   };

//   const closeModal = () => {
//     setShowViewResults(false);
//     setSelectedJob(null);
//   };

//   return (
//     <div className="min-h-screen">
//       <div className={`${(loading || attemptsLoading) ? 'filter blur-sm pointer-events-none' : ''} max-w-[1100px] mx-auto`}>

//         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5">

//           <div>
//             <h1 className="text-[28px] font-semibold text-[#1f1f1f]">Assessment Details</h1>
//           </div>

//           {/* <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1">
//             <div className="bg-blue-100 rounded-2xl p-6 sm:p-8 shadow-sm flex-1">
//               <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Total Jobs</h2>
//               <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600">{jobs.length}</p>
//             </div>

//             <div className="bg-green-100 rounded-2xl p-6 sm:p-8 shadow-sm flex-1">
//               <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Total Candidates</h2>
//               <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600">
//                 {jobs.reduce((sum, j) => sum + j.totalCandidates, 0)}
//               </p>
//             </div>
//           </div> */}

//           <div className="flex items-end">
//             <div className="relative w-full sm:w-[260px]">
//               <input
//                 type="text"
//                 placeholder="Search"
//                 value={searchQuery}
//                 onChange={(e) => {
//                   setSearchQuery(e.target.value);
//                   setCurrentPage(1);
//                 }}
//                 className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#d7d7df] bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7b61ff] focus:border-transparent"
//               />
//               <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//               <button className="hidden absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
//                 <Search size={20} />
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-[18px] border border-[#d7c9ff] shadow-sm overflow-hidden">
//           <div className="overflow-x-auto">

//             <table className="w-full min-w-[900px]">

//               <thead className="bg-[#f3f0fb]">
//                 <tr>
//                   <th className="px-5 py-4 text-left text-[15px] font-semibold text-[#222]">Serial No.</th>
//                   <th className="px-5 py-4 text-left text-[15px] font-semibold text-[#222]">Assessment Name</th>
//                   <th className="px-5 py-4 text-left text-[15px] font-semibold text-[#222]">Created On</th>
//                   <th className="px-5 py-4 text-left text-[15px] font-semibold text-[#222]">Test Date</th>
//                   <th className="px-5 py-4 text-center text-[15px] font-semibold text-[#222]">Candidate Numbers</th>
//                   <th className="px-5 py-4 text-center text-[15px] font-semibold text-[#222]">Actions</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {currentRows.length > 0 ? (
//                   currentRows.map((job, index) => (
//                     <tr key={job.id} className="hover:bg-[#faf9ff] transition-colors border-b border-[#ededf3] last:border-b-0">
//                       <td className="px-5 py-5 text-sm text-gray-700">
//                         {(indexOfFirstRow + index + 1)}
//                       </td>

//                       <td className="px-5 py-5 text-sm text-gray-800">{job.jobTitle}</td>

//                       {/* <td className="px-4 py-4 border-b border-gray-300">
//                         <span className="inline-flex items-center justify-center min-w-[60px] px-3 py-1 bg-green-200 text-green-800 text-sm font-medium rounded-full">
//                           {job.totalCandidates}
//                         </span>
//                       </td> */}

//                       <td className="px-5 py-5 text-sm text-gray-700">
//                         {job.createdAt || 'N/A'}
//                       </td>

//                       <td className="px-5 py-5 text-sm font-semibold text-[#6c5ce7]">
//                         {job.testDate || 'N/A'}
//                       </td>

//                       <td className="px-5 py-5 text-center">
//                         <span className="inline-flex items-center justify-center min-w-[52px] px-4 py-1 bg-[#eef4ff] text-[#2f80ed] text-sm font-semibold rounded-full">
//                           {job.totalCandidates}
//                         </span>
//                       </td>

//                       <td className="px-5 py-5">
//                         <div className="flex items-center justify-center gap-2">
//                           <button
//                             onClick={() => handleViewResults(job)}
//                             className="px-2 py-2 flex items-center justify-center text-[#6c5ce7] bg-[#f3efff] rounded-lg hover:bg-[#ebe4ff] transition-colors"
//                             aria-label="View job"
//                           >
//                             <Eye size={16} />
//                           </button>
//                           {/* <button
//                             onClick={() => handleDelete(job)}
//                             className="p-2 text-red-500 border border-red-500 rounded hover:bg-red-50 transition-colors"
//                             aria-label="Delete job"
//                           >
//                             <Trash2 size={16} />
//                           </button> */}
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="6" className="text-center py-10 text-gray-500">
//                       No jobs found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>

//           </div>
//         </div>

//         <div className="pb-5">
//           <Pagination
//             currentPage={currentPage}
//             totalPages={totalPages}
//             onPageChange={handlePageChange}
//           />
//         </div>
//         {/* {hrRaw && (
//           <div className="mt-4 bg-white p-4 rounded shadow">
//             <h4 className="font-semibold mb-2">HR /api/jd/created-by/hr response</h4>
//             <pre className="text-xs overflow-auto max-h-64">{typeof hrRaw === 'string' ? hrRaw : JSON.stringify(hrRaw, null, 2)}</pre>
//           </div>
//         )} */}
//       </div>
//       {/* Loading overlay for initial load */}
//       {loading && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
//           <div className="bg-white/90 rounded-lg p-6 flex flex-col items-center gap-3">
//             <SpinLoader />
//             <div className="text-sm text-gray-700">Loading tests...</div>
//           </div>
//         </div>
//       )}

//       {/* Error fallback for initial load */}
//       {error && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 p-4">
//           <div className="max-w-lg w-full bg-white rounded-lg p-6 shadow">
//             <h3 className="text-lg font-semibold mb-2">Failed to load tests</h3>
//             <p className="text-sm text-gray-600 mb-4">{String(error)}</p>
//             <div className="flex gap-2">
//               <button onClick={retryLoad} className="px-3 py-2 bg-blue-600 text-white rounded">Retry</button>
//               <button onClick={() => setError(null)} className="px-3 py-2 bg-gray-100 rounded">Dismiss</button>
//             </div>
//           </div>
//         </div>
//       )}


//      {showViewResults && selectedJob && (
//   <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
//     <div className="bg-white rounded-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] max-w-[990px] w-full max-h-[80vh] overflow-hidden border border-[#ece7ff]">
//       <div className="flex items-center justify-between px-8 py-5 border-b border-[#f0ecff] bg-white">
//         <h3 className="text-[18px] font-semibold text-[#1f1f1f]">
//           {selectedJob.jobTitle}
//         </h3>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={closeModal}
//             className="hidden px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
//           >
//             Close
//           </button>
//           <button
//             onClick={closeModal}
//             aria-label="Close"
//             className="w-9 h-9 flex items-center justify-center rounded-full text-[#111] hover:bg-[#f5f5f8] transition-colors"
//           >
//             <X size={20} strokeWidth={2.2} />
//           </button>
//         </div>
//       </div>

//       <div className="p-0">
//         {attemptsLoading ? (
//           <div className="flex items-center justify-center gap-3 py-10">
//             <SpinLoader />
//             <span className="text-sm text-gray-700">Loading attempts...</span>
//           </div>
//         ) : attemptsError ? (
//           <div className="p-6 text-center text-sm text-red-600">
//             <div className="mb-3">{String(attemptsError)}</div>
//             <div className="flex items-center justify-center gap-2">
//               <button
//                 onClick={() => handleViewResults(selectedJob)}
//                 className="px-3 py-2 bg-blue-600 text-white rounded"
//               >
//                 Retry
//               </button>
//               <button
//                 onClick={() => setAttemptsError(null)}
//                 className="px-3 py-2 bg-gray-100 rounded"
//               >
//                 Dismiss
//               </button>
//             </div>
//           </div>
//         ) : (
//           <div className="overflow-auto">
//             <table className="w-full min-w-[920px] text-sm">
//               <thead className="bg-[#F5F5FF]">
//                 <tr>
//                   <th className="px-8 py-5 text-left text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
//                     Serial No.
//                   </th>
//                   <th className="px-6 py-5 text-left text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
//                     Candidate Name
//                   </th>
//                   <th className="px-6 py-5 text-left text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
//                     Email ID
//                   </th>
//                   <th className="px-6 py-5 text-left text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
//                     Score
//                   </th>
//                   <th className="px-6 py-5 text-center text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
//                     Tab Switches
//                   </th>
//                   <th className="px-6 py-5 text-center text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
//                     In-Activities
//                   </th>
//                     <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
//                       Face Not Visible
//                     </th>
//                     <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
//                       Multi Face Detection
//                     </th>
//                   <th className="px-6 py-5 text-center text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
//                     Video
//                   </th>
//                   {/* <th className="px-6 py-5 text-center text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
//                     Report
//                   </th> */}
//                   {/* <th className="px-6 py-5 text-center text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
//                     Report
//                   </th> */}
//                 </tr>
//               </thead>

//               <tbody>
//                 {(selectedJob.attempts || []).length === 0 ? (
//                   <tr>
//                     <td colSpan="8" className="py-8 text-center text-gray-500">
//                       No attempts found.
//                     </td>
//                   </tr>
//                 ) : (
//                   selectedJob.attempts.map((a, i) => {
//                     let score = '';
//                     try {
//                       if (a && Number.isFinite(a.totalScore)) {
//                         score = a.totalScore.toFixed ? a.totalScore.toFixed(2) : String(a.totalScore);
//                       } else {
//                         const rd = a.results_data;
//                         if (Array.isArray(rd)) {
//                           const s = rd.reduce((sum, it) => sum + (Number(it && it.score) || 0), 0);
//                           score = Number.isFinite(s) ? s.toFixed(2) : '';
//                         } else if (rd && typeof rd === 'number') {
//                           score = rd.toFixed ? rd.toFixed(2) : String(rd);
//                         }
//                       }
//                     } catch (e) {
//                       score = '';
//                     }

//                     const cand = a.candidate || {};
//                     console.log('Results.jsx: rendering attempt', { attempt: a, candidate: cand });
//                     const name =
//                       cand.name ||
//                       `${cand.firstName || ''} ${cand.lastName || ''}`.trim() ||
//                       cand.fullName ||
//                       cand.username ||
//                       a.candidate_id ||
//                       'N/A';
//                     const email =
//                       cand.email ||
//                       cand.emailAddress ||
//                       cand.contact_email ||
//                       cand.username ||
//                       'N/A';
//                     const cid = a.candidate_id || a.candidate?.id || a.candidate_id || 'unknown';
//                     let displayScore = score;

//                     return (
//                       <>
//                         <tr
//                           key={a.candidate_id || i}
//                           className="border-b border-[#efeff4] last:border-b-0"
//                         >
//                           <td className="px-8 py-5 text-[15px] font-medium text-[#1f1f1f]">
//                             {i + 1}
//                           </td>

//                           <td className="px-6 py-5 text-[15px] text-[#1f1f1f] whitespace-nowrap">
//                             {name}
//                           </td>

//                           <td className="px-6 py-5 text-[15px] text-[#1f1f1f] whitespace-nowrap">
//                             {email}
//                           </td>

//                           <td className="px-6 py-5">
//                             <div className="flex items-center gap-3">
//                               {(() => {
//                                 const scoreNum = parseFloat(displayScore) || 0;
//                                 const maxScore = 100;
//                                 const percentage = Math.min((scoreNum / maxScore) * 100, 100);
//                                 const isLow = percentage < 35;
//                                 const strokeColor = isLow ? '#ef4444' : '#6c5ce7';
//                                 const trackColor = isLow ? '#fecaca' : '#e8defd';
//                                 const radius = 9;
//                                 const circumference = 2 * Math.PI * radius;
//                                 const dashOffset = circumference - (percentage / 100) * circumference;

//                                 return (
//                                   <>
//                                     <span
//                                       className="text-[15px] leading-none font-semibold"
//                                       style={{ color: strokeColor }}
//                                     >
//                                       {displayScore}
//                                     </span>
//                                     <svg width="24" height="24" viewBox="0 0 24 24">
//                                       <circle
//                                         cx="12"
//                                         cy="12"
//                                         r={radius}
//                                         fill="none"
//                                         stroke={trackColor}
//                                         strokeWidth="3"
//                                       />
//                                       <circle
//                                         cx="12"
//                                         cy="12"
//                                         r={radius}
//                                         fill="none"
//                                         stroke={strokeColor}
//                                         strokeWidth="3"
//                                         strokeLinecap="round"
//                                         strokeDasharray={circumference}
//                                         strokeDashoffset={dashOffset}
//                                         transform="rotate(-90 12 12)"
//                                         style={{ transition: 'stroke-dashoffset 0.5s ease' }}
//                                       />
//                                     </svg>
//                                   </>
//                                 );
//                               })()}
//                             </div>
//                           </td>

//                           <td className="px-6 py-5 text-center">
//                             <span className="text-[15px] font-medium text-[#ff5c7a]">
//                               {a.tab_switches ?? 0}
//                             </span>
//                           </td>

//                           <td className="px-6 py-5 text-center">
//                             <span className="text-[15px] font-medium text-[#5b5eff]">
//                               {a.inactivities ?? 0}
//                             </span>
//                           </td>

//                           <td className="px-6 py-5 text-center">
//                             <span className="text-[15px] font-medium text-orange-500">
//                               {a.face_not_visible ?? 0}
//                             </span>
//                           </td>
//                           <td className="px-6 py-5 text-center">
//                             <span className="text-[15px] font-medium text-[#ff4f6d]">
//                               {a.multiple_faces ?? 0}
//                             </span>
//                           </td>

//                           <td className="px-6 py-5 text-center">
//                             {a.video_url ? (
//                               <button
//                                 onClick={() => {
//                                   try {
//                                     const cid =
//                                       a.candidate_id ||
//                                       a.candidate?.id ||
//                                       a.candidate?._id ||
//                                       a.candidate?.candidate_id ||
//                                       String(i);
//                                     setPlayAttemptId(cid || String(i));
//                                   } catch (e) {
//                                     console.error('Play click failed', e);
//                                   }
//                                 }}
//                                 className="inline-flex items-center justify-center gap-2 px-5 py-1.5 bg-gradient-to-r from-[#644CB6] to-[#9273F3] text-white text-[14px] font-medium rounded-full hover:bg-[#6b52ca] transition-colors"
//                               >
//                                 <img src={playicon} alt="Video" className="" />
//                                 Play
//                               </button>
//                             ) : (
//                               <span className="text-sm text-gray-400">N/A</span>
//                             )}
//                           </td>
                          
//                           {/* <td className="px-6 py-5 text-center">
//                             <button
//                               onClick={() => setSelectedAttempt(a)}
//                               className="inline-flex items-center justify-center gap-2 px-5 py-1.5 bg-[#f3f0fb] text-[#6c5ce7] text-[14px] font-medium rounded-full hover:bg-[#ebe7ff] transition-colors"
//                             >
//                               <FileText size={16} />
//                               Report
//                             </button>
//                           </td> */}
                          
//                           {/* <td className="px-6 py-5 text-center">
//                             <button
//                               onClick={() => setSelectedAttempt(a)}
//                               className="inline-flex items-center justify-center gap-2 px-5 py-1.5 bg-[#f3f0fb] text-[#6c5ce7] text-[14px] font-medium rounded-full hover:bg-[#ebe7ff] transition-colors"
//                             >
//                               <FileText size={16} />
//                               Report
//                             </button>
//                           </td> */}
//                         </tr>
//                       </>
//                     );
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   </div>
// )}
//       {/* Video overlay */}
//       {videoSrc && (
//         <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
//           <div className="bg-black rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
//             <button
//               onClick={() => {
//                 try { if (videoSrc && videoSrc.startsWith('blob:')) URL.revokeObjectURL(videoSrc); } catch(_){}
//                 setVideoSrc(null); setVideoError(null);
//               }}
//               className="absolute right-2 top-2 bg-white/90 text-black rounded px-2 py-1 z-50"
//             >
//               Close
//             </button>
//             {videoLoading ? (
//               <div className="w-full h-64 flex items-center justify-center text-white">Loading video...</div>
//             ) : videoError ? (
//               <div className="w-full p-6 text-white">
//                 <div className="mb-3">Failed to load video: {videoError}</div>
//                 <div className="flex gap-2">
//                   <a href={videoSrc} target="_blank" rel="noreferrer" className="px-3 py-2 bg-white text-black rounded">Open in new tab</a>
//                   <button onClick={() => { try { if (videoSrc && videoSrc.startsWith('blob:')) URL.revokeObjectURL(videoSrc); } catch(_){}; setVideoSrc(null); setVideoError(null); }} className="px-3 py-2 bg-gray-200 rounded">Close</button>
//                 </div>
//               </div>
//             ) : (
//               <video key={videoSrc} controls autoPlay playsInline crossOrigin="anonymous" className="w-full h-full bg-black" src={videoSrc}>
//                 Your browser does not support the video tag.
//               </video>
//             )}
//           </div>
//         </div>
//       )}
//       {playAttemptId && (
//         <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
//           <div className="bg-black rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden relative p-4">
//             <button
//               onClick={() => setPlayAttemptId(null)}
//               className="absolute right-2 top-2 bg-white/90 text-black rounded px-2 py-1 z-50"
//             >
//               Close
//             </button>
//             <div className="text-white mb-2">Playing attempt: {String(playAttemptId)}</div>
//             <VideoPlayer attemptId={playAttemptId} />
//           </div>
//         </div>
//       )}

//       {/* {selectedAttempt && (
//         <ViewResults
//           jobData={selectedJob}
//           attempt={selectedAttempt}
//           onClose={() => setSelectedAttempt(null)}
//         />
//       )} */}

//       {selectedAttempt && (
//         <ViewResults
//           jobData={selectedJob}
//           attempt={selectedAttempt}
//           onClose={() => setSelectedAttempt(null)}
//         />
//       )}
//     </div>
//   );
// }

// export default Results;
import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Eye, Trash2, X, FileText } from 'lucide-react';
import Pagination from '../components/LandingPage/Pagination';
import ViewResults from './ViewResults';
import SpinLoader from '../components/SpinLoader';
import { baseUrl } from '../utils/ApiConstants';
import { pythonUrl } from '../utils/ApiConstants';
import { testApi } from './api/tests';
import playicon from "../img/play.png"

function Results() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showViewResults, setShowViewResults] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [videoType, setVideoType] = useState(null);
  const videoRef = useRef(null);
  const [playAttemptId, setPlayAttemptId] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attemptsError, setAttemptsError] = useState(null);
  const mountedRef = useRef(true);

  const rowsPerPage = 8;

  const computeAttemptScore = (attempt) => {
    try {
      const rd = attempt && attempt.results_data;
      if (Array.isArray(rd)) {
        return rd.reduce((sum, it) => sum + (Number(it && it.score) || 0), 0);
      } else if (rd && typeof rd === 'number') {
        return Number(rd) || 0;
      }
    } catch (e) {
      return 0;
    }
    return 0;
  };

  const formatDate = (val) => {
    if (!val) return 'N/A';
    try {
      const dt = new Date(val);
      if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
    } catch (e) {
      // fallthrough
    }
    try {
      // remove GMT part if present
      return String(val).split('GMT')[0].trim();
    } catch (e) {
      return String(val);
    }
  };

  const [jobs, setJobs] = useState([]);
  const [hrJDs, setHrJDs] = useState([]);
  const [hrRaw, setHrRaw] = useState(null);

  // Fetch recruiter-created JDs and log response on page load
  const fetchMyJDs = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${baseUrl}/jd/created-by/hr`, { headers });
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        console.log('[Results] /api/jd/created-by/hr response:', json);
        // store HR response for mapping
        const list = Array.isArray(json) ? json : (json.data || (json.data === undefined ? json : []));
        setHrJDs(Array.isArray(list) ? list : []);
        setHrRaw(json);
      } catch (e) {
        console.log('[Results] /api/jd/created-by/hr raw response:', text);
        // fallback: if endpoint returns plain array text
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) setHrJDs(parsed);
          setHrRaw(parsed);
        } catch (_) {
          setHrRaw(text);
        }
      }
    } catch (e) {
      console.error('[Results] failed to fetch recruiter JDs', e);
    }
  };

  const loadFinalized = async () => {
    setError(null);
    setLoading(true);
    try {
      const orgId = localStorage.getItem('org_id') || localStorage.getItem('orgId');
      const headers = {};
      if (orgId) headers['X-Org-Id'] = orgId;

      const res = await fetch(`${pythonUrl}/v1/finalise/finalized-tests`, { headers });
      if (!res.ok) {
        const txt = await res.text().catch(() => 'Failed');
        throw new Error(txt || 'Failed loading finalized tests');
      }
      const data = await res.json();
      console.log("[Result] finalized-tests result:", data);

      const rawArr = Array.isArray(data) ? data : [];
      const counts = rawArr.reduce((acc, t) => {
        const key = t.job_id || t.question_set_id || '';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      const counters = {};

      // Pehle basic mapping karo
      const mapped = rawArr.map((t, idx) => {
        const key = t.job_id || t.question_set_id || '';
        counters[key] = (counters[key] || 0) + 1;
        const groupCount = counts[key] || 0;
        const baseTitle = t.title || 'Untitled Test';
        const numberedTitle = groupCount > 1 ? `${baseTitle} - Test ${counters[key]}` : baseTitle;

        return {
          id: idx + 1,
          jobId: t.job_id ? `#${t.job_id}` : `#${(t.question_set_id || '').slice(0, 6)}`,
          jobTitle: numberedTitle,
          totalCandidates: 0, // baad me update hoga
          testDate: formatDate(t.exam_date || t.createdAt),
          createdAt: formatDate(t.createdAt),
          raw: t
        };
      });

      // Ab har test ke liye attempts API call karke actual count lo
      const mappedWithCounts = await Promise.all(
        mapped.map(async (job) => {
          try {
            if (!job.raw || !job.raw.question_set_id) return job;
            const qsid = encodeURIComponent(job.raw.question_set_id);
            const orgId = localStorage.getItem('org_id') || localStorage.getItem('orgId');
            const headers = {};
            if (orgId) headers['X-Org-Id'] = orgId;

            const attRes = await fetch(`${pythonUrl}/v1/test/attempts/${qsid}`, { headers });
            if (!attRes.ok) return job;
            const attData = await attRes.json();

            let attemptsArr = [];
            if (Array.isArray(attData)) {
              attemptsArr = attData;
            } else if (attData && Array.isArray(attData.attempts)) {
              attemptsArr = attData.attempts;
            }

            // Unique candidates count karo - use both candidate_id and cid for robustness
            const uniqueCandidates = new Set(
              attemptsArr
                .map(a => {
                  const id = a.candidate_id || a.cid;
                  return id ? String(id) : null;
                })
                .filter(Boolean)
            );

            return {
              ...job,
              totalCandidates: uniqueCandidates.size
            };
          } catch (e) {
            console.error('Failed to fetch attempts count for', job.jobTitle, e);
            return job;
          }
        })
      );

      console.log('[Results] mapped with actual counts:', mappedWithCounts);
      const sortedMapped = mappedWithCounts.sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
      if (mountedRef.current) setJobs(sortedMapped);
    } catch (e) {
      console.error('Failed loading finalized tests', e);
      setError((e && e.message) ? String(e.message) : 'Failed loading finalized tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    loadFinalized();
    fetchMyJDs();
    return () => { mountedRef.current = false };
  }, []);

  const retryLoad = () => {
    setError(null);
    loadFinalized();
  };

  const displayedJobs = useMemo(() => {
    if (!hrJDs || hrJDs.length === 0) return jobs;
    return jobs.filter((j) => {
      try {
        const rawJobId = j.raw?.job_id || j.raw?.jobId || j.jobId || '';
        const normalized = String(rawJobId).replace(/^#/, '');
        return hrJDs.some((h) => String(h._id) === normalized || String(h._id) === String(j.raw?.job_id));
      } catch (e) {
        return false;
      }
    });
  }, [jobs, hrJDs]);

  const filteredJobs = displayedJobs.filter((job) =>
    (job.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / rowsPerPage));
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredJobs.slice(indexOfFirstRow, indexOfLastRow);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleViewResults = (job) => {
    // fetch attempts for this test and candidate details
    (async () => {
      if (!job || !job.raw || !job.raw.question_set_id) return;
      setAttemptsLoading(true);
      setAttemptsError(null);
      try {
        const qsid = encodeURIComponent(job.raw.question_set_id);
        const orgId = localStorage.getItem('org_id') || localStorage.getItem('orgId');
        const headers = {};
        if (orgId) headers['X-Org-Id'] = orgId;

        const res = await fetch(`${pythonUrl}/v1/test/attempts/${qsid}`, { headers });
        if (!res.ok) {
          const txt = await res.text().catch(() => 'Failed');
          console.error('Failed to load attempts', txt);
          setAttemptsError(txt || 'Failed to load attempts');
          setAttemptsLoading(false);
          return;
        }
        const attempts = await res.json();

        // Normalize response: backend may return an array, an object {attempts: [...]},
        // or a message when no data exists. Treat 'no data' as empty attempts.
        let attemptsArr = [];
        if (Array.isArray(attempts)) {
          attemptsArr = attempts;
        } else if (attempts && Array.isArray(attempts.attempts)) {
          attemptsArr = attempts.attempts;
        } else if (attempts && attempts.message) {
          // No data for this test — show empty attempts modal
          setSelectedJob({ ...job, attempts: [], rawAttempts: [] });
          setShowViewResults(true);
          setAttemptsLoading(false);
          return;
        }

        // enrich each attempt with candidate info from public candidate API
        const enriched = await Promise.all((attemptsArr || []).map(async (a) => {
          let candidate = null;
          const identifier = a.cid || a.candidate_id;
          if (identifier) {
            try {
              const r2 = await fetch(`${baseUrl}/candidate/public/${encodeURIComponent(identifier)}`);
              if (r2.ok) {
                const cdata = await r2.json();
                // API may return { success: true, candidate: { ... } } or the candidate object directly
                candidate = (cdata && cdata.candidate) ? cdata.candidate : cdata;
              }
            } catch (e) {
              // ignore
            }
          }
          return { ...a, candidate };
        }));

        // debug logs: show what we received and enriched
        console.log('Results.jsx: raw attemptsArr=', attemptsArr);
        console.log('Results.jsx: enriched attempts=', enriched);

        // Aggregate by candidate_id: sum scores and cheating counts into a single row per candidate
        const aggMap = {};
        const computeAttemptScore = (attempt) => {
          try {
            const rd = attempt.results_data;
            if (Array.isArray(rd)) {
              return rd.reduce((sum, it) => sum + (Number(it && it.score) || 0), 0);
            } else if (rd && typeof rd === 'number') {
              return Number(rd) || 0;
            }
          } catch (e) {
            return 0;
          }
          return 0;
        };

        for (const a of enriched) {
          const cidValue = a.cid || a.candidate_id || (a.candidate && (a.candidate.id || a.candidate.candidate_id)) || 'unknown';
          const key = String(cidValue);
          const score = computeAttemptScore(a);
          const ts = a.created_at ? new Date(String(a.created_at)) : null;
          if (!aggMap[key]) {
            aggMap[key] = {
              candidate_id: key,
              candidate: a.candidate || null,
              totalScore: score,
              tab_switches: Number(a.tab_switches) || 0,
              inactivities: Number(a.inactivities) || 0,
              face_not_visible: Number(a.face_not_visible) || 0,
              multiple_faces: Number(a.multiple_faces) || 0,
              attempts_count: 1,
              created_at: ts,
              // keep a representative recording/audio URL and raw qa_data for viewing
              // Store the specific attempt ID for exact video retrieval
              id: a.id || a._id || null, 
              video_url: a.video_url || a.video || a.videoUrl || null,
              audio_url: a.audio_url || a.audio || a.audioUrl || null,
              proctoring_video_url: a.proctoring_video_url || null,
              qa_data: a.qa_data || a.qaData || null,
              results_data: a.results_data || null,
            };
          } else {
            aggMap[key].totalScore += score;
            aggMap[key].tab_switches += Number(a.tab_switches) || 0;
            aggMap[key].inactivities += Number(a.inactivities) || 0;
            aggMap[key].face_not_visible += Number(a.face_not_visible) || 0;
            aggMap[key].multiple_faces += Number(a.multiple_faces) || 0;
            aggMap[key].attempts_count += 1;
            // keep latest submitted time
            if (ts && (!aggMap[key].created_at || ts > aggMap[key].created_at)) aggMap[key].created_at = ts;
            // prefer populated candidate object
            if (!aggMap[key].candidate && a.candidate) aggMap[key].candidate = a.candidate;
            // prefer newer recording/audio if this attempt is newer
            const existingTs = aggMap[key].created_at;
            if (ts && (!existingTs || ts >= existingTs)) {
              aggMap[key].id = a.id || a._id || aggMap[key].id;
              aggMap[key].video_url = a.video_url || a.video || a.videoUrl || aggMap[key].video_url;
              aggMap[key].audio_url = a.audio_url || a.audio || a.audioUrl || aggMap[key].audio_url;
              aggMap[key].proctoring_video_url = a.proctoring_video_url || aggMap[key].proctoring_video_url;
              aggMap[key].qa_data = a.qa_data || a.qaData || aggMap[key].qa_data;
              aggMap[key].results_data = a.results_data || aggMap[key].results_data;
            }
          }
        }

        const aggregated = Object.values(aggMap).map((v) => ({
          ...v,
          // format created_at back to ISO/string for display code
          created_at: v.created_at ? v.created_at.toISOString() : null,
        }));

        setSelectedJob({ ...job, attempts: aggregated, rawAttempts: enriched });
        setShowViewResults(true);
      } catch (e) {
        console.error('Error loading attempts', e);
        setAttemptsError((e && e.message) ? String(e.message) : 'Error loading attempts');
      } finally {
        setAttemptsLoading(false);
      }
    })();
  };

  // Try to resolve a relative or partial media path to a working absolute URL by probing common prefixes.
  const resolveMediaUrl = async (raw) => {
    if (!raw) return null;
    const s = String(raw).trim();
    if (!s) return null;
    // if already absolute, return as-is
    if (/^https?:\/\//i.test(s)) return s;

    const prefixes = [
      baseUrl.replace(/\/$/, ''),
      pythonUrl.replace(/\/$/, ''),
      window.location.origin.replace(/\/$/, ''),
      // also try removing '/api' if present in baseUrl
      baseUrl.replace(/\/api\/?$/, ''),
    ];

    for (const p of prefixes) {
      try {
        const candidate = `${p}${s.startsWith('/') ? '' : '/'}${s}`;
        // First try HEAD to avoid downloading full file
        const headResp = await fetch(candidate, { method: 'HEAD' });
        if (headResp && headResp.ok) return candidate;
        // fallback: try GET for servers that don't support HEAD but allow byte ranges
        const getResp = await fetch(candidate, { method: 'GET', headers: { Range: 'bytes=0-0' } });
        if (getResp && (getResp.ok || getResp.status === 206)) return candidate;
      } catch (e) {
        // ignore and try next prefix
      }
    }

    // last resort: return original raw as relative (browser may still resolve if served)
    return s;
  };

  // Lightweight endpoint-backed video player that queries the server for a full URL.
  const VideoPlayer = ({ attemptId }) => {
    const [url, setUrl] = useState(null);
    const [loadingUrl, setLoadingUrl] = useState(false);
    useEffect(() => {
      let mounted = true;
      if (!attemptId) {
        setUrl(null);
        return () => { mounted = false; };
      }
      const orgId = localStorage.getItem('org_id') || localStorage.getItem('orgId');
      testApi.getVideoUrl(attemptId, orgId)
        .then(async (j) => {
          if (!mounted) return;
          const raw = j && (j.video_url || j.videoUrl || j.url || (j.data && j.data.video_url));
          if (raw) {
            const resolved = await resolveMediaUrl(raw);
            if (mounted) setUrl(resolved);
          } else {
            setUrl(null);
          }
        })
        .catch((e) => {
          console.error('VideoPlayer getVideoUrl failed', e);
          if (mounted) setUrl(null);
        })
        .finally(() => { if (mounted) setLoadingUrl(false); });
      return () => { mounted = false; };
    }, [attemptId]);

    if (loadingUrl) return <div className="text-white p-4">Loading video...</div>;
    if (!url) return <div className="text-white p-4">No video available</div>;
    return (
      <video controls autoPlay muted playsInline style={{ maxWidth: '100%' }}>
        <source src={url} />
        Your browser does not support the video tag.
      </video>
    );
  };

  const handleDelete = async (job) => {
    if (!job || !job.raw || !job.raw.question_set_id) return;
    const ok = window.confirm(`Delete test "${job.jobTitle}"? This cannot be undone.`);
    if (!ok) return;
    try {
      const qsid = encodeURIComponent(job.raw.question_set_id);
      const orgId = localStorage.getItem('org_id') || localStorage.getItem('orgId');
      const headers = { 'Content-Type': 'application/json' };
      if (orgId) headers['X-Org-Id'] = orgId;

      const res = await fetch(`${pythonUrl}/v1/finalise/finalized-test/${qsid}`, { 
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const txt = await res.text();
        alert('Delete failed: ' + txt);
        return;
      }
      // remove from UI
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } catch (e) {
      console.error('Delete failed', e);
      alert('Delete failed');
    }
  };

  const closeModal = () => {
    setShowViewResults(false);
    setSelectedJob(null);
  };

  return (
    <div className="min-h-screen">
      <div className={`${(loading || attemptsLoading) ? 'filter blur-sm pointer-events-none' : ''} max-w-[1100px] mx-auto`}>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5">

          <div>
            <h1 className="text-[28px] font-semibold text-[#1f1f1f]">Assessment Details</h1>
          </div>

          {/* <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1">
            <div className="bg-blue-100 rounded-2xl p-6 sm:p-8 shadow-sm flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Total Jobs</h2>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600">{jobs.length}</p>
            </div>

            <div className="bg-green-100 rounded-2xl p-6 sm:p-8 shadow-sm flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Total Candidates</h2>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600">
                {jobs.reduce((sum, j) => sum + j.totalCandidates, 0)}
              </p>
            </div>
          </div> */}

          <div className="flex items-end">
            <div className="relative w-full sm:w-[260px]">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#d7d7df] bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7b61ff] focus:border-transparent"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <button className="hidden absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <Search size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[18px] border border-[#d7c9ff] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="bg-[#f3f0fb]">
                <tr>
                  <th className="px-5 py-4 text-left text-[15px] font-semibold text-[#222]">Serial No.</th>
                  <th className="px-5 py-4 text-left text-[15px] font-semibold text-[#222]">Assessment Name</th>
                  <th className="px-5 py-4 text-left text-[15px] font-semibold text-[#222]">Created On</th>
                  <th className="px-5 py-4 text-left text-[15px] font-semibold text-[#222]">Test Date</th>
                  <th className="px-5 py-4 text-center text-[15px] font-semibold text-[#222]">Candidate Numbers</th>
                  <th className="px-5 py-4 text-center text-[15px] font-semibold text-[#222]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentRows.length > 0 ? (
                  currentRows.map((job, index) => (
                    <tr key={job.id} className="hover:bg-[#faf9ff] transition-colors border-b border-[#ededf3] last:border-b-0">
                      <td className="px-5 py-5 text-sm text-gray-700">
                        {(indexOfFirstRow + index + 1)}
                      </td>

                      <td className="px-5 py-5 text-sm text-gray-800">{job.jobTitle}</td>

                      {/* <td className="px-4 py-4 border-b border-gray-300">
                        <span className="inline-flex items-center justify-center min-w-[60px] px-3 py-1 bg-green-200 text-green-800 text-sm font-medium rounded-full">
                          {job.totalCandidates}
                        </span>
                      </td> */}

                      <td className="px-5 py-5 text-sm text-gray-700">
                        {job.createdAt || 'N/A'}
                      </td>

                      <td className="px-5 py-5 text-sm font-semibold text-[#6c5ce7]">
                        {job.testDate || 'N/A'}
                      </td>

                      <td className="px-5 py-5 text-center">
                        <span className="inline-flex items-center justify-center min-w-[52px] px-4 py-1 bg-[#eef4ff] text-[#2f80ed] text-sm font-semibold rounded-full">
                          {job.totalCandidates}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewResults(job)}
                            className="px-2 py-2 flex items-center justify-center text-[#6c5ce7] bg-[#f3efff] rounded-lg hover:bg-[#ebe4ff] transition-colors"
                            aria-label="View job"
                          >
                            <Eye size={16} />
                          </button>
                          {/* <button
                            onClick={() => handleDelete(job)}
                            className="p-2 text-red-500 border border-red-500 rounded hover:bg-red-50 transition-colors"
                            aria-label="Delete job"
                          >
                            <Trash2 size={16} />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-500">
                      No jobs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          </div>
        </div>

        <div className="pb-5">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
        {/* {hrRaw && (
          <div className="mt-4 bg-white p-4 rounded shadow">
            <h4 className="font-semibold mb-2">HR /api/jd/created-by/hr response</h4>
            <pre className="text-xs overflow-auto max-h-64">{typeof hrRaw === 'string' ? hrRaw : JSON.stringify(hrRaw, null, 2)}</pre>
          </div>
        )} */}
      </div>
      {/* Loading overlay for initial load */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white/90 rounded-lg p-6 flex flex-col items-center gap-3">
            <SpinLoader />
            <div className="text-sm text-gray-700">Loading tests...</div>
          </div>
        </div>
      )}

      {/* Error fallback for initial load */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 p-4">
          <div className="max-w-lg w-full bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-2">Failed to load tests</h3>
            <p className="text-sm text-gray-600 mb-4">{String(error)}</p>
            <div className="flex gap-2">
              <button onClick={retryLoad} className="px-3 py-2 bg-blue-600 text-white rounded">Retry</button>
              <button onClick={() => setError(null)} className="px-3 py-2 bg-gray-100 rounded">Dismiss</button>
            </div>
          </div>
        </div>
      )}


     {showViewResults && selectedJob && (
  <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] max-w-[990px] w-full max-h-[80vh] overflow-hidden border border-[#ece7ff]">
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#f0ecff] bg-white">
        <h3 className="text-[18px] font-semibold text-[#1f1f1f]">
          {selectedJob.jobTitle}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={closeModal}
            className="hidden px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
          >
            Close
          </button>
          <button
            onClick={closeModal}
            aria-label="Close"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#111] hover:bg-[#f5f5f8] transition-colors"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="p-0">
        {attemptsLoading ? (
          <div className="flex items-center justify-center gap-3 py-10">
            <SpinLoader />
            <span className="text-sm text-gray-700">Loading attempts...</span>
          </div>
        ) : attemptsError ? (
          <div className="p-6 text-center text-sm text-red-600">
            <div className="mb-3">{String(attemptsError)}</div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handleViewResults(selectedJob)}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                Retry
              </button>
              <button
                onClick={() => setAttemptsError(null)}
                className="px-3 py-2 bg-gray-100 rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-[#F5F5FF]">
                <tr>
                  <th className="px-8 py-5 text-left text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                    Serial No.
                  </th>
                  <th className="px-6 py-5 text-left text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                    Candidate Name
                  </th>
                  <th className="px-6 py-5 text-left text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                    Email ID
                  </th>
                  <th className="px-6 py-5 text-left text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                    Score
                  </th>
                  <th className="px-6 py-5 text-center text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                    Tab Switches
                  </th>
                  <th className="px-6 py-5 text-center text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                    In-Activities
                  </th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                      Face Not Visible
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                      Multi Face Detection
                    </th>
                  <th className="px-6 py-5 text-center text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                    Video
                  </th>
                  {/* <th className="px-6 py-5 text-center text-[13px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                    Report
                  </th> */}
                </tr>
              </thead>

              <tbody>
                {(selectedJob.attempts || []).length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-gray-500">
                      No attempts found.
                    </td>
                  </tr>
                ) : (
                  selectedJob.attempts.map((a, i) => {
                    let score = '';
                    try {
                      if (a && Number.isFinite(a.totalScore)) {
                        score = a.totalScore.toFixed ? a.totalScore.toFixed(2) : String(a.totalScore);
                      } else {
                        const rd = a.results_data;
                        if (Array.isArray(rd)) {
                          const s = rd.reduce((sum, it) => sum + (Number(it && it.score) || 0), 0);
                          score = Number.isFinite(s) ? s.toFixed(2) : '';
                        } else if (rd && typeof rd === 'number') {
                          score = rd.toFixed ? rd.toFixed(2) : String(rd);
                        }
                      }
                    } catch (e) {
                      score = '';
                    }

                    const cand = a.candidate || {};
                    console.log('Results.jsx: rendering attempt', { attempt: a, candidate: cand });
                    const name =
                      cand.name ||
                      `${cand.firstName || ''} ${cand.lastName || ''}`.trim() ||
                      cand.fullName ||
                      cand.username ||
                      a.candidate_id ||
                      'N/A';
                    const email =
                      cand.email ||
                      cand.emailAddress ||
                      cand.contact_email ||
                      cand.username ||
                      'N/A';
                    const cid = a.candidate_id || a.candidate?.id || a.candidate_id || 'unknown';
                    let displayScore = score;

                    return (
                      <>
                        <tr
                          key={a.candidate_id || i}
                          className="border-b border-[#efeff4] last:border-b-0"
                        >
                          <td className="px-8 py-5 text-[15px] font-medium text-[#1f1f1f]">
                            {i + 1}
                          </td>

                          <td className="px-6 py-5 text-[15px] text-[#1f1f1f] whitespace-nowrap">
                            {name}
                          </td>

                          <td className="px-6 py-5 text-[15px] text-[#1f1f1f] whitespace-nowrap">
                            {email}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              {(() => {
                                const scoreNum = parseFloat(displayScore) || 0;
                                const maxScore = Array.isArray(a.results_data) 
                                  ? a.results_data.reduce((sum, q) => sum + (Number(q.positive_marking) || 0), 0) 
                                  : (selectedJob?.raw?.max_score || 100);
                                const percentage = maxScore > 0 ? Math.min((scoreNum / maxScore) * 100, 100) : 0;
                                const isLow = percentage < 35;
                                const strokeColor = isLow ? '#ef4444' : '#6c5ce7';
                                const trackColor = isLow ? '#fecaca' : '#e8defd';
                                const radius = 9;
                                const circumference = 2 * Math.PI * radius;
                                const dashOffset = circumference - (percentage / 100) * circumference;

                                return (
                                  <>
                                    <span
                                      className="text-[15px] leading-none font-semibold"
                                      style={{ color: strokeColor }}
                                    >
                                      {displayScore}
                                    </span>
                                    <svg width="24" height="24" viewBox="0 0 24 24">
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r={radius}
                                        fill="none"
                                        stroke={trackColor}
                                        strokeWidth="3"
                                      />
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r={radius}
                                        fill="none"
                                        stroke={strokeColor}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={dashOffset}
                                        transform="rotate(-90 12 12)"
                                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                      />
                                    </svg>
                                  </>
                                );
                              })()}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-center">
                            <span className="text-[15px] font-medium text-[#ff5c7a]">
                              {a.tab_switches ?? 0}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-center">
                            <span className="text-[15px] font-medium text-[#5b5eff]">
                              {a.inactivities ?? 0}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-center">
                            <span className="text-[15px] font-medium text-orange-500">
                              {a.face_not_visible ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-[15px] font-medium text-[#ff4f6d]">
                              {a.multiple_faces ?? 0}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-center">
                            {(a.proctoring_video_url || a.video_url) ? (
                              <button
                                onClick={() => {
                                  try {
                                    // Pass the actual database attempt ID to ensure correct video fetching
                                    setPlayAttemptId(a.id || a.candidate_id || String(i));
                                  } catch (e) {
                                    console.error('Play click failed', e);
                                  }
                                }}
                                className="inline-flex items-center justify-center gap-2 px-5 py-1.5 bg-gradient-to-r from-[#644CB6] to-[#9273F3] text-white text-[14px] font-medium rounded-full hover:bg-[#6b52ca] transition-colors"
                              >
                                <img src={playicon} alt="Video" className="" />
                                Play
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                          
                          {/* <td className="px-6 py-5 text-center">
                            <button
                              onClick={() => setSelectedAttempt(a)}
                              className="inline-flex items-center justify-center gap-2 px-5 py-1.5 bg-[#f3f0fb] text-[#6c5ce7] text-[14px] font-medium rounded-full hover:bg-[#ebe7ff] transition-colors"
                            >
                              <FileText size={16} />
                              Report
                            </button>
                          </td> */}
                        </tr>
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
)}
      {/* Video overlay */}
      {videoSrc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-black rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
            <button
              onClick={() => {
                try { if (videoSrc && videoSrc.startsWith('blob:')) URL.revokeObjectURL(videoSrc); } catch(_){}
                setVideoSrc(null); setVideoError(null);
              }}
              className="absolute right-2 top-2 bg-white/90 text-black rounded px-2 py-1 z-50"
            >
              Close
            </button>
            {videoLoading ? (
              <div className="w-full h-64 flex items-center justify-center text-white">Loading video...</div>
            ) : videoError ? (
              <div className="w-full p-6 text-white">
                <div className="mb-3">Failed to load video: {videoError}</div>
                <div className="flex gap-2">
                  <a href={videoSrc} target="_blank" rel="noreferrer" className="px-3 py-2 bg-white text-black rounded">Open in new tab</a>
                  <button onClick={() => { try { if (videoSrc && videoSrc.startsWith('blob:')) URL.revokeObjectURL(videoSrc); } catch(_){}; setVideoSrc(null); setVideoError(null); }} className="px-3 py-2 bg-gray-200 rounded">Close</button>
                </div>
              </div>
            ) : (
              <video key={videoSrc} controls autoPlay playsInline crossOrigin="anonymous" className="w-full h-full bg-black" src={videoSrc}>
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>
      )}
      {playAttemptId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-black rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden relative p-4">
            <button
              onClick={() => setPlayAttemptId(null)}
              className="absolute right-2 top-2 bg-white/90 text-black rounded px-2 py-1 z-50"
            >
              Close
            </button>
            <div className="text-white mb-2">Playing attempt: {String(playAttemptId)}</div>
            <VideoPlayer attemptId={playAttemptId} />
          </div>
        </div>
      )}

      {selectedAttempt && (
        <ViewResults
          jobData={selectedJob}
          attempt={selectedAttempt}
          onClose={() => setSelectedAttempt(null)}
        />
      )}
    </div>
  );
}

export default Results;
