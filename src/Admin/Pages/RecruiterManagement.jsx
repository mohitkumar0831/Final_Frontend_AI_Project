import React, { useEffect, useMemo, useState } from "react";
import { Search, Trash2, Eye, X } from "lucide-react";
import axios from "axios";
import { baseUrl } from "../../utils/ApiConstants";
import AddNewRecruiter from "../Components/AddNewRecruiter";

function RecruiterManagement() {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState([]);
  const [editingRecruiter, setEditingRecruiter] = useState(null);

  const [statusPopup, setStatusPopup] = useState(null);
  const [selectedActionRecruiter, setSelectedActionRecruiter] = useState(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);

  const itemsPerPage = 8;

  useEffect(() => {
    const fetchAllRecruiter = async () => {
      try {
        const res = await axios.get(`${baseUrl}/admin/allhr`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (res.data.success && res.data.data) {
          const mappedData = res.data.data.map((recruiter, index) => ({
            id: recruiter._id || `temp_${index}`,
            name: recruiter.name || "NA",
            email: recruiter.email || "NA",
            phone: recruiter.phone || "NA",
            status: recruiter.isActive ? "Active" : "Inactive",
            registerId: recruiter.registerId || "NA",
            registerDate: recruiter.createdAt
              ? new Date(recruiter.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
              : "NA",
            lastLogin: recruiter.lastLogin
              ? new Date(recruiter.lastLogin).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              : "NA",
            associates: recruiter.associates || [],
            role: recruiter.role || "HR",
            company: recruiter.company || "NA",
            createdAt: recruiter.createdAt,
          }));

          setRecruiters(mappedData);

          const initialLogs = mappedData.map((r) => ({
            date: r.registerDate,
            action: `HR ${r.name} Created`,
            by: "Admin",
            timestamp: new Date(r.createdAt).getTime(),
          }));

          const deactivatedLogs = mappedData
            .filter((r) => r.status === "Inactive")
            .map((r) => ({
              date: r.registerDate,
              action: `HR ${r.name} Deactivated`,
              by: "Admin",
              timestamp: new Date(r.createdAt).getTime() + 1000,
            }));

          const allLogs = [...initialLogs, ...deactivatedLogs]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

          setActivityLogs(allLogs);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching Recruiter data:", error);
        setLoading(false);
      }
    };

    fetchAllRecruiter();
  }, []);

  const filteredRecruiters = useMemo(() => {
    return [...recruiters]
      .reverse()
      .filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.phone.includes(searchQuery)
      );
  }, [recruiters, searchQuery]);

  const totalPages = Math.ceil(filteredRecruiters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecruiters = filteredRecruiters.slice(startIndex, endIndex);

  useEffect(() => setCurrentPage(1), [searchQuery]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleDelete = async (id) => {
    const recruiterToDelete = recruiters.find((r) => r.id === id);
    const ok = window.confirm(
      `Are you sure you want to delete ${recruiterToDelete?.name || "this recruiter"}?`
    );
    if (!ok) return;

    try {
      const res = await axios.delete(`${baseUrl}/admin/hr/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      alert("HR deleted successfully!");

      if (res.data.success) {
        const newLog = {
          date: new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          action: `HR ${recruiterToDelete?.name || ""} Deleted`,
          by: "Admin",
          timestamp: Date.now(),
        };

        setActivityLogs((prev) => [newLog, ...prev].slice(0, 5));
        setRecruiters((prev) => prev.filter((r) => r.id !== id));

        if (selectedRecruiter?.id === id) {
          setSelectedRecruiter(null);
          setShowDetailsModal(false);
        }

        const newFilteredLength = recruiters.filter((r) => r.id !== id).length;
        const newTotalPages = Math.ceil(newFilteredLength / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      }
    } catch (error) {
      console.error("Error deleting HR:", error);
      alert(error.response?.data?.message || "Failed to delete HR");
    }
  };

  const handleViewDetails = (recruiter) => {
    setSelectedRecruiter(recruiter);
    setShowDetailsModal(true);
  };

  const handleEditHR = (recruiter) => {
    setEditingRecruiter(recruiter);
    setShowAddForm(true);
  };

  const handleSaveRecruiter = (responseData) => {
    if (editingRecruiter) {
      const updatedRecruiters = recruiters.map((r) =>
        r.id === editingRecruiter.id
          ? {
            ...r,
            name: responseData.name || responseData.fullName,
            email: responseData.email,
            phone: responseData.phone,
            company: responseData.company || r.company,
          }
          : r
      );

      setRecruiters(updatedRecruiters);

      if (selectedRecruiter?.id === editingRecruiter.id) {
        setSelectedRecruiter((prev) => ({
          ...prev,
          name: responseData.name || responseData.fullName,
          email: responseData.email,
          phone: responseData.phone,
          company: responseData.company || prev.company,
        }));
      }
    } else {
      const newRecruiter = {
        id: responseData.data?._id || `temp_${Date.now()}`,
        name: responseData.data?.name || responseData.fullName || "NA",
        email: responseData.data?.email || responseData.email || "NA",
        phone: responseData.data?.phone || responseData.phone || "NA",
        status: "Active",
        registerId: `#324459${recruiters.length}`,
        registerDate: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        lastLogin: "Just now",
        associates: [],
        role: "HR",
        company: responseData.data?.company || "NA",
        createdAt: new Date(),
      };

      const newLog = {
        date: newRecruiter.registerDate,
        action: `HR ${newRecruiter.name} Created`,
        by: "Admin",
        timestamp: Date.now(),
      };

      setActivityLogs((prev) => [newLog, ...prev].slice(0, 5));
      setRecruiters((prev) => [...prev, newRecruiter]);
    }

    setShowAddForm(false);
    setEditingRecruiter(null);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingRecruiter(null);
  };

  const handleToggleStatus = async (recruiter) => {
    try {
      const res = await axios.put(
        `${baseUrl}/auth/toggle-user/${recruiter.id}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (res.data.success) {
        const updatedStatus = res.data.data.isActive ? "Active" : "Inactive";

        setRecruiters((prev) =>
          prev.map((r) => (r.id === recruiter.id ? { ...r, status: updatedStatus } : r))
        );

        if (selectedRecruiter?.id === recruiter.id) {
          setSelectedRecruiter((prev) => ({ ...prev, status: updatedStatus }));
        }

        setStatusPopup({ message: `User is now ${updatedStatus}`, type: updatedStatus });
        setTimeout(() => setStatusPopup(null), 2000);

        const newLog = {
          date: new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          action: `HR ${recruiter.name} ${updatedStatus === "Active" ? "Activated" : "Deactivated"
            }`,
          by: "Admin",
          timestamp: Date.now(),
        };

        setActivityLogs((prev) => [newLog, ...prev].slice(0, 5));
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const confirmToggleStatus = async () => {
    if (!selectedActionRecruiter) return;
    await handleToggleStatus(selectedActionRecruiter);
    setShowConfirmPopup(false);
    setSelectedActionRecruiter(null);
  };

  const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "H";
    const b = parts[1]?.[0] || parts[0]?.[1] || "R";
    return (a + b).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading recruiter data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Recruiters</h1>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[260px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-[#6D5DD3]/30"
              />
            </div>

            <button
              onClick={() => {
                setEditingRecruiter(null);
                setShowAddForm(true);
              }}
              className="h-10 px-4 rounded-md bg-gradient-to-r from-[#6E54C3] to-[#AEB0FF] text-white font-medium hover:brightness-95 transition"
            >
              Add New
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D7D2FF] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-[#F7F7FF]">
                <tr className="text-left text-sm text-gray-700">
                  <th className="px-6 py-4 font-semibold">Serial No.</th>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Phone</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {currentRecruiters.length > 0 ? (
                  currentRecruiters.map((recruiter, index) => (
                    <tr key={recruiter.id} className="text-sm text-gray-800 hover:bg-[#FAFAFF]">
                      <td className="px-6 py-4">{startIndex + index + 1}</td>
                      <td className="px-6 py-4">{recruiter.name}</td>
                      <td className="px-6 py-4 text-gray-600">{recruiter.email}</td>
                      <td className="px-6 py-4 text-[#6D5DD3] font-medium">
                        {recruiter.phone}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-medium ${recruiter.status === "Active"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                            }`}
                        >
                          {recruiter.status === "Active" ? "Active" : "In-Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewDetails(recruiter)}
                            className="w-8 h-8 rounded-lg bg-[#F6F6FF] hover:bg-[#EDE9FF] transition flex items-center justify-center"
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-[#5B34F1]" />
                          </button>

                          <button
                            onClick={() => handleDelete(recruiter.id)}
                            className="w-8 h-8 rounded-lg bg-[#FFF6F6] hover:bg-[#FFE4E6] transition flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No recruiters found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredRecruiters.length > 0 && totalPages > 1 && (
            <div className="py-4 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`w-8 h-8 rounded-md border grid place-items-center transition ${currentPage === 1
                    ? "border-gray-200 text-gray-300"
                    : "border-[#6D5DD3]/50 text-[#6D5DD3] hover:bg-[#6D5DD3]/5"
                    }`}
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const active = page === currentPage;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded-md border text-sm font-medium transition ${active
                        ? "bg-[#6D5DD3] border-[#6D5DD3] text-white"
                        : "bg-white border-[#6D5DD3]/40 text-[#6D5DD3] hover:bg-[#6D5DD3]/5"
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`w-8 h-8 rounded-md border grid place-items-center transition ${currentPage === totalPages
                    ? "border-gray-200 text-gray-300"
                    : "border-[#6D5DD3]/50 text-[#6D5DD3] hover:bg-[#6D5DD3]/5"
                    }`}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <AddNewRecruiter
          onSave={handleSaveRecruiter}
          onCancel={handleCancelForm}
          editData={editingRecruiter}
        />
      )}

      {showDetailsModal && selectedRecruiter && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-[560px] bg-white rounded-[22px] shadow-xl overflow-hidden">
            <div className="px-5 py-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-[#F0EEFF] grid place-items-center text-[#6D5DD3] font-semibold text-lg">
                  {getInitials(selectedRecruiter.name)}
                </div>

                <div className="min-w-0">
                  <div className="text-xl font-semibold text-gray-900 truncate">
                    {selectedRecruiter.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {selectedRecruiter.email} <span className="text-gray-400">|</span>{" "}
                    {selectedRecruiter.phone}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 grid place-items-center"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="px-5 pb-5">
              <div className="text-center space-y-2 py-4">
                <div className="text-base font-semibold text-gray-900">
                  Registration Date :{" "}
                  <span className="font-normal text-gray-700">
                    {selectedRecruiter.registerDate}
                  </span>
                </div>

                <div className="text-base font-semibold text-gray-900">
                  Role :{" "}
                  <span className="font-normal text-gray-700">
                    {selectedRecruiter.role || "HR"}
                  </span>
                </div>

                <div className="pt-5">
                  <div className="text-base font-semibold text-gray-900 mb-3">
                    Associate Recruiters:
                  </div>

                  {selectedRecruiter.associates && selectedRecruiter.associates.length > 0 ? (
                    <div className="space-y-1">
                      {selectedRecruiter.associates.map((a, idx) => (
                        <div key={idx} className="text-sm text-gray-700">
                          {a}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No Associates</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedActionRecruiter(selectedRecruiter);
                    setShowConfirmPopup(true);
                  }}
                  className={`flex-1 h-10 rounded-xl border font-medium transition ${selectedRecruiter.status === "Active"
                    ? "border-red-500 text-red-500 hover:bg-red-50"
                    : "border-green-600 text-green-600 hover:bg-green-50"
                    }`}
                >
                  {selectedRecruiter.status === "Active" ? "Deactivate" : "Activate"}
                </button>

                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditHR(selectedRecruiter);
                  }}
                  className="flex-[2] h-10 rounded-xl bg-gradient-to-r from-[#7058C5] to-[#A9A9FB] text-white font-medium hover:brightness-95 transition"
                >
                  Edit HR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmPopup && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[380px] text-center border border-gray-200">
            <div
              className={`mx-auto mb-3 w-12 h-12 flex items-center justify-center rounded-full ${selectedActionRecruiter?.status === "Active" ? "bg-red-100" : "bg-green-100"
                }`}
            >
              {selectedActionRecruiter?.status === "Active" ? "⚠️" : "✅"}
            </div>

            <h2 className="text-lg font-semibold mb-2 text-gray-800">
              Confirm{" "}
              {selectedActionRecruiter?.status === "Active"
                ? "Deactivation"
                : "Activation"}
            </h2>

            <p className="text-gray-600 mb-5">
              Are you sure you want to{" "}
              <span className="font-semibold">
                {selectedActionRecruiter?.status === "Active" ? "Deactivate" : "Activate"}
              </span>{" "}
              <br />
              <span className="text-gray-800 font-medium">
                {selectedActionRecruiter?.name}
              </span>{" "}
              ?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowConfirmPopup(false);
                  setSelectedActionRecruiter(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                onClick={confirmToggleStatus}
                className={`px-4 py-2 rounded-lg text-white font-medium transition ${selectedActionRecruiter?.status === "Active"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
                  }`}
              >
                {selectedActionRecruiter?.status === "Active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecruiterManagement;