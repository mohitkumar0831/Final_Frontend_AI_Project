function ExaminationCard({ job, handleGiveTest }) {
  if (!job) return null;

  // Calculate days left
  const getDaysLeft = () => {
    if (!job.endDate) return 0;

    try {
      const endDate = new Date(job.endDate);
      const today = new Date();

      const diff = Math.ceil(
        (endDate - today) / (1000 * 60 * 60 * 24)
      );

      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  };

  const daysLeft = getDaysLeft();

  return (
    <div className="relative bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">

      {/* Days Left Badge */}
      {daysLeft > 0 && (
        <div className="absolute top-0 right-0 bg-red-50 text-red-500 px-4 py-1 rounded-lg text-sm font-medium">
          {daysLeft} days left
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">

          {/* Logo */}
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center font-semibold text-purple-700">
            {job.company ? job.company.slice(0, 2).toUpperCase() : "NS"}
          </div>

          {/* Title */}
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              {job.title}
            </h2>

            <p className="text-xs text-gray-500">
              {job.company || "Company"} • {job.location}
            </p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {job.workType && (
          <span className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded">
            {job.workType}
          </span>
        )}

        {/* <span className="px-2 py-1 text-xs bg-yellow-50 text-yellow-600 rounded">
          Full Time
        </span> */}

        <span className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded">
          Active
        </span>
      </div>

      {/* Skills */}
      {/* <div className="mb-3">
        <p className="text-xs text-gray-600 mb-2">Skills</p>

        <div className="flex flex-wrap gap-2">
          {job.skills && job.skills.length > 0 ? (
            <>
              {job.skills.slice(0, 3).map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {skill}
                </span>
              ))}

              {job.skills.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                  +{job.skills.length - 3}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-400">No skills listed</span>
          )}
        </div>
      </div> */}

      {/* Time Section */}
      <div className="flex justify-between items-center bg-gray-100 p-3 rounded-xl mt-auto">

        <div className="text-xs space-y-1">
          <div>
            <span className="text-gray-500">From :</span>{" "}
            <span className="font-semibold">{job.startDate}</span>{" "}
            <span className="text-blue-600 font-semibold">
              {job.startTime}
            </span>
          </div>

          <div>
            <span className="text-gray-500">To :</span>{" "}
            <span className="font-semibold text-red-500">
              {job.endDate}
            </span>{" "}
            <span className="text-blue-600 font-semibold">
              {job.endTime}
            </span>
          </div>
        </div>

        {/* Button */}
        {job.isActive && job.canGiveTest && (
          <button
            onClick={() => handleGiveTest(job)}
            className="bg-gradient-to-r from-purple-500 to-indigo-400 text-white text-sm px-5 py-2 rounded-xl font-medium hover:opacity-90 transition"
          >
            Give Test
          </button>
        )}
      </div>
    </div>
  );
}

export default ExaminationCard;