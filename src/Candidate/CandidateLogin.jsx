import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import img from "../img/login.png";
import logo from "../img/loginlogo.png";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { baseUrl } from "../utils/ApiConstants";

export default function CandidateLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const redirectJobId = location.state?.redirectJobId || null;

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!email || !password) {
            setError("Email and password are required");
            setLoading(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email");
            setLoading(false);
            return;
        }

        try {
            const { data } = await axios.post(
                `${baseUrl}/candidate/login`,
                { email, password }
            );

            const cleanCandidate = {
                _id: data.candidate._id,
                id: data.candidate._id,
                name: data.candidate.name,
                email: data.candidate.email,
                phone: data.candidate.phone,
                hasLoggedIn: data.candidate.hasLoggedIn,
            };

            localStorage.setItem("candidateToken", data.token);
            localStorage.setItem("candidate", JSON.stringify(cleanCandidate));
            sessionStorage.setItem("candidateData", JSON.stringify(cleanCandidate));

            setLoading(false);

            if (redirectJobId) {
                navigate(`/Candidate-Dashboard/AllJDs/ApplyToJob/${redirectJobId}`);
            } else if (!data.candidate.hasLoggedIn) {
                navigate("/Candidate-Chatbot");
            } else {
                navigate("/Candidate-Dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.error || "Invalid credentials");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="mx-auto flex min-h-screen max-w-[1100px] items-stretch gap-6 p-6">
                <div className="flex w-full flex-col rounded-md bg-white px-10 pb-8 md:w-1/2">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center">
                            <img src={logo} alt="" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-[#6A2767]">
                    RecruterAI
                        </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-center">
                        <h1 className="text-center text-2xl font-bold tracking-wide text-black">
                            WELCOME Candidate!
                        </h1>
                        <p className="mt-3 text-center text-sm text-gray-500">
                            Welcome back! Please enter your details.
                        </p>

                        <form onSubmit={handleLogin} className="mt-12 space-y-5">
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <label className="mb-2 block text-xs font-semibold text-gray-700">
                                    Password
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="**********"
                                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-12 text-sm text-gray-900 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-[34px] text-gray-500 hover:text-gray-700 transition"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 text-xs text-gray-600">
                                    <input
                                        type="checkbox"
                                        className="h-3.5 w-3.5 rounded border-gray-300 text-purple-700 focus:ring-purple-300"
                                    />
                                    Remember me
                                </label>

                                <button
                                    type="button"
                                    className="text-xs text-[#6A2767] font-semibold hover:text-gray-900"
                                    onClick={() => navigate("/CandidateForgotPassword")}
                                >
                                    Forgot password
                                </button>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="h-11 w-full rounded-lg bg-gradient-to-r from-[#1B1138] to-[#322071] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(143,42,209,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg
                                            className="animate-spin h-5 w-5"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    "Sign in"
                                )}
                            </button>

                            <p className="text-center text-sm text-gray-600 pt-2">
                                Don&apos;t have an account?{" "}
                                <Link
                                    to="/CandidateRegister"
                                    className="text-[#6A2767] hover:underline font-semibold"
                                >
                                    Sign Up
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>

                <div className="hidden w-1/2 md:block">
                    <div className="relative h-full w-full overflow-hidden">
                        <div className="relative flex h-full w-full items-center justify-center">
                            <img
                                src={img}
                                alt="Dashboard preview"
                                className="h-full w-full object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}