import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import axios from "axios";
import { baseUrl } from "../../utils/ApiConstants";
import NotificationBell from '../../components/NotificationBell';
import { useNavigate, useLocation } from "react-router-dom";

const CandidateHeader = ({ onMenuToggle }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [dateTime, setDateTime] = useState("");
    const location = useLocation();

    const getNavTitle = () => {
        const path = location.pathname;
        if (path.includes("/AllJds")) return "Open Positions";
        if (path.includes("/AppliedJD")) return "Applied Jobs";
        if (path.includes("/Examination")) return "Online Assessment";
        if (path.includes("/Report")) return "Evaluation Summary";
        return "Dashboard";
    };

    const formatDateTime = () => {
        const now = new Date();
        const date = now.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
        const time = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
        return `${date} | ${time}`;
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("candidateToken");
                const res = await axios.get(`${baseUrl}/candidate/profile/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(res.data.candidate);
            } catch (err) {
                console.error("Error fetching user:", err);
            }
        };
        fetchUser();
        setDateTime(formatDateTime());
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-1 w-full">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <button
                        onClick={onMenuToggle}
                        className="lg:hidden p-1.5 sm:p-2 rounded hover:bg-gray-100 flex-shrink-0"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="min-w-0 flex-1">
                        <p className="text-[7px] sm:text-xs text-gray-500 mb-2">
                            {getNavTitle()}
                        </p>
                        <h2 className="text-sm sm:text-lg font-semibold text-gray-800 truncate leading-tight">
                            Welcome, {user?.name?.split(' ')[0] || "..."}
                        </h2>
                        <p className="text-[9px] sm:text-xs leading-tight">
                            {dateTime}
                        </p>
                    </div>
                </div>

                <div className="flex items-center flex-shrink-0 ml-2">
                    {user && user._id && <NotificationBell userId={user._id} />}
                </div>
            </div>
        </header>
    );
};

export default CandidateHeader;