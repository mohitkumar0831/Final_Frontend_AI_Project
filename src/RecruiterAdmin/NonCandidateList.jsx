import React, { useMemo, useState, useEffect } from "react";
import { Search, Eye, X, Link, Copy } from "lucide-react";
import Pagination from "../components/LandingPage/Pagination";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import SpinLoader from "../components/SpinLoader";
import { baseUrl } from "../utils/ApiConstants";

export default function NonCandidateList() {
    const [q, setQ] = useState("");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [shareFor, setShareFor] = useState(null);
    const [copied, setCopied] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingInvites, setSendingInvites] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { jdId } = location.state || {};

    useEffect(() => {
        const fetchNonCandidates = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${baseUrl}/jd/all-candidates`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });
                console.log("hiii", res.data);

                if (res.data?.success && res.data?.data) {
                    setCandidates(res.data.data);
                } else {
                    setCandidates([]);
                }
            } catch (error) {
                console.log(error);
                setCandidates([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNonCandidates();
    }, []);

    const itemsPerPage = 5;

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        let result = candidates;

        if (needle) {
            result = result.filter(
                (c) =>
                    c.name?.toLowerCase().includes(needle) ||
                    c.email?.toLowerCase().includes(needle)
            );
        }

        result = result.filter((candidate) => {
            const appliedCandidateRecord = candidate.appliedCandidates?.find(
                (ac) =>
                    ac.candidate?._id === candidate._id || ac.candidate === candidate._id
            );

            if (appliedCandidateRecord?.mailStatus === "sent") return false;
            if (appliedCandidateRecord?.testCompletedAt) return false;

            return true;
        });

        return result;
    }, [q, candidates, jdId]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filtered.slice(startIndex, endIndex);

    const allSelected =
        currentItems.length > 0 && currentItems.every((c) => selectedIds.has(c._id));

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [q]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    useEffect(() => {
        if (shareFor) {
            const handleEscape = (e) => {
                if (e.key === "Escape") setShareFor(null);
            };
            window.addEventListener("keydown", handleEscape);
            return () => window.removeEventListener("keydown", handleEscape);
        }
    }, [shareFor]);

    const handleSendBulkInvite = async () => {
        if (!jdId) {
            alert("JD ID is missing. Please go back and select a JD.");
            return;
        }
        if (selectedIds.size === 0) {
            alert("Please select at least one candidate.");
            return;
        }

        try {
            setSendingInvites(true);
            const candidateIds = Array.from(selectedIds);

            const res = await axios.post(
                `${baseUrl}/candidate/send-email/${jdId}`,
                { candidateIds },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (res.data?.success) {
                alert("Invites sent successfully");
                const invitedCandidates = candidates.filter(c => candidateIds.includes(c._id));
                setSelectedIds(new Set());

                navigate("/RecruiterAdmin-Dashboard/JDDetails/GenerateAssessment", {
                    state: {
                        filteredCandidates: invitedCandidates,
                        jdData: null
                    }
                });
            } else {
                alert(res.data?.message || "Failed to send invites");
            }
        } catch (error) {
            console.log(error);
            alert(error.response?.data?.message || "Failed to send invites");
        } finally {
            setSendingInvites(false);
        }
    };

    const handleClear = () => {
        setQ("");
        setSelectedIds(new Set());
    };

    const getExperienceValue = (c) => {
        const val =
            c.experience ??
            c.totalExperience ??
            c.yearsOfExperience ??
            c.experienceYears ??
            c.exp;
        if (val === 0) return 0;
        return val || "NA";
    };

    const getSkillsArray = (c) => {
        const skills = c.skills ?? c.skillSet ?? c.primarySkills ?? c.tags;
        if (!skills) return [];
        if (Array.isArray(skills)) return skills.filter(Boolean);
        if (typeof skills === "string") {
            return skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        }
        return [];
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4">
            {sendingInvites && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4">
                        <SpinLoader />
                        <p className="text-gray-700 font-medium">Sending invites...</p>
                        <p className="text-sm text-gray-500">
                            Please wait while we send invites to {selectedIds.size} candidate(s)
                        </p>
                    </div>
                </div>
            )}

            <div className="mx-auto w-full">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Candidate List
                    </h1>

                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
                        <div className="relative w-full sm:w-[320px]">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search"
                                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-300 focus:ring-2 focus:ring-black/5"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={handleClear}
                                disabled={sendingInvites && selectedIds.size > 0}
                                className="rounded-lg border border-[#5B4CCB] text-[#5B4CCB] bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Clear
                            </button>

                            <button
                                onClick={handleSendBulkInvite}
                                disabled={selectedIds.size === 0 || sendingInvites}
                                className="rounded-lg bg-gradient-to-r from-[#23038b] to-[#6c42f5] 
                                px-4 py-2 text-sm font-medium text-white
                              hover:from-[#332173] hover:to-[#4c2a9a]
                                disabled:cursor-not-allowed disabled:opacity-60 
                                transition-all duration-300"
                            >
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl border border-violet-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] divide-y divide-gray-100">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="w-12 px-4 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all"
                                            className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
                                            checked={allSelected}
                                            onChange={() => {
                                                setSelectedIds((prev) => {
                                                    const next = new Set(prev);
                                                    if (allSelected) {
                                                        currentItems.forEach((c) => next.delete(c._id));
                                                    } else {
                                                        currentItems.forEach((c) => next.add(c._id));
                                                    }
                                                    return next;
                                                });
                                            }}
                                        />
                                    </th>

                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700">
                                        Serial No.
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700">
                                        Candidate Name
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700">
                                        Email
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700">
                                        Phone No.
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700">
                                        Experience
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700">
                                        Skills
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700">
                                        Resume
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10">
                                            <div className="flex justify-center">
                                                <SpinLoader />
                                            </div>
                                        </td>
                                    </tr>
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((c, idx) => {
                                        const exp = getExperienceValue(c);
                                        const skillsArr = getSkillsArray(c);
                                        const visibleSkills = skillsArr.slice(0, 2);
                                        const remaining = skillsArr.length - visibleSkills.length;

                                        return (
                                            <tr key={c._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Select ${c.name}`}
                                                        className="h-4 w-4 rounded border-gray-300 accent-indigo-600"
                                                        checked={selectedIds.has(c._id)}
                                                        onChange={() => {
                                                            setSelectedIds((prev) => {
                                                                const next = new Set(prev);
                                                                next.has(c._id) ? next.delete(c._id) : next.add(c._id);
                                                                return next;
                                                            });
                                                        }}
                                                    />
                                                </td>

                                                <td className="px-4 py-4 text-sm text-gray-800">
                                                    {startIndex + idx + 1}
                                                </td>

                                                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                    {c.name || "NA"}
                                                </td>

                                                <td className="px-4 py-4 text-sm text-gray-700">
                                                    {c.email || "NA"}
                                                </td>

                                                <td className="px-4 py-4 text-sm text-gray-700">
                                                    {c.phone || c.phoneNumber || "NA"}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-green-100 px-2 text-xs font-semibold text-green-700">
                                                        {exp || "NA"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {visibleSkills.map((s) => (
                                                            <span
                                                                key={s}
                                                                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                                                            >
                                                                {s || "NA"}
                                                            </span>
                                                        ))}
                                                        {remaining > 0 && (
                                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                                                +{remaining}
                                                            </span>
                                                        )}
                                                        {skillsArr.length === 0 && (
                                                            <span className="text-xs text-gray-500">NA</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    {c.resume ? (
                                                        <a
                                                            href={c.resume}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2EEFF] text-[#5B4CCB] transition"
                                                            title="View Resume"
                                                            aria-label="View Resume"
                                                        >
                                                            <Eye size={16} />
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">NA</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                                            No candidates found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
                {filtered.length > 0 && (
                    <div className="px-3 sm:px-4 py-3">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {shareFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => setShareFor(null)}
                        aria-hidden
                    />
                    <div className="relative z-10 w-[92%] max-w-2xl rounded-2xl bg-white p-4 sm:p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Link</h3>
                            </div>
                            <button
                                onClick={() => setShareFor(null)}
                                aria-label="Close share modal"
                                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Link
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                                <input
                                    readOnly
                                    value={shareFor.resume || ""}
                                    className="w-full rounded-lg border border-gray-300 bg-gray-100 py-2.5 pl-10 pr-12 text-sm text-gray-700 outline-none focus:border-gray-400 focus:ring-2 focus:ring-black/5"
                                />
                                <button
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(shareFor.resume || "");
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 1500);
                                        } catch {
                                            setCopied(false);
                                            alert("Copy failed. Please copy manually.");
                                        }
                                    }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-600 hover:bg-gray-100"
                                    aria-label="Copy link"
                                    title="Copy link"
                                >
                                    <Copy size={18} />
                                </button>
                            </div>
                            {copied && (
                                <span className="whitespace-nowrap text-xs font-medium text-emerald-600">
                                    Copied!
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}