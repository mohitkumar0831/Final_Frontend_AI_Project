import { X } from 'lucide-react';

function AppliedJobsSkillsModal({ selectedSkills, closeSkillsPopup }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeSkillsPopup} />
            <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Technical Requirements</h3>
                    <button onClick={closeSkillsPopup} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectedSkills?.map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AppliedJobsSkillsModal;
