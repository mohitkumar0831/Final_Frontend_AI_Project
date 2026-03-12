import { MapPin, X, Search, Calendar, Briefcase, IndianRupee, Clock, GraduationCap, ClipboardList, Building2 } from "lucide-react";

const BuildingLogo = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Building Logo"
  >
    <g clipPath="url(#clip_building_shape)">
     
      <path d="M1.5 8L5.5 4L9.5 7L10 22.5H4L1.5 21V8Z" fill="#9B8EFF"/>
      
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M16 14C16 14.552 15.552 15 15 15H14C13.448 15 13 14.552 13 14C13 13.448 13.448 13 14 13H15C15.552 13 16 13.448 16 14ZM19 13H18C17.448 13 17 13.448 17 14C17 14.552 17.448 15 18 15H19C19.552 15 20 14.552 20 14C20 13.448 19.552 13 19 13ZM15 17H14C13.448 17 13 17.448 13 18C13 18.552 13.448 19 14 19H15C15.552 19 16 18.552 16 18C16 17.448 15.552 17 15 17ZM19 17H18C17.448 17 17 17.448 17 18C17 18.552 17.448 19 18 19H19C19.552 19 20 18.552 20 18C20 17.448 19.552 17 19 17ZM15 5H14C13.448 5 13 5.448 13 6C13 6.552 13.448 7 14 7H15C15.552 7 16 6.552 16 6C16 5.448 15.552 5 15 5ZM19 5H18C17.448 5 17 5.448 17 6C17 6.552 17.448 7 18 7H19C19.552 7 20 6.552 20 6C20 5.448 19.552 5 19 5ZM15 9H14C13.448 9 13 9.448 13 10C13 10.552 13.448 11 14 11H15C15.552 11 16 10.552 16 10C16 9.448 15.552 9 15 9ZM19 9H18C17.448 9 17 9.448 17 10C17 10.552 17.448 11 18 11H19C19.552 11 20 10.552 20 10C20 9.448 19.552 9 19 9ZM24 5V19C24 21.757 21.757 24 19 24H5C2.243 24 0 21.757 0 19V9.258C0 7.907 0.558 6.594 1.531 5.657L3.419 3.839C4.586 2.714 6.414 2.715 7.581 3.839L9 5.206V5C9 2.243 11.243 0 14 0H19C21.757 0 24 2.243 24 5ZM9 9.258C9 8.447 8.665 7.66 8.081 7.097L6.193 5.279C5.999 5.091 5.749 4.998 5.5 4.998C5.251 4.998 5.001 5.091 4.807 5.279L2.919 7.097C2.335 7.659 2 8.447 2 9.258V19C2 20.654 3.346 22 5 22H9V9.258ZM22 5C22 3.346 20.654 2 19 2H14C12.346 2 11 3.346 11 5V22H19C20.654 22 22 20.654 22 19V5ZM6 13H5C4.448 13 4 13.448 4 14C4 14.552 4.448 15 5 15H6C6.552 15 7 14.552 7 14C7 13.448 6.552 13 6 13ZM6 9H5C4.448 9 4 9.448 4 10C4 10.552 4.448 11 5 11H6C6.552 11 7 10.552 7 10C7 9.448 6.552 9 6 9ZM6 17H5C4.448 17 4 17.448 4 18C4 18.552 4.448 19 5 19H6C6.552 19 7 18.552 7 18C7 17.448 6.552 17 6 17Z" 
        fill="black"
      />
    </g>
    <defs>
      <clipPath id="clip_building_shape">
        <rect width="24" height="24" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

//Qualification logo 
const EducationLogo = ({ size = 24, accentColor = "#9B8EFF", className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Education Icon"
    >
      <path d="M11.5 3.5L2.5 8L12 11.5L21 7.5L11.5 3.5Z" fill={accentColor}/>
      
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M22.807 10.3747C22.737 9.70367 22.591 8.72167 22.383 7.53567C22.383 7.53567 22.332 7.15767 21.972 6.88867C21.889 6.82667 19.853 5.41667 16.492 4.05067C14.174 3.10867 11.971 2.70167 11.878 2.68567C11.76 2.66467 11.639 2.66467 11.521 2.68567C11.428 2.70267 9.226 3.10867 6.907 4.05067C3.545 5.41667 1.511 6.82967 1.426 6.88867C1.159 7.07667 1 7.38167 1 7.70767C1 8.03367 1.159 8.33967 1.426 8.52667C1.481 8.56467 2.347 9.16567 3.856 9.95467C3.803 10.8267 3.773 11.6287 3.773 12.2087C3.773 16.3257 4.483 18.9157 4.514 19.0237C4.562 19.1977 4.657 19.3547 4.788 19.4797C4.987 19.6687 6.872 21.3297 11.704 21.3297C16.625 21.3297 18.446 19.6547 18.637 19.4627C18.759 19.3407 18.847 19.1897 18.894 19.0237C18.924 18.9167 19.624 16.3587 19.624 12.2097C19.624 11.6317 19.595 10.8287 19.542 9.95467C19.964 9.73367 20.336 9.52867 20.654 9.34567C20.728 9.83367 20.783 10.2507 20.818 10.5807C21.235 14.5927 20.802 17.1687 20.797 17.1937C20.703 17.7367 21.106 18.3257 21.698 18.3617C22.26 18.3957 22.682 18.0237 22.768 17.5397C22.788 17.4257 23.256 14.6877 22.808 10.3747H22.807ZM7.66 5.90267C9.419 5.18767 11.15 4.80067 11.7 4.68867C12.25 4.80167 13.981 5.18867 15.74 5.90267C17.33 6.54867 18.61 7.21067 19.488 7.70867C18.612 8.20467 17.335 8.86467 15.74 9.51367C13.981 10.2287 12.25 10.6157 11.7 10.7277C11.15 10.6147 9.419 10.2277 7.66 9.51367C6.07 8.86767 4.79 8.20567 3.912 7.70767C4.788 7.21167 6.065 6.55167 7.66 5.90267ZM17.625 12.2097C17.625 15.2717 17.214 17.4177 17.042 18.1817C16.541 18.5107 14.963 19.3297 11.705 19.3297C8.503 19.3297 6.89 18.5067 6.365 18.1707C6.19 17.3947 5.775 15.2377 5.775 12.2097C5.775 11.8577 5.788 11.4037 5.81 10.8977C6.158 11.0527 6.524 11.2097 6.907 11.3647C9.225 12.3067 11.428 12.7137 11.521 12.7297C11.58 12.7407 11.64 12.7457 11.7 12.7457C11.76 12.7457 11.82 12.7407 11.879 12.7297C11.972 12.7127 14.174 12.3067 16.493 11.3647C16.877 11.2087 17.243 11.0527 17.591 10.8967C17.614 11.4027 17.626 11.8577 17.626 12.2087L17.625 12.2097Z" 
        fill="black"
      />
    </svg>
  );
};

//Experience logo 
const ProfileVerifiedLogo = ({ size = 18, color = "#4C4C4C", className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 18 18" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Profile Verified Icon"
    >
      <g clipPath="url(#clip_profile_verified)">
        <path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M10.5 6C10.5 3.92925 8.82075 2.25 6.75 2.25C4.67925 2.25 3 3.92925 3 6C3 8.058 4.659 9.72525 6.71175 9.74625C7.03425 9.09825 7.46325 8.5155 7.9665 8.00775C7.60275 8.172 7.1805 8.25 6.75 8.25C5.9145 8.25 5.295 7.94925 4.9065 7.272C4.9065 7.272 5.56725 6.75 6.75 6.75C7.60425 6.75 8.41125 7.06875 8.79225 7.293C9.29925 6.92475 9.858 6.624 10.4587 6.40725C10.4738 6.2715 10.5 6.1395 10.5 6ZM6.75 6C6.129 6 5.625 5.448 5.625 4.875C5.625 4.254 6.129 3.75 6.75 3.75C7.371 3.75 7.875 4.254 7.875 4.875C7.875 5.496 7.371 6 6.75 6ZM7.5 17.25C7.5 17.6647 7.164 18 6.75 18H3.75C1.68225 18 0 16.3177 0 14.25V3.75C0 1.68225 1.68225 0 3.75 0H9.75C11.8177 0 13.5 1.68225 13.5 3.75V5.25C13.5 5.664 13.164 6 12.75 6C12.336 6 12 5.664 12 5.25V3.75C12 2.5095 10.9905 1.5 9.75 1.5H3.75C2.5095 1.5 1.5 2.5095 1.5 3.75V14.25C1.5 15.4905 2.5095 16.5 3.75 16.5H6.75C7.164 16.5 7.5 16.8353 7.5 17.25ZM12.75 7.5C9.855 7.5 7.5 9.85575 7.5 12.75C7.5 15.6442 9.855 18 12.75 18C15.645 18 18 15.6442 18 12.75C18 9.85575 15.645 7.5 12.75 7.5ZM12.75 16.5C10.6823 16.5 9 14.8177 9 12.75C9 10.6823 10.6823 9 12.75 9C14.8177 9 16.5 10.6823 16.5 12.75C16.5 14.8177 14.8177 16.5 12.75 16.5ZM5.25 12C5.664 12 6 12.3352 6 12.75C6 13.1648 5.664 13.5 5.25 13.5H3.75C3.336 13.5 3 13.1648 3 12.75C3 12.3352 3.336 12 3.75 12H5.25ZM15.1658 11.841C15.453 12.1395 15.4432 12.6143 15.144 12.9015L13.485 14.4945C13.146 14.829 12.696 14.9977 12.2452 14.9977C11.7945 14.9977 11.3422 14.829 10.9972 14.4923L10.1483 13.6613C9.852 13.371 9.8475 12.8963 10.137 12.6007C10.4272 12.3045 10.902 12.3 11.1975 12.5887L12.0465 13.4198C12.1545 13.5255 12.3307 13.5262 12.438 13.4198L14.1052 11.8193C14.4037 11.5335 14.8785 11.5417 15.1658 11.841Z" 
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="clip_profile_verified">
          <rect width="18" height="18" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
};


//job summary
const TaskCompletedLogo = ({ size = 24, accentColor = "#9B8EFF", className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Task Completed Icon"
    >
      <g clipPath="url(#clip_task_check)">
       
        <circle cx="17" cy="17" r="5" fill={accentColor}/>
        
       
        <path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M10 23C10 23.552 9.553 24 9 24H5C2.243 24 0 21.757 0 19V7C0 4.955 1.237 3.198 3 2.424V1C3 0.448 3.447 0 4 0C4.553 0 5 0.448 5 1V2H7V1C7 0.448 7.447 0 8 0C8.553 0 9 0.448 9 1V2H11V1C11 0.448 11.447 0 12 0C12.553 0 13 0.448 13 1V2H15V1C15 0.448 15.447 0 16 0C16.553 0 17 0.448 17 1V2.424C18.763 3.198 20 4.955 20 7C20 7.552 19.553 8 19 8C18.447 8 18 7.552 18 7C18 5.346 16.654 4 15 4H5C3.346 4 2 5.346 2 7V19C2 20.654 3.346 22 5 22H9C9.553 22 10 22.448 10 23ZM15 8C15 7.448 14.553 7 14 7H6C5.447 7 5 7.448 5 8C5 8.552 5.447 9 6 9H14C14.553 9 15 8.552 15 8ZM24 17C24 20.86 20.859 24 17 24C13.141 24 10 20.86 10 17C10 13.14 13.141 10 17 10C20.859 10 24 13.14 24 17ZM22 17C22 14.243 19.757 12 17 12C14.243 12 12 14.243 12 17C12 19.757 14.243 22 17 22C19.757 22 22 19.757 22 17ZM6 11C5.447 11 5 11.448 5 12C5 12.552 5.447 13 6 13H8.5C9.053 13 9.5 12.552 9.5 12C9.5 11.448 9.053 11 8.5 11H6ZM18.808 15.758L16.585 17.892C16.441 18.032 16.206 18.035 16.063 17.892L14.932 16.784C14.536 16.399 13.904 16.404 13.518 16.799C13.131 17.194 13.137 17.826 13.532 18.213L14.663 19.321C15.123 19.771 15.725 19.995 16.327 19.995C16.929 19.995 17.527 19.771 17.98 19.324L20.193 17.2C20.591 16.817 20.604 16.184 20.222 15.786C19.84 15.388 19.205 15.374 18.808 15.757V15.758Z" 
          fill="#282828"
        />
      </g>
      <defs>
        <clipPath id="clip_task_check">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
};

const ViewDetailsLogo = ({ size = 24, accentColor = "#9B8EFF", className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="View Details Logo"
    >
      <g clipPath="url(#clip_details_icon)">
       
        <path 
          d="M12 18L11 19.5L11.5 20.5L14.5 22L16 23L18.5 22.5L20.5 22L22 21L23 19.5L22 18L20.5 17L19 16H17H15L13.5 17L12 18Z" 
          fill={accentColor}
        />
        
        <path 
          d="M8 16C8 16.828 7.328 17.5 6.5 17.5C5.672 17.5 5 16.828 5 16C5 15.172 5.672 14.5 6.5 14.5C7.328 14.5 8 15.172 8 16ZM6.5 4.5C5.672 4.5 5 5.172 5 6C5 6.828 5.672 7.5 6.5 7.5C7.328 7.5 8 6.828 8 6C8 5.172 7.328 4.5 6.5 4.5ZM6.5 9.5C5.672 9.5 5 10.172 5 11C5 11.828 5.672 12.5 6.5 12.5C7.328 12.5 8 11.828 8 11C8 10.172 7.328 9.5 6.5 9.5ZM19 0H5C2.243 0 0 2.243 0 5V18C0 20.757 2.243 23 5 23H8C8.552 23 9 22.553 9 22C9 21.447 8.552 21 8 21H5C3.346 21 2 19.654 2 18V5C2 3.346 3.346 2 5 2H19C20.654 2 22 3.346 22 5V14C22 14.553 22.448 15 23 15C23.552 15 24 14.553 24 14V5C24 2.243 21.757 0 19 0ZM11 7H18C18.552 7 19 6.552 19 6C19 5.448 18.552 5 18 5H11C10.448 5 10 5.448 10 6C10 6.552 10.448 7 11 7ZM11 12H18C18.552 12 19 11.552 19 11C19 10.448 18.552 10 18 10H11C10.448 10 10 10.448 10 11C10 11.552 10.448 12 11 12ZM23.705 18.549C24.096 19.127 24.096 19.873 23.705 20.451C22.809 21.776 20.746 24 17 24C13.254 24 11.191 21.776 10.294 20.451C9.903 19.872 9.903 19.126 10.294 18.549C11.19 17.224 13.252 15 16.999 15C20.746 15 22.809 17.224 23.705 18.549ZM21.93 19.5C21.2 18.494 19.667 17 17 17C14.333 17 12.799 18.495 12.07 19.5C12.799 20.506 14.333 22 17 22C19.667 22 21.2 20.506 21.93 19.5ZM17 18C16.172 18 15.5 18.672 15.5 19.5C15.5 20.328 16.172 21 17 21C17.828 21 18.5 20.328 18.5 19.5C18.5 18.672 17.828 18 17 18Z" 
          fill="black"
        />
      </g>
      <defs>
        <clipPath id="clip_details_icon">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
};


function AllJDsModal({ selectedJob, handleCloseModal, handleApplyFromModal }) {
    if (!selectedJob) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden relative flex flex-col">
                
                {/* Header Section */}
                <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-[#7058C5] rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl flex-shrink-0">
                            {selectedJob.company.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 line-clamp-1">{selectedJob.title}</h2>
                            <p className="text-gray-500 text-xs md:text-sm font-medium line-clamp-1">{selectedJob.company}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                        <span className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-gray-50 text-gray-600 rounded-full text-[10px] md:text-xs font-medium">
                            <MapPin size={12} className="text-indigo-500" /> {Array.isArray(selectedJob.location) ? selectedJob.location[0] : selectedJob.location}
                        </span>
                        <span className="px-2 md:px-3 py-1 md:py-1.5 bg-red-50 text-red-500 rounded-full text-[10px] md:text-xs font-bold">
                            {selectedJob.dueDate || selectedJob.offerId?.dueDate.slice(0, 10) || 'Apply Soon'}
                        </span>
                        <span className="px-2 md:px-3 py-1 md:py-1.5 bg-fuchsia-50 text-fuchsia-600 rounded-full text-[10px] md:text-xs font-bold uppercase">
                            {selectedJob.appliedCandidates?.length || 0}+ Applicants
                        </span>
                        <button onClick={handleCloseModal} className="ml-auto sm:ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#6551a4ff transparent'
                }}>
                    {/* Left Scrollable Column */}
                    <div className="flex-1 overflow-visible lg:overflow-y-auto p-5 sm:p-6 lg:p-8 space-y-8 lg:space-y-10" style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#634BB5 transparent',
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <TaskCompletedLogo size={24} accentColor={  "#9B8EFF"} />
                                <h3 className="text-lg md:text-xl font-bold text-gray-900">Job Summary</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-sm md:text-[15px]">
                                {selectedJob.jobSummary || 'Details not available.'}
                               
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-4 md:mb-6">
                                <EducationLogo size={30} accentColor="#6366F1" />
                                <h3 className="text-lg md:text-xl font-bold text-gray-900">Qualification</h3>
                            </div>
                            <ul className="space-y-3 md:space-y-4">
                                {(selectedJob.requirements && selectedJob.requirements.length > 0) ? (
                                    selectedJob.requirements.map((req, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-gray-600 text-sm md:text-[15px]">
                                            <div className="w-2 h-2 rounded-full bg-[#7058C5] mt-2 flex-shrink-0" />
                                            {req}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-gray-500 text-sm">No specific requirements listed</li>
                                )}
                            </ul>
                        </section>
                    </div>

                    {/* Right Sidebar Column */}
                    <div className="w-full lg:w-[380px]   p-6 lg:p-8 space-y-8 flex-shrink-0">
                        <div className="border-b border-gray-100 bg-[#F9F9FB]">
                            <div className="flex items-center gap-2 mb-4 md:mb-6">
                                <div className="p-1 bg-white rounded shadow-sm"><ViewDetailsLogo size={28} accentColor="#4F46E5" /></div>
                                <h3 className="text-lg md:text-xl font-bold text-gray-900">Overview</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                                        <Briefcase size={20} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase">Employment Type</p>
                                        <p className="text-xs md:text-sm font-bold text-gray-700">
                                            {selectedJob.offerId?.employmentType || selectedJob.employmentType || 'Full Time'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                                        <ProfileVerifiedLogo size={24} color="gray" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase">Experience</p>
                                        <p className="text-xs md:text-sm font-bold text-gray-700">
                                            {selectedJob.offerId?.experience || selectedJob.experience || 'Not Specified'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                                        <IndianRupee size={20} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase">Salary</p>
                                        <p className="text-xs md:text-sm font-bold text-gray-700">
                                            {selectedJob.offerId?.salary || selectedJob.salary || 'Not Disclosed'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
                                        <Calendar size={20} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase">Due Date</p>
                                        <p className="text-xs md:text-sm font-bold text-gray-700">
                                            {selectedJob.dueDate || selectedJob.offerId?.dueDate.slice(0, 10)  || 'Apply Soon'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        

                        <div className="bg-[#F9F9FB]">
                            <div className="flex items-center gap-2 mb-4">
                                <BuildingLogo size={32} className="header-logo" />
                                <h3 className="text-lg md:text-xl font-bold text-gray-900">About The Company</h3>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {selectedJob.offerId?.description || selectedJob.description || 'Not Specified'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 lg:p-6 bg-white border-t border-gray-50 flex justify-center">
                    <button
                        onClick={handleApplyFromModal}
                        className="w-full sm:w-2/3 lg:w-1/3 bg-gradient-to-r from-[#7058C5] to-[#A9A9FB] hover:bg-[#5d47a8] text-white font-bold py-3 lg:py-4 rounded-xl transition-all shadow-lg shadow-indigo-100 text-base lg:text-lg"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}



export default AllJDsModal;
