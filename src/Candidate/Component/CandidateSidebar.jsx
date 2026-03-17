import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Building2,
  UserPlus,
  FileText,
  Search,
  Headphones,
  ChevronsUpDown,
  X,
} from "lucide-react";
import user from "../../img/man-head.png";
import logoutImg from "../../img/power3.png";
import sublogo from "../../assets/sublogo.png";
import axios from "axios";
import { baseUrl } from "../../utils/ApiConstants";

const CandidateAdminSidebar = ({ isOpen = true, onToggle }) => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState("CandidateDashboard");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileBtnRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("candidateToken");
        const res = await axios.get(`${baseUrl}/candidate/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("hii",res.data);
        
        setUserData(res.data.candidate);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  const navItems = useMemo(
    () => [
      {
        name: "CandidateDashboard",
        path: "/Candidate-Dashboard",
        icon: Home,
        label: "Dashboard",
      },
      {
        name: "AllJds",
        path: "/Candidate-Dashboard/AllJds",
        icon: Building2,
        label: "Open Positions",
      },
      {
        name: "AppliedJD",
        path: "/Candidate-Dashboard/AppliedJD",
        icon: Building2,
        label: "Applied Jobs",
      },
      {
        name: "Examination",
        path: "/Candidate-Dashboard/Examination",
        icon: UserPlus,
        label: "Online Assessment",
      },
      {
        name: "Reports",
        path: "/Candidate-Dashboard/Report",
        icon: FileText,
        label: "Evaluation Summary",
      },
    ],
    []
  );

  useEffect(() => {
    const p = location.pathname;
    if (p.includes("/AllJds")) setActiveNav("AllJds");
    else if (p.includes("/AppliedJD")) setActiveNav("AppliedJD");
    else if (p.includes("/Examination")) setActiveNav("Examination");
    else if (p.includes("/Report")) setActiveNav("Reports");
    else if (p === "/Candidate-Dashboard") setActiveNav("CandidateDashboard");
  }, [location.pathname]);

  const handleNavClick = (name, path) => {
    setActiveNav(name);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("candidateToken");
    localStorage.removeItem("candidate");
    setIsProfileMenuOpen(false);
    navigate("/");
  };

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!isProfileMenuOpen) return;
      const btn = profileBtnRef.current;
      const menu = profileMenuRef.current;
      if (btn?.contains(e.target) || menu?.contains(e.target)) return;
      setIsProfileMenuOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsProfileMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isProfileMenuOpen]);

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  };

  const NavItem = ({ name, path, icon: Icon, label }) => {
    const isActive = activeNav === name;
    return (
      <button
        onClick={() => handleNavClick(name, path)}
        className={[
          "group w-full flex items-center gap-3",
          "h-9 px-3 rounded-md text-left",
          "text-[12px] font-medium tracking-wide",
          "transition-colors duration-200",
          isActive
            ? "bg-[#332173] text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)]"
            : "text-white/80 hover:bg-white/10 hover:text-white",
        ].join(" ")}
      >
        <Icon size={16} className={isActive ? "text-white" : "text-white/80"} />
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 bottom-0 z-50 w-[260px] ml-1 my-1 rounded-xl",
          "px-4 py-5 text-white",
          "transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          "bg-gradient-to-b from-[#1A1034] via-[#241554] to-[#1A1034]",
          "flex flex-col",
        ].join(" ")}
      >
        <div className="shrink-0">
          <div className="flex justify-center items-center gap-2 px-1">
            <div className="text-[22px] font-semibold">
              Recruiter<span className="text-white/90">AI</span>
            </div>
            <button
              onClick={onToggle}
              className="p-1 rounded hover:bg-white/20 lg:hidden absolute right-3"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-4">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"
              />
              <input
                placeholder="Search"
                className={[
                  "w-full h-9 rounded-md",
                  "bg-white/10",
                  "pl-9 pr-3 text-[12px]",
                  "outline-none text-white placeholder:text-white/60",
                  "ring-1 ring-white/40 focus:ring-white/40",
                ].join(" ")}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto pr-1 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavItem key={item.name} {...item} />
            ))}
          </nav>

          <div className="mt-6">
            <div
              className={[
                "rounded-xl p-4",
                "bg-gradient-to-b from-white/10 to-white/5",
                "ring-1 ring-white/10",
              ].join(" ")}
            >
              <div className="flex justify-center">
                <div className="grid place-items-center h-10 w-10 rounded-full bg-white/10 ring-1 ring-white/10">
                  <Headphones size={18} />
                </div>
              </div>

              <div className="mt-3 text-center">
                <div className="text-[12px] font-semibold">Need Support?</div>
                <div className="mt-1 text-[10px] text-white/65">
                  Get in touch with our agents
                </div>
                <button
                  className={[
                    "mt-3 w-full h-9 rounded-md",
                    "bg-[#332173] hover:bg-[#3a2580]",
                    "text-[12px] font-semibold",
                    "shadow-[0_10px_22px_rgba(0,0,0,0.25)]",
                  ].join(" ")}
                  onClick={() => navigate("/support")}
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 pt-3 border-t border-white/10 relative">
          {isProfileMenuOpen && (
            <div
              ref={profileMenuRef}
              className={[
                "absolute left-0 right-0 bottom-[64px] z-50",
                "bg-white rounded-2xl",
                "shadow-[0_20px_40px_rgba(0,0,0,0.35)]",
                "ring-1 ring-black/10",
                "overflow-hidden",
              ].join(" ")}
            >
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigate("/Candidate-Dashboard/CandidateProfile");
                }}
                className={[
                  "w-full flex items-center gap-3",
                  "px-4 py-2 text-left",
                  "text-[#2f2bd6]",
                  "transition-colors",
                  "hover:bg-[#F3F2FF]",
                ].join(" ")}
              >
                <div className="grid place-items-center h-8 w-8 rounded-full bg-white ring-1 ring-black/5">
                  <img src={user} alt="User" className="h-[10] w-[10] rounded-full" />
                </div>
                <span className="text-[16px] font-medium">Profile</span>
              </button>

              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  handleLogout();
                }}
                className={[
                  "w-full flex items-center gap-3",
                  "px-4 py-2 text-left",
                  "text-red-600",
                  "transition-colors",
                  "hover:bg-red-50",
                ].join(" ")}
              >
                <div className="grid place-items-center h-8 w-8 rounded-full bg-white ring-1 ring-black/5">
                  <img src={logoutImg} alt="Logout" className="h-[10] w-[10] rounded-full" />
                </div>
                <span className="text-[16px] font-medium">Log Out</span>
              </button>
            </div>
          )}

          <button
            ref={profileBtnRef}
            className={[
              "w-full flex items-center gap-3",
              "rounded-full p-3",
              "bg-white/10 hover:bg-white/15",
              "ring-1 ring-white/10",
              "transition-colors",
            ].join(" ")}
            onClick={() => setIsProfileMenuOpen((v) => !v)}
          >
            <div className="h-9 w-9 rounded-full ring-2 ring-white/20 bg-[#332173] flex items-center justify-center text-white text-[14px] font-bold uppercase shrink-0">
              {getInitials(userData?.name)}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[12px] font-semibold leading-4 truncate capitalize">
                {userData?.name || "Loading..."}
              </div>
              <div className="text-[10px] text-white/65 leading-4 truncate">
                {userData?.role || "Candidate"}
              </div>
            </div>
            <ChevronsUpDown size={16} className="text-white/70" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default CandidateAdminSidebar;