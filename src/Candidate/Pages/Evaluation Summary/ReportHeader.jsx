import { Search, X, SlidersHorizontal } from 'lucide-react';

function ReportHeader({ 
    searchTerm, 
    setSearchTerm, 
    setCurrentPage, 
    filterJobTitle, 
    setFilterJobTitle,
    showFilterDropdown,
    setShowFilterDropdown,
    filterRef,
    uniqueJobTitles
}) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4">
            <h2 className="text-xl font-semibold text-gray-800">Assessment Result</h2>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-end">
                <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="🔍︎ Search by name, job, or company"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-3 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="relative" ref={filterRef}>
                    <button 
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 text-black rounded-lg transition-colors hover:bg-gray-300 w-full sm:w-auto ${
                            filterJobTitle ? 'ring-2 ring-blue-500 border-blue-500' : ''
                        }`}
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                        <span className="font-medium text-sm">Filter</span>
                        {filterJobTitle && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                    </button>

                    {showFilterDropdown && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-4 space-y-4">
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
                                <select
                                    value={filterJobTitle}
                                    onChange={e => setFilterJobTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                                >
                                    <option value="">All Job Titles</option>
                                    {uniqueJobTitles.map(title => (
                                        <option key={title} value={title}>{title}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setFilterJobTitle("");
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={() => setShowFilterDropdown(false)}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ReportHeader;
