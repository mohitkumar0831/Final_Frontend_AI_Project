import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Search, Eye, ChevronDown } from "lucide-react";
import Pagination from "../components/LandingPage/Pagination";
import { superAdminBaseUrl } from "../utils/ApiConstants";

function StatCard({
    label,
    value,
    iconImage,
    chartImage,
    valueColor = "text-indigo-600",
}) {
    const [firstWord, ...rest] = (label || "").split(" ");
    const restWords = rest.join(" ");

    const s = { valueColor: valueColor };
    const image = chartImage;

    return (
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm border border-gray-100">
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
                    {iconImage ? (
                        <img
                            src={iconImage}
                            alt=""
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <div className="h-full w-full rounded-lg bg-indigo-100" />
                    )}
                </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
                <p className={`text-3xl font-bold ${s.valueColor}`}>{value}</p>
                {image ? <img src={image} alt="" className="h-8" /> : null}
            </div>
        </div>
    );
}

function EnquiryMessages() {
    const [currentPage, setCurrentPage] = useState(1);
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");

    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState(
        "Ok, we will look on this issue as soon as possible."
    );
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [sending, setSending] = useState(false);

    const [selectedIds, setSelectedIds] = useState(new Set());

    const itemsPerPage = 7;
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => {
        const fetchTotalEnquiry = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${superAdminBaseUrl}/enquiry/all`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                const data = response.data;
                console.log(data);


                if (data.status === "success" && data.data) {
                    setTickets(data.data);
                    setFilteredTickets(data.data);
                }
                setLoading(false);
            } catch (error) {
                console.error("Fetch error:", error);
                setLoading(false);
            }
        };

        fetchTotalEnquiry();
    }, []);

    const normalizeStatus = (t) => {
        const s = (t?.status || "Pending").toString().toLowerCase();
        if (s === "closed" || s === "resolved") return "Closed";
        return "Pending";
    };

    const totals = useMemo(() => {
        const total = tickets.length || 0;
        const pending = tickets.filter((t) => normalizeStatus(t) === "Pending")
            .length;
        const closed = tickets.filter((t) => normalizeStatus(t) === "Closed").length;
        return { total, pending, closed };
    }, [tickets]);

    const applySearch = (value) => {
        const term = (value || "").trim();
        if (term === "") {
            setFilteredTickets(tickets);
        } else {
            const filtered = tickets.filter((ticket) => {
                const idMatch =
                    ticket._id && ticket._id.toLowerCase().includes(term.toLowerCase());
                const emailMatch =
                    ticket.emailid &&
                    ticket.emailid.toLowerCase().includes(term.toLowerCase());
                return idMatch || emailMatch;
            });
            setFilteredTickets(filtered);
        }
        setCurrentPage(1);
    };

    const handleSearch = () => applySearch(searchTerm);

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        applySearch(value);
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const handleViewClick = (ticket) => {
        setSelectedTicket(ticket);
        setPopupMessage(ticket?.message || "NA");
        setShowPopup(true);
    };

    const handleClosePopup = () => {
        setShowPopup(false);
        setSelectedTicket(null);
        setPopupMessage("Ok, we will look on this issue as soon as possible.");
    };

    const handleSaveMessage = () => {
        if (!selectedTicket) return;
        setShowPopup(false);
        setSelectedTicket(null);
        setPopupMessage("Ok, we will look on this issue as soon as possible.");
    };

    const getFieldValue = (value) => value || "NA";

    const formatDate = (dateString) => {
        if (!dateString) return "NA";
        const date = new Date(dateString);
        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yy = String(date.getFullYear()).slice(-2);
        return `${dd}-${mm}-${yy}`;
    };

    const getInitials = (name) => {
        if (!name) return "NA";
        return name
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    const isAllCurrentSelected =
        currentItems.length > 0 &&
        currentItems.every((t) => t?._id && selectedIds.has(t._id));

    const toggleSelectAllCurrent = () => {
        const next = new Set(selectedIds);
        if (isAllCurrentSelected) {
            currentItems.forEach((t) => t?._id && next.delete(t._id));
        } else {
            currentItems.forEach((t) => t?._id && next.add(t._id));
        }
        setSelectedIds(next);
    };

    const toggleSelectOne = (id) => {
        if (!id) return;
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleMarkResolved = () => {
        if (selectedIds.size === 0) return;

        const update = (arr) =>
            arr.map((t) =>
                selectedIds.has(t?._id) ? { ...t, status: "Closed" } : t
            );

        const nextTickets = update(tickets);
        setTickets(nextTickets);

        const term = searchTerm;
        const nextFiltered = update(filteredTickets);
        setFilteredTickets(nextFiltered);

        setSelectedIds(new Set());

        setCurrentPage(1);

        void term;
    };

    const statCards = [
        {
            label: "Total Enquiries",
            value: totals.total,
            valueColor: "text-indigo-600",
            iconImage: null,
            chartImage: null,
        },
        {
            label: "Pending Enquiries",
            value: totals.pending,
            valueColor: "text-pink-500",
            iconImage: null,
            chartImage: null,
        },
        {
            label: "Closed Enquiries",
            value: totals.closed,
            valueColor: "text-indigo-600",
            iconImage: null,
            chartImage: null,
        },
    ];

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {statCards.map((c, idx) => (
                        <StatCard key={idx} {...c} />
                    ))}
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Enquiries</h2>

                    <div className="flex items-center gap-3">
                        <div className="relative w-full md:w-[240px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={handleSearchInputChange}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="w-full h-9 pl-9 pr-3 rounded-md border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <button
                            onClick={handleMarkResolved}
                            disabled={selectedIds.size === 0}
                            className="h-9 px-4 rounded-md bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Mark As Resolved
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-indigo-50 border-b border-indigo-100">
                                <tr className="text-left text-xs font-semibold text-gray-700">
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={isAllCurrentSelected}
                                            onChange={toggleSelectAllCurrent}
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="px-4 py-3 whitespace-nowrap">Serial No.</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Company Name</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Email</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Phone</th>
                                    <th className="px-4 py-3 whitespace-nowrap">Created on</th>
                                    <th className="px-4 py-3 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1">
                                            Status <ChevronDown className="w-3.5 h-3.5" />
                                        </span>
                                    </th>
                                    <th className="px-4 py-3 whitespace-nowrap">Message</th>
                                    <th className="px-4 py-3 whitespace-nowrap text-center">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-6 py-10 text-center text-gray-500"
                                        >
                                            Loading...
                                        </td>
                                    </tr>
                                ) : currentItems.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-6 py-10 text-center text-gray-500"
                                        >
                                            No enquiries found
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((ticket, index) => {
                                        const status = normalizeStatus(ticket);
                                        const isSelected =
                                            ticket?._id && selectedIds.has(ticket._id);

                                        return (
                                            <tr key={ticket._id || index} className="hover:bg-gray-50">
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!isSelected}
                                                        onChange={() => toggleSelectOne(ticket?._id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                </td>

                                                <td className="px-4 py-4 text-sm text-gray-800">
                                                    {indexOfFirstItem + index + 1}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3 min-w-[180px]">
                                                        <span className="text-sm text-gray-900">
                                                            {getFieldValue(ticket.companyName)}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-sm text-gray-800">
                                                    {getFieldValue(ticket.emailid)}
                                                </td>

                                                <td className="px-4 py-4 text-sm text-gray-800">
                                                    {getFieldValue(ticket.phone)}
                                                </td>

                                                <td className="px-4 py-4 text-sm text-gray-800 whitespace-nowrap">
                                                    {formatDate(ticket.createdAt)}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={[
                                                            "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium",
                                                            status === "Closed"
                                                                ? "bg-green-50 text-green-600"
                                                                : "bg-orange-50 text-orange-600",
                                                        ].join(" ")}
                                                    >
                                                        {status}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-sm text-gray-800 max-w-[240px] truncate">
                                                    {getFieldValue(ticket.message)}
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => handleViewClick(ticket)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                                        title="View"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!loading && filteredTickets.length > 0 && (
                    <div className="mt-5">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {showPopup && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-[460px] bg-white rounded-[32px] shadow-2xl overflow-hidden">
                        <div className="relative px-8 pt-8">
                            <h3 className="text-2xl font-semibold text-gray-900 text-center">
                                Enquiry Details
                            </h3>

                            <button
                                onClick={handleClosePopup}
                                className="absolute right-6 top-6 text-2xl leading-none text-gray-700 hover:text-gray-900"
                                aria-label="Close"
                            >
                                ×
                            </button>

                            <div className="mt-8 space-y-2 text-[17px]">
                                <div className="flex items-center justify-center gap-2 text-center flex-wrap">
                                    <span className="font-semibold text-gray-900">Company Name</span>
                                    <span className="font-semibold text-gray-900">:</span>
                                    <span className="text-gray-600">
                                        {getFieldValue(selectedTicket?.companyName)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-center flex-wrap">
                                    <span className="font-semibold text-gray-900">Raised By</span>
                                    <span className="font-semibold text-gray-900">:</span>
                                    <span className="text-gray-600">
                                        {getFieldValue(
                                            selectedTicket?.raisedBy ||
                                            selectedTicket?.name ||
                                            selectedTicket?.fullName
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-center flex-wrap">
                                    <span className="font-semibold text-gray-900">Email</span>
                                    <span className="font-semibold text-gray-900">:</span>
                                    <span className="text-gray-600">
                                        {getFieldValue(selectedTicket?.emailid)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-center flex-wrap">
                                    <span className="font-semibold text-gray-900">Phone</span>
                                    <span className="font-semibold text-gray-900">:</span>
                                    <span className="text-gray-600">
                                        {getFieldValue(selectedTicket?.phone)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-center flex-wrap">
                                    <span className="font-semibold text-gray-900">Date Created</span>
                                    <span className="font-semibold text-gray-900">:</span>
                                    <span className="text-gray-600">
                                        {formatDate(selectedTicket?.createdAt)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-center gap-3 text-center flex-wrap">
                                    <span className="font-semibold text-gray-900">Status</span>
                                    <span className="font-semibold text-gray-900">:</span>

                                    <span
                                        className={[
                                            "inline-flex items-center justify-center rounded-full px-7 py-2 text-sm font-medium",
                                            normalizeStatus(selectedTicket) === "Closed"
                                                ? "bg-green-50 text-green-600"
                                                : "bg-orange-50 text-orange-500",
                                        ].join(" ")}
                                    >
                                        {normalizeStatus(selectedTicket)}
                                    </span>
                                </div>
                            </div>

                            <div className="my-3 border-t border-dashed border-gray-300" />

                            <h4 className="text-xl font-semibold text-gray-900 text-center">
                                Message
                            </h4>

                            <p className="mt-4 pb-10 text-center text-gray-600 leading-relaxed px-2">
                                {getFieldValue(selectedTicket?.message)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EnquiryMessages;