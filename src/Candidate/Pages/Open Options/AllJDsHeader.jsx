import { Search, X, SlidersHorizontal } from "lucide-react";

function AllJDsHeader({ 
    searchTerm, 
    setSearchTerm, 
    filterLocation, 
    filterCompany, 
    setFilterLocation, 
    setFilterCompany,
    showFilterDropdown,
    setShowFilterDropdown,
    filterRef,
    uniqueLocations,
    uniqueCompanies
}) {
    return (
        <header className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                <h1 className="text-2xl sm:text-3xl text-gray-900 font-bold tracking-tight">All Available Jobs</h1>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">
                    <div className="flex gap-2 flex-1 md:flex-initial">
                        <div className="relative flex-1 md:w-80">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search by title, company, or skills"
                                className="w-full pl-4 pr-12 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <Search className="w-5 h-5" />
                            </span>
                        </div>
                        <div className="relative" ref={filterRef}>
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className={`px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm flex items-center gap-2 ${
                                    (filterLocation || filterCompany) ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
                                }`}
                            >
                                <SlidersHorizontal className="w-5 h-5" />
                                <span className="hidden sm:inline">Filter</span>
                                {(filterLocation || filterCompany) && (
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                )}
                            </button>
                            
                            {showFilterDropdown && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                        <h3 className="font-bold text-gray-900">Filters</h3>
                                        <button
                                            onClick={() => setShowFilterDropdown(false)}
                                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                                        <select
                                            value={filterLocation}
                                            onChange={e => setFilterLocation(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                                        >
                                            <option value="">All Locations</option>
                                            {uniqueLocations.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                                        <select
                                            value={filterCompany}
                                            onChange={e => setFilterCompany(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                                        >
                                            <option value="">All Companies</option>
                                            {uniqueCompanies.map(comp => (
                                                <option key={comp} value={comp}>{comp}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => {
                                                setFilterLocation("");
                                                setFilterCompany("");
                                            }}
                                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => setShowFilterDropdown(false)}
                                            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7058C5] to-[#A9A9FB] text-white rounded-lg hover:opacity-90 transition-all font-medium text-sm"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {(filterLocation || filterCompany || searchTerm) && (
                        <button
                            className="px-4 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
                            onClick={() => { setFilterLocation(""); setFilterCompany(""); setSearchTerm(""); }}
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

export default AllJDsHeader;
