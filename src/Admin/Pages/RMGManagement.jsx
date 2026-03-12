import React, { useState, useEffect } from 'react';
import { Search, Trash2, Eye, X } from 'lucide-react';
import Pagination from '../../components/LandingPage/Pagination';
import AddNewRMG from '../Components/AddNewRMG';
import { baseUrl } from '../../utils/ApiConstants';
import axios from 'axios';

function RMGManagement() {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState([]);
  const [editingRMG, setEditingRMG] = useState(null);

  useEffect(() => {
    const fetchAllRMG = async () => {
      try {
        const res = await axios.get(`${baseUrl}/admin/allrmg`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        // console.log(res.data);

        if (res.data.success && res.data.data) {
          const mappedData = res.data.data.map((rmg, index) => ({
            id: rmg._id || `temp_${index}`,
            name: rmg.name || 'NA',
            email: rmg.email || 'NA',
            phone: rmg.phone || 'NA',
            status: rmg.isActive ? 'Active' : 'Inactive',
            registerId: rmg.registerId || 'NA',
            registerDate: rmg.createdAt ? new Date(rmg.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'NA',
            lastLogin: rmg.lastLogin ? new Date(rmg.lastLogin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'NA',
            associates: rmg.associates || [],
            totalRecruiterManaged: rmg.totalRecruiterManaged || 0,
            totalJDHandled: rmg.totalJDHandled || 0,
            candidateSelected: rmg.candidateSelected || 0,
            candidateNotSelected: rmg.candidateNotSelected || 0,
            successRate: rmg.successRate || 0,
            role: rmg.role || 'NA',
            company: rmg.company || 'NA',
            createdAt: rmg.createdAt
          }));

          setRecruiters(mappedData);

          const initialLogs = mappedData.map(rmg => ({
            date: rmg.registerDate,
            action: `RMG ${rmg.name} Created`,
            by: "Admin",
            timestamp: new Date(rmg.createdAt).getTime()
          }));

          const deactivatedLogs = mappedData
            .filter(rmg => rmg.status === 'Inactive')
            .map(rmg => ({
              date: rmg.registerDate,
              action: `RMG ${rmg.name} Deactivated`,
              by: "Admin",
              timestamp: new Date(rmg.createdAt).getTime() + 1000
            }));

          const allLogs = [...initialLogs, ...deactivatedLogs]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

          setActivityLogs(allLogs);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching RMG data:", error);
        setLoading(false);
      }
    }

    fetchAllRMG();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const disableAdd = recruiters.length >= 1 && !showAddForm;

  const itemsPerPage = 5;

  const filteredRecruiters = recruiters.filter(recruiter =>
    recruiter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recruiter.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recruiter.phone.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredRecruiters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecruiters = filteredRecruiters.slice(startIndex, endIndex);

  useEffect(() => {
    if (recruiters.length > 0 && !selectedRecruiter) {
      setSelectedRecruiter(recruiters[0]);
    }
  }, [recruiters, selectedRecruiter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Are you sure you want to delete this RMG?');
    if (!ok) return;

    try {
      const rmgToDelete = recruiters.find(r => r.id === id);

      const res = await axios.delete(`${baseUrl}/admin/rmg/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert("RMG deleted successfully!");

      if (res.data.success) {
        const newLog = {
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          action: `RMG ${rmgToDelete.name} Deleted`,
          by: "Admin",
          timestamp: Date.now()
        };

        setActivityLogs(prev => [newLog, ...prev].slice(0, 5));

        setRecruiters(recruiters.filter(r => r.id !== id));
        if (selectedRecruiter?.id === id) {
          const remaining = recruiters.filter(r => r.id !== id);
          setSelectedRecruiter(remaining.length > 0 ? remaining[0] : null);
          setShowDetails(false);
        }
        const newFilteredLength = recruiters.filter(r => r.id !== id).length;
        const newTotalPages = Math.ceil(newFilteredLength / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      }
    } catch (error) {
      console.error("Error deleting RMG:", error);
      alert(error.response?.data?.message || 'Failed to delete RMG');
    }
  };

  const handleViewDetails = (recruiter) => {
    setSelectedRecruiter(recruiter);
    setShowDetails(true);
  };

  const handleEditRMG = (recruiter) => {
    setEditingRMG(recruiter);
    setShowAddForm(true);
  };

  const handleSaveRMG = (responseData) => {
    if (editingRMG) {
      const updatedRecruiters = recruiters.map(r =>
        r.id === editingRMG.id
          ? {
            ...r,
            name: responseData.name || responseData.fullName,
            email: responseData.email,
            phone: responseData.phone
          }
          : r
      );

      setRecruiters(updatedRecruiters);

      if (selectedRecruiter?.id === editingRMG.id) {
        setSelectedRecruiter({
          ...selectedRecruiter,
          name: responseData.name || responseData.fullName,
          email: responseData.email,
          phone: responseData.phone
        });
      }

      const newLog = {
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        action: `RMG ${responseData.name || responseData.fullName} Updated`,
        by: "Admin",
        timestamp: Date.now()
      };

      setActivityLogs(prev => [newLog, ...prev].slice(0, 5));
    } else {
      const newRecruiter = {
        id: responseData.data?._id || `temp_${Date.now()}`,
        name: responseData.data?.name || responseData.fullName || 'NA',
        email: responseData.data?.email || responseData.email || 'NA',
        phone: responseData.data?.phone || responseData.phone || 'NA',
        status: 'Active',
        registerId: `#324459${recruiters.length}`,
        registerDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        lastLogin: 'Just now',
        associates: [],
        totalRecruiterManaged: 0,
        totalJDHandled: 0,
        candidateSelected: 0,
        candidateNotSelected: 0,
        successRate: 0,
        role: 'RMG',
        company: responseData.data?.company || 'NA',
        createdAt: new Date()
      };

      const newLog = {
        date: newRecruiter.registerDate,
        action: `RMG ${newRecruiter.name} Created`,
        by: "Admin",
        timestamp: Date.now()
      };

      setActivityLogs(prev => [newLog, ...prev].slice(0, 5));
      setRecruiters([...recruiters, newRecruiter]);
    }

    setShowAddForm(false);
    setEditingRMG(null);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingRMG(null);
  };

  const handleToggleStatus = (recruiter) => {
    const updatedRecruiters = recruiters.map(r => {
      if (r.id === recruiter.id) {
        return { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return r;
    });

    setRecruiters(updatedRecruiters);
    setSelectedRecruiter({ ...recruiter, status: recruiter.status === 'Active' ? 'Inactive' : 'Active' });

    const newLog = {
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      action: `RMG ${recruiter.name} ${recruiter.status === 'Active' ? 'Deactivated' : 'Activated'}`,
      by: "Admin",
      timestamp: Date.now()
    };

    setActivityLogs(prev => [newLog, ...prev].slice(0, 5));
  };

  const handleSuspend = (recruiter) => {
    const newLog = {
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      action: `RMG ${recruiter.name} Suspended`,
      by: "Admin",
      timestamp: Date.now()
    };

    setActivityLogs(prev => [newLog, ...prev].slice(0, 5));
  };

  const formatRegisterDate = (recruiter) => {
    if (!recruiter?.createdAt) return recruiter?.registerDate || 'NA';
    const d = new Date(recruiter.createdAt);
    if (Number.isNaN(d.getTime())) return recruiter?.registerDate || 'NA';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replaceAll('/', '-');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading RMG data...</div>
      </div>
    );
  }

  const rolePillClass = (role) => {
    if (String(role).toLowerCase() === 'rmg') return 'bg-purple-100 text-purple-700';
    if (String(role).toLowerCase() === 'admin') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const statusPillClass = (status) => {
    if (status === 'Active') return 'bg-green-50 text-green-600';
    return 'bg-orange-50 text-red-500';
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Recruiters</h1>

          <div className="flex items-center gap-3">
            <div className="relative w-[220px] sm:w-[280px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#7C5CFC]/20 focus:border-[#7C5CFC]"
              />
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={disableAdd}
              title={disableAdd ? 'An RMG already exists' : ''}
              className={`${disableAdd ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#7C5CFC] text-white hover:bg-[#6A49FC]'} h-9 px-4 rounded-md text-sm font-medium transition`}
            >
              Add New
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D9D2FF] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead className="bg-[#F4F2FF]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800">Serial No.</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800">Register Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {currentRecruiters.length > 0 ? (
                  currentRecruiters.map((recruiter, index) => (
                    <tr key={recruiter.id} className="bg-white">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {recruiter.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {recruiter.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatRegisterDate(recruiter)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${rolePillClass(recruiter.role)}`}>
                          {recruiter.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold ${statusPillClass(recruiter.status)}`}>
                          {recruiter.status === 'Active' ? 'Active' : 'In-Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(recruiter)}
                            className="w-8 h-8 rounded-lg bg-[#F6F6FF] hover:bg-[#EDE9FF] transition flex items-center justify-center"
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
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500 text-sm">
                      No recruiters found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredRecruiters.length > 0 && (
            <div className="py-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {showAddForm && (
          <div className="mt-6">
            <AddNewRMG
              onSave={handleSaveRMG}
              onCancel={handleCancelForm}
              editData={editingRMG}
            />
          </div>
        )}

        {showDetails && selectedRecruiter && (
          <div
            className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4"
            onClick={() => setShowDetails(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-[28px] p-6 sm:p-7 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">Recruiter Details</h2>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${rolePillClass(selectedRecruiter.role)}`}>
                    {selectedRecruiter.role}
                  </span>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 transition flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-semibold text-gray-900">Name :</span>
                  <span className="text-gray-700">{selectedRecruiter.name}</span>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="font-semibold text-gray-900">Email :</span>
                  <span className="text-gray-700">{selectedRecruiter.email}</span>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="font-semibold text-gray-900">Register Date :</span>
                  <span className="text-gray-700">{formatRegisterDate(selectedRecruiter)}</span>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="font-semibold text-gray-900">Status :</span>
                  <span className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold ${statusPillClass(selectedRecruiter.status)}`}>
                    {selectedRecruiter.status === 'Active' ? 'Active' : 'In-Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RMGManagement;