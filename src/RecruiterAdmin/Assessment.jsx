import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AssessmentAPI from "./api/generateAssessmentApi";
import SpinLoader from "../components/SpinLoader";

function Assessment() {
  const navigate = useNavigate();
  const [openSkillPopup, setOpenSkillPopup] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const [search, setSearch] = useState("");
  const [jobTitleSort, setJobTitleSort] = useState("none");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchAssessments = async () => {
      try {
        const json = await AssessmentAPI.getAllFinalizedTests();
        if (!mounted) return;

        if (!json || !Array.isArray(json)) {
          setError("Failed to fetch assessments");
          setData([]);
        } else {
          setData(json);
        }
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAssessments();
    return () => {
      mounted = false;
    };
  }, []);

  const sortedByDate = useMemo(() => {
    return [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = sortedByDate.filter((row) => {
      if (!q) return true;

      const title = (row.title || "").toLowerCase();
      const company = (row.company || "").toLowerCase();
      const skills = Array.isArray(row.skills)
        ? row.skills
          .map((s) => (typeof s === "string" ? s : s?.skill || ""))
          .join(" ")
          .toLowerCase()
        : "";

      return title.includes(q) || company.includes(q) || skills.includes(q);
    });

    if (jobTitleSort !== "none") {
      list = [...list].sort((a, b) => {
        const at = (a.title || "").toLowerCase();
        const bt = (b.title || "").toLowerCase();
        if (at < bt) return jobTitleSort === "asc" ? -1 : 1;
        if (at > bt) return jobTitleSort === "asc" ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [sortedByDate, search, jobTitleSort]);

  const totalPages = Math.ceil(filteredAndSorted.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = filteredAndSorted.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, jobTitleSort]);

  const toggleJobTitleSort = () => {
    setJobTitleSort((prev) => (prev === "none" ? "asc" : prev === "asc" ? "desc" : "none"));
  };

  const EyeIcon = ({ className = "w-4 h-4" }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ChevronLeft = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ChevronRight = ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const SortIcon = ({ direction }) => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 10l4-4 4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={direction === "asc" ? 1 : 0.35}
      />
      <path
        d="M16 14l-4 4-4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={direction === "desc" ? 1 : 0.35}
      />
    </svg>
  );

  return (
    <div className="min-h-screen">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-[18px] font-semibold text-[#1f2340]">Assessment Details</h1>

        <div className="relative w-[240px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-300"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-[0_10px_30px_rgba(67,56,202,0.08)]">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="bg-[#f6f5ff] text-[#2b2f4a]">
                <th className="px-8 py-4 text-left font-semibold">Serial No.</th>

                <th className="px-6 py-4 text-left font-semibold">
                  <button
                    type="button"
                    onClick={toggleJobTitleSort}
                    className="inline-flex items-center gap-2"
                    title="Sort by Job Title"
                  >
                    Job Title
                    <span className="text-[#2b2f4a]">
                      <SortIcon direction={jobTitleSort} />
                    </span>
                  </button>
                </th>

                <th className="px-6 py-4 text-left font-semibold">Created On</th>
                <th className="px-6 py-4 text-left font-semibold">Skill</th>
                <th className="px-6 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10">
                    <div className="flex justify-center">
                      <SpinLoader />
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No assessments found
                  </td>
                </tr>
              ) : (
                currentData.map((row, idx) => {
                  const id = (row.question_set_id || row.job_id || "").toString().replace("#", "");
                  return (
                    <tr
                      key={row.question_set_id || row.job_id || idx}
                      className="border-t border-gray-100 hover:bg-[#fbfbff] transition"
                    >
                      <td className="px-8 py-5 text-[#1f2340]">{startIndex + idx + 1}.</td>

                      <td className="px-6 py-5 text-[#1f2340]">{row.title || "-"}</td>

                      <td className="px-6 py-5 text-[#1f2340]">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString("en-GB")
                          : "-"}
                      </td>

                      <td className="px-6 py-5">
                        {row.skills && row.skills.length > 0 ? (() => {
                          const skillNames = row.skills
                            .map((skill) => {
                              const name = typeof skill === "string" ? skill : skill?.skill || "";
                              return name.replace(/^"|"$/g, "").trim();
                            })
                            .filter((s) => s.length > 0);

                          if (skillNames.length === 0) {
                            return <span className="text-xs text-gray-400">No skills</span>;
                          }

                          const visibleSkills = skillNames.slice(0, 3);
                          const remainingSkills = skillNames.slice(3);
                          const hasMore = remainingSkills.length > 0;
                          const popupId = row.question_set_id || row.job_id || idx;

                          return (
                            <>
                              <div className="flex items-center gap-2">
                                {visibleSkills.map((s, sIdx) => (
                                  <span
                                    key={`${popupId}-skill-${sIdx}`}
                                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-[#1f2340] whitespace-nowrap"
                                  >
                                    {s}
                                  </span>
                                ))}
                                {hasMore && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenSkillPopup(openSkillPopup === popupId ? null : popupId);
                                    }}
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 hover:bg-indigo-200 transition cursor-pointer"
                                  >
                                    +{remainingSkills.length}
                                  </button>
                                )}
                              </div>

                              {openSkillPopup === popupId && (
                                <div
                                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                                  onClick={() => setOpenSkillPopup(null)}
                                >
                                  <div
                                    className="bg-white rounded-2xl shadow-2xl border border-indigo-200 p-6 min-w-[320px] max-w-[480px] w-[90vw] sm:w-auto"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-between mb-4">
                                      <h3 className="text-sm font-bold text-[#2b2f4a]">
                                        All Skills — {row.title || "Assessment"}
                                      </h3>
                                      <button
                                        type="button"
                                        onClick={() => setOpenSkillPopup(null)}
                                        className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition text-lg leading-none cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {skillNames.map((s, sIdx) => (
                                        <span
                                          key={`popup-${popupId}-skill-${sIdx}`}
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
                        })() : (
                          <span className="text-xs text-gray-400">No skills</span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <button
                            onClick={() =>
                              navigate(
                                `/RecruiterAdmin-Dashboard/Assessment/QuestionsList/${id}`
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center  rounded-lg bg-[#F2EEFF] text-[#5B4CCB] transition"
                            title="View"
                            aria-label="View"
                          >
                            <EyeIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-md border border-indigo-200 bg-white text-indigo-700 disabled:opacity-40"
              aria-label="Previous page"
              title="Previous"
            >
              <span className="flex items-center justify-center">
                <ChevronLeft />
              </span>
            </button>

            {(() => {
              const pageGroup = Math.ceil(currentPage / 5);
              const startPage = (pageGroup - 1) * 5 + 1;
              const endPage = Math.min(startPage + 4, totalPages);

              return Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
                const page = startPage + i;
                const active = page === currentPage;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={[
                      "h-8 w-8 rounded-md border text-sm font-medium",
                      active
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50",
                    ].join(" ")}
                  >
                    {page}
                  </button>
                );
              });
            })()}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-md border border-indigo-200 bg-white text-indigo-700 disabled:opacity-40"
              aria-label="Next page"
              title="Next"
            >
              <span className="flex items-center justify-center">
                <ChevronRight />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Assessment;