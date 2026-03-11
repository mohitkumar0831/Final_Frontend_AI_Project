import { Search } from 'lucide-react';

function AppliedJobsHeader({ searchTerm, setSearchTerm, setCurrentPage }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800">Applied Jobs</h2>
            <div className="relative w-full sm:w-72">
                <input
                    type="text"
                    placeholder="Search by company, job, location, or skills"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            </div>
        </div>
    );
}

export default AppliedJobsHeader;
