import React, { useEffect, useState, useMemo } from "react";
import img from "../img/cd.png";
import TF from "../img/RIS.png";
import IF from "../img/TFC1.png";
import TU from "../img/TUC1.png";
import TA from "../img/TAC1.png";
import TAL from "../img/candidate-TA.png";
import TFL from "../img/candidate-TC.png";
import ISL from "../img/candidate-TF.png";
import CTU from "../img/candidate-TU.png";
import RDbanner from "../img/banner-image.png";

import axios from "axios";
import { baseUrl } from "../utils/ApiConstants";
import IntelligentHiringHero from "./Component/IntelligentHiringAgent";
import { Link } from "react-router-dom";
import Pagination from "../components/LandingPage/Pagination";

const RecruiterDashboard = () => {
    const [recentCandidates, setRecentCandidates] = useState([]);
    const [pieChartView, setPieChartView] = useState('total');
    const [user, setUser] = useState(null);
    const [assignedJDs, setAssignedJDs] = useState([]);
    const [createdJDs, setCreatedJDs] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [recentAssignedJDs, setRecentAssignedJDs] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([]);
    const [hoveredBar, setHoveredBar] = useState(null);
    const [totalFiltered, setTotalFiltered] = useState(0);
    const [totalUnfiltered, setTotalUnfiltered] = useState(0);
    const [totalApplications, setTotalApplications] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const candidatesPerPage = 8;

    const stats = [
        {
            title: "Total Applicants",
            value: totalApplications,
            img: TA,
            text: "text-purple-800",
            line: TAL,
        },
        {
            title: "Total Filtered",
            value: totalFiltered,
            img: TF,
            text: "text-pink-500",
            line: TFL,
        },
        {
            title: "Total JD Created",
            value: createdJDs.length || 0,
            img: IF,
            text: "text-blue-500",
            line: ISL,
        },
        {
            title: "Total Unfiltered",
            value: totalUnfiltered,
            img: TU,
            text: "text-orange-500",
            line: CTU,
        },
    ];

    const getAvailableYears = (assigned, created) => {
        const years = new Set();
        assigned.forEach(jd => {
            if (jd.createdAt) {
                years.add(new Date(jd.createdAt).getFullYear());
            }
        });
        created.forEach(jd => {
            if (jd.createdAt) {
                years.add(new Date(jd.createdAt).getFullYear());
            }
        });
        return Array.from(years).sort((a, b) => b - a);
    };

    const processMonthlyData = (assigned, created, year) => {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const monthlyStats = months.map((month, index) => {
            const assignedCount = assigned.filter(jd => {
                if (!jd.createdAt) return false;
                const date = new Date(jd.createdAt);
                return date.getMonth() === index && date.getFullYear() === year;
            }).length;
            const createdCount = created.filter(jd => {
                if (!jd.createdAt) return false;
                const date = new Date(jd.createdAt);
                return date.getMonth() === index && date.getFullYear() === year;
            }).length;
            return {
                month,
                monthIndex: index,
                assigned: assignedCount,
                created: createdCount,
                year
            };
        });
        return monthlyStats;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    const getRecentAssignedJDs = (jds) => {
        return [...jds]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4);
    };

    const getPieChartData = () => {
        if (pieChartView === 'monthly') {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const monthlyAssigned = assignedJDs.filter(jd => {
                if (!jd.createdAt) return false;
                const date = new Date(jd.createdAt);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }).length;

            const monthlyCreated = createdJDs.filter(jd => {
                if (!jd.createdAt) return false;
                const date = new Date(jd.createdAt);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }).length;

            const total = monthlyAssigned + monthlyCreated;
            if (total === 0) return { assignedPercent: 50, createdPercent: 50, total: 0 };
            const assignedPercent = Math.round((monthlyAssigned / total) * 100);
            const createdPercent = 100 - assignedPercent;
            return { assignedPercent, createdPercent, total };
        } else {
            const totalAssigned = assignedJDs.length;
            const totalCreated = createdJDs.length;
            const total = totalAssigned + totalCreated;
            if (total === 0) return { assignedPercent: 50, createdPercent: 50, total: 0 };
            const assignedPercent = Math.round((totalAssigned / total) * 100);
            const createdPercent = 100 - assignedPercent;
            return { assignedPercent, createdPercent, total };
        }
    };

    const getYearTotals = () => {
        const assignedTotal = monthlyData.reduce((sum, m) => sum + m.assigned, 0);
        const createdTotal = monthlyData.reduce((sum, m) => sum + m.created, 0);
        return { assignedTotal, createdTotal };
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const token = localStorage.getItem("token");
                const [
                    candidatesRes,
                    assignedOffersRes,
                    jdByRecruiterRes
                ] = await Promise.all([
                    axios.get(`${baseUrl}/jd/all-candidates`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${baseUrl}/jd/assigned-offers/hr`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${baseUrl}/jd/created-by/hr`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                ]);

                const assignedData = assignedOffersRes.data.success ? assignedOffersRes.data.data || [] : [];
                const createdData = jdByRecruiterRes.data.success ? jdByRecruiterRes.data.data || [] : [];
                if (candidatesRes.data.success) {
                    setCandidates(candidatesRes.data.data || []);
                }
                setAssignedJDs(assignedData);
                setRecentAssignedJDs(getRecentAssignedJDs(assignedData));
                setCreatedJDs(createdData);
                const years = getAvailableYears(assignedData, createdData);
                setAvailableYears(years);
                const currentYear = new Date().getFullYear();
                const yearToSelect = years.includes(currentYear) ? currentYear : (years[0] || currentYear);
                setSelectedYear(yearToSelect);
                const monthly = processMonthlyData(assignedData, createdData, yearToSelect);
                setMonthlyData(monthly);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        if (assignedJDs.length > 0 || createdJDs.length > 0) {
            const monthly = processMonthlyData(assignedJDs, createdJDs, selectedYear);
            setMonthlyData(monthly);
        }
    }, [selectedYear, assignedJDs, createdJDs]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${baseUrl}/auth/meAll`, {
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
    }, []);

    useEffect(() => {
        const fetchAllCandidates = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${baseUrl}/offer/all-candidates-filtered`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log("All Candidates:", res.data);

                if (res.data.success) {
                    const allCandidates = res.data.data || [];

                    setRecentCandidates(allCandidates);
                    setTotalApplications(allCandidates.length);
                    setTotalFiltered(allCandidates.filter(c => c.status === 'filtered').length);
                    setTotalUnfiltered(allCandidates.filter(c => c.status === 'unfiltered').length);
                }
            } catch (err) {
                console.error("Error fetching candidates:", err);
            }
        };
        fetchAllCandidates();
    }, []);

    const pieData = getPieChartData();
    const yearTotals = getYearTotals();

    const pieSize = 200;
    const pieCenter = pieSize / 2;
    const outerRadius = 80;
    const innerRadius = 62;
    const strokeOuter = 10;
    const strokeInner = 10;
    const outerCircumference = 2 * Math.PI * outerRadius;
    const innerCircumference = 2 * Math.PI * innerRadius;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const todayJDs = assignedJDs.filter(jd => {
        if (!jd.dueDate) return false;
        const d = new Date(jd.dueDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === todayDate.getTime();
    });

    const upcomingJDs = assignedJDs
        .filter(jd => {
            if (!jd.dueDate) return false;
            const d = new Date(jd.dueDate);
            d.setHours(0, 0, 0, 0);
            return d.getTime() > todayDate.getTime();
        })
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 3);

    const renderJDItem = (jd, index, isToday = false) => {
        const colorClasses = ['bg-purple-500', 'bg-blue-500', 'bg-pink-500'];
        const colorClass = isToday ? 'bg-purple-600' : colorClasses[index % colorClasses.length];

        return (
            <div key={jd._id} className="flex gap-4 py-3 mb-2">
                <div className={`w-1.5 rounded-full ${colorClass} flex-shrink-0`}></div>
                <div className="flex items-center gap-6 flex-1">
                    <h4 className="font-medium text-gray-800 text-sm w-[180px] truncate flex-shrink-0" title={jd.jobTitle}>
                        {jd.jobTitle}
                    </h4>
                    <div className="flex-shrink-0 w-[80px]">
                        <span className="text-gray-400 text-xs block">Experience</span>
                        <span className="text-sm text-gray-600">{jd.experience || 'N/A'}</span>
                    </div>
                    <div className="flex-shrink-0">
                        <span className="text-gray-400 text-xs block">Timeline</span>
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(jd.createdAt)} - {formatDate(jd.dueDate)}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const filteredCandidates = recentCandidates.filter(candidate => {
        const query = searchQuery.toLowerCase();
        const nameMatch = candidate.name?.toLowerCase().includes(query);
        const jobTitleMatch = candidate.jobTitle?.toLowerCase().includes(query);
        return nameMatch || jobTitleMatch;
    });
    const totalPages = Math.ceil(filteredCandidates.length / candidatesPerPage);
    const currentCandidates = useMemo(() => {
        const startIndex = (currentPage - 1) * candidatesPerPage;
        const endIndex = startIndex + candidatesPerPage;
        return filteredCandidates.slice(startIndex, endIndex);
    }, [filteredCandidates, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return (
        <div className="min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-5 mt-6">
                <div className="lg:col-span-4 relative w-full overflow-hidden rounded-xl shadow-sm aspect-[16/6] sm:aspect-[16/5] md:aspect-[16/4] lg:aspect-auto lg:h-full">
                    <img
                        src={RDbanner}
                        alt="Dashboard Banner"
                        className="w-full h-full "
                    />
                    <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 text-[#24174E]">
                        <p className="text-xs sm:text-sm md:text-base opacity-90 mb-0.5 sm:mb-1">
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2">
                            {(() => {
                                const hour = new Date().getHours();
                                if (hour < 12) return "Good Morning";
                                if (hour < 18) return "Good Afternoon";
                                return "Good Evening";
                            })()}, {user?.name ? user.name.split(' ')[0] : 'Recruiter'}!
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base opacity-90 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg leading-relaxed hidden sm:block">
                            Turn hiring chaos into high-fives with <br className="hidden md:block" />
                            smarter, faster recruiting
                        </p>

                        <p className="text-sm flex justify-center rounded-lg py-2 bg-gradient-to-r from-[#59459F] to-[#6262BB] w-[220px] mt-6">
                            <Link to="/RecruiterAdmin-Dashboard/JD" className="text-white">
                                See All Job Requisitions
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center flex-shrink-0">
                        <h3 className="text-base sm:text-lg font-semibold">JD Distribution</h3>
                        <select
                            value={pieChartView}
                            onChange={(e) => setPieChartView(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-white cursor-pointer outline-none"
                        >
                            <option value="total">Total</option>
                            <option value="monthly">This Month</option>
                        </select>
                    </div>

                    <div className="relative flex justify-center flex-1 items-center min-h-0">
                        <svg
                            width="220"
                            height="220"
                            viewBox="0 0 220 220"
                            className="max-w-[180px] sm:max-w-[220px] max-h-[180px] sm:max-h-[220px]"
                        >
                            {(() => {
                                const size = 220;
                                const cx = 110;
                                const cy = 110;
                                const r = 78;
                                const stroke = 20;
                                const cornerRadius = 4;
                                const gapDeg = 6;

                                const polarToCartesian = (cx, cy, r, angle) => {
                                    const rad = (angle - 90) * Math.PI / 180;
                                    return {
                                        x: cx + r * Math.cos(rad),
                                        y: cy + r * Math.sin(rad),
                                    };
                                };

                                const describeArc = (cx, cy, r, startAngle, endAngle) => {
                                    const start = polarToCartesian(cx, cy, r, endAngle);
                                    const end = polarToCartesian(cx, cy, r, startAngle);
                                    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

                                    return [
                                        "M", start.x, start.y,
                                        "A", r, r, 0, largeArcFlag, 0, end.x, end.y
                                    ].join(" ");
                                };

                                const total = pieData.assignedPercent + pieData.createdPercent || 100;
                                const usableDeg = 360 - gapDeg * 2;
                                const firstDeg = (pieData.assignedPercent / total) * usableDeg;
                                const secondDeg = (pieData.createdPercent / total) * usableDeg;

                                const firstStart = 220;
                                const firstEnd = firstStart + firstDeg;

                                const secondStart = firstEnd + gapDeg;
                                const secondEnd = secondStart + secondDeg;

                                const bgStart = secondEnd + gapDeg;
                                const bgEnd = firstStart + 360;

                                return (
                                    <>
                                        <defs>
                                            <filter id="roundCorners">
                                                <feGaussianBlur in="SourceGraphic" stdDeviation={cornerRadius} result="blur" />
                                                <feColorMatrix in="blur" type="matrix"
                                                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                                                    result="round"
                                                />
                                                <feComposite in="SourceGraphic" in2="round" operator="atop" />
                                            </filter>
                                        </defs>
                                        <g filter="url(#roundCorners)">
                                            <path
                                                d={describeArc(cx, cy, r, bgStart, bgEnd)}
                                                fill="none"
                                                stroke="#F5F5F7"
                                                strokeWidth={stroke}
                                                strokeLinecap="butt"
                                            />
                                            <path
                                                d={describeArc(cx, cy, r, firstStart, firstEnd)}
                                                fill="none"
                                                stroke="#6C4DD9"
                                                strokeWidth={stroke}
                                                strokeLinecap="butt"
                                            />
                                            <path
                                                d={describeArc(cx, cy, r, secondStart, secondEnd)}
                                                fill="none"
                                                stroke="#F451A6"
                                                strokeWidth={stroke}
                                                strokeLinecap="butt"
                                            />
                                        </g>
                                    </>
                                );
                            })()}
                        </svg>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                            <div className="text-sm sm:text-base text-gray-500">
                                {pieChartView === 'monthly' ? 'This Month' : 'Total Applied'}
                            </div>
                            <div className="text-3xl sm:text-4xl font-bold text-[#2B1B68]">
                                {pieData.total}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 sm:gap-6 text-xs sm:text-sm flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="w-6 sm:w-8 h-2 sm:h-3 rounded-full bg-indigo-400"></span>
                            <span>Others <b>{pieData.assignedPercent}%</b></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-6 sm:w-8 h-2 sm:h-3 rounded-full bg-rose-400"></span>
                            <span>{user?.name || 'User'} <b>{pieData.createdPercent}%</b></span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 mt-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="relative overflow-hidden bg-gradient-to-b from-white to-[#f8f7ff] rounded-[24px] p-4 sm:p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] min-w-[220px] sm:min-w-[240px] md:min-w-[210px] flex-1"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-xl justify-center shrink-0">
                                    <img
                                        src={stat.img}
                                        alt=""
                                        className="h-7 w-7 object-contain"
                                    />
                                </div>
                                <p className="text-[#6b6b6b] text-sm sm:text-base leading-5 font-medium max-w-[100px]">
                                    {(() => {
                                        const words = stat.title.split(" ");
                                        return words.length === 2 ? (
                                            <>
                                                {words[0]} <br />
                                                {words[1]}
                                            </>
                                        ) : (
                                            stat.title
                                        );
                                    })()}
                                </p>
                            </div>
                            <h2 className={`text-3xl sm:text-4xl font-bold leading-none ${stat.text}`}>
                                {stat.value}
                            </h2>
                        </div>
                        <div className="mt-4 sm:mt-5">
                            <img
                                src={stat.line}
                                alt=""
                                className="w-full h-10 sm:h-12 object-cover"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mt-6">
               
                <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm h-[320px] flex flex-col">
                     {/* Calendar */}
                    <h3 className="text-lg font-semibold mb-4">Calendar</h3>
                    <div className="overflow-x-auto overflow-y-auto pb-2 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="min-w-[500px]">
                            {todayJDs.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-gray-400 text-sm mb-3">Today</h4>
                                    {todayJDs.map((jd, index) => renderJDItem(jd, index, true))}
                                </div>
                            )}
                            <div>
                                <h4 className="text-gray-400 text-sm mb-3">Upcoming</h4>
                                {upcomingJDs.length > 0 ? (
                                    upcomingJDs.map((jd, index) => renderJDItem(jd, index))
                                ) : (
                                    <div className="text-gray-400 text-sm italic py-2">No upcoming JDs</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Requisition Overview */}
                <div className="lg:col-span-2 rounded-xl p-6 shadow-sm h-[320px] ">
                    <div className="flex flex-wrap justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">Requisition Overview</h3>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="border rounded-md text-sm px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {availableYears.length > 0 ? (
                                    availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))
                                ) : (
                                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                                )}
                            </select>
                        </div>
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-2 rounded-full bg-indigo-400"></span>
                                Assigned JD ({yearTotals.assignedTotal})
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-2 rounded-full bg-rose-400"></span>
                                Created JD ({yearTotals.createdTotal})
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="flex min-w-[650px]">
                            <div className="flex flex-col justify-between h-48 pr-3 text-right text-xs text-gray-400 font-medium">
                                <span className="-mt-2">100</span>
                                <span className="-mt-2">75</span>
                                <span className="-mt-2">50</span>
                                <span className="-mt-2">25</span>
                                <span className="-mb-2">0</span>
                            </div>

                            <div className="flex-1 relative h-48">
                                <div className="absolute inset-0 w-full h-full pointer-events-none">
                                    <div className="absolute bottom-0 w-full border-b border-gray-100"></div>
                                    <div className="absolute bottom-[25%] w-full border-b border-gray-100"></div>
                                    <div className="absolute bottom-[50%] w-full border-b border-gray-100"></div>
                                    <div className="absolute bottom-[75%] w-full border-b border-gray-100"></div>
                                    <div className="absolute top-0 w-full border-b border-gray-100"></div>
                                </div>

                                <div className="flex items-end justify-between h-full relative z-10 px-2">
                                    {(monthlyData.length > 0 ? monthlyData :
                                        ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"].map(month => ({ month, assigned: 0, created: 0 }))
                                    ).map((item, i) => {

                                        let assignedHeight = item.assigned;
                                        let createdHeight = item.created;

                                        if (assignedHeight > 100) assignedHeight = 100;
                                        if (createdHeight > 100) createdHeight = 100;

                                        const isHovered = hoveredBar === i;

                                        return (
                                            <div
                                                key={i}
                                                className="flex flex-col items-center gap-2 flex-1 h-full relative cursor-pointer group "
                                                onMouseEnter={() => setHoveredBar(i)}
                                                onMouseLeave={() => setHoveredBar(null)}
                                            >
                                                {isHovered && (
                                                    <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 z-20 shadow-lg whitespace-nowrap">
                                                        <div className="font-semibold mb-1">{item.month} {selectedYear}</div>
                                                        <div>Assigned: {item.assigned}</div>
                                                        <div>Created: {item.created}</div>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                                    </div>
                                                )}

                                                <div className="flex items-end gap-1 justify-center w-full h-full pb-[1px]">
                                                    <div
                                                        style={{ height: `${assignedHeight}%` }}
                                                        className={`w-3 md:w-4 rounded-t-md transition-all duration-300 ${isHovered ? 'bg-indigo-500' : 'bg-indigo-400'}`}
                                                    ></div>

                                                    <div
                                                        style={{ height: `${createdHeight}%` }}
                                                        className={`w-3 md:w-4 rounded-t-md transition-all duration-300 ${isHovered ? 'bg-rose-500' : 'bg-rose-400'}`}
                                                    ></div>
                                                </div>

                                                <span className={`text-[10px] sm:text-xs absolute -bottom-6 ${isHovered ? 'text-gray-800 font-bold' : 'text-gray-400'}`}>
                                                    {item.month}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-w-0 mt-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-4 pt-4">
                    <h3 className="text-xl font-semibold">Candidates</h3>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <input
                                type="text"
                                placeholder="Search by name or job title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 md:w-80 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <svg
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto mt-4 bg-white shadow-sm rounded-[18px]">
                    <table className="w-full min-w-[900px] border-collapse text-sm">
                        <thead>
                            <tr className="bg-[#F4F4FF] text-[#1F1F1F]">
                                <th className="py-4 px-4 text-left font-semibold">Serial No.</th>
                                <th className="py-4 px-4 text-left font-semibold">Name</th>
                                <th className="py-4 px-4 text-left font-semibold">Phone No.</th>
                                <th className="py-4 px-4 text-left font-semibold">Job Title</th>
                                <th className="py-4 px-4 text-left font-semibold">Skill</th>
                                <th className="py-4 px-4 text-left font-semibold">Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentCandidates.length > 0 ? (
                                currentCandidates.map((item, i) => {
                                    const serialNo = (currentPage - 1) * candidatesPerPage + i + 1;

                                    const allSkills =
                                        item.skills && item.skills.length > 0
                                            ? item.skills.flatMap((skill) =>
                                                typeof skill === "string"
                                                    ? skill
                                                        .split(",")
                                                        .map((s) => s.trim())
                                                        .filter((s) => s.length > 0)
                                                    : [skill]
                                            )
                                            : [];

                                    return (
                                        <tr key={item.candidateId + i} className="border-b border-[#F0F0F0]">
                                            <td className="py-4 px-4 text-[#222]">{serialNo}.</td>

                                            <td className="py-4 px-4 text-[#222] whitespace-nowrap">
                                                {item.name || "N/A"}
                                            </td>

                                            <td className="py-4 px-4 text-[#222] whitespace-nowrap">
                                                {item.phone || "N/A"}
                                            </td>

                                            <td className="py-4 px-4 text-[#222] whitespace-nowrap">
                                                {item.jobTitle || "N/A"}
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {allSkills.length > 0 ? (
                                                        <>
                                                            {allSkills.slice(0, 3).map((skill, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-3 py-1 rounded-full text-xs bg-[#F3F3F3] text-[#444]"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                            {allSkills.length > 3 && (
                                                                <span className="px-3 py-1 rounded-full text-xs bg-[#F3F3F3] text-[#444]">
                                                                    +{allSkills.length - 3}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">No skills</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <span
                                                    className={`inline-flex items-center justify-center min-w-[92px] px-4 py-1.5 rounded-full text-xs font-medium ${item.status?.toLowerCase() === "filtered"
                                                        ? "bg-[#F1FBEA] text-[#22C55E]"
                                                        : "bg-[#FFF1F1] text-[#FF3B30]"
                                                        }`}
                                                >
                                                    {item.status?.toLowerCase() === "filtered"
                                                        ? "Filtered"
                                                        : "Unfiltered"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-400">
                                        {searchQuery
                                            ? "No candidates match your search"
                                            : "No recent candidates found"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Pagination */}
            <div className="py-4">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};

export default RecruiterDashboard;