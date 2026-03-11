import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AssessmentAPI from '../../../RecruiterAdmin/api/generateAssessmentApi';
import SpinLoader from '../../../components/SpinLoader';
import ExaminationCard from './ExaminationCard';

export default function Examination() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const regex = / \d{2}:\d{2}:\d{2} GMT/;

  useEffect(() => {
    const fetchAssessment = async () => {
      setLoading(true);
      try {
        const candidateRaw = sessionStorage.getItem("candidateData");
        const candidate = candidateRaw ? JSON.parse(candidateRaw) : null;
        if (!candidate) {
          setJobs([
            {
              title: "No Examination Available",
              location: "—",
              description: "You have not been shortlisted for the test.",
              isActive: false,
              startDate: "—",
              startTime: "—",
              endDate: "—",
              endTime: "—",
            },
          ]);
          return;
        }

        const candidateId = candidate._id || candidate.id;
        let finalisedTestResults = null;
        try {
          finalisedTestResults = await AssessmentAPI.getFinalizedTest(candidateId);
        } catch (apiErr) {
          console.error('Error fetching finalized test from AssessmentAPI:', apiErr);
        }

        if (Array.isArray(finalisedTestResults) && finalisedTestResults.length > 0) {
          const onlyNull = finalisedTestResults.length === 1 &&
            Object.values(finalisedTestResults[0]).every(
              v => v === null || v === undefined || v === ""
            );
          if (!onlyNull) {
            const parseDateTime = (dateStr, timeStr) => {
              if (!dateStr && !timeStr) return null;

              try {
                let dt = new Date(dateStr);
                
                if (!isNaN(dt) && timeStr) {
                  const datePart = dt.toISOString().split('T')[0];
                  dt = new Date(`${datePart} ${timeStr}`);
                }

                if (!isNaN(dt)) return dt;

                const combined = `${dateStr || ''} ${timeStr || ''}`.trim();
                dt = new Date(combined);
                
                if (!isNaN(dt)) return dt;
              } catch (e) {
                console.error("Parsing error:", e);
              }

              return null;
            };

            const now = new Date();

            let takenList = [];
            try {
              const taken = await AssessmentAPI.getTakenTests(candidateId);
              takenList = Array.isArray(taken) ? taken : [];
              console.log('Examination: takenList ->', takenList);
            } catch (e) {
              console.warn('Failed to fetch taken tests', e);
            }

            const normalizeQuestionSetId = (t) => {
              if (!t) return null;
              if (typeof t === 'string') return t;
              return t.questionSetId || t.question_set_id || t.question_set || (t.questionSet && (t.questionSet.id || t.questionSet._id)) || null;
            };

            const takenQuestionSetIds = new Set(
              takenList
                .map(t => t.question_set_id || t.questionSetId || (t.question && (t.question.question_set_id || t.question.questionSetId)) || null)
                .filter(Boolean)
            );

            const availableTests = finalisedTestResults.filter(test => {
              const qid = normalizeQuestionSetId(test);
              if (qid && takenQuestionSetIds.has(qid)) {
                console.log('Examination: filtering out taken test by question_set_id', { qid });
                return false;
              }
              return true;
            });

            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

            const processed = availableTests.map(test => {
              const rawStart = test.exam_date || test.startDate || '';
              const rawEnd = test.end_date || test.endDate || '';
              let startDT = parseDateTime(rawStart, test.test_start || test.test_start);
              let endDT = parseDateTime(rawEnd, test.test_end || test.test_end);

              const tryDateOnlyAsEndOfDay = (dateStr) => {
                if (!dateStr) return null;
                try {
                  const d = new Date(dateStr);
                  if (d && !isNaN(d)) {
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
                  }
                } catch (e) {}
                return null;
              };

              const tryDateOnlyAsStartOfDay = (dateStr) => {
                if (!dateStr) return null;
                try {
                  const d = new Date(dateStr);
                  if (d && !isNaN(d)) {
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
                  }
                } catch (e) {}
                return null;
              };

              const formatToAMPM = (time24) => {
                if (!time24) return "";

                let [hours, minutes] = time24.split(':').map(Number);
                
                const ampm = hours >= 12 ? 'PM' : 'AM';
                
                hours = hours % 12;
                hours = hours ? hours : 12; 
                
                const strMinutes = minutes < 10 ? '0' + minutes : minutes;

                return `${hours}:${strMinutes} ${ampm}`;
              };

              if (!startDT) startDT = tryDateOnlyAsStartOfDay(rawStart) || null;
              if (!endDT) endDT = tryDateOnlyAsEndOfDay(rawEnd) || null;

              const isActiveFlag = typeof test.isActive === 'boolean' ? test.isActive : true;
              const isAvailable = isActiveFlag && (endDT ? now <= endDT : true);
              const canGiveTest = isActiveFlag && (startDT ? now >= startDT : true) && (endDT ? now <= endDT : true);

              const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
              const timeOptions = { hour: '2-digit', minute: '2-digit' };
              const displayStartDate = startDT ? startDT.toLocaleDateString(undefined, dateOptions) : (rawStart || 'Today');
              var displayStartTime = startDT ? startDT.toLocaleTimeString(undefined, timeOptions) : (test.test_start || test.startTime || '10:00 AM');
              displayStartTime = formatToAMPM(displayStartTime);
              const displayEndDate = endDT ? endDT.toLocaleDateString(undefined, dateOptions) : (rawEnd || '—');
              var displayEndTime = endDT ? endDT.toLocaleTimeString(undefined, timeOptions) : (test.test_end || test.endTime || '—');
              displayEndTime = formatToAMPM(displayEndTime);

              const isExpiredByDateOnly = endDT ? (endDT < todayStart) : false;

              return {
                title: test.title || "Assessment",
                company: test.company,
                jobId: test.jobId || test.job_id || test._id || test.id || null,
                location: test.location || "API Response Check",
                workType: test.workType || "API Response Check",
                skills: Array.isArray(test.skills) ? test.skills : [],
                description: test.description || "This is an assessment for your role.",
                startDate: displayStartDate,
                startTime: displayStartTime,
                endDate: displayEndDate,
                endTime: displayEndTime,
                isActive: isActiveFlag,
                isAvailable,
                canGiveTest,
                isExpiredByDateOnly,
                questionSetId: test.questionSetId || test.question_set_id || "assessment",
                questions: Array.isArray(test.questions) ? test.questions : [],
                aiScore: test.aiScore !== null && test.aiScore !== undefined ? test.aiScore : null,
                aiExplanation: test.aiExplanation !== null && test.aiExplanation !== undefined ? test.aiExplanation : null
              };
            });

            setJobs(processed.filter(j => j.isAvailable && !j.isExpiredByDateOnly).map(({isExpiredByDateOnly, ...rest}) => rest));
            return;
          }
        }
        setJobs([
          {
            title: "No Examination Available",
            location: "—",
            description: "You have not been shortlisted for the test.",
            isActive: false,
            startDate: "—",
            startTime: "—",
            endDate: "—",
            endTime: "—",
          },
        ]);
        } catch (err) {
          console.error("Error fetching assessment from backend", err);
          setJobs([
            {
              title: "No Assessment Found",
              location: "—",
              workType: "—",
              employmentMode: "—",
              description:
                "No assessment has been generated yet. Please check back later.",
              startDate: "—",
              startTime: "—",
              endDate: "—",
              endTime: "—",
              isActive: false,
            },
          ]);
        } finally {
          setLoading(false);
        }
    };
    fetchAssessment();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SpinLoader />
      </div>
    );
  }

  const handleGiveTest = (job) => {
    const id = job.jobId || job.job_id || job.id || null;
    const qid = job.questionSetId || job.question_set_id || job.questionSetId || null;
    try {
      sessionStorage.setItem('jobData', JSON.stringify({ job_id: id, questionSetId: qid }));
      console.log('Examination: stored jobData ->', { job_id: id, questionSetId: qid });
    } catch (e) {}
    try {
      navigate(`/Candidate-Dashboard/Examination/TestDetails/${job.questionSetId}?job_id=${encodeURIComponent(id || '')}`, { state: { job_id: id } });
    } catch (e) {
      navigate(`/Candidate-Dashboard/Examination/TestDetails/${job.questionSetId}?job_id=${encodeURIComponent(id || '')}`);
    }
  };

  return (
    <div className="min-h-screen px-4 md:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Available Examinations
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job, index) => (
          <ExaminationCard
            key={index}
            job={job}
            handleGiveTest={handleGiveTest}
          />
        ))}
      </div>
    </div>
  );
}
