import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import SupportTicketDetail from '../Components/SupportTicketsDetail';
import { baseUrl } from '../../utils/ApiConstants';
import RaiseTickets from './RaiseTickets';
import TT from "../../img/TT.png";
import APT from "../../img/APT.png";
import CT from "../../img/CT.png";
import ISL from "../../img/ISL.png";
import TAL from "../../img/TAL.png";

const getRolePill = (role) => {
    const key = (role || '').toLowerCase();
    if (key.includes('rmg')) return 'bg-purple-100 text-purple-700';
    if (key.includes('candidate')) return 'bg-pink-100 text-pink-700';
    if (key.includes('admin')) return 'bg-blue-100 text-blue-700';
    if (key.includes('recruiter')) return 'bg-emerald-100 text-emerald-700';
    return 'bg-gray-100 text-gray-700';
};

const getPriorityPill = (priority) => {
    if (priority === 'High') return 'bg-red-100 text-red-600';
    if (priority === 'Medium') return 'bg-amber-100 text-amber-700';
    if (priority === 'Low') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
};

const getStatusPill = (status) => {
    if (status === 'Closed') return 'bg-green-100 text-green-700';
    if (status === 'Resolved') return 'bg-blue-100 text-blue-700';
    return 'bg-orange-100 text-orange-700';
};

const getStatusLabel = (status) => {
    if (status === 'Open') return 'Pending';
    return status || 'Pending';
};

