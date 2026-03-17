import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import ResumeSummary from "./ResumeSummary";
import { useNavigate, useLocation } from "react-router-dom";
import { baseUrl } from "../utils/ApiConstants";
import axios from "axios";

function JDDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const jdData = location.state?.jdData || null;

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showResumeSummary, setShowResumeSummary] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [currentPageTable1, setCurrentPageTable1] = useState(1);
  const itemsPerPageTable1 = 5;

  const [currentPageTable2, setCurrentPageTable2] = useState(1);
  const itemsPerPageTable2 = 5;

  const [pendingCandidates, setPendingCandidates] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [jdDetails, setJdDetails] = useState(jdData);

  const [pendingSearchTerm, setPendingSearchTerm] = useState("");
  const [selectedPendingIds, setSelectedPendingIds] = useState(() => new Set());
  const headerCheckboxRef = useRef(null);
  const [hasAutoFiltered, setHasAutoFiltered] = useState(false);

  // util: ensure id is a valid Mongo ObjectId string
  const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

  useEffect(() => {
    const fetchCandidateAppliedJDs = async () => {
      try {
        const token = localStorage.getItem("token");
        const jdId = jdData?._id;

        if (!jdId) {
          return;
        }

        const response = await axios.get(`${baseUrl}/jd/${jdId}/candidatess`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const allCandidates = response.data.data || [];
          const pending = allCandidates.filter((candidate) => {
            const status = candidate.status?.toLowerCase();
            return status === "pending" || status === "applied" || !status;
          });
          setPendingCandidates(pending);
        }
      } catch (error) {
        console.error("Error fetching JDs:", error);
      }
    };

    fetchCandidateAppliedJDs();
  }, [jdData?._id]);

  useEffect(() => {
    if (pendingCandidates.length > 0 && !hasAutoFiltered && !isFiltering) {
      setHasAutoFiltered(true);
      let allIds = pendingCandidates.map(getPendingSelectableId).filter(id => id);
      // sanitize ids to valid ObjectId format
      allIds = allIds.filter(isValidObjectId);
      console.log("auto-filter: pending ids", allIds);
      setSelectedPendingIds(new Set(allIds));
      // Trigger filtering with provided ids
      handleFilterResumes(allIds).catch(() => {
        // if something goes wrong we want to retry next time candidates change
        setHasAutoFiltered(false);
      });
    }
  }, [pendingCandidates, hasAutoFiltered, isFiltering]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const appliedCandidates = jdDetails?.appliedCandidates || [];
  const filteredCandidatesList = jdDetails?.filteredCandidates || [];
  const unfilteredCandidatesList = jdDetails?.unfilteredCandidates || [];

  const mappedCandidates = [
    ...filteredCandidatesList.map((fc) => {
      const appliedInfo = appliedCandidates.find(
        (ac) => ac.candidate === fc.candidate || ac._id === fc.candidate || ac.candidateId === fc.candidate
      );
      return {
        id: fc.candidate,
        name: appliedInfo?.name || "N/A",
        email: appliedInfo?.email || "N/A",
        phone: appliedInfo?.phone || "N/A",
        resume: appliedInfo?.resume || "",
        isFiltered: true,
        experience: appliedInfo?.experience || "N/A",
        aiScore: fc.aiScore || 0,
        aiExplanation: fc.aiExplanation || "",
        appliedAt: formatDate(appliedInfo?.appliedAt),
        isProcessed: true,
      };
    }),
    ...unfilteredCandidatesList.map((uc) => {
      const appliedInfo = appliedCandidates.find(
        (ac) => ac.candidate === uc.candidate || ac._id === uc.candidate || ac.candidateId === uc.candidate
      );
      return {
        id: uc.candidate,
        name: appliedInfo?.name || "N/A",
        email: appliedInfo?.email || "N/A",
        phone: appliedInfo?.phone || "N/A",
        resume: appliedInfo?.resume || "",
        isFiltered: false,
        experience: appliedInfo?.experience || "N/A",
        aiScore: uc.aiScore || 0,
        aiExplanation: uc.aiExplanation || "",
        appliedAt: formatDate(appliedInfo?.appliedAt),
        isProcessed: true,
      };
    }),
  ];

  const getFilteredData = () => {
    let data = mappedCandidates.filter((c) => c.isProcessed);

    if (activeTab === "filtered") {
      data = data.filter((candidate) => candidate.isFiltered === true);
    } else if (activeTab === "unfiltered") {
      data = data.filter((candidate) => candidate.isFiltered === false);
    }

    if (searchTerm) {
      data = data.filter((candidate) => candidate.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return data;
  };

  const filteredCandidates = getFilteredData();

  const filteredCount = mappedCandidates.filter((c) => c.isFiltered === true && c.isProcessed).length;
  const unfilteredCount = mappedCandidates.filter((c) => c.isFiltered === false && c.isProcessed).length;

  const pendingCandidatesFiltered = useMemo(() => {
    if (!pendingSearchTerm.trim()) return pendingCandidates;
    const q = pendingSearchTerm.toLowerCase();
    return pendingCandidates.filter((c) => {
      const name = c.name || c.candidate?.name || "";
      return name.toLowerCase().includes(q);
    });
  }, [pendingCandidates, pendingSearchTerm]);

  const totalPagesTable1 = Math.ceil(pendingCandidatesFiltered.length / itemsPerPageTable1);
  const startIndexTable1 = (currentPageTable1 - 1) * itemsPerPageTable1;
  const endIndexTable1 = startIndexTable1 + itemsPerPageTable1;
  const currentDataTable1 = pendingCandidatesFiltered.slice(startIndexTable1, endIndexTable1);

  const totalPagesTable2 = Math.ceil(filteredCandidates.length / itemsPerPageTable2);
  const startIndexTable2 = (currentPageTable2 - 1) * itemsPerPageTable2;
  const endIndexTable2 = startIndexTable2 + itemsPerPageTable2;
  const currentDataTable2 = filteredCandidates.slice(startIndexTable2, endIndexTable2);

  const handlePageChangeTable1 = (newPage) => {
    if (newPage >= 1 && newPage <= totalPagesTable1) setCurrentPageTable1(newPage);
  };

  const handlePageChangeTable2 = (newPage) => {
    if (newPage >= 1 && newPage <= totalPagesTable2) setCurrentPageTable2(newPage);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPageTable2(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPageTable2(1);
  };

  const handleViewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowResumeSummary(true);
  };

  const getPendingSelectableId = (candidate) => {
    if (!candidate) return null;

    const possibleIds = [
      candidate?.candidate?._id,
      typeof candidate?.candidate === 'string' ? candidate.candidate : null,
      candidate?.candidateId,
      candidate?._id,
      candidate?.id,
    ];

    const foundId = possibleIds.find((id) => {
      if (!id) return false;
      if (typeof id === 'string' && id.length > 0) return true;
      if (typeof id === 'object' && id.toString) return true;
      return false;
    });

    const resultId = foundId ? (typeof foundId === 'object' ? foundId.toString() : foundId) : null;

    return resultId;
  };

  const allSelectableIds = useMemo(() => {
    const ids = pendingCandidatesFiltered
      .map(getPendingSelectableId)
      .filter((id) => id !== null && id !== undefined);
    return ids;
  }, [pendingCandidatesFiltered]);

  const allChecked = allSelectableIds.length > 0 && allSelectableIds.every((id) => selectedPendingIds.has(id));
  const someChecked = allSelectableIds.some((id) => selectedPendingIds.has(id));

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = !allChecked && someChecked;
    }
  }, [allChecked, someChecked]);

  const togglePendingSelection = (id) => {
    if (!id) return;
    setSelectedPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedPendingIds((prev) => {
      const next = new Set(prev);

      if (allChecked) {
        allSelectableIds.forEach((id) => next.delete(id));
      } else {
        allSelectableIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const handleFilterResumes = async (providedIds = null) => {
    let selectedIds = providedIds || Array.from(selectedPendingIds);
    // clean by type and format
    selectedIds = selectedIds.filter(isValidObjectId);
    console.log("filterResumes called with IDs", selectedIds);

    if (selectedIds.length === 0) {
      alert("Please select at least one candidate to filter");
      return;
    }

    const validIds = selectedIds.filter((selectedId) => {
      return pendingCandidates.some((pc) => {
        const pcId = getPendingSelectableId(pc);
        return pcId === selectedId;
      });
    });
    console.log("valid ids after cross-check", validIds);

    if (validIds.length === 0) {
      alert("Selected candidates are no longer available for filtering");
      return;
    }

    try {
      setIsFiltering(true);
      const token = localStorage.getItem("token");
      const jdId = jdDetails?._id;

      if (!jdId) {
        alert("No JD ID available");
        setIsFiltering(false);
        return;
      }

      const requestBody = validIds.length ? { candidateIds: validIds } : {};
      console.log("sending filter request", requestBody);
      const response = await axios.post(
        `${baseUrl}/jd/${jdId}/filter-resumes`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const newlyProcessedIds = new Set([
          ...(response.data.filtered || []).map((f) => f.id),
          ...(response.data.unfiltered || []).map((u) => u.id),
        ]);

        setPendingCandidates((prevPending) => {
          const updated = prevPending.filter((pc) => {
            const pcId = getPendingSelectableId(pc);
            const shouldRemove = pcId && newlyProcessedIds.has(pcId);
            return !shouldRemove;
          });
          return updated;
        });

        setSelectedPendingIds((prev) => {
          const next = new Set(prev);
          newlyProcessedIds.forEach((id) => next.delete(id));
          return next;
        });

        setCurrentPageTable1(1);

        setJdDetails((prevJdDetails) => {
          const existingFilteredCandidates = [...(prevJdDetails?.filteredCandidates || [])];
          const existingUnfilteredCandidates = [...(prevJdDetails?.unfilteredCandidates || [])];

          const newFilteredCandidates = (response.data.filtered || []).map((f) => ({
            candidate: f.id,
            aiScore: f.score,
            aiExplanation: f.explanation,
          }));

          const newUnfilteredCandidates = (response.data.unfiltered || []).map((u) => ({
            candidate: u.id,
            aiScore: u.score,
            aiExplanation: u.explanation,
          }));

          const existingFilteredIds = new Set(existingFilteredCandidates.map((c) => c.candidate));
          const existingUnfilteredIds = new Set(existingUnfilteredCandidates.map((c) => c.candidate));

          const mergedFilteredCandidates = [
            ...existingFilteredCandidates,
            ...newFilteredCandidates.filter((c) => !existingFilteredIds.has(c.candidate)),
          ];

          const mergedUnfilteredCandidates = [
            ...existingUnfilteredCandidates,
            ...newUnfilteredCandidates.filter((c) => !existingUnfilteredIds.has(c.candidate)),
          ];

          const updatedAppliedCandidates = (prevJdDetails?.appliedCandidates || []).map((candidate) => {
            const candidateId = candidate.candidate;

            if (candidateId && newlyProcessedIds.has(candidateId)) {
              const filteredData = (response.data.filtered || []).find((f) => f.id === candidateId);
              const unfilteredData = (response.data.unfiltered || []).find((u) => u.id === candidateId);

              if (filteredData) {
                return {
                  ...candidate,
                  status: "filtered",
                  aiScore: filteredData.score,
                  aiExplanation: filteredData.explanation,
                };
              }

              if (unfilteredData) {
                return {
                  ...candidate,
                  status: "unfiltered",
                  aiScore: unfilteredData.score,
                  aiExplanation: unfilteredData.explanation,
                };
              }
            }

            return candidate;
          });

          return {
            ...prevJdDetails,
            filteredCandidates: mergedFilteredCandidates,
            unfilteredCandidates: mergedUnfilteredCandidates,
            appliedCandidates: updatedAppliedCandidates,
          };
        });

        setCurrentPageTable2(1);

        const userConfirmed = window.confirm("Filtering completed! Go back to check filtered candidates?");
        if (userConfirmed) {
          navigate("/RecruiterAdmin-Dashboard/JD", { state: { highlightJdId: jdDetails?._id } });
        }
      } else {
        alert(response.data.message || "Filtering failed. Please try again.");
      }
    } catch (error) {
      console.error("filterResumes error", error.response || error);
      const errorMessage = error.response?.data?.message || "Error filtering resumes. Please try again.";
      alert(errorMessage);
    } finally {
      setIsFiltering(false);
    }
  };

  const PaginationBar = ({ currentPage, totalPages, onPageChange }) => {
    if (!totalPages || totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center
            ${currentPage === 1 ? "opacity-40 cursor-not-allowed border-[#C9C2FF]" : "border-[#C9C2FF] hover:bg-[#F3F1FF]"}`}
        >
          <ChevronLeft size={16} className="text-[#5B4BFF]" />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg border text-sm font-medium
              ${p === currentPage ? "bg-[#5B4BFF] text-white border-[#5B4BFF]" : "bg-white text-[#5B4BFF] border-[#C9C2FF] hover:bg-[#F3F1FF]"}`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center
            ${currentPage === totalPages ? "opacity-40 cursor-not-allowed border-[#C9C2FF]" : "border-[#C9C2FF] hover:bg-[#F3F1FF]"}`}
        >
          <ChevronRight size={16} className="text-[#5B4BFF]" />
        </button>
      </div>
    );
  };

  const ScoreBadge = ({ score }) => {
    const s = Number(score || 0);
    const deg = Math.max(0, Math.min(100, s)) * 3.6;
    const color = s >= 70 ? "#16a34a" : s >= 40 ? "#f59e0b" : "#ef4444";

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold" style={{ color }}>
          {s}%
        </span>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: `conic-gradient(${color} ${deg}deg, #E5E7EB 0deg)` }}
        >
          <div className="w-4 h-4 rounded-full bg-white" />
        </div>
      </div>
    );
  };

  const getCandidateDisplayValue = (candidate, field) => {
    if (candidate[field]) return candidate[field];
    if (candidate.candidate && typeof candidate.candidate === 'object') {
      return candidate.candidate[field] || "N/A";
    }
    return "N/A";
  };

  return (
    <div className="min-h-screen">
      <div className="">
        <div className="overflow-hidden mb-6">
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Pending Candidate List ({pendingCandidates.length})
            </h2>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <input
                  value={pendingSearchTerm}
                  onChange={(e) => {
                    setPendingSearchTerm(e.target.value);
                    setCurrentPageTable1(1);
                  }}
                  placeholder="Search"
                  className="w-full h-10 bg-white border border-[#D7D2FF] rounded-lg pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#5B4BFF]/20 focus:border-[#5B4BFF]/40"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="px-3 pb-2 relative">
            <div className="border border-[#D7D2FF] rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-[#F3F1FF] text-gray-700 border-b border-[#E6E2FF]">
                    <th className="py-3 px-4 w-12">
                      <input
                        ref={headerCheckboxRef}
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleSelectAll}
                        disabled={allSelectableIds.length === 0}
                        className="w-4 h-4 accent-[#5B4BFF] rounded"
                      />
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">Serial No.</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">Candidate Name</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">Email</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">Phone No.</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">Applied On</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">Reallocation Status</th>
                  </tr>
                </thead>

                <tbody>
                  {currentDataTable1.length > 0 ? (
                    currentDataTable1.map((candidate, idx) => {
                      const id = getPendingSelectableId(candidate);
                      const isChecked = id ? selectedPendingIds.has(id) : false;

                      const name = getCandidateDisplayValue(candidate, 'name');
                      const email = getCandidateDisplayValue(candidate, 'email');
                      const phone = getCandidateDisplayValue(candidate, 'phone');
                      const appliedOn = candidate.appliedAt ? formatDate(candidate.appliedAt) : "N/A";

                      return (
                        <tr
                          key={id || `pending-${startIndexTable1 + idx}`}
                          className="border-b border-[#F1EEFF] last:border-b-0 hover:bg-[#FAF9FF]"
                        >
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => id && togglePendingSelection(id)}
                              disabled={!id}
                              className="w-4 h-4 accent-[#5B4BFF] rounded"
                            />
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-800">{startIndexTable1 + idx + 1}</td>
                          <td className="py-4 px-4 text-sm text-gray-800">{name}</td>
                          <td className="py-4 px-4 text-sm text-gray-600">{email}</td>
                          <td className="py-4 px-4 text-sm text-gray-600">{phone}</td>
                          <td className="py-4 px-4 text-sm text-gray-600">{appliedOn}</td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E9FBEA] text-[#16a34a]">
                              {candidate.reallocate ? "Yes" : "No"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
                        No pending candidates found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {isFiltering && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-2xl z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#5B4BFF]" />
                  <p className="text-sm text-gray-600">Filtering resumes...</p>
                </div>
              </div>
            )}

            {!isFiltering && <PaginationBar
              currentPage={currentPageTable1}
              totalPages={totalPagesTable1}
              onPageChange={handlePageChangeTable1}
            />}
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Candidate List</h2>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full h-10 bg-white border border-[#D7D2FF] rounded-lg pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#5B4BFF]/20 focus:border-[#5B4BFF]/40"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              <button
                onClick={() => {
                  const onlyFiltered = mappedCandidates.filter((c) => c.isFiltered === true);
                  const filteredIds = onlyFiltered.map((c) => c.id);
                  localStorage.setItem("filteredCandidateIds", JSON.stringify(filteredIds));
                  navigate("/RecruiterAdmin-Dashboard/JDDetails/GenerateAssessment", {
                    state: { filteredCandidates: onlyFiltered, jdData: jdDetails },
                  });
                }}
                className="h-10 px-4 rounded-lg text-sm font-medium bg-[#5B4BFF] hover:bg-[#4A3CF0] text-white transition-colors"
              >
                Generate Assessment
              </button>
            </div>
          </div>

          <div className="hidden">
            <button onClick={() => handleTabChange("all")}>All ({filteredCount + unfilteredCount})</button>
            <button onClick={() => handleTabChange("filtered")}>Filtered ({filteredCount})</button>
            <button onClick={() => handleTabChange("unfiltered")}>Unfiltered ({unfilteredCount})</button>
          </div>

          <div className="px-3 pb-2">
            <div className="border border-[#D7D2FF] rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-[#F3F1FF] text-gray-700 border-b border-[#E6E2FF]">
                    <th className="py-3 px-4 text-left text-xs font-semibold">Serial No.</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">Candidate Name</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">Email</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">Phone No.</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">FitBit Score</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {currentDataTable2.length > 0 ? (
                    currentDataTable2.map((candidate, idx) => (
                      <tr
                        key={candidate.id || `candidate-${idx}`}
                        className="border-b border-[#F1EEFF] last:border-b-0 hover:bg-[#FAF9FF]"
                      >
                        <td className="py-4 px-4 text-sm text-gray-800">{startIndexTable2 + idx + 1}</td>
                        <td className="py-4 px-4 text-sm text-gray-800">{candidate.name}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{candidate.email}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{candidate.phone}</td>
                        <td className="py-4 px-4">
                          <ScoreBadge score={candidate.aiScore} />
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                              ${candidate.isFiltered ? "bg-[#E9FBEA] text-[#16a34a]" : "bg-[#FDECEC] text-[#ef4444]"}`}
                          >
                            {candidate.isFiltered ? "Filtered" : "Unfiltered"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleViewCandidate(candidate)}
                            className="w-9 h-9 rounded-full border border-[#D7D2FF] bg-white hover:bg-[#F3F1FF] flex items-center justify-center"
                          >
                            <Eye size={16} className="text-[#5B4BFF]" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
                        No candidates found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              currentPage={currentPageTable2}
              totalPages={totalPagesTable2}
              onPageChange={handlePageChangeTable2}
            />
          </div>
        </div>

        {showResumeSummary && (
          <ResumeSummary onClose={() => setShowResumeSummary(false)} candidate={selectedCandidate} />
        )}
      </div>
    </div>
  );
}

export default JDDetails;