import React, { useEffect, useMemo, useState } from "react";
import { Eye, ChevronDown, ArrowUpDown, ChevronsUpDown } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import Pagination from "../../components/LandingPage/Pagination";
import FilteredCandidate from "./FilteredCandidate";
import UnfilteredCandidate from "./UnfilteredCandidate";
import arrow from "../../img/double-arrow.png"

async function fetchJDHistoryFromApi(jdId) {
    const res = await fetch(`/api/jds/history/${jdId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to fetch JD history");
    }
    return res.json();
}

function getStatusPillClasses(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("pending")) return "bg-orange-50 text-orange-600 border-orange-100";
    if (s.includes("jd created")) return "bg-green-50 text-green-600 border-green-100";
    if (s.includes("in progress")) return "bg-amber-50 text-amber-700 border-amber-100";
    if (s.includes("closed") || s.includes("rejected")) return "bg-red-50 text-red-600 border-red-100";
    return "bg-gray-50 text-gray-600 border-gray-200";
}

function getPriorityPillClasses(priority) {
    const p = (priority || "").toLowerCase();
    if (p.includes("high")) return "bg-red-50 text-red-600 border-red-100";
    if (p.includes("medium")) return "bg-amber-50 text-amber-700 border-amber-100";
    if (p.includes("low")) return "bg-green-50 text-green-600 border-green-100";
    return "bg-gray-50 text-gray-600 border-gray-200";
}

function FitBitScore({ value = 0, variant = "green" }) {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    const color = variant === "red" ? "#ef4444" : "#22c55e";
    const track = "#e5e7eb";

    return (
        <div className="flex items-center justify-end gap-2">
            <span className={`text-sm font-semibold ${variant === "red" ? "text-red-600" : "text-green-600"}`}>
                {v}%
            </span>
            <div
                className="w-6 h-6 rounded-full"
                style={{
                    background: `conic-gradient(${color} ${v * 3.6}deg, ${track} 0deg)`,
                    position: "relative",
                }}
            >
                <div className="absolute inset-[3px] rounded-full bg-white" />
            </div>
        </div>
    );
}

function DonutCard({ total = 0, filtered = 0, unfiltered = 0 }) {
    const t = Number(total) || 0;
    const f = Number(filtered) || 0;
    const u = Number(unfiltered) || 0;

    const circumference = 2 * Math.PI * 78;
    const filteredPercent = t ? (f / t) * 100 : 0;
    const unfilteredPercent = t ? (u / t) * 100 : 0;

    const filteredDash = (filteredPercent / 100) * circumference;
    const unfilteredDash = (unfilteredPercent / 100) * circumference;

    return (
        <div className="bg-white rounded-2xl p-5 shadow-[0px_0px_6px_0px_rgba(0,_0,_0,_0.12)]">
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                    <svg
                        width="192"
                        height="192"
                        viewBox="0 0 176 176"
                        className="absolute inset-0"
                    >
                        <defs>
                            <linearGradient id="filteredGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#c4b5fd" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                        </defs>

                        <circle
                            cx="88"
                            cy="88"
                            r="78"
                            fill="none"
                            stroke="#d9d6fe"
                            strokeWidth="14"
                        />

                        <circle
                            cx="88"
                            cy="88"
                            r="78"
                            fill="none"
                            stroke="url(#filteredGradient)"
                            strokeWidth="14"
                            strokeLinecap="round"
                            strokeDasharray={`${filteredDash} ${circumference}`}
                            transform="rotate(-90 88 88)"
                            style={{ transition: "stroke-dasharray 0.5s ease" }}
                        />
                    </svg>

                    <div className="relative flex flex-col items-center justify-center text-center">
                        <div className="text-xs text-gray-500 leading-4">Total Application</div>
                        <div className="text-3xl font-bold text-indigo-700">{t}</div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-3">
                        <span className="w-9 h-3 rounded-full bg-indigo-500" />
                        <div className="text-xs text-gray-500 leading-4">
                            <p>Filtered</p>
                            <div className="text-[11px] text-gray-400">Application ({f})</div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <span className="w-9 h-3 rounded-full bg-indigo-200" />
                        <div className="text-xs text-gray-500 leading-4">
                            <p>Un-Filtered</p>
                            <div className="text-[11px] text-gray-400">Application ({u})</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const SeeHistory = () => {
    const location = useLocation();
    const params = useParams();

    const [jdData, setJdData] = useState(location.state?.jdData || null);
    const [loading, setLoading] = useState(!location.state?.jdData);
    const [error, setError] = useState("");

    const [showFilteredPopup, setShowFilteredPopup] = useState(false);
    const [showUnfilteredPopup, setShowUnfilteredPopup] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    const [activeTab, setActiveTab] = useState("filtered");
    const [currentJobIndex, setCurrentJobIndex] = useState(0);
    const [filteredPage, setFilteredPage] = useState(1);
    const [unfilteredPage, setUnfilteredPage] = useState(1);

    const itemsPerPage = 8;

    useEffect(() => {
        let mounted = true;

        async function load() {
            console.log("📍 location.state:", location.state);

            try {
                if (location.state?.jdData) {
                    console.log("✅ Data from location.state:", location.state.jdData);
                    setJdData(location.state.jdData);
                    setLoading(false);
                    return;
                }

                const jdId = params.jdId;
                if (!jdId) {
                    console.log("❌ No jdId found!");
                    setLoading(false);
                    return;
                }

                setLoading(true);
                console.log("📞 Calling API with jdId:", jdId);

                const apiData = await fetchJDHistoryFromApi(jdId);
                console.log("✅ API Response:", apiData);

                if (mounted) setJdData(apiData);

            } catch (e) {
                console.log("💥 Error:", e);
                if (mounted) setError(e?.message || "Something went wrong");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();

        return () => {
            mounted = false;
        };
    }, [params.jdId, location.state?.jdData]);

    const finalJobData = useMemo(() => {
        const jdArray = jdData?.fullData?.jds || [];

        const jobData = jdArray.map((jd, index) => {
            const appliedCandidates = jd.raw?.appliedCandidates || [];
            const filteredCands = appliedCandidates.filter((c) => c.status === "filtered");
            const unfilteredCands = appliedCandidates.filter(
                (c) => c.status === "unfiltered" || c.status !== "filtered"
            );

            return {
                id: jd.id || jd._id,
                title: jdData?.fullData?.jobTitle || jdData?.title || "N/A",
                jdId: `JD#${(jd.id || jd._id)?.slice(-4) || index}`,
                assignedOn: new Date(jdData?.fullData?.createdAt).toLocaleDateString("en-CA") || "N/A",
                dueDate: new Date(jdData?.fullData?.dueDate).toLocaleDateString("en-CA") || "N/A",
                status: jdData?.fullData?.status || "N/A",
                priority: jdData?.fullData?.priority || "N/A",
                notes: jd.raw?.jobSummary || "No notes available",
                totalApply: jd.totalApplicants || appliedCandidates.length || 0,
                filtered: jd.filteredCount || filteredCands.length || 0,
                unfiltered: jd.unfilteredCount || unfilteredCands.length || 0,
                rawFilteredCandidates: jd.raw?.filteredCandidates || [],
                rawUnfilteredCandidates: jd.raw?.unfilteredCandidates || [],
                rawAppliedCandidates: appliedCandidates,
                skills: jdData?.fullData?.skills || [],
            };
        });

        return jobData.length
            ? jobData
            : [
                {
                    id: 1,
                    title: "No Data Available",
                    jdId: "N/A",
                    assignedOn: "N/A",
                    dueDate: "N/A",
                    status: "N/A",
                    priority: "N/A",
                    notes: "No data available",
                    totalApply: 0,
                    filtered: 0,
                    unfiltered: 0,
                    rawFilteredCandidates: [],
                    rawUnfilteredCandidates: [],
                    rawAppliedCandidates: [],
                    skills: [],
                },
            ];
    }, [jdData]);

    const currentJob = finalJobData[currentJobIndex];

    const filteredCandidates = useMemo(() => {
        return (currentJob?.rawFilteredCandidates || []).map((fc, index) => {
            const cand = (typeof fc.candidate === 'object' && fc.candidate !== null)
                ? fc.candidate
                : {};

            return {
                id: fc._id || index + 1,
                name: cand.name || "N/A",
                email: cand.email || "N/A",
                resume: cand.resume || null,
                phone: cand.phone || "N/A",
                skillsArr: currentJob?.skills || [],
                percentage: fc.aiScore || 0,
                aiExplanation: fc.aiExplanation || "No explanation available",
                candidateRefId: cand._id || fc.candidate || null,
            };
        });
    }, [currentJob]);

    const unfilteredCandidates = useMemo(() => {
        return (currentJob?.rawUnfilteredCandidates || []).map((uc, index) => {
            const cand = (typeof uc.candidate === 'object' && uc.candidate !== null)
                ? uc.candidate
                : {};

            return {
                id: uc._id || index + 1,
                name: cand.name || "N/A",
                email: cand.email || "N/A",
                resume: cand.resume || null,
                phone: cand.phone || "N/A",
                skillsArr: currentJob?.skills || [],
                percentage: uc.aiScore || 0,
                aiExplanation: uc.aiExplanation || "No explanation available",
                candidateRefId: cand._id || uc.candidate || null,
            };
        });
    }, [currentJob]);

    const filteredTotalPages = Math.ceil(filteredCandidates.length / itemsPerPage) || 1;
    const filteredStartIndex = (filteredPage - 1) * itemsPerPage;
    const currentFilteredCandidates = filteredCandidates.slice(
        filteredStartIndex,
        filteredStartIndex + itemsPerPage
    );

    const unfilteredTotalPages = Math.ceil(unfilteredCandidates.length / itemsPerPage) || 1;
    const unfilteredStartIndex = (unfilteredPage - 1) * itemsPerPage;
    const currentUnfilteredCandidates = unfilteredCandidates.slice(
        unfilteredStartIndex,
        unfilteredStartIndex + itemsPerPage
    );

    const handleFilteredEyeClick = (candidate) => {
        setSelectedCandidate(candidate);
        setShowFilteredPopup(true);
    };

    const handleUnfilteredEyeClick = (candidate) => {
        setSelectedCandidate(candidate);
        setShowUnfilteredPopup(true);
    };

    useEffect(() => {
        if (activeTab === "filtered") setFilteredPage(1);
        if (activeTab === "unfiltered") setUnfilteredPage(1);
    }, [activeTab]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-[0px_0px_6px_0px_rgba(0,_0,_0,_0.12)]">
                <div className="text-gray-700 font-semibold">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-[0px_0px_6px_0px_rgba(0,_0,_0,_0.12)]">
                <div className="text-red-600 font-semibold">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {showFilteredPopup && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <FilteredCandidate
                        candidate={selectedCandidate}
                        jobTitle={currentJob?.title}
                        onClose={() => setShowFilteredPopup(false)}
                    />
                </div>
            )}

            {showUnfilteredPopup && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <UnfilteredCandidate
                        candidate={selectedCandidate}
                        jobTitle={currentJob?.title}
                        onClose={() => setShowUnfilteredPopup(false)}
                    />
                </div>
            )}

            <div className="flex items-center justify-between gap-3">
                <div className="text-gray-900 font-bold">
                    Job Title: <span className="font-bold">{currentJob?.title}</span>
                </div>

                <button className="px-4 py-2 rounded-md bg-gradient-to-r from-[#7058C5] to-[#A9A9FB] text-white text-sm font-semibold hover:bg-indigo-700">
                    View Job Description
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-[0px_0px_6px_0px_rgba(0,_0,_0,_0.12)]">
                    <div className="font-bold text-gray-900">Job Summary</div>
                    <p className="text-gray-600 text-sm mt-3 leading-relaxed max-h-36 overflow-auto pr-1">
                        {currentJob?.notes}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-[0px_0px_6px_0px_rgba(0,_0,_0,_0.12)]">
                    <div className="font-bold text-gray-900">Overview</div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 mt-5 text-sm">
                        <div>
                            <div className="text-[11px] text-gray-400">Current Status</div>
                            <div className="mt-2">
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${getStatusPillClasses(
                                        currentJob?.status
                                    )}`}
                                >
                                    {currentJob?.status}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] text-gray-400">Priority</div>
                            <div className="mt-2">
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${getPriorityPillClasses(
                                        currentJob?.priority
                                    )}`}
                                >
                                    {currentJob?.priority}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="text-[11px] text-gray-400">Assigned on</div>
                            <div className="mt-2 text-sm font-semibold text-gray-900">{currentJob?.assignedOn}</div>
                        </div>

                        <div>
                            <div className="text-[11px] text-gray-400">Due Date</div>
                            <div className="mt-2 text-sm font-semibold text-red-600">{currentJob?.dueDate}</div>
                        </div>
                    </div>
                </div>

                <DonutCard
                    total={currentJob?.totalApply}
                    filtered={filteredCandidates.length}
                    unfiltered={unfilteredCandidates.length}
                />
            </div>

            <div className="overflow-hidden">
                <div className="px-5 pt-4">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => setActiveTab("filtered")}
                            className={`text-sm font-semibold pb-3 ${activeTab === "filtered" ? "text-gray-900 border-b-3 border-[#251851]" : "text-gray-400"
                                }`}
                        >
                            Filtered Candidates
                        </button>

                        <button
                            onClick={() => setActiveTab("unfiltered")}
                            className={`text-sm font-semibold pb-3 ${activeTab === "unfiltered" ? "text-gray-900 border-b-3 border-[#251851]" : "text-gray-400"
                                }`}
                        >
                            Un-Filtered Candidates
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto border border-purple-300 rounded-lg">
                    <table className="w-full min-w-[980px] text-left">
                        <thead>
                            <tr className="text-xs font-semibold text-gray-500 bg-indigo-50/40">
                                <th className="py-4 px-5">
                                    <div className="inline-flex items-center gap-1">
                                        Serial No.
                                    </div>
                                </th>
                                <th className="py-4 px-5">
                                    <div className="inline-flex items-center gap-1">
                                        Job Title <img src={arrow} alt="" />
                                    </div>
                                </th>
                                <th className="py-4 px-5">
                                    <div className="inline-flex items-center gap-1">
                                        Name
                                    </div>
                                </th>
                                <th className="py-4 px-5">
                                    <div className="inline-flex items-center gap-1">
                                        Email
                                    </div>
                                </th>
                                <th className="py-4 px-5">
                                    <div className="inline-flex items-center gap-1">
                                        Skills <img src={arrow} alt="" />
                                    </div>
                                </th>
                                <th className="py-4 px-5 text-right">
                                    <div className="inline-flex items-center gap-1 justify-end w-full">
                                        FitBit Score <img src={arrow} alt="" />
                                    </div>
                                </th>
                                <th className="py-4 px-5 text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody className="text-sm text-gray-800">
                            {activeTab === "filtered" ? (
                                currentFilteredCandidates.length ? (
                                    currentFilteredCandidates.map((c, idx) => (
                                        <tr key={c.id} className="border-t border-gray-300">
                                            <td className="py-4 px-5">{filteredStartIndex + idx + 1}</td>
                                            <td className="py-4 px-5">{currentJob?.title}</td>
                                            <td className="py-4 px-5">{c.name}</td>
                                            <td className="py-4 px-5">{c.email}</td>
                                            <td className="py-4 px-5">
                                                <div className="flex flex-wrap gap-2">
                                                    {(c.skillsArr || []).slice(0, 3).map((s) => (
                                                        <span key={s} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                                                            {s}
                                                        </span>
                                                    ))}
                                                    {(c.skillsArr || []).length > 3 && (
                                                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                                                            +{(c.skillsArr || []).length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <FitBitScore value={c.percentage} variant="green" />
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        onClick={() => handleFilteredEyeClick(c)}
                                                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-[#F6F6FF] hover:bg-indigo-50"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4 text-indigo-700" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-gray-500">
                                            No filtered candidates available
                                        </td>
                                    </tr>
                                )
                            ) : currentUnfilteredCandidates.length ? (
                                currentUnfilteredCandidates.map((c, idx) => (
                                    <tr key={c.id} className="border-t border-gray-300">
                                        <td className="py-4 px-5">{unfilteredStartIndex + idx + 1}</td>
                                        <td className="py-4 px-5">{currentJob?.title}</td>
                                        <td className="py-4 px-5">{c.name}</td>
                                        <td className="py-4 px-5">{c.email}</td>
                                        <td className="py-4 px-5">
                                            <div className="flex flex-wrap gap-2">
                                                {(c.skillsArr || []).slice(0, 3).map((s) => (
                                                    <span key={s} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                                                        {s}
                                                    </span>
                                                ))}
                                                {(c.skillsArr || []).length > 3 && (
                                                    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                                                        +{(c.skillsArr || []).length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5">
                                            <FitBitScore value={c.percentage} variant="red" />
                                        </td>
                                        <td className="py-4 px-5">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => handleUnfilteredEyeClick(c)}
                                                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-[#F6F6FF] hover:bg-indigo-50"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4 text-indigo-700" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-gray-500">
                                        No unfiltered candidates available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="py-4 flex items-center justify-center">
                    {activeTab === "filtered" ? (
                        <Pagination currentPage={filteredPage} totalPages={filteredTotalPages} onPageChange={setFilteredPage} />
                    ) : (
                        <Pagination
                            currentPage={unfilteredPage}
                            totalPages={unfilteredTotalPages}
                            onPageChange={setUnfilteredPage}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeeHistory;