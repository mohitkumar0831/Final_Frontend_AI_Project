import { Eye } from 'lucide-react';

function ReportTable({ currentData, startIndex, baseUrl, setSelectedCandidate, setOpenModal }) {

    return (
        <div className="bg-white w-full rounded-xl shadow-md border border-gray-300 mb-8">
            <div className="overflow-x-auto border border-gray-200 shadow-md rounded-2xl">
                <table className="w-full min-w-[700px]">
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
                                        <td className="py-5 px-4 text-sm text-gray-700 font-medium">{candidate.jobTitle}</td>
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
                                                    const enriched = { ...candidate };
                                                    if ((!enriched.name || enriched.name === 'Candidate') && enriched.candidateId) {
                                                        try {
                                                            const candidateCid = enriched.cid ?? enriched.raw?.cid ?? enriched.candidateId ?? null;
                                                            if (candidateCid) {
                                                                const r = await fetch(`${baseUrl}/candidate/public/${encodeURIComponent(candidateCid)}`);
                                                                if (r.ok) {
                                                                    const j = await r.json();
                                                                    enriched.name = j.candidate?.name || j.name || enriched.name;
                                                                    enriched.email = j.candidate?.email || j.email || enriched.email;
                                                                }
                                                            }
                                                        } catch (e) { console.error(e); }
                                                    }

                                                    try {
                                                        const raw = enriched.raw || {};
                                                        enriched.totalQuestion = Array.isArray(raw.results_data) ? raw.results_data.length : enriched.totalQuestion;
                                                        if (Array.isArray(raw.results_data)) {
                                                            let obt = 0, pos = 0;
                                                            for (const q of raw.results_data) {
                                                                if (!q) continue;
                                                                const scoreVal = (q.score !== undefined && q.score !== null) ? Number(q.score || 0) : null;
                                                                const posMark = (q.positive_marking !== undefined && q.positive_marking !== null) ? Number(q.positive_marking) : null;

                                                                if (scoreVal !== null) obt += scoreVal;
                                                                else if (posMark !== null && q.is_correct) obt += posMark;

                                                                if (posMark !== null) pos += posMark;
                                                                else pos += 1;
                                                            }
                                                            enriched.marks = `${obt}/${pos}`;
                                                            enriched.correct = raw.results_data.filter(r => r && r.is_correct).length;
                                                            enriched.incorrect = raw.results_data.length - enriched.correct;
                                                        }
                                                        // Exam date from created_at
                                                        enriched.exam_date = raw.created_at || null;
                                                    } catch (e) { console.error(e); }

                                                    setSelectedCandidate(enriched);
                                                    setOpenModal(true);
                                                }}
                                                className="p-1.5 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
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
                                    No assessment results found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ReportTable;
