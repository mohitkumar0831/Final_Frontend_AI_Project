import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Eye, FileCheck, Search, Ticket, X } from "lucide-react";
import axios from "axios";
import Pagination from "../../components/LandingPage/Pagination";
import { baseUrl } from "../../utils/ApiConstants";
import icon1 from "../../img/TT.png";
import icon2 from "../../img/PT.png";
import icon3 from "../../img/CT.png"
import card1 from "../../img/ISL.png"
import card2 from "../../img/TFL.png"
import card3 from "../../img/ISL.png"
import RMGSupportTickets from "./RMGSupportTickets";

const RMGRaiseTickets = () => {
    const navigate = useNavigate();
    const [isRaiseOpen, setIsRaiseOpen] = useState(false);
    const [activeTab] = useState("All");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchId, setSearchId] = useState("");
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${baseUrl}/tickets/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.data?.success) setTickets(res.data.tickets || []);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

    const calculatedStats = useMemo(() => {
        const pending = tickets.filter((t) => t.status === "Open").length;
        const closed = tickets.filter((t) => t.status === "Closed").length;
        const resolved = tickets.filter((t) => t.status === "Resolved").length;

        return { total: tickets.length, pending, closed, resolved };
    }, [tickets]);

    const stats = useMemo(
        () => [
            {
                label: "Total Tickets",
                value: calculatedStats.total,
                iconImg: icon1,
                cardImg: card1,
                valueClass: "text-indigo-600",
            },
            {
                label: "Pending Tickets",
                value: calculatedStats.pending,
                iconImg: icon2,
                cardImg: card2,
                valueClass: "text-rose-500",
            },
            {
                label: "Closed Tickets",
                value: calculatedStats.closed,
                iconImg: icon3,
                cardImg: card3,
                valueClass: "text-violet-600",
            },
        ],
        [calculatedStats]
    );

    const filteredTickets = useMemo(() => {
        let filtered = tickets;

        if (activeTab === "Pending") filtered = filtered.filter((t) => t.status === "Open");
        else if (activeTab === "Closed") filtered = filtered.filter((t) => t.status === "Closed");
        else if (activeTab === "Resolved") filtered = filtered.filter((t) => t.status === "Resolved");

        if (searchId) {
            filtered = filtered.filter((t) =>
                (t.subject || "").toLowerCase().includes(searchId.toLowerCase())
            );
        }

        return [...filtered].reverse();
    }, [activeTab, searchId, tickets]);

    const itemsPerPage = 8;
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const paginatedTickets = filteredTickets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatDateShort = (dateString) => {
        if (!dateString) return "N/A";
        const d = new Date(dateString);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}-${mm}-${yy}`;
    };

    const displayStatus = (status) => (status === "Open" ? "Pending" : status);

    const statusPill = (status) => {
        const s = displayStatus(status);
        if (s === "Closed") return "bg-green-50 text-green-600";
        if (s === "Pending") return "bg-orange-50 text-orange-600";
        if (s === "Resolved") return "bg-indigo-50 text-indigo-600";
        return "bg-gray-50 text-gray-600";
    };

    const priorityPill = (priority) => {
        if (priority === "High") return "bg-red-50 text-red-600";
        if (priority === "Medium") return "bg-amber-50 text-amber-700";
        if (priority === "Low") return "bg-green-50 text-green-700";
        return "bg-gray-50 text-gray-600";
    };

    const rolePill = (role) => {
        const r = (role || "").toLowerCase();
        if (r.includes("rmg")) return "bg-fuchsia-50 text-fuchsia-700";
        if (r.includes("candidate")) return "bg-pink-50 text-pink-700";
        if (r.includes("admin")) return "bg-sky-50 text-sky-700";
        if (r.includes("recruit")) return "bg-emerald-50 text-emerald-700";
        return "bg-gray-50 text-gray-700";
    };

    const getRaisedByName = (t) => t?.raisedBy?.name || "N/A";

    const Sparkline = ({ className = "" }) => (
        <svg viewBox="0 0 120 40" className={`w-28 h-8 ${className}`} fill="none">
            <path
                d="M2 30 C 15 22, 22 34, 34 26 C 46 18, 56 30, 70 22 C 84 14, 96 24, 118 12"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

    const openDetails = (ticket) => {
        setSelectedTicket(ticket);
        setIsDetailsOpen(true);
    };

    const closeDetails = () => {
        setIsDetailsOpen(false);
    };

    return (
        <div className="min-h-screen">
            <div className="">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                    {stats.map((s, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl border border-indigo-50 shadow-sm px-5 py-5 min-h-[140px] flex flex-col justify-between"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="text-sm text-gray-600">{s.label}</div>
                                <img src={s.iconImg} alt="" className="w-10 h-10 object-contain" />
                            </div>

                            <div className="flex justify-between items-center gap-4">
                                <div className={`text-4xl font-bold leading-none ${s.valueClass}`}>{s.value}</div>
                                <img src={s.cardImg} alt="" className="w-28 h-12 object-contain" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-row-reverse gap-3 mb-3">

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by Subject"
                                value={searchId}
                                onChange={(e) => {
                                    setSearchId(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-64 max-w-[75vw] h-10 pl-10 pr-3 rounded-lg border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>

                        <button
                            onClick={() => setIsRaiseOpen(true)}
                            className="h-10 px-4 rounded-lg bg-gradient-to-r from-[#735BC7] to-[#AAA9FB] text-white text-sm font-medium hover:bg-purple-700"
                        >
                            Raise Tickets
                        </button>

                        <RMGSupportTickets
                            isOpen={isRaiseOpen}
                            onClose={() => setIsRaiseOpen(false)}
                        />

                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-purple-300 shadow-sm overflow-hidden">

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px]">
                            <thead className="bg-[#F5F5FF]">
                                <tr className="text-left text-xs font-semibold text-gray-700">
                                    <th className="px-8 py-4">Serial No.</th>
                                    <th className="px-8 py-4">Raised By</th>
                                    <th className="px-8 py-4">Role</th>
                                    <th className="px-8 py-4">Subject</th>
                                    <th className="px-8 py-4">Created on</th>
                                    <th className="px-8 py-4">Priority</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4 text-center">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-10 text-center text-sm text-gray-700">
                                            Loading tickets...
                                        </td>
                                    </tr>
                                ) : paginatedTickets.length ? (
                                    paginatedTickets.map((t, idx) => (
                                        <tr key={t._id || idx} className="hover:bg-purple-50">
                                            <td className="px-8 py-4 text-sm text-gray-800">
                                                {(currentPage - 1) * itemsPerPage + idx + 1}
                                            </td>

                                            <td className="px-8 py-4 text-sm text-gray-800">{getRaisedByName(t)}</td>

                                            <td className="px-8 py-4">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${rolePill(
                                                        t.role
                                                    )}`}
                                                >
                                                    {t.role || "N/A"}
                                                </span>
                                            </td>

                                            <td className="px-8 py-4 text-sm text-gray-800 max-w-[360px] truncate">
                                                {t.subject || "N/A"}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-700">
                                                {formatDateShort(t.createdAt)}
                                            </td>

                                            <td className="px-8 py-4">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${priorityPill(
                                                        t.priority
                                                    )}`}
                                                >
                                                    {t.priority || "N/A"}
                                                </span>
                                            </td>

                                            <td className="px-8 py-4">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusPill(
                                                        t.status
                                                    )}`}
                                                >
                                                    {displayStatus(t.status) || "N/A"}
                                                </span>
                                            </td>

                                            <td className="px-8 py-4">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        onClick={() => openDetails(t)}
                                                        className="h-7 w-7 grid place-items-center rounded-lg bg-[#F6F6FF] text-[#5B4CCB] hover:bg-[#F2EEFF] transition"
                                                        aria-label="View JD Summary"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-10 text-center text-sm text-gray-500">
                                            No tickets found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(p) => setCurrentPage(p)}
                    />
                )}
            </div>

            {isDetailsOpen && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={closeDetails} />
                    <div className="relative w-full max-w-sm bg-white rounded-[28px] shadow-2xl overflow-hidden">
                        <div className="px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-xl font-bold text-gray-900">Support Ticket Details</div>
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${rolePill(
                                        selectedTicket.role
                                    )}`}
                                >
                                    {selectedTicket.role || "N/A"}
                                </span>
                            </div>

                            <button
                                onClick={closeDetails}
                                className="h-10 w-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
                            >
                                <X className="w-5 h-5 text-gray-900" />
                            </button>
                        </div>

                        <div className="px-6 pb-6">
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-center gap-2">
                                    <span className="font-semibold text-gray-900">Subject :</span>
                                    <span className="text-gray-600">{selectedTicket.subject || "N/A"}</span>
                                </div>

                                <div className="flex justify-center gap-2">
                                    <span className="font-semibold text-gray-900">Raised By :</span>
                                    <span className="text-gray-600">{getRaisedByName(selectedTicket)}</span>
                                </div>

                                <div className="flex justify-center gap-2">
                                    <span className="font-semibold text-gray-900">Email :</span>
                                    <span className="text-gray-600">{selectedTicket?.raisedBy?.email || "N/A"}</span>
                                </div>

                                <div className="flex justify-center gap-2">
                                    <span className="font-semibold text-gray-900">Created Date :</span>
                                    <span className="text-gray-600">{formatDateShort(selectedTicket.createdAt)}</span>
                                </div>

                                <div className="flex justify-center gap-2">
                                    <span className="font-semibold text-gray-900">Updated Date :</span>
                                    <span className="text-gray-600">{formatDateShort(selectedTicket.updatedAt)}</span>
                                </div>

                                <div className="flex justify-center gap-2">
                                    <span className="font-semibold text-gray-900">Assigned to :</span>
                                    <span className="text-gray-600">
                                        {selectedTicket?.assignedTo?.name || "Not Assigned"}
                                    </span>
                                </div>

                                <div className="flex justify-center gap-6 pt-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">Priority :</span>
                                        <span
                                            className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-medium ${priorityPill(
                                                selectedTicket.priority
                                            )}`}
                                        >
                                            {selectedTicket.priority || "N/A"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">Status :</span>
                                        <span
                                            className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-medium ${statusPill(
                                                selectedTicket.status
                                            )}`}
                                        >
                                            {displayStatus(selectedTicket.status) || "N/A"}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-5">
                                    <div className="border-t border-dashed  pt-4">
                                        <div className="text-center font-semibold text-gray-900 mb-3">Description</div>
                                        <div className="text-center text-gray-600 leading-relaxed whitespace-pre-wrap">
                                            {selectedTicket.description || "N/A"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RMGRaiseTickets;