const Tickets = () => {
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isRaiseOpen, setIsRaiseOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [allTickets, setAllTickets] = useState([]);

    const fetchTickets = async () => {
        try {
            const res = await axios.get(`${baseUrl}/tickets/`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (res.data.success && res.data.tickets) {
                const mappedTickets = res.data.tickets.map((ticket) => ({
                    id: `#${ticket._id.slice(-5)}`,
                    reporter: ticket.raisedBy?.name || 'NA',
                    subject: ticket.subject,
                    status: ticket.status,
                    startDate: new Date(ticket.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    role: ticket.role || ticket.raisedBy?.role || 'N/A',
                    priority: ticket.priority,
                    description: ticket.description,
                    email: ticket.raisedBy?.email || '',
                    assignedTo: ticket.assignedTo,
                    _id: ticket._id,
                    raisedBy: ticket.raisedBy,
                }));

                setAllTickets(mappedTickets);
            }
        } catch (error) {
            console.log('Error fetching tickets:', error);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const calculatedStats = useMemo(() => {
        const pending = allTickets.filter((t) => t.status === 'Open').length;
        const closed = allTickets.filter((t) => t.status === 'Closed').length;
        return { total: allTickets.length, pending, closed };
    }, [allTickets]);

    const filteredTickets = useMemo(() => {
        let filtered = allTickets;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter((ticket) =>
                ticket.id.toLowerCase().includes(query) ||
                ticket.reporter.toLowerCase().includes(query) ||
                ticket.subject.toLowerCase().includes(query) ||
                ticket.role.toLowerCase().includes(query) ||
                (ticket.priority || '').toLowerCase().includes(query) ||
                ticket.status.toLowerCase().includes(query)
            );
        }

        return [...filtered].reverse();
    }, [searchQuery, allTickets]);

    const itemsPerPage = 8;
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);

    const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const openDetail = (ticket) => {
        setSelectedTicket(ticket);
        setIsDetailOpen(true);
    };

    const closeDetail = () => {
        setIsDetailOpen(false);
        setSelectedTicket(null);
    };

    const handleLocalTicketUpdate = ({ _id, status }) => {
        setAllTickets((prev) => prev.map((t) => (t._id === _id ? { ...t, status } : t)));
        setSelectedTicket((prev) => (prev && prev._id === _id ? { ...prev, status } : prev));
    };

    const statCards = [
        {
            label: 'Total Tickets',
            value: calculatedStats.total,
            iconImage: TT,
            image: ISL,
            valueColor: 'text-indigo-600',
        },
        {
            label: 'Pending Tickets',
            value: calculatedStats.pending,
            iconImage: APT,
            image: TAL,
            valueColor: 'text-rose-500',
        },
        {
            label: 'Closed Tickets',
            value: calculatedStats.closed,
            iconImage: CT,
            image: ISL,
            valueColor: 'text-indigo-600',
        },
    ];

    return (
        <div className="min-h-screen">
            <div className="max-w-6xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {statCards.map((s, idx) => {
                        const words = s.label.split(' ');
                        const firstWord = words[0];
                        const restWords = words.slice(1).join(' ');

                        return (
                            <div key={idx} className="rounded-xl bg-white px-5 py-4 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <p className="text-lg font-medium text-gray-500">
                                        {firstWord}
                                        {restWords && (
                                            <>
                                                <br />
                                                {restWords}
                                            </>
                                        )}
                                    </p>
                                    <div className="h-9 w-9">
                                        <img src={s.iconImage} alt="" className="h-full w-full object-contain" />
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <p className={`text-3xl font-bold ${s.valueColor}`}>{s.value}</p>
                                    <img src={s.image} alt="" className="h-8" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="text-base font-semibold text-gray-900">Ticket List</div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search by ID, name, subject..."
                                className="w-[200px] sm:w-[260px] h-9 rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>

                        <button
                            onClick={() => setIsRaiseOpen(true)}
                            className="h-9 px-4 rounded-md bg-[#6D5BD0] text-white text-sm font-medium shadow-sm hover:opacity-95"
                        >
                            Raise Tickets
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-[#D7D0FF] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#F3F2FF]">
                                <tr className="text-xs font-semibold text-gray-700">
                                    <th className="px-5 py-4 text-left whitespace-nowrap">Serial No.</th>
                                    <th className="px-5 py-4 text-left whitespace-nowrap">Raised By</th>
                                    <th className="px-5 py-4 text-left whitespace-nowrap">Role</th>
                                    <th className="px-5 py-4 text-left whitespace-nowrap">Subject</th>
                                    <th className="px-5 py-4 text-left whitespace-nowrap">Created on</th>
                                    <th className="px-5 py-4 text-left whitespace-nowrap">Priority</th>
                                    <th className="px-5 py-4 text-left whitespace-nowrap">Status</th>
                                    <th className="px-5 py-4 text-center whitespace-nowrap">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {paginatedTickets.length ? (
                                    paginatedTickets.map((t, idx) => (
                                        <tr key={`${t._id}-${idx}`} className="hover:bg-[#FAFAFF]">
                                            <td className="px-5 py-4 text-sm text-gray-700">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                            <td className="px-5 py-4 text-sm text-gray-800">{t.reporter}</td>
                                            <td className="px-5 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRolePill(t.role)}`}>{t.role}</span>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-800 max-w-[280px] truncate">{t.subject}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">{t.startDate}</td>
                                            <td className="px-5 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityPill(t.priority)}`}>
                                                    {t.priority || 'Normal'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-4 py-1 rounded-full text-xs font-medium ${getStatusPill(t.status)}`}>
                                                    {getStatusLabel(t.status)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => openDetail(t)}
                                                        className="w-8 h-8 rounded-lg bg-[#F6F6FF] hover:bg-[#EDE9FF] transition flex items-center justify-center"
                                                    >
                                                        <Eye className="w-4 h-4 text-[#5B34F1]" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-500">
                                            No tickets found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredTickets.length > 0 && totalPages > 1 && (
                        <div className="py-4 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="w-8 h-8 rounded-md border border-[#D7D0FF] text-[#6D5BD0] grid place-items-center bg-white disabled:opacity-40"
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {Array.from({ length: totalPages }).map((_, i) => {
                                const page = i + 1;
                                const active = page === currentPage;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-md border grid place-items-center text-sm ${active
                                            ? 'bg-[#6D5BD0] text-white border-[#6D5BD0]'
                                            : 'bg-white text-[#6D5BD0] border-[#D7D0FF] hover:bg-[#F3F2FF]'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="w-8 h-8 rounded-md border border-[#D7D0FF] text-[#6D5BD0] grid place-items-center bg-white disabled:opacity-40"
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <SupportTicketDetail
                isOpen={isDetailOpen}
                onClose={closeDetail}
                selectedTicket={selectedTicket}
                onTicketUpdated={handleLocalTicketUpdate}
            />

            <RaiseTickets
                isOpen={isRaiseOpen}
                onClose={() => setIsRaiseOpen(false)}
                onSuccess={() => fetchTickets()}
            />
        </div>
    );
};

export default Tickets;