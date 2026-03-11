import React from 'react'
import './App.css'
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link,
} from "react-router-dom";

import LandingPage from './components/LandingPage/LandingPage';
import NotificationPage from './components/NotificationBell.jsx';
import CompaniesRegister from './SuperAdmin/CompaniesRegister';
import SuperAdminProfile from './SuperAdmin/SuperAdminProfile';
import SuperAdminLayout from './SuperAdmin/SuperAdminLayout';
import MainLayout from './layouts/MainLayout';
import Home from './views/Home/Home';
import Features from './views/Features/Features';
import Howworks from './views/How It Works/Howworks';
import Industries from './views/Industries/Industries';
import About from './views/About/About';
import Contact from './views/Contact/Contact';
import Companies from './SuperAdmin/Companies';
import CompanyDetail from './SuperAdmin/CompanieDetail';
import Tickets from './SuperAdmin/Tickets';
import JD from './RecruiterAdmin/JD';
import CreateJD from './RecruiterAdmin/CreateJD';
import Assessment from './RecruiterAdmin/Assessment';
import QuestionsList from './RecruiterAdmin/QuestionsList';
import RecruiterAdminLayout from './RecruiterAdmin/RecruiterAdminLayout';
import Results from './RecruiterAdmin/Results';
import ViewResults from './RecruiterAdmin/ViewResults';
import JDDetails from './RecruiterAdmin/JDDetails';
import GenerateAssessment from './RecruiterAdmin/GenerateAssessment';
import NonCandidateList from './RecruiterAdmin/NonCandidateList';
import QuestionCreated from './RecruiterAdmin/Component/QuestionCreated';
import RejisteredRecruiters from './SuperAdmin/RejisteredRecruiters';
import AllJDs from './Candidate/Pages/Open Options/AllJDs';
import CandidateLayout from './Candidate/Pages/CandidateLayout';
import Report from './Candidate/Pages/Evaluation Summary/Report';
import AppliedJD from './Candidate/Pages/Applied Jobs/AppliedJD';
import Examination from './Candidate/Pages/Online Assessment/Examination';
import StartExam from './Candidate/Pages/StartExam';
import { useState } from "react";
import CandidateProfile from './Candidate/Pages/CandidateProfile';
import RMGLayout from './RMGAdmin/Pages/RMGLayout';
import Requirement from './RMGAdmin/Pages/Requirement';
import RequirementForm from './RMGAdmin/Pages/RequirementForm';
import AdminLayout from './Admin/Pages/AdminLayout';
import RecruiterManagement from './Admin/Pages/RecruiterManagement';
import AssignedRecruiters from './RMGAdmin/Pages/AssignedRecruiters';
import RMGManagement from './Admin/Pages/RMGManagement';
import AdminTickets from './Admin/Pages/Tickets';
import RaiseTickets from './Admin/Pages/RaiseTickets';
import EyeButton from './RMGAdmin/Pages/EyeButton';
import FilteredCandidate from './RMGAdmin/Pages/FilteredCandidate';
import UnfilteredCandidate from './RMGAdmin/Pages/UnfilteredCandidate';
import Review from './RecruiterAdmin/Review';
import SuperAdminLogin from './SuperAdmin/SuperAdminLogin';
import SuperAdminRegister from './SuperAdmin/SuperAdminRegister';
import SuperAdminDashboard from './SuperAdmin/SuperAdminDashboard';
import RecruiterDashboard from './RecruiterAdmin/RecruiterDashboard';
import CandidateDashboard from './Candidate/Pages/CandidateDashboard';
import RMGDashboard from './RMGAdmin/Pages/RMGDashboard';
import SeeHistory from './RMGAdmin/Pages/SeeHistory';
import CandidateLogin from './Candidate/CandidateLogin';
import Chatbot from './Candidate/Chatbot';
import AdminDashboard from './Admin/Components/AdminDashboard';
import RMGSupportTickets from './RMGAdmin/Pages/RMGSupportTickets';
import RMGRaiseTickets from './RMGAdmin/Pages/RMGRaiseTickets';
import EnquiryMessages from './SuperAdmin/EnquiryMessages';
import UniversalLogin from './components/UniversalLogin';
import TestDetails from "./Candidate/Component/TestDetails";
import CameraCheckWrapper from './Candidate/instructions_page/CameraCheckWrapper';
import GiveTest from './Candidate/Pages/GiveTest';
import ForgotPassword from './components/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { CompanyProvider } from './Context/companyContext';
import CandidateRegister from './Candidate/CandidateRegister';
import CandidateForgotPassword from './components/CandidateForgotPassword';
import RecruiterProfile from './RecruiterAdmin/RecruiterProfile';
import LoadingScreen from '../src/components/MainLoader.jsx';
import JDDetail from './components/JDDetail.jsx';
import ApplyToJob from './Candidate/Pages/ApplyToJob.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';

const App = () => {

  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />
  }
  return (

    <CompanyProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Notification Page for all roles */}
          <Route path="/notifications" element={<NotificationPage userId={localStorage.getItem('userId') || localStorage.getItem('adminId') || localStorage.getItem('candidateId') || localStorage.getItem('superAdminId')} />} />

          {/* <Route path="/" element={<LandingPage />} /> */}
          
          {/* Main Layout with nested routes for public pages */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="features" element={<Features />} />
            <Route path="how-it-works" element={<Howworks />} />
            <Route path="industries" element={<Industries />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          <Route path="/CandidateForgotPassword" element={<CandidateForgotPassword />} />
          <Route path="/SuperAdminLogin" element={<SuperAdminLogin />} />
          <Route path="/CandidateLogin" element={<CandidateLogin />} />
          <Route path="/CandidateRegister" element={<CandidateRegister />} />
          <Route path="/Candidate-Chatbot" element={<Chatbot />} />
          <Route path="/Login" element={<UniversalLogin />} />
          <Route path="/SuperAdminRegister" element={<SuperAdminRegister />} />
          <Route path="/JDDetail/:id" element={<JDDetail />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/Admin-Dashboard" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path='RecruiterManagement' element={<RecruiterManagement />} />
              <Route path='RMGManagement' element={<RMGManagement />} />
              <Route path='Tickets' element={<AdminTickets />} />
              <Route path='RaiseTickets' element={<RaiseTickets />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/RMGAdmin-Dashboard" element={<RMGLayout />}>
              <Route index element={<RMGDashboard />} />
              <Route path="RequirementForm" element={<RequirementForm />} />
              <Route path="Requirement" element={<Requirement />} />
              <Route path="AssignedRecruiters" element={<AssignedRecruiters />} />
              <Route path="EyeButton" element={<EyeButton />} />
              <Route path="FilteredCandidate" element={<FilteredCandidate />} />
              <Route path="UnfilteredCandidate" element={<UnfilteredCandidate />} />
              <Route path="AssignedRecruiters/SeeHistory" element={<SeeHistory />} />
              <Route path="RMGRaiseTickets/RMGSupportTickets" element={<RMGSupportTickets />} />
              <Route path="RMGRaiseTickets" element={<RMGRaiseTickets />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/Candidate-Dashboard" element={<CandidateLayout />}>
              <Route index element={<CandidateDashboard />} />
              <Route path="AllJDs" element={<AllJDs />} />
              <Route path="AllJDs/ApplyToJob/:jobId" element={<ApplyToJob />} />
              <Route path="Report" element={<Report />} />
              <Route path="AppliedJD" element={<AppliedJD />} />
              <Route path="Examination" element={<Examination />} />
              <Route path="Examination/TestDetails/:questionSetId" element={<TestDetails />} />
              <Route path="CandidateProfile" element={<CandidateProfile />} />
              {/* Camera Check (must contain the questionSetId) */}
              <Route path="Examination/CameraCheck/:questionSetId" element={<CameraCheckWrapper />} />
              {/* Candidate Test Route */}
              <Route path="give-test/:questionSetId" element={<GiveTest />} />
            </Route>
          </Route>


          <Route element={<ProtectedRoute />}>
            <Route path="/SuperAdmin-Dashboard" element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="CompaniesRegister" element={<CompaniesRegister />} />
              <Route path="Profile" element={<SuperAdminProfile />} />
              <Route path="Companies" element={<Companies />} />
              <Route path="RejisteredRecruiters/CompanieDetail" element={<CompanyDetail />} />
              <Route path="Tickets" element={<Tickets />} />
              <Route path="RejisteredRecruiters" element={<RejisteredRecruiters />} />
              <Route path="EnquiryMessages" element={<EnquiryMessages />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/RecruiterAdmin-Dashboard" element={<RecruiterAdminLayout />}>
              <Route index element={<RecruiterDashboard />} />
              <Route path="JD" element={<JD />} />
              <Route path="JD/CreateJD" element={<CreateJD />} />
              <Route path="Assessment" element={<Assessment />} />
              <Route path="Assessment/QuestionsList/:questionSetId" element={<QuestionsList />} />
              <Route path="Results" element={<Results />} />
              <Route path="JDDetails" element={<JDDetails />} />
              <Route path="JDDetails/GenerateAssessment" element={<GenerateAssessment />} />
              {/* ✅ NEW ROUTE: Questions editing page after generation */}
              <Route path="JDDetails/GenerateAssessment/QuestionsList/:questionSetId" element={<QuestionsList />} />
              <Route path="JDDetails/GenerateAssessment/Created" element={<QuestionCreated />} />
              {/* ✅ NEW ROUTE: Standalone Review page (optional) */}
              <Route path="Review" element={<Review />} />
              <Route path="NonCandidateList" element={<NonCandidateList />} />
              <Route path="RecruiterProfile" element={<RecruiterProfile />} />
            </Route>
          </Route>

        </Routes>
      </Router >
    </CompanyProvider>


  )
}

export default App
