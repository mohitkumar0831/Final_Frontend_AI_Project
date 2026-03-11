import React, { useEffect, useState, useRef } from "react";
import { Search, Bell, MessageCircle, Menu, ChevronDown } from "lucide-react";
import axios from "axios";
import { baseUrl } from "../../utils/ApiConstants";
import { useNavigate } from "react-router-dom";
import NotificationBell from '../../components/NotificationBell';



const CandidateHeader = ({ onMenuToggle }) => {
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('candidateToken');
        localStorage.removeItem('candidate');
        navigate('/Candidatelogin');
    };

    const handleProfile = () => {
        setDropdownOpen(false);
        navigate('/Candidate-Dashboard/CandidateProfile');
    };

    const [dateTime, setDateTime] = useState("");

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
                const res = await axios.get(`${baseUrl}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUser(res.data.data);
            } catch (err) {
                console.error("Error fetching user:", err);
            }
        };
        fetchUser();
        setDateTime(formatDateTime());
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-2">
                {/* Left Section */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                    <button
                        onClick={onMenuToggle}
                        className="lg:hidden p-1.5 sm:p-2 rounded hover:bg-gray-100 flex-shrink-0"
                    >
                        <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <div className="min-w-0">
                        <h2 className="text-xs sm:text-lg font-semibold text-gray-800 truncate">
                            Welcome, {user?.name?.split(' ')[0] || "..."}
                        </h2>
                        <p className="text-[9px] sm:text-sm text-gray-500">
                            {dateTime}
                        </p>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
                    {/* Notification Bell */}
                    <div className="scale-[0.8] sm:scale-100 origin-right">
                        {user && user._id && <NotificationBell userId={user._id} />}
                    </div>

                    {/* Profile Dropdown */}
                    <div
                        className="relative border border-gray-200 rounded-lg p-1 sm:p-2 flex items-center gap-1 sm:gap-3 cursor-pointer hover:bg-gray-50"
                        ref={dropdownRef}
                        onClick={() => setDropdownOpen((prev) => !prev)}
                    >
                        {/* Avatar */}
                        <div className="w-6 h-6 sm:w-9 sm:h-9 bg-purple-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-sm font-semibold flex-shrink-0">
                            {user?.name ? user.name[0].toUpperCase() : "?"}
                        </div>

                        {/* Name & Role - Hide below 380px */}
                        <div className="hidden min-[380px]:block min-w-0 max-w-[80px] sm:max-w-[120px]">
                            <span className="text-[10px] sm:text-sm font-medium text-gray-800 truncate block">
                                {user?.name || "Loading..."}
                            </span>
                            <span className="text-[8px] sm:text-xs text-gray-500 block">
                                {user?.role || "Candidate"}
                            </span>
                        </div>

                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />

                        {dropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-28 sm:w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                <button
                                    onClick={handleProfile}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-700 rounded-t-lg text-xs sm:text-sm"
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600 rounded-b-lg text-xs sm:text-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default CandidateHeader;