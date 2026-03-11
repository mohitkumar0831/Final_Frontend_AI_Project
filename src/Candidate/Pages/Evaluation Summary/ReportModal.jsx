import React, { useState } from "react";
import ViewInsightDetail from "./ViewInsightDetail";
import { Calendar } from "lucide-react";

function ReportModal({ selectedCandidate, setOpenModal, setSelectedCandidate }) {
    const [showInsight, setShowInsight] = useState(false);

    if (!selectedCandidate) return null;



    const examDate = (() => {
        const raw = selectedCandidate.raw || {};
        const dateValue = selectedCandidate.exam_date || raw.created_at || null;
        if (!dateValue) return "—";
        try {
            const d = new Date(dateValue);
            if (isNaN(d.getTime())) return String(dateValue);
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return "—";
        }
    })();

    const skills = (() => {
        let s = selectedCandidate.skills;
        if (typeof s === 'string' && s.trim()) {
            s = s.split(',').map(x => x.trim()).filter(Boolean);
        }
        return Array.isArray(s) && s.length > 0 ? s : [];
    })();

    return (
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
                    className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-100">
                        <div className="flex gap-4">
                            <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl uppercase">
                                {selectedCandidate.name?.substring(0, 2) || "NS"}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{selectedCandidate.jobTitle || "Developer"}</h2>
                                <p className="text-gray-400 font-medium">{selectedCandidate.company || "—"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-5">
                            {[
                                { label: "Name", value: selectedCandidate.name },
                                { label: "Job Title", value: selectedCandidate.jobTitle },
                                { label: "Email", value: selectedCandidate.email || "—" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center">
                                    <span className="w-32 text-gray-900 font-bold text-base">{item.label} :</span>
                                    <span className="text-gray-500 font-medium">{item.value || "—"}</span>
                                </div>
                            ))}

                            <div className="flex items-center">
                                <span className="w-32 text-gray-900 font-bold text-base">Exam Date :</span>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className={`font-medium ${examDate !== '—' ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {examDate}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <span className="w-32 text-gray-900 font-bold text-base pt-1">Skills :</span>
                                 <div className="flex flex-wrap gap-2">
                        {(Array.isArray(selectedCandidate.skills) && selectedCandidate.skills.length ? selectedCandidate.skills : ['Wireframing', 'Prototyping', 'User Research']).map((s, i) => (
                          <span key={`${s}-${i}`} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {s}
                          </span>
                        ))}
                      </div>
                            </div>

                            <div className="flex items-center">
                                <span className="w-32 text-gray-900 font-bold text-base">Marks :</span>
                                <span className="text-gray-500 font-medium">{selectedCandidate.marks || "—"}</span>
                            </div>

                            <div className="pt-6">
                                <button 
                                    onClick={() => setShowInsight(true)}
                                    className="w-full sm:w-80 py-3.5 bg-gradient-to-r from-[#7058C5] to-[#7058C5] hover:from-[#5d47a8] hover:to-[#6050b8] text-white font-semibold rounded-xl transition-all shadow-md active:scale-95"
                                >
                                    View Insight
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-50/50 rounded-3xl p-8 flex items-center justify-between border border-gray-50">
                            <div className="relative flex items-center justify-center">
                                {(() => {
                                    const marksArray = (selectedCandidate.marks || '0/0').split('/');
                                    const obtained = parseFloat(marksArray[0]) || 0;
                                    const total = parseFloat(marksArray[1]) || 1;
                                    const totalQuestions = selectedCandidate.totalQuestion || selectedCandidate.raw?.results_data?.length || 1;
                                    const correct = selectedCandidate.correct || selectedCandidate.raw?.results_data?.filter(r => r && r.is_correct).length || 0;
                                    const incorrect = (selectedCandidate.incorrect !== undefined) ? selectedCandidate.incorrect : (totalQuestions - correct);
                                    
                                    const correctPercent = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
                                    const incorrectPercent = totalQuestions > 0 ? (incorrect / totalQuestions) * 100 : 0;
                                    
                                    return (
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
                                    );
                                })()}
                            </div>

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

            {showInsight && (
                <div 
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-6"
                    onClick={() => setShowInsight(false)}
                >
                    <div 
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-3xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setShowInsight(false)}
                            className="absolute top-4 right-4 z-[120] p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <ViewInsightDetail candidate={selectedCandidate} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReportModal;