import React, { useEffect, useState } from "react";
import img from "../../img/Candidate-Dashboard.png"
import TF from "../../img/TC1.png";
import IF from "../../img/TFC1.png";
import TU from "../../img/TUC1.png";
import TA from "../../img/TAC1.png";
import TAL from "../../img/candidate-TA.png";
import TFL from "../../img/candidate-TC.png";
import ISL from "../../img/candidate-TF.png";
import CTU from "../../img/candidate-TU.png";
import { Bookmark, Briefcase, User2 } from "lucide-react";
import { baseUrl } from "../../utils/ApiConstants";
import axios from "axios";
import { Link } from "react-router-dom";
import RDbanner from "../../img/banner-image.png";

function DonutCard({ total = 0, filtered = 0, unfiltered = 0 }) {
    const t = Number(total) || 0;
    const f = Number(filtered) || 0;
    const u = Number(unfiltered) || 0;

    const circumference = 2 * Math.PI * 78;
    const filteredPercent = t ? (f / t) * 100 : 0;
    const unfilteredPercent = t ? (u / t) * 100 : 0;

    const filteredDash = (filteredPercent / 100) * circumference;
    const unfilteredDash = (unfilteredPercent / 100) * circumference;

    return (
        <div className="bg-white rounded-2xl p-5 shadow-[0px_0px_6px_0px_rgba(0,_0,_0,_0.12)] h-full flex flex-col">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-4">
                Candidate Overview
            </h3>

            <div className="flex items-center justify-center gap-4 flex-1">
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0 flex items-center justify-center">
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 176 176"
                        className="absolute inset-0"
                    >
                        <defs>
                            <linearGradient id="filteredGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#c4b5fd" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                        </defs>

                        <circle
                            cx="88"
                            cy="88"
                            r="78"
                            fill="none"
                            stroke="#d9d6fe"
                            strokeWidth="14"
                        />

                        <circle
                            cx="88"
                            cy="88"
                            r="78"
                            fill="none"
                            stroke="url(#filteredGradient)"
                            strokeWidth="14"
                            strokeLinecap="round"
                            strokeDasharray={`${filteredDash} ${circumference}`}
                            transform="rotate(-90 88 88)"
                            style={{ transition: "stroke-dasharray 0.5s ease" }}
                        />
                    </svg>

                    <div className="relative flex flex-col items-center justify-center text-center">
                        <div className="text-[10px] sm:text-xs text-gray-500 leading-4">Total Application</div>
                        <div className="text-2xl sm:text-3xl font-bold text-indigo-700">{t}</div>
                    </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col items-center gap-2 sm:gap-3">
                        <span className="w-7 sm:w-9 h-2 sm:h-3 rounded-full bg-indigo-500" />
                        <div className="text-[10px] sm:text-xs text-gray-500 leading-4 text-center">
                            <p>Filtered</p>
                            <div className="text-[10px] sm:text-[11px] text-gray-400">Application ({f})</div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 sm:gap-3">
                        <span className="w-7 sm:w-9 h-2 sm:h-3 rounded-full bg-indigo-200" />
                        <div className="text-[10px] sm:text-xs text-gray-500 leading-4 text-center">
                            <p>Un-Filtered</p>
                            <div className="text-[10px] sm:text-[11px] text-gray-400">Application ({u})</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const CandidateDashboard = () => {
    const [totalJdsCount, setTotalJdsCount] = useState(0);
    const [tooltipData, setTooltipData] = useState({ show: false, x: 0, y: 0, name: '' });
    const [user, setUser] = useState(null);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [jdCounts, setJdCounts] = useState({
        totalAppliedJds: 0,
        filteredJds: 0,
        unfilteredJds: 0
    });
    const [latestFiveJds, setLatestFiveJds] = useState([]);
    const [applicationDistribution, setApplicationDistribution] = useState({
        total: 0,
        pending: 0,
        filtered: 0
    });
    const [allApplicationsData, setAllApplicationsData] = useState([]);
    const [distributionFilter, setDistributionFilter] = useState('all');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [applicationStatus, setApplicationStatus] = useState([]);
    const [appliedJdIds, setAppliedJdIds] = useState([]);
    const [graphData, setGraphData] = useState({
        points: [],
        aiScores: [],
        averageAiScore: 0
    });
    const [analyticsFilter, setAnalyticsFilter] = useState("daily");

    const extractSalary = (benefits) => {
        if (!benefits || !Array.isArray(benefits) || benefits.length === 0) {
            return "N/A";
        }

        const salaryPatterns = [
            /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:INR|₹|Rs\.?|rupees?)/i,
            /(?:INR|₹|Rs\.?)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
            /salary\s*(?:of|:)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
            /(\d{1,3}(?:,\d{3})*)\s*(?:per\s*(?:annum|year|month))/i,
            /(\d+(?:,\d+)*)\s*(?:lpa|LPA)/i,
            /(\d+(?:\.\d+)?)\s*(?:lakh|lac)/i
        ];

        for (const benefit of benefits) {
            if (typeof benefit !== 'string') continue;

            const lowerBenefit = benefit.toLowerCase();

            if (lowerBenefit.includes('salary') ||
                lowerBenefit.includes('inr') ||
                lowerBenefit.includes('₹') ||
                lowerBenefit.includes('lpa') ||
                lowerBenefit.includes('per annum') ||
                lowerBenefit.includes('per month') ||
                lowerBenefit.includes('lakh')) {

                for (const pattern of salaryPatterns) {
                    const match = benefit.match(pattern);
                    if (match) {
                        const amount = match[1] || match[0];

                        if (lowerBenefit.includes('lpa')) {
                            return `${amount} LPA`;
                        }
                        if (lowerBenefit.includes('per month') || lowerBenefit.includes('monthly')) {
                            return `₹${amount}/month`;
                        }
                        if (lowerBenefit.includes('per annum') || lowerBenefit.includes('annual')) {
                            return `₹${amount}/year`;
                        }

                        return `₹${amount}`;
                    }
                }

                if (lowerBenefit.includes('salary')) {
                    const numbers = benefit.match(/[\d,]+/g);
                    if (numbers && numbers.length > 0) {
                        return `₹${numbers[0]}`;
                    }
                }
            }
        }

        return "N/A";
    };

    const filterApplicationsByTime = (applications, filter, year, month) => {
        if (filter === 'all') {
            return applications;
        }

        return applications.filter(app => {
            const appDate = new Date(app.appliedAt || app.createdAt);

            if (filter === 'year') {
                return appDate.getFullYear() === year;
            }

            if (filter === 'month') {
                return appDate.getFullYear() === year && appDate.getMonth() === month;
            }

            return true;
        });
    };

    const calculateDistribution = (applications) => {
        let total = applications.length;
        let pending = 0;
        let filtered = 0;

        applications.forEach(app => {
            const status = app.status?.toLowerCase();
            if (status === 'filtered') {
                filtered++;
            } else if (status !== 'unfiltered') {
                pending++;
            }
        });

        return { total, pending, filtered };
    };

    useEffect(() => {
        if (allApplicationsData.length > 0) {
            const filteredApps = filterApplicationsByTime(
                allApplicationsData,
                distributionFilter,
                selectedYear,
                selectedMonth
            );
            const newDistribution = calculateDistribution(filteredApps);
            setApplicationDistribution(newDistribution);
        }
    }, [distributionFilter, selectedYear, selectedMonth, allApplicationsData]);

    const getAvailableYears = () => {
        const years = new Set();
        allApplicationsData.forEach(app => {
            const date = new Date(app.appliedAt || app.createdAt);
            years.add(date.getFullYear());
        });
        return Array.from(years).sort((a, b) => b - a);
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

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
    }, []);

    useEffect(() => {
        const fetchAppliedJobs = async () => {
            try {
                const token = localStorage.getItem("candidateToken");
                const res = await axios.get(`${baseUrl}/candidate/applied-jobs`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log(res.data);

                if (res.data?.success && res.data?.jobs) {
                    const userRes = await axios.get(`${baseUrl}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const loggedInCandidateId = userRes.data?.data?._id;

                    let totalApplied = 0;
                    let filteredCount = 0;
                    let pendingCount = 0;
                    const statusList = [];
                    const aiScoresList = [];
                    const allAppsForFilter = [];

                    res.data.jobs.forEach(job => {
                        const appliedCandidates = job.appliedCandidates || [];
                        const candidateInApplied = appliedCandidates.find(
                            c => c.candidate === loggedInCandidateId
                        );

                        if (candidateInApplied) {
                            totalApplied++;

                            allAppsForFilter.push({
                                ...candidateInApplied,
                                jobId: job._id,
                                createdAt: job.createdAt,
                                jobTitle: job.offerId?.jobTitle || job.keyResponsibilities || job.companyName || "Job"
                            });

                            aiScoresList.push({
                                jobId: job._id,
                                aiScore: candidateInApplied.aiScore || 0,
                                jobName: job.offerId?.jobTitle || job.companyName || "Job"
                            });

                            const candidateStatus = candidateInApplied.status?.toLowerCase();

                            if (candidateStatus === 'filtered') {
                                filteredCount++;
                                statusList.push({
                                    id: job._id,
                                    role: job.keyResponsibilities || "N/A",
                                    company: job.companyName,
                                    jobSummary: job.jobSummary,
                                    status: "Filtered",
                                    badgeClass: "bg-emerald-100 text-emerald-700",
                                    lineColor: "bg-green-400",
                                    aiScore: candidateInApplied.aiScore
                                });
                            } else if (candidateStatus === 'unfiltered') {
                                statusList.push({
                                    id: job._id,
                                    role: job.keyResponsibilities || "N/A",
                                    company: job.companyName,
                                    jobSummary: job.jobSummary,
                                    status: "Unfiltered",
                                    badgeClass: "bg-rose-100 text-rose-700",
                                    lineColor: "bg-rose-400",
                                    aiScore: candidateInApplied.aiScore
                                });
                            } else {
                                pendingCount++;
                                statusList.push({
                                    id: job._id,
                                    role: job.keyResponsibilities || "N/A",
                                    company: job.companyName,
                                    jobSummary: job.jobSummary,
                                    status: "Pending",
                                    badgeClass: "bg-amber-100 text-amber-700",
                                    lineColor: "bg-amber-400",
                                    aiScore: candidateInApplied.aiScore
                                });
                            }
                        }
                    });

                    const last7Jobs = aiScoresList.slice(-7);
                    const avgScore = last7Jobs.length > 0
                        ? Math.round(last7Jobs.reduce((sum, j) => sum + j.aiScore, 0) / last7Jobs.length)
                        : 0;

                    setGraphData({
                        points: last7Jobs,
                        aiScores: last7Jobs.map(j => j.aiScore),
                        averageAiScore: avgScore
                    });

                    setAllApplicationsData(allAppsForFilter);

                    setApplicationDistribution({
                        total: totalApplied,
                        pending: pendingCount,
                        filtered: filteredCount
                    });

                    setApplicationStatus(statusList.slice(-5));
                    const appliedIds = res.data.jobs.map(job => job._id);
                    setAppliedJdIds(appliedIds);
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchAppliedJobs();
    }, []);

    useEffect(() => {
        const fetchjdcounts = async () => {
            try {
                const res = await axios.get(`${baseUrl}/candidate/jd-counts`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("candidateToken")}`,
                    },
                });

                if (res.data?.counts) {
                    setJdCounts(res.data.counts);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchjdcounts();
    }, []);

    useEffect(() => {
        const fetchlatestfivejds = async () => {
            try {
                const res = await axios.get(`${baseUrl}/jd/all-jd`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("candidateToken")}`,
                    },
                });
                console.log(res.data);

                if (res.data?.success && res.data?.data) {
                    const sortedJds = [...res.data.data]
                        .filter(jd => !appliedJdIds.includes(jd._id))
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 5);

                    setLatestFiveJds(sortedJds);
                }
            } catch (error) {
                console.log(error);
            }
        };

        if (appliedJdIds.length >= 0) {
            fetchlatestfivejds();
        }
    }, [appliedJdIds]);
    useEffect(() => {
        const fetchJDs = async () => {
            try {
                const response = await axios.get(`${baseUrl}/jd/all-jd`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('candidateToken')}`,
                    }
                });

                console.log('JDs Data:', response.data);

                if (response.data?.success) {
                    setTotalJdsCount(response.data.count || response.data.data?.length || 0);
                }
            }
            catch (error) {
                console.error('Error fetching JDs:', error);
            }
        };
        fetchJDs();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentDateTime.getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getFirstName = (fullName) => {
        if (!fullName) return "User";
        return fullName.split(' ')[0];
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return "Today";
        if (diffInDays === 1) return "1D ago";
        if (diffInDays < 7) return `${diffInDays}D ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}W ago`;
        return `${Math.floor(diffInDays / 30)}M ago`;
    };

    const truncateText = (text, maxLength = 50) => {
        if (!text) return "";
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    };

    const getFilteredAnalyticsData = () => {
        const apps = [...allApplicationsData].sort(
            (a, b) => new Date(a.appliedAt || a.createdAt) - new Date(b.appliedAt || b.createdAt)
        );

        if (!apps.length) {
            return {
                labels: [],
                fullLabels: [],
                values: [],
            };
        }

        if (analyticsFilter === "daily") {
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];

            const todayApps = apps.filter((app) => {
                const appDate = new Date(app.appliedAt || app.createdAt);
                return appDate.toISOString().split("T")[0] === todayStr;
            });

            if (todayApps.length === 0) {
                return {
                    labels: [],
                    fullLabels: [],
                    values: [],
                };
            }

            return {
                labels: todayApps.map((app) => {
                    const title = app.jobTitle || "Job";
                    return title.length > 10 ? title.slice(0, 10) + ".." : title;
                }),
                fullLabels: todayApps.map((app) => app.jobTitle || "Job"),
                values: todayApps.map((app) => app.aiScore || 0),
            };
        }

        if (analyticsFilter === "monthly") {
            const grouped = {};

            apps.forEach((app) => {
                const date = new Date(app.appliedAt || app.createdAt);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        label: months[date.getMonth()].slice(0, 3),
                        total: 0,
                        count: 0,
                        sortDate: new Date(date.getFullYear(), date.getMonth(), 1),
                        jobTitles: [],
                    };
                }
                grouped[key].total += app.aiScore || 0;
                grouped[key].count += 1;
                grouped[key].jobTitles.push(app.jobTitle || "Job");
            });

            const monthlyData = Object.values(grouped)
                .sort((a, b) => a.sortDate - b.sortDate)
                .slice(-8);

            return {
                labels: monthlyData.map((item) => item.label),
                fullLabels: monthlyData.map(
                    (item) => `${item.label} (${item.count} jobs)`
                ),
                values: monthlyData.map((item) =>
                    item.count ? Math.round(item.total / item.count) : 0
                ),
            };
        }

        if (analyticsFilter === "yearly") {
            const grouped = {};

            apps.forEach((app) => {
                const date = new Date(app.appliedAt || app.createdAt);
                const key = `${date.getFullYear()}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        label: key,
                        total: 0,
                        count: 0,
                        sortDate: new Date(date.getFullYear(), 0, 1),
                    };
                }
                grouped[key].total += app.aiScore || 0;
                grouped[key].count += 1;
            });

            const yearlyData = Object.values(grouped)
                .sort((a, b) => a.sortDate - b.sortDate)
                .slice(-8);

            return {
                labels: yearlyData.map((item) => item.label),
                fullLabels: yearlyData.map(
                    (item) => `${item.label} (${item.count} jobs)`
                ),
                values: yearlyData.map((item) =>
                    item.count ? Math.round(item.total / item.count) : 0
                ),
            };
        }

        return {
            labels: [],
            fullLabels: [],
            values: [],
        };
    };
    const analyticsGraphData = getFilteredAnalyticsData();

    const generateBarPositions = (values) => {
        const count = values.length || 1;
        const chartWidth = 600;
        const chartHeight = 185;
        const maxBarHeight = 155;
        const maxBarWidth = 45;
        const minBarWidth = 20;
        const minGap = 8;

        const barWidth = Math.max(
            minBarWidth,
            Math.min(maxBarWidth, (chartWidth - (count - 1) * minGap) / count - minGap)
        );
        const totalBarsWidth = count * barWidth;
        const totalGap = chartWidth - totalBarsWidth;
        const gap = count > 1 ? Math.max(minGap, totalGap / (count + 1)) : 0;
        const startX = gap;

        return values.map((value, index) => {
            const height = value > 0 ? Math.max((value / 100) * maxBarHeight, 8) : 0;
            const x = startX + index * (barWidth + gap);
            const y = chartHeight - height;

            return {
                x,
                y,
                width: barWidth,
                height,
                value,
                index,
            };
        });
    };

    const barData = generateBarPositions(analyticsGraphData.values);

    const stats = [
        { title: "Total Applications", value: jdCounts.totalAppliedJds, img: TA, text: "text-purple-800", line: TAL },
        { title: "Total Filtered", value: jdCounts.filteredJds, img: TF, text: "text-pink-500", line: TFL },
        { title: "Total Job Description", value: totalJdsCount, img: IF, text: "text-blue-500", line: ISL },
        { title: "Total Unfiltered", value: jdCounts.unfilteredJds, img: TU, text: "text-orange-500", line: CTU },
    ];

    const pieSize = 220;
    const pieCenter = pieSize / 2;
    const outerRadius = 90;
    const middleRadius = 68;
    const innerRadius = 46;
    const strokeWidth = 14;

    const outerCircumference = 2 * Math.PI * outerRadius;
    const middleCircumference = 2 * Math.PI * middleRadius;
    const innerCircumference = 2 * Math.PI * innerRadius;

    const totalForPie = applicationDistribution.total || 1;
    const outerPercent = 100;
    const pendingPercent = Math.round((applicationDistribution.pending / totalForPie) * 100);
    const filteredPercent = Math.round((applicationDistribution.filtered / totalForPie) * 100);

    return (
        <div className="min-h-screen">
            <div className="space-y-4">
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-6">
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
                                Land your dream job faster, track progress,<br className="hidden md:block" />
                                 and celebrate every win 
                            </p>

                            <p className="text-sm flex justify-center rounded-lg py-2 bg-gradient-to-r from-[#59459F] to-[#6262BB] w-[150px] mt-6">
                                <Link to="/Candidate-Dashboard/AllJds" className="text-white">
                                    Start Applying
                                </Link>
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-2 min-h-[280px] sm:min-h-[300px] md:min-h-[320px]">
                        <DonutCard
                            total={jdCounts.totalAppliedJds}
                            filtered={jdCounts.filteredJds}
                            unfiltered={jdCounts.unfilteredJds}
                        />
                    </div>
                </div>

                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
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


                {/* //Jobs Analytics */}

                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-xl sm:rounded-2xl bg-white p-4 sm:p-5 shadow-sm lg:col-span-2 h-[380px] sm:h-[400px] md:h-[420px] flex flex-col">
                        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
                            <h2 className="text-sm sm:text-base font-semibold text-slate-900">Application Status</h2>
                            <Link to="/Candidate-Dashboard/AppliedJD" className="text-xs sm:text-sm font-medium text-indigo-500 hover:underline">View All</Link>
                        </div>
                        <div className="flex-1 overflow-x-auto overflow-y-auto pr-1 sm:pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <div className="space-y-3 sm:space-y-4 min-w-[400px]">
                                {applicationStatus.length > 0 ? (
                                    applicationStatus.map((app) => (
                                        <div key={app.id} className="relative flex justify-between gap-2 rounded-lg sm:rounded-xl bg-slate-50 p-3">
                                            <span className={`absolute left-0 top-0 h-full w-1 rounded-full ${app.lineColor}`} />
                                            <div className="pl-3 space-y-0.5 flex-1">
                                                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                                                    {truncateText(app.role, 30) || "Job Position"}
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-slate-500">{app.company}</p>
                                                <p className="text-[10px] text-slate-400 line-clamp-1">
                                                    {truncateText(app.jobSummary, 40)}
                                                </p>
                                            </div>
                                            <div className="flex items-center pl-3">
                                                {app.aiScore !== undefined && (
                                                    <p className="text-[11px] font-semibold text-slate-700">
                                                        AI Score: {app.aiScore}%
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center pl-3">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${app.badgeClass}`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                        No applications yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl bg-white p-3 sm:p-4 md:p-5 shadow-sm lg:col-span-3 h-[380px] sm:h-[400px] md:h-[420px] flex flex-col">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 flex-shrink-0 gap-2">
                            <h2 className="text-sm sm:text-base md:text-lg font-bold text-[#11142D] tracking-tight">
                                Jobs Analytics
                            </h2>

                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-500">
                                    Total Jobs Applied{" "}
                                    <span className="text-[#6C63FF] font-bold">
                                        {jdCounts.totalAppliedJds}
                                    </span>
                                </p>

                                <select
                                    value={analyticsFilter}
                                    onChange={(e) => setAnalyticsFilter(e.target.value)}
                                    className="rounded-full border border-slate-200 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors outline-none"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 relative mt-2">
                            <div className="w-full h-full overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                <div
                                    className="h-full"
                                    style={{
                                        minWidth:
                                            analyticsGraphData.values.length > 7
                                                ? `${analyticsGraphData.values.length * 85}px`
                                                : "100%",
                                    }}
                                >
                                    <svg
                                        width="100%"
                                        height="100%"
                                        viewBox={`0 0 ${Math.max(
                                            700,
                                            50 + analyticsGraphData.values.length * 85
                                        )} 260`}
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#818CF8" />
                                                <stop offset="100%" stopColor="#4F46E5" />
                                            </linearGradient>
                                            
                                            <linearGradient id="barGradientHover" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#A78BFA" />
                                                <stop offset="100%" stopColor="#7C3AED" />
                                            </linearGradient>

                                            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#4F46E5" floodOpacity="0.25" />
                                            </filter>
                                        </defs>

                                        {[0, 20, 40, 60, 80, 100].map((val, i) => {
                                            const y = 200 - (val / 100) * 160;
                                            return (
                                                <g key={i}>
                                                    <text
                                                        x="34"
                                                        y={y + 4}
                                                        fontSize="11"
                                                        fill="#94A3B8"
                                                        textAnchor="end"
                                                        fontWeight="600"
                                                    >
                                                        {val}
                                                    </text>
                                                    <line
                                                        x1="45"
                                                        y1={y}
                                                        x2={Math.max(
                                                            700,
                                                            60 + analyticsGraphData.values.length * 85
                                                        )}
                                                        y2={y}
                                                        stroke="#F1F5F9"
                                                        strokeWidth="1.5"
                                                        strokeDasharray="4 4"
                                                    />
                                                </g>
                                            );
                                        })}

                                        <g transform="translate(60, 0)">
                                            {barData.map((bar, i) => {
                                                const scaledHeight = bar.value > 0 ? Math.max((bar.value / 100) * 160, 8) : 0;
                                                const scaledY = 200 - scaledHeight;
                                                const hoverIndex = tooltipData.show && tooltipData.index === i;

                                                return (
                                                    <g key={i}>
                                                        {/* Background Track */}
                                                        <rect
                                                            x={bar.x}
                                                            y={40}
                                                            width={bar.width}
                                                            height={160}
                                                            rx="8"
                                                            ry="8"
                                                            fill="#F8FAFC"
                                                        />

                                                        {scaledHeight > 0 && (
                                                            <rect
                                                                x={bar.x}
                                                                y={scaledY}
                                                                width={bar.width}
                                                                height={scaledHeight}
                                                                rx="8"
                                                                ry="8"
                                                                fill={hoverIndex ? "url(#barGradientHover)" : "url(#barGradient)"}
                                                                filter={hoverIndex ? "url(#shadow)" : ""}
                                                                className="cursor-pointer transition-all duration-300 transform-origin-bottom"
                                                                style={{ transformOrigin: `${bar.x + bar.width / 2}px ${scaledY + scaledHeight}px`, transform: hoverIndex ? 'scaleY(1.02)' : 'scaleY(1)' }}
                                                                onMouseEnter={(e) => {
                                                                    const rect = e.target.getBoundingClientRect();
                                                                    setTooltipData({
                                                                        show: true,
                                                                        index: i,
                                                                        x: rect.left + rect.width / 2,
                                                                        y: rect.top,
                                                                        label: analyticsGraphData.fullLabels?.[i] || analyticsGraphData.labels[i],
                                                                        value: bar.value,
                                                                    });
                                                                }}
                                                                onMouseLeave={() =>
                                                                    setTooltipData((prev) => ({
                                                                        ...prev,
                                                                        show: false,
                                                                    }))
                                                                }
                                                            />
                                                        )}

                                                        {scaledHeight > 25 && (
                                                            <text
                                                                x={bar.x + bar.width / 2}
                                                                y={scaledY + 18}
                                                                fontSize="10"
                                                                fill="white"
                                                                textAnchor="middle"
                                                                fontWeight="600"
                                                                className="pointer-events-none"
                                                            >
                                                                {bar.value}%
                                                            </text>
                                                        )}

                                                        <text
                                                            x={bar.x + bar.width / 2}
                                                            y="225"
                                                            fontSize="11"
                                                            fill={hoverIndex ? "#4F46E5" : "#64748B"}
                                                            textAnchor="middle"
                                                            fontWeight="600"
                                                            className="transition-colors duration-300 pointer-events-none"
                                                        >
                                                            {analyticsGraphData.labels[i]}
                                                        </text>
                                                    </g>
                                                );
                                            })}
                                        </g>
                                    </svg>
                                </div>
                            </div>

                            {analyticsGraphData.values.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium">No analytics data available</p>
                                    </div>
                                </div>
                            )}

                            {tooltipData.show && (
                                <div
                                    className="fixed z-50 px-4 py-3 bg-white/95 backdrop-blur-md text-slate-800 text-xs rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 pointer-events-none transform -translate-x-1/2 min-w-[140px] transition-all duration-200"
                                    style={{
                                        left: tooltipData.x,
                                        top: tooltipData.y - 70,
                                    }}
                                >
                                    <div className="font-semibold mb-2 text-slate-900 border-b border-slate-100 pb-1.5 break-words max-w-[200px]">
                                        {tooltipData.label}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                        <span className="font-bold text-indigo-600 text-[13px]">Score: {tooltipData.value}%</span>
                                    </div>
                                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white/95 border-b border-r border-slate-100 rotate-45 shadow-[4px_4px_4px_rgba(0,0,0,0.02)]"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900">Application Distribution</h3>
                            <div className="flex gap-2">
                                <select
                                    value={distributionFilter}
                                    onChange={(e) => setDistributionFilter(e.target.value)}
                                    className="border border-slate-200 rounded-lg px-2 py-1 text-[10px] sm:text-xs font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">All Time</option>
                                    <option value="year">By Year</option>
                                    <option value="month">By Month</option>
                                </select>

                                {distributionFilter === 'year' && (
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="border border-slate-200 rounded-lg px-2 py-1 text-[10px] sm:text-xs font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {getAvailableYears().length > 0 ? (
                                            getAvailableYears().map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))
                                        ) : (
                                            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                                        )}
                                    </select>
                                )}

                                {distributionFilter === 'month' && (
                                    <>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            className="border border-slate-200 rounded-lg px-2 py-1 text-[10px] sm:text-xs font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {getAvailableYears().length > 0 ? (
                                                getAvailableYears().map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))
                                            ) : (
                                                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                                            )}
                                        </select>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                            className="border border-slate-200 rounded-lg px-2 py-1 text-[10px] sm:text-xs font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {months.map((month, index) => (
                                                <option key={index} value={index}>{month.slice(0, 3)}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="relative flex justify-center my-6 sm:my-8">
                            <svg width={pieSize} height={pieSize} className="max-w-[200px] sm:max-w-[220px]" viewBox={`0 0 ${pieSize} ${pieSize}`}>
                                {(() => {
                                    const cx = pieCenter;
                                    const cy = pieCenter;
                                    const r = 78;
                                    const stroke = 20;
                                    const cornerRadius = 4;
                                    const gapDeg = 6;

                                    const total = applicationDistribution.total || 1;
                                    const filtered = applicationDistribution.filtered || 0;
                                    const unfiltered = Math.max(0, total - filtered);

                                    const totalGaps = gapDeg * 2;
                                    const usableDeg = 360 - totalGaps;

                                    const filteredDeg = (filtered / total) * usableDeg;
                                    const unfilteredDeg = (unfiltered / total) * usableDeg;

                                    const filteredStart = 0;
                                    const filteredEnd = filteredStart + filteredDeg;

                                    const unfilteredStart = filteredEnd + gapDeg;
                                    const unfilteredEnd = unfilteredStart + unfilteredDeg;

                                    const polarToCartesian = (cx, cy, r, angle) => {
                                        const rad = (angle - 90) * Math.PI / 180;
                                        return {
                                            x: cx + r * Math.cos(rad),
                                            y: cy + r * Math.sin(rad),
                                        };
                                    };

                                    const describeArc = (cx, cy, r, startAngle, endAngle) => {
                                        if (endAngle - startAngle < 1) return "";
                                        const start = polarToCartesian(cx, cy, r, endAngle);
                                        const end = polarToCartesian(cx, cy, r, startAngle);
                                        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
                                        return [
                                            "M", start.x, start.y,
                                            "A", r, r, 0, largeArcFlag, 0, end.x, end.y
                                        ].join(" ");
                                    };

                                    return (
                                        <>
                                            <defs>
                                                <filter id="roundCornersDistribution">
                                                    <feGaussianBlur in="SourceGraphic" stdDeviation={cornerRadius} result="blur" />
                                                    <feColorMatrix in="blur" type="matrix"
                                                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                                                        result="round"
                                                    />
                                                    <feComposite in="SourceGraphic" in2="round" operator="atop" />
                                                </filter>
                                            </defs>

                                            <g filter="url(#roundCornersDistribution)">
                                                <path
                                                    d={describeArc(cx, cy, r, filteredStart, filteredEnd)}
                                                    fill="none"
                                                    stroke="#6C50D4"
                                                    strokeWidth={stroke}
                                                    strokeLinecap="butt"
                                                />

                                                <path
                                                    d={describeArc(cx, cy, r, unfilteredStart, unfilteredEnd)}
                                                    fill="none"
                                                    stroke="#A58CFF"
                                                    strokeWidth={stroke}
                                                    strokeLinecap="butt"
                                                />
                                            </g>
                                        </>
                                    );
                                })()}
                            </svg>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                <p className="text-xs sm:text-sm text-slate-500">Total</p>
                                <p className="text-xl sm:text-2xl font-bold text-slate-900">{applicationDistribution.total}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-600">Total</span>
                                <span className="font-semibold">{applicationDistribution.total}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 sm:w-4 h-2 sm:h-2.5 rounded-full" style={{ backgroundColor: '#6C50D4' }}></span>
                                <span className="text-slate-600">Filtered</span>
                                <span className="font-semibold">{applicationDistribution.filtered}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 sm:w-4 h-2 sm:h-2.5 rounded-full" style={{ backgroundColor: '#A58CFF' }}></span>
                                <span className="text-slate-600">Unfiltered</span>
                                <span className="font-semibold">{Math.max(0, applicationDistribution.total - applicationDistribution.filtered)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl bg-white p-4 sm:p-5 shadow-sm lg:col-span-2 min-w-0 overflow-hidden h-[380px] sm:h-[400px] md:h-[420px] flex flex-col">
                        <div className="mb-3 sm:mb-4 flex items-center justify-between flex-shrink-0">
                            <h2 className="text-sm sm:text-base font-semibold">Job Recommendations</h2>
                            <Link to="/Candidate-Dashboard/Alljds" className="text-[10px] sm:text-xs font-medium text-indigo-500 hover:underline">View All</Link>
                        </div>
                        <div className="overflow-x-auto overflow-y-auto -mx-4 sm:-mx-5 px-4 sm:px-5 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <div className="space-y-3 sm:space-y-4 min-w-[520px]">
                                {latestFiveJds.length > 0 ? (
                                    latestFiveJds.map((job, index) => {
                                        const salary = extractSalary(job.benefits);
                                        return (
                                            <div key={job._id || index} className="flex items-center justify-between gap-4 rounded-xl sm:rounded-2xl border border-slate-300 p-3 sm:p-4">
                                                <div className="space-y-1 flex-1 min-w-0">
                                                    <p className="text-xs sm:text-sm font-semibold truncate">
                                                        {job.keyResponsibilities || truncateText(job.jobSummary, 40) || "Job Position"}
                                                    </p>
                                                    <p className="text-[10px] sm:text-xs text-slate-500">
                                                        {job.companyName}
                                                    </p>
                                                    <p className="text-[10px] sm:text-[11px] font-medium text-rose-500">
                                                        {job.appliedCandidates?.length || 0}+ applications
                                                    </p>
                                                    <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1.5 sm:gap-2 text-[9px] sm:text-[11px]">
                                                        {job.requiredQualifications && (
                                                            <span className="rounded-full bg-slate-200 px-2 sm:px-3 py-0.5 sm:py-1 font-medium text-slate-700 flex items-center whitespace-nowrap">
                                                                <User2 className="h-3 w-3 mr-1" />
                                                                {job.requiredQualifications}
                                                            </span>
                                                        )}
                                                        <span className="rounded-full bg-slate-200 px-2 sm:px-3 py-0.5 sm:py-1 font-medium text-slate-700 flex items-center whitespace-nowrap">
                                                            <Briefcase className="h-3 w-3 mr-1" />
                                                            Full Time
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end justify-center gap-2 flex-shrink-0">
                                                    <span className={`text-xs sm:text-sm font-semibold border border-slate-300 rounded-2xl px-3 py-1 ${salary === 'N/A' ? 'text-slate-400' : 'text-slate-700'}`}>
                                                        {salary}
                                                    </span>
                                                    <p className="text-[10px] sm:text-[11px] text-slate-400">
                                                        {formatTimeAgo(job.createdAt)}
                                                    </p>
                                                    <button className="inline-flex items-center rounded-full bg-slate-900 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap">
                                                        Apply Now
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 text-sm py-10">
                                        No job recommendations available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateDashboard;