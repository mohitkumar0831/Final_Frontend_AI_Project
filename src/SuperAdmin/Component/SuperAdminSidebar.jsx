import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Building2,
  LogOut,
  MessageSquare,
  Building,
  Search,
  Headphones,
  ChevronsUpDown,
  Shield,
} from "lucide-react";

const AdminSidebar = ({ isOpen = true, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState("Dashboard");

  const navItems = useMemo(
    () => [
      {
        name: "Dashboard",
        path: "/SuperAdmin-Dashboard",
        icon: Home,
        label: "Dashboard",
      },
      {
        name: "EnquiryMessages",
        path: "/SuperAdmin-Dashboard/EnquiryMessages",
        icon: MessageSquare,
        label: "Enquiry Messages",
      },
      {
        name: "RegisteredCompanies",
        path: "/SuperAdmin-Dashboard/CompaniesRegister",
        icon: Building,
        label: "Register Companies",
      },
      {
        name: "RejisteredRecruiters",
        path: "/SuperAdmin-Dashboard/RejisteredRecruiters",
        icon: Building2,
        label: "Recently Applied",
      },
    ],
    []
  );

  useEffect(() => {
    const path = location.pathname;

    if (path.includes("/EnquiryMessages")) setActiveNav("EnquiryMessages");
    else if (path.includes("/CompaniesRegister"))
      setActiveNav("RegisteredCompanies");
    else if (path.includes("/RejisteredRecruiters"))
      setActiveNav("RejisteredRecruiters");
    else if (path.includes("/Profile")) setActiveNav("Profile");
    else setActiveNav("Dashboard");
  }, [location.pathname]);

  const handleNavClick = (name, path) => {
    setActiveNav(name);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/SuperAdminLogin");
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
        <Icon
          size={16}
          className={isActive ? "text-white" : "text-white/80"}
        />
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 bottom-0 z-40 w-[260px] ml-1 my-1 rounded-xl",
          "px-4 py-5 text-white",
          "transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          "bg-gradient-to-b from-[#1A1034] via-[#241554] to-[#1A1034]",
          "flex flex-col",
        ].join(" ")}
      >
        {/* ── Logo ── */}
        <div className="shrink-0">
          <div className="flex justify-center items-center gap-2 px-1">
            <div className="text-[22px] font-semibold">
              Recruiter<span className="text-white/90">AI</span>
            </div>
          </div>

          {/* ── Search ── */}
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

        {/* ── Scrollable Nav ── */}
        <div className="mt-5 flex-1 overflow-y-auto pr-1 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavItem key={item.name} {...item} />
            ))}

            {/* ── Logout Button ── */}
            <button
              onClick={handleLogout}
              className={[
                "group w-full flex items-center gap-3",
                "h-9 px-3 rounded-md text-left",
                "text-[12px] font-medium tracking-wide",
                "transition-colors duration-200",
                "text-red-300/90 hover:bg-red-500/15 hover:text-red-200",
              ].join(" ")}
            >
              <LogOut size={16} className="text-red-300/90" />
              <span className="truncate">Logout</span>
            </button>
          </nav>

          {/* ── Support Card ── */}
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

        {/* ── Profile Footer ── */}
        <div className="shrink-0 pt-3 border-t border-white/10">
          <button
            className={[
              "w-full flex items-center gap-3",
              "rounded-full p-3",
              "bg-white/10 hover:bg-white/15",
              "ring-1 ring-white/10",
              "transition-colors",
            ].join(" ")}
            onClick={() => navigate("/SuperAdmin-Dashboard/Profile")}
          >
            <div className="h-9 w-9 rounded-full ring-2 ring-white/20 bg-[#332173] grid place-items-center">
              <Shield size={18} className="text-white" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[12px] font-semibold leading-4 truncate">
                Super Admin
              </div>
              <div className="text-[10px] text-white/65 leading-4 truncate">
                Administrator
              </div>
            </div>
            <ChevronsUpDown size={16} className="text-white/70" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;