import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  UserPlus,
  Building2,
  X,
  LogOut
} from 'lucide-react';
import sublogo from '../../assets/sublogo.png'; 



const CandidateAdminSidebar = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeNav, setActiveNav] = useState('');

  useEffect(() => {
    const path = location.pathname;

    if (path.includes("/AllJds")) setActiveNav("AllJds");
    else if (path.includes("/AppliedJD")) setActiveNav("AppliedJD");
    else if (path.includes("/Examination")) setActiveNav("Examination");
    else if (path.includes("/Report")) setActiveNav("Reports");
    else setActiveNav("CandidateDashboard");

  }, [location.pathname]);

  const handleNavClick = (name, path) => {
    setActiveNav(name);
    navigate(path);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('candidateToken');
      localStorage.removeItem('candidate');
    } catch (e) {}
    if (onToggle) onToggle();
    navigate('/');
  };

  const NavItem = ({ name, path, icon: Icon, label }) => {
    const isActive = activeNav === name;

    return (
      <li>
        <button
          onClick={() => handleNavClick(name, path)}
          className={`
            relative flex w-full items-center space-x-3 py-3 px-4 rounded-lg transition-all duration-200 font-medium
            ${isActive ? 'bg-gradient-to-r  from-[#34226D] to-[#6146B5]  shadow-sm' : 'text-white hover:bg-white/20'}
          `}
        >
          {isActive && (
            <div className="absolute left-[-16px] top-0 h-full w-1 bg-white rounded-r-md" />
          )}

          <Icon size={20} />
          <span>{label}</span>
        </button>
      </li>
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

      <div
        className={`
          fixed left-0 top-0 h-screen bg-gradient-to-b from-[#332173] to-[#1A1034] text-white z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 w-64 flex flex-col shadow-xl rounded-xl ml-1 my-1
        `}
      >
        <div className="flex items-center justify-between pb-8 py-4 px-6">
          <div className='w-full text-center'>
            
            <h1 className="text-3xl font-bold tracking-wide flex items-center justify-center gap-2">
              <span>
               <img src={sublogo} alt="Sub Logo" className='h-8 w-8 text-white' />
               </span>
            RecruterAI
            </h1>
          </div>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-white/20 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4">
          <ul className="space-y-2">

            <NavItem 
              name="CandidateDashboard" 
              path="/Candidate-Dashboard" 
              icon={Home} 
              label="Dashboard" 
            />
            
            <NavItem 
              name="AllJds" 
              path="/Candidate-Dashboard/AllJds" 
              icon={Building2} 
              label="Open Positions" 
            />

            <NavItem 
              name="AppliedJD" 
              path="/Candidate-Dashboard/AppliedJD" 
              icon={Building2} 
              label="Applied Jobs" 
            />

            <NavItem 
              name="Examination" 
              path="/Candidate-Dashboard/Examination" 
              icon={UserPlus} 
              label="Online Assessment" 
            />

            <NavItem 
              name="Reports" 
              path="/Candidate-Dashboard/Report" 
              icon={UserPlus} 
              label="Evalution Summary" 
            />

            <li>
              <button
                onClick={handleLogout}
                className={`flex w-full items-center space-x-3 py-3 px-4 rounded-lg transition-all duration-200 font-medium text-white hover:bg-white/20`}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </li>

          </ul>
        </nav>
      </div>
    </>
  );
};

export default CandidateAdminSidebar;