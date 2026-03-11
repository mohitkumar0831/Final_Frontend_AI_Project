import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const ViewInsightDetail = ({ candidate }) => {
  const results = candidate?.raw?.results_data || [];

  return (
    <div className="max-w-4xl mx-auto bg-white min-h-screen shadow-sm font-sans text-slate-800">
      
      <header className="flex items-center p-5 border-b gap-3 bg-gradient-to-r from-indigo-50 to-purple-50/30">
        <div className="w-11 h-11 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold text-sm">
          {candidate?.name?.substring(0, 2)?.toUpperCase() || "NS"}
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">{candidate?.jobTitle || "Developer"}</h1>
          <p className="text-gray-500 text-sm">{candidate?.company || "—"}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="px-3 py-1.5 bg-white text-sm font-semibold text-indigo-600 rounded-full border border-indigo-100">
            {results.length} Questions
          </span>
          <span className="px-3 py-1.5 bg-white text-sm font-semibold text-green-600 rounded-full border border-green-100">
            {results.filter(q => q?.is_correct).length} Correct
          </span>
          <span className="px-3 py-1.5 bg-white text-sm font-semibold text-red-500 rounded-full border border-red-100">
            {results.filter(q => q && !q.is_correct).length} Wrong
          </span>
        </div>
      </header>

      <main className="p-6">
        <h2 className="text-2xl font-bold mb-6">Questions & Answers</h2>

        {results.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium">No results data available.</p>
            <p className="text-gray-300 text-sm mt-1">Assessment data will appear here once available</p>
          </div>
        ) : (
          <div className="space-y-8">
            {results.map((q, idx) => {
              if (!q) return null;

              const isCorrect = q.is_correct;
              const score = q.score ?? 0;
              const maxScore = q.positive_marking ?? q.max_score ?? 1;
              const sectionName = q.section_name || q.question_type || q.type || 'TEXT';
              const isMCQ = sectionName.toUpperCase() === 'MCQ';

              
              const candidateAnswer = q.candidate_answer || q.given_answer || '';
              const correctAnswer = q.correct_answer || '';

              return (
                <div key={idx} className="space-y-4">
                  <div className="bg-pink-50 p-3 rounded-xl flex items-center gap-3 flex-wrap">
                    <span className="font-semibold px-2">Question {idx + 1}</span>
                    <span className={`px-4 py-1 rounded-full text-sm font-medium border ${isCorrect ? 'bg-white text-green-600 border-green-100' : 'bg-white text-red-500 border-red-100'}`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="bg-indigo-200 text-indigo-800 px-5 py-1 rounded-full text-sm font-bold uppercase">
                        {sectionName}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-start pt-2">
                    <h3 className="text-lg font-semibold max-w-2xl">Q. {q.question}</h3>
                    <span className="border-2 border-indigo-300 text-indigo-600 px-4 py-0.5 rounded-full text-sm font-medium whitespace-nowrap ml-4">
                      Marks: {score} / {maxScore}
                    </span>
                  </div>

                  {isMCQ ? (
                    <div className="space-y-3">
                      <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                        isCorrect 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          {isCorrect 
                            ? <CheckCircle2 size={22} className="text-green-500 flex-shrink-0" /> 
                            : <XCircle size={22} className="text-red-500 flex-shrink-0" />
                          }
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Your Answer</p>
                            <p className={`text-sm font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              {candidateAnswer || '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {!isCorrect && correctAnswer && (
                        <div className="flex items-center justify-between p-4 rounded-xl border-2 bg-green-50 border-green-200">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 size={22} className="text-green-500 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Correct Answer</p>
                              <p className="text-sm font-semibold text-green-700">
                                {correctAnswer}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {q.feedback && (
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Feedback</p>
                          <p className="text-sm text-blue-700">{q.feedback}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className={`p-4 border-2 rounded-xl text-sm leading-relaxed ${
                        isCorrect 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Your Answer</p>
                        {candidateAnswer || <span className="italic text-gray-400">No answer provided.</span>}
                      </div>
                      {q.feedback && (
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Feedback</p>
                          <p className="text-sm text-blue-700">{q.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ViewInsightDetail;