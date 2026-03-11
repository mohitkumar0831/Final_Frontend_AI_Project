import { useEffect } from "react";
import { X, User, Phone, Mail, ScrollText, BadgeCheck } from "lucide-react";
import cicon from "../img/calendor-icon.png";
import overviewicon from "../img/overview.png";
import profileicon from "../img/profile-icon.png";

export default function ResumeSummary({ onClose, candidate }) {
    const name = candidate?.name || "N/A";
    const phone = candidate?.phone || "N/A";
    const email = candidate?.email || "N/A";
    const overview = candidate?.aiExplanation || "N/A";

    const isFiltered = !!candidate?.isFiltered;
    const statusText = isFiltered ? "Filtered" : "Unfiltered";

    const score = Math.round(Number(candidate?.aiScore ?? 0));
    const clamped = Math.max(0, Math.min(100, score));
    const circumference = 2 * Math.PI * 78;
    const dashArray = `${(clamped / 100) * circumference} ${circumference}`;

    // Dynamic color for progress based on percentage
    const progressColor = clamped > 50
        ? 'url(#progressGreenGradient)'
        : 'url(#progressRedGradient)';

    useEffect(() => {
        const onKeyDown = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const openResume = () => {
        const url = candidate?.resume;
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const InfoRow = ({ Icon, label, value }) => (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-gray-500" />
            </div>
            <div className="min-w-0">
                <div className="text-[11px] text-gray-500">{label}</div>
                <div className="text-sm font-medium text-gray-900 break-all">{value}</div>
            </div>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 py-6"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Resume Summary</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
                    >
                        <X size={18} className="text-gray-700" />
                    </button>
                </div>

                <div className="px-6 pb-6 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6 items-start">
                        <div className="space-y-5 pt-7">
                            <InfoRow
                                Icon={() => (
                                    <img
                                        src={profileicon}
                                        alt="profile"
                                        className="w-5 h-5 rounded-full object-cover"
                                    />
                                )}
                                label="Full Name"
                                value={name}
                            />
                            <InfoRow Icon={Phone} label="Phone No." value={phone} />
                            <InfoRow Icon={Mail} label="Email" value={email} />
                        </div>

                        <div className="bg-gray-100 p-5 rounded-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                    <img src={cicon} alt="Calendar Icon" />
                                    Status
                                </div>
                                <span className={`text-sm font-semibold ${isFiltered ? "text-green-600 bg-green-100 py-0.5 px-2 rounded-md" : "text-red-500"}`}>
                                    {statusText}
                                </span>
                            </div>

                            <div className="mt-5 flex justify-center">
                                <div className="relative w-44 h-44 flex items-center justify-center">
                                    <svg
                                        width="176"
                                        height="176"
                                        viewBox="0 0 176 176"
                                        className="absolute inset-0"
                                    >
                                        <defs>
                                            <linearGradient id="progressGreenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#bbf7d0" />
                                                <stop offset="50%" stopColor="#22c55e" />
                                                <stop offset="100%" stopColor="#166534" />
                                            </linearGradient>
                                            <linearGradient id="progressRedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#fecaca" />
                                                <stop offset="50%" stopColor="#ef4444" />
                                                <stop offset="100%" stopColor="#991b1b" />
                                            </linearGradient>
                                        </defs>

                                        <circle
                                            cx="88"
                                            cy="88"
                                            r="78"
                                            fill="none"
                                            stroke="#E5E7EB"
                                            strokeWidth="12"
                                        />

                                        <circle
                                            cx="88"
                                            cy="88"
                                            r="78"
                                            fill="none"
                                            stroke={progressColor}
                                            strokeWidth="12"
                                            strokeLinecap="round"
                                            strokeDasharray={dashArray}
                                            transform="rotate(-90 88 88)"
                                            style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.5s" }}
                                        />
                                    </svg>

                                    <span className="relative text-2xl font-semibold text-[#166534]">
                                        {clamped}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <img src={overviewicon} alt="" />
                            Overview
                        </div>
                        <p className="mt-2 text-sm leading-6 text-gray-500">{overview}</p>
                    </div>

                    <button
                        type="button"
                        onClick={openResume}
                        disabled={!candidate?.resume}
                        className={`mt-5 w-full h-10 rounded-lg text-sm font-semibold text-white transition-colors
                            ${candidate?.resume ? "bg-[#886BE6] hover:bg-[#684FBC]" : "bg-[#6D59FF]/60 cursor-not-allowed"}`}
                    >
                        View Resume
                    </button>
                </div>
            </div>
        </div>
    );
}