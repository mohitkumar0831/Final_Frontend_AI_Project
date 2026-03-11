import { useEffect, useState, useRef } from 'react';
import { Trash2, Search, SlidersHorizontal, Eye, X } from 'lucide-react';
import Pagination from '../../components/LandingPage/Pagination';
import SpinLoader from '../../components/SpinLoader';
import { baseUrl } from '../../utils/ApiConstants';
import { pythonUrl } from '../../utils/ApiConstants';

function Report() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJobTitle, setFilterJobTitle] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const filterRef = useRef(null);
  const itemsPerPage = 5;
  const CAND_API_BASE = baseUrl;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (attempt) => {
    if (!attempt || !attempt.id) return;
    const ok = window.confirm(`Delete attempt ${attempt.id}? This cannot be undone.`);
    if (!ok) return;
    try {
      const res = await fetch(`${pythonUrl}/v1/test/attempts/${encodeURIComponent(attempt.id)}`, { method: 'DELETE' });
      console.log("response:",res)
      if (!res.ok) {
        const txt = await res.text();
        alert('Delete failed: ' + txt);
        return;
      }
      setCandidates(prev => prev.filter(c => c.id !== attempt.id));
    } catch (e) {
      console.error('Delete failed', e);
      alert('Delete failed');
    }
  };

  const loadAttempts = async () => {
    setError(null);
    setLoading(true);
    const candidateRaw = sessionStorage.getItem('candidateData') || localStorage.getItem('candidateData') || localStorage.getItem('candidate');
    let loggedCid = null;
    if (candidateRaw) {
      try {
        const parsed = JSON.parse(candidateRaw);
        loggedCid = parsed?.cid || parsed?.id || parsed?._id || parsed?.candidate_id || null;
      } catch (e) {
        loggedCid = null;
      }
    }
    const restrictToLoggedCandidate = Boolean(loggedCid);
    try {
      const res = await fetch(`${pythonUrl}/v1/test/attempts`);
      if (!res.ok) {
        const txt = await res.text().catch(() => 'Failed');
        throw new Error(txt || 'Failed loading attempts');
      }
      const data = await res.json();
      console.log("DATA:",data)
      let mapped = (data.attempts || []).map(a => ({
          id: a.id || a.candidate_id || '—',
          candidateId: a.candidate_id || a.details?.candidate_id || null,
          cid: a.cid ?? a.details?.cid ?? null,
          name: 'Candidate',
          email: '',
          company: a.details?.company || '-',
          jobTitle: a.details?.role_title || '-',
          totalQuestion: Array.isArray(a.results_data) ? a.results_data.length : '-',
          marks: (Array.isArray(a.results_data) && a.results_data.length) ? (() => {
            try {
              let obtained = 0;
              let possible = 0;
              for (const q of a.results_data) {
                if (!q) continue;
                const hasScoreField = q.score !== undefined && q.score !== null;
                const scoreVal = hasScoreField ? Number(q.score || 0) : null;
                const posMark = (q.positive_marking !== undefined && q.positive_marking !== null) ? Number(q.positive_marking) : null;
                const negMark = (q.negative_marking !== undefined && q.negative_marking !== null) ? Number(q.negative_marking) : null;

                if (scoreVal !== null) {
                  obtained += scoreVal;
                } else if (posMark !== null) {
                  if (q.is_correct) {
                    obtained += posMark;
                  } else if (negMark !== null) {
                    obtained -= Math.abs(negMark);
                  }
                } else if (q.raw_score !== undefined && q.raw_score !== null) {
                  const raw = Number(q.raw_score) || 0;
                  obtained += raw;
                }

                if (posMark !== null) possible += posMark;
                else if (q.max_score !== undefined && q.max_score !== null) possible += Number(q.max_score);
                else possible += 1;
              }
              return `${obtained}/${possible}`;
            } catch (e) { return '-'; }
          })() : '-',
          skills: Array.isArray(a.details?.skills) ? a.details.skills : (a.details?.skills || []),
          time: '-',
          correct: '-',
          incorrect: '-',
          raw: a,
        }));
      if (restrictToLoggedCandidate) {
        const before = mapped.length;
        mapped = mapped.filter(m => {
          const attemptCid = m.cid ?? m.candidateId ?? m.raw?.candidate_id ?? m.raw?.cid ?? null;
          return attemptCid && String(attemptCid) === String(loggedCid);
        });
        if (mountedRef.current) console.log(`Report: restricted attempts from ${before} to ${mapped.length} for cid=${loggedCid}`);
      }

      if (mountedRef.current) setCandidates(mapped);

      try {
          let finalizedTests = [];
          try {
            const fr = await fetch(`${pythonUrl}/v1/finalise/finalized-tests`);
            if (fr.ok) {
              const fj = await fr.json();
              finalizedTests = Array.isArray(fj) ? fj : (fj.data || []);
            }
          } catch (e) {
            finalizedTests = [];
          }
          const CAND_API_BASE = `${baseUrl}`;
          const token = localStorage.getItem('candidateToken') || localStorage.getItem('token') || null;
          console.log("token",token)

          const fetchName = async (candidateId) => {
            if (!candidateId) return null;
            try {
              const headers = { 'Content-Type': 'application/json' };
              if (token) headers['Authorization'] = `Bearer ${token}`;
              const r = await fetch(`${CAND_API_BASE}/candidate/public/${encodeURIComponent(candidateId)}`, { headers });
              if (!r.ok) return null;
              const j = await r.json();
              return j.candidate?.name || null;
            } catch (e) { return null; }
          };

          const promises = mapped.map(async (m) => {
            const cid = m.cid ?? m.candidateId ?? m.raw?.candidate_id ?? null;
            if (cid) {
              try {
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const r = await fetch(`${CAND_API_BASE}/candidate/public/${encodeURIComponent(cid)}`, { headers });
                if (r.ok) {
                  const j = await r.json();
                  const name = j.candidate?.name || j.name || null;
                  if (name) m.name = name;
                  m.email = j.candidate?.email || j.email || m.email || '';
                }
              } catch (e) {
               
              }
            }

            try {
              const qset = m.raw?.question_set_id || m.raw?.questionSetId || m.raw?.question_setId || null;
              if (qset) {
                if (Array.isArray(finalizedTests) && finalizedTests.length) {
                  try {
                    const ft = finalizedTests.find(t => {
                      try {
                        const cand = String(qset);
                        if (String(t.question_set_id || '') === cand) return true;
                        if (String(t._id || t.id || '') === cand) return true;
                        if (String((t.question_set && t.question_set._id) || '') === cand) return true;
                        if (String(t.question_set_id || '').startsWith(cand) || String(t._id || '').startsWith(cand)) return true;
                        
                        const urlCandidates = [t.test_taken_url, t.testTakenUrl, t.url, t.link, t.test_url];
                        for (const u of urlCandidates) {
                          if (!u) continue;
                          try {
                            if (String(u).includes(cand)) return true;
                          } catch (e) { /* ignore URL parse errors */ }
                        }
                      } catch (e) { /* ignore */ }
                      return false;
                    });
                    if (ft) {
                      m.jobTitle = ft.title || ft.role_title || m.jobTitle;
                      m.company = ft.company || m.company;
                    }
                  } catch (e) {  }
                }

                if (!m.jobTitle || m.jobTitle === '-' || m.jobTitle === 'Untitled Test') {
                  try {
                    const ar = await fetch(`${pythonUrl}/v1/question-set/${encodeURIComponent(qset)}/questions`);
                    if (ar.ok) {
                      const aj = await ar.json();
                      if (aj && aj.status === 'success') {
                        m.jobTitle = aj.role_title || aj.title || m.jobTitle;
                        m.company = aj.company || m.company;
                      }
                    }
                  } catch (e) {
                    
          }
                }
              }
            } catch (e) {
              
            }

            return m;
          });

      const resolved = await Promise.all(promises);
      if (mountedRef.current) setCandidates(resolved);
    } catch (e) {
      console.warn('Candidate name resolution failed', e);
    }
    } catch (err) {
      console.error('Failed loading attempts', err);
      setError((err && err.message) ? String(err.message) : 'Failed loading attempts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    loadAttempts();
    return () => { mountedRef.current = false };
  }, []);

  const retryLoad = () => {
    setError(null);
    loadAttempts();
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = (c.name || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (c.jobTitle || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (c.company || '').toString().toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJobTitle = filterJobTitle ? (c.jobTitle || '').toLowerCase().includes(filterJobTitle.toLowerCase()) : true;
    return matchesSearch && matchesJobTitle;
  });

      const uniqueJobTitles = [...new Set(candidates.map(c => c.jobTitle).filter(Boolean))];

  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredCandidates.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (!openModal) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpenModal(false);
        setSelectedCandidate(null);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openModal]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4">
          <h2 className="text-xl font-semibold text-gray-800">Assessment Result</h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-end">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="🔍︎ Search by name, job, or company"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-3 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
            </div>

            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 text-black rounded-lg transition-colors hover:bg-gray-300 w-full sm:w-auto ${
                  filterJobTitle ? 'ring-2 ring-blue-500 border-blue-500' : ''
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="font-medium text-sm">Filter</span>
                {filterJobTitle && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>

              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 space-y-4">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
                    <select
                      value={filterJobTitle}
                      onChange={e => setFilterJobTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    >
                      <option value="">All Job Titles</option>
                      {uniqueJobTitles.map(title => (
                        <option key={title} value={title}>{title}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setFilterJobTitle("");
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowFilterDropdown(false)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>


      <div className="flex flex-col sm:flex-row justify-between items-stretch gap-6 mb-8">
      <div className="bg-white w-full rounded-xl shadow-md border border-gray-300   mb-8">

        <div className="overflow-x-auto border border-gray-200 shadow-md rounded-2xl">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-300" style={{ backgroundColor: '#F5F5FF' }}>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Serial No.</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Job Title</th>
                 <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Company Name</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Total Questions</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Full Marks</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Marks Obtained</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((candidate, index) => {
                  const marksArray = (candidate.marks || '0/0').split('/');
                  const obtained = parseFloat(marksArray[0]) || 0;
                  const total = parseFloat(marksArray[1]) || 100;
                  const percentage = total > 0 ? (obtained / total) * 100 : 0;
                  const circumference = 2 * Math.PI * 18;
                  const strokeDashoffset = circumference - (percentage / 100) * circumference;
                  
                  return (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-5 px-4 text-sm font-medium text-gray-800">{startIndex + index + 1}</td>
                    <td className="py-5 px-4 text-sm text-gray-700">{candidate.jobTitle}</td>
                    <td className="py-5 px-4 text-sm text-gray-700">{candidate.company}</td>
                    <td className="py-5 px-4 text-sm text-gray-700">{candidate.totalQuestion}</td>
                    <td className="py-5 px-4 text-sm font-semibold text-gray-800">{total}</td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-800">{obtained}</span>
                        <div className="relative w-12 h-12">
                          
                          <svg className="transform -rotate-90" width="48" height="48">
                            <circle
                              cx="24"
                              cy="24"
                              r="18"
                              stroke="#E5E7EB"
                              strokeWidth="4"
                              fill="none"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="18"
                              stroke="#654CB7"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                              className="transition-all duration-500"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-800">{Math.round(percentage)}%</span>
                          </div>
                        </div>
                      
                      </div>
                    </td>
                    <td className="py-5 px-4 text-center">
                      <button
                        onClick={async () => {
                          // build richer selectedCandidate before opening modal
                          const enriched = { ...candidate };
                          // try to fetch canonical name if it's missing or placeholder
                          if ((!enriched.name || enriched.name === 'Candidate') && enriched.candidateId) {
                              try {
                              const candidateCid = enriched.cid ?? enriched.raw?.cid ?? enriched.candidateId ?? null;
                              if (candidateCid) {
                                const r = await fetch(`${CAND_API_BASE}/candidate/public/${encodeURIComponent(candidateCid)}`);
                                if (r.ok) {
                                  const j = await r.json();
                                  enriched.name = j.candidate?.name || j.name || enriched.name;
                                  enriched.email = j.candidate?.email || j.email || enriched.email;
                                }
                              }
                            } catch (e) { /* ignore */ }
                          }
                          // compute additional derived fields from raw attempt if available
                              try {
                                const raw = enriched.raw || {};
                                // If qa_data exists, merge answers into results_data entries when missing
                                try {
                                  // Use results_data as authoritative source for answers (ignore qa_data)
                                  const sourceList = raw.results_data || raw.resultsData || [];
                                  if (Array.isArray(sourceList)) {
                                    sourceList.forEach(r => {
                                      try {
                                        // Prefer existing given_answer, otherwise fall back to candidate_answer or answer
                                        const cand = r.candidate_answer ?? r.candidateAnswer ?? r.candidateResponse ?? null;
                                        const ans = r.answer ?? r.correct_answer ?? null;
                                        if ((r.given_answer === undefined || r.given_answer === null || String(r.given_answer).trim() === '') &&
                                            cand !== null && String(cand).trim() !== '') {
                                          r.given_answer = cand;
                                        }
                                        if ((r.given_answer === undefined || r.given_answer === null || String(r.given_answer).trim() === '') &&
                                            ans !== null && String(ans).trim() !== '') {
                                          r.given_answer = ans;
                                        }
                                        // normalize other fields
                                        r.answer = r.answer ?? r.given_answer ?? r.candidate_answer ?? null;
                                        r.candidate_answer = r.candidate_answer ?? r.given_answer ?? r.answer ?? null;
                                      } catch (e) {
                                        // ignore normalization errors
                                      }
                                    });
                                  }
                                } catch (e) {
                                  // ignore merge errors
                                }

                                enriched.totalQuestion = Array.isArray(raw.results_data) ? raw.results_data.length : enriched.totalQuestion;
                            // derive marks: accumulate `score` when present, otherwise use positive/negative marking
                            if (Array.isArray(raw.results_data)) {
                              try {
                                let obtained = 0;
                                let possible = 0;
                                for (const q of raw.results_data) {
                                  if (!q) continue;
                                  const hasScoreField = q.score !== undefined && q.score !== null;
                                  const scoreVal = hasScoreField ? Number(q.score || 0) : null;
                                  const posMark = (q.positive_marking !== undefined && q.positive_marking !== null) ? Number(q.positive_marking) : null;
                                  const negMark = (q.negative_marking !== undefined && q.negative_marking !== null) ? Number(q.negative_marking) : null;

                                  if (scoreVal !== null) {
                                    obtained += scoreVal;
                                  } else if (posMark !== null) {
                                    if (q.is_correct) obtained += posMark;
                                    else if (negMark !== null) obtained -= Math.abs(negMark);
                                  } else if (q.raw_score !== undefined && q.raw_score !== null) {
                                    obtained += Number(q.raw_score) || 0;
                                  }

                                  if (posMark !== null) possible += posMark;
                                  else if (q.max_score !== undefined && q.max_score !== null) possible += Number(q.max_score);
                                  else possible += 1;
                                }
                                enriched.marks = `${obtained}/${possible}`;
                                enriched.correct = raw.results_data.filter(r => r && r.is_correct).length || undefined;
                                enriched.incorrect = Array.isArray(raw.results_data) ? raw.results_data.length - (enriched.correct || 0) : undefined;
                              } catch (e) { /* ignore */ }
                            }
                            enriched.time = raw.time_taken || enriched.time;
                          } catch (e) { /* ignore */ }

                          setSelectedCandidate(enriched);
                          setOpenModal(true);
                        }}
                        className="p-1.5 border border-blue-300 rounded hover:bg-blue-50"
                        aria-label="View Result"
                      >
                        <Eye size={16} className="text-blue-500" />
                      </button>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-gray-500">
                    No candidates found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
              }}
            />
          )}
        </div>
      </div>

      {openModal && selectedCandidate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-auto p-4 sm:p-6 bg-black/40"
          onClick={() => {
            setOpenModal(false);
            setSelectedCandidate(null);
          }}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              onClick={() => {
                setOpenModal(false);
                setSelectedCandidate(null);
              }}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>


<div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100">
  {/* Header Section */}
  <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-100">
    <div className="flex gap-4">
      <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl uppercase">
        {selectedCandidate.name?.substring(0, 2) || "NS"}
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{selectedCandidate.jobTitle || "Developer"}</h2>
        <p className="text-gray-400 font-medium">{selectedCandidate.company || "Netfotech Solutions"}</p>
      </div>
    </div>
    
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
    {/* Left Side: Candidate Details */}
    <div className="space-y-5">
      {[
        { label: "Name", value: selectedCandidate.name },
        { label: "Job Title", value: selectedCandidate.jobTitle },
        { label: "Email", value: selectedCandidate.email || "—" },
        { label: "Exam Date", value: selectedCandidate.examDate || (selectedCandidate.raw?.createdAt ? new Date(selectedCandidate.raw.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-') : "—") },
      ].map((item, idx) => (
        <div key={idx} className="flex items-center">
          <span className="w-32 text-gray-900 font-bold text-base">{item.label} :</span>
          <span className="text-gray-500 font-medium">{item.value || "—"}</span>
        </div>
      ))}

      <div className="flex items-start">
        <span className="w-32 text-gray-900 font-bold text-base pt-1">Skills :</span>
        <div className="flex flex-wrap gap-2">
          {(Array.isArray(selectedCandidate.skills) && selectedCandidate.skills.length > 0 ? 
            selectedCandidate.skills.slice(0, 5) : 
            (selectedCandidate.raw?.details?.skills || []).slice(0, 5)
          ).map((s, i) => (
            <span key={i} className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">
              {s}
            </span>
          ))}
          {((Array.isArray(selectedCandidate.skills) && selectedCandidate.skills.length > 5) || 
            (selectedCandidate.raw?.details?.skills && selectedCandidate.raw.details.skills.length > 5)) && (
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
              +{(selectedCandidate.skills?.length || selectedCandidate.raw?.details?.skills?.length || 0) - 5}
            </span>
          )}
        </div>
      </div>

      <div className="pt-6">
        <button className="w-full sm:w-80 py-3.5 bg-indigo-400 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md">
          View Insight
        </button>
      </div>
    </div>

    {/* Right Side: Donut Chart Visualization */}
    <div className="bg-gray-50/50 rounded-3xl p-8 flex items-center justify-between border border-gray-50">
      <div className="relative flex items-center justify-center">
        {(() => {
          const marksArray = (selectedCandidate.marks || '0/0').split('/');
          const obtained = parseFloat(marksArray[0]) || 0;
          const total = parseFloat(marksArray[1]) || 1;
          const correct = selectedCandidate.correct || selectedCandidate.raw?.results_data?.filter(r => r && r.is_correct).length || 0;
          const totalQuestions = selectedCandidate.totalQuestion || selectedCandidate.raw?.results_data?.length || 1;
          const incorrect = (selectedCandidate.incorrect !== undefined) ? selectedCandidate.incorrect : (totalQuestions - correct);
          const unattempted = totalQuestions - correct - incorrect;
          
          const correctPercent = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
          const incorrectPercent = totalQuestions > 0 ? (incorrect / totalQuestions) * 100 : 0;
          const unattemptedPercent = totalQuestions > 0 ? (unattempted / totalQuestions) * 100 : 0;
          
          return (
            <>
              {/* Simple CSS Circular Chart matching Figma colors */}
              <div 
                className="w-48 h-48 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(
                    #00ff73 0% ${correctPercent}%, 
                    #ff9898 ${correctPercent}% ${correctPercent + incorrectPercent}%, 
                    #ffe08a ${correctPercent + incorrectPercent}% 100%
                  )`
                }}
              >
                {/* Inner Circle (White part of donut) */}
                <div className="w-36 h-36 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <div className="flex items-baseline">
                      <span className="text-5xl font-black text-indigo-700">
                          {obtained.toFixed(0)}
                      </span>
                      <span className="text-xl font-bold text-gray-400 ml-1">
                          /{total.toFixed(0)}
                      </span>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="space-y-6">
        {[
          { color: "bg-[#00ff73]", label: "Correct", sub: "Answers" },
          { color: "bg-[#ff9898]", label: "Wrong", sub: "Answers" },
          { color: "bg-[#ffe08a]", label: "Un-Attempted", sub: "Questions" },
        ].map((legend, i) => (
          <div key={i} className="text-right">
            <div className={`w-12 h-3.5 ${legend.color} rounded-full ml-auto mb-1`}></div>
            <p className="text-[11px] font-bold text-gray-500 leading-tight uppercase tracking-wider">
                {legend.label}<br/>{legend.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
            



          </div>
        </div>
      )}

      {/* Loading overlay (match Results.jsx) */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white/90 rounded-lg p-6 flex flex-col items-center gap-3">
            <SpinLoader />
            <div className="text-sm text-gray-700">Loading tests...</div>
          </div>
        </div>
      )}

      {/* Error fallback */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 p-4">
          <div className="max-w-lg w-full bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-2">Failed to load data</h3>
            <p className="text-sm text-gray-600 mb-4">{String(error)}</p>
            <div className="flex gap-2">
              <button onClick={retryLoad} className="px-3 py-2 bg-blue-600 text-white rounded">Retry</button>
              <button onClick={() => setError(null)} className="px-3 py-2 bg-gray-100 rounded">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

export default Report;
