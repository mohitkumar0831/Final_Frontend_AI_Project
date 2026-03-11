import { useEffect, useState, useRef } from 'react';
import Pagination from '../../../components/LandingPage/Pagination';
import SpinLoader from '../../../components/SpinLoader';
import { baseUrl } from '../../../utils/ApiConstants';
import { pythonUrl } from '../../../utils/ApiConstants';
import ReportHeader from './ReportHeader';
import ReportTable from './ReportTable';
import ReportModal from './ReportModal';
import ViewInsightDetail from './ViewInsightDetail';

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

  // Fetch attempts from backend and map to UI shape
  const loadAttempts = async () => {
    setError(null);
    setLoading(true);
    // determine if a candidate is logged in and get their canonical id (cid)
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
          // store candidate id so we can lookup canonical name from backend
          candidateId: a.candidate_id || a.details?.candidate_id || null,
          // preserve cid from attempt row for public lookup
          cid: a.cid ?? a.details?.cid ?? null,
          // will be replaced by server lookup below when possible
          name: 'Candidate',
          email: '',
          company: a.details?.company || '-',
          jobTitle: a.details?.role_title || '-',
          totalQuestion: Array.isArray(a.results_data) ? a.results_data.length : '-',
          // compute marks from results_data.score when available
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
                  // derive from raw_score/is_correct when score absent
                  if (q.is_correct) {
                    obtained += posMark;
                  } else if (negMark !== null) {
                    obtained -= Math.abs(negMark);
                  }
                } else if (q.raw_score !== undefined && q.raw_score !== null) {
                  // best-effort: assume raw_score in [0,1]
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
      // If a candidate is logged in, restrict visible attempts to that candidate's cid only
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
                          } catch (e) { }
                        }
                      } catch (e) { }
                      return false;
                    });
                    if (ft) {
                      m.jobTitle = ft.title || ft.role_title || m.jobTitle;
                      m.company = ft.company || m.company;
                    }
                  } catch (e) { }
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
      <ReportHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setCurrentPage={setCurrentPage}
        filterJobTitle={filterJobTitle}
        setFilterJobTitle={setFilterJobTitle}
        showFilterDropdown={showFilterDropdown}
        setShowFilterDropdown={setShowFilterDropdown}
        filterRef={filterRef}
        uniqueJobTitles={uniqueJobTitles}
      />

      <div className="  justify-between items-stretch gap-6 mb-8">
        <ReportTable
          currentData={currentData}
          startIndex={startIndex}
          baseUrl={CAND_API_BASE}
          setSelectedCandidate={setSelectedCandidate}
          setOpenModal={setOpenModal}
        />

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

      {openModal && selectedCandidate && (
        <ReportModal
          selectedCandidate={selectedCandidate}
          setOpenModal={setOpenModal}
          setSelectedCandidate={setSelectedCandidate}
        />
      )}

      {/* Loading overlay */}
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
  );
}

export default Report;
