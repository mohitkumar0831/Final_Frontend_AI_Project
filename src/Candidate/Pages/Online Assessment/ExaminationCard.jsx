function ExaminationCard({ job, handleGiveTest }) {
    return (
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-gray-300 hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
            <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>

                <p className="text-red-500 text-sm sm:text-base mb-4">{job.location}</p>

                {job.workType && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-3 py-1 text-xs sm:text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-xl">
                            {job.workType}
                        </span>
                    </div>
                )}

                <p className="text-gray-600 text-sm leading-relaxed mb-2">{job.description}</p>

                {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {job.skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1 text-xs sm:text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
                                {skill}
                            </span>
                        ))}
                    </div>
                )}

                <div className="space-y-2 text-sm sm:text-base mb-4">
                    <div className="flex">
                        <span className="font-semibold text-gray-900 min-w-[100px]">From:</span>
                        <span className="text-gray-700 ml-2">
                            {job.startDate} at {job.startTime}
                        </span>
                    </div>

                    <div className="flex">
                        <span className="font-semibold text-gray-900 min-w-[100px]">To:</span>
                        <span className="text-gray-700 ml-2">
                            {job.endDate} at {job.endTime}
                        </span>
                    </div>
                </div>
            </div>

            <hr />

            <div className="flex justify-end">
                {job.isActive && job.canGiveTest ? (
                    <button
                        onClick={() => handleGiveTest(job)}
                        className={`mt-2 w-[100px] py-2 rounded-2xl font-medium text-sm sm:text-base transition-all duration-300 bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg`}
                    >
                        Give Test
                    </button>
                ) : null}
            </div>
        </div>
    );
}

export default ExaminationCard;
