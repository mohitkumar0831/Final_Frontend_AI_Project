import { X, ChevronDown, Clock, Calendar, Timer } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

/** "9:30 AM" / "9:30AM" -> minutes from midnight */
function parseTime12ToMinutes(t) {
  if (!t || typeof t !== 'string') return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mins = parseInt(m[2], 10);
  const period = m[3].toUpperCase();
  if (Number.isNaN(h) || Number.isNaN(mins) || mins > 59) return null;
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  if (h > 23) return null;
  return h * 60 + mins;
}

/** "9:30 AM" -> "09:30" for input[type=time] */
function time12ToInput24(t) {
  const mins = parseTime12ToMinutes(t);
  if (mins == null) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "09:30" -> "9:30 AM" */
function input24ToTime12(s24) {
  if (!s24) return '';
  const [hs, ms] = s24.split(':');
  let h = parseInt(hs, 10);
  const m = parseInt(ms, 10) || 0;
  if (Number.isNaN(h)) return '';
  const ap = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}

function calendarDaysBetween(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const a = new Date(`${startStr}T12:00:00`);
  const b = new Date(`${endStr}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function formatDuration(totalMinutes) {
  if (totalMinutes == null || totalMinutes <= 0) return null;
  const days = Math.floor(totalMinutes / (24 * 60));
  const rem = totalMinutes % (24 * 60);
  const hours = Math.floor(rem / 60);
  const minutes = rem % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
}

function CalendarPicker({ onSelect, selectedStart, selectedEnd }) {
  const [current, setCurrent] = useState(new Date());

  const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
  const firstDay = (new Date(current.getFullYear(), current.getMonth(), 1).getDay() + 6) % 7;

  let days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const goPrev = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const goNext = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const todayNum = new Date().setHours(0, 0, 0, 0);
  const now = new Date();
  const prevMonthEnd = new Date(current.getFullYear(), current.getMonth(), 0);
  const disablePrev = prevMonthEnd < new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const toEnCA = (dateObj) => dateObj.toLocaleDateString('en-CA');
  const parseLocalMidnight = (s) => (s ? new Date(`${s}T00:00:00`) : null);
  const startDateNum = selectedStart ? parseLocalMidnight(selectedStart).getTime() : null;
  const endDateNum = selectedEnd ? parseLocalMidnight(selectedEnd).getTime() : null;
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={!disablePrev ? goPrev : undefined}
          disabled={disablePrev}
          className="p-3 text-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
        >
          ‹
        </button>

        <h2 className="font-medium text-gray-700">
          {current.toLocaleString('default', { month: 'long' })} {current.getFullYear()}
        </h2>

        <button
          onClick={goNext}
          className="p-3 text-2xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-center font-semibold text-gray-500 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d, index) => {
          if (!d) return <div key={index}></div>;
          const currentDateObj = new Date(current.getFullYear(), current.getMonth(), d);
          const local = toEnCA(currentDateObj);
          const numeric = currentDateObj.setHours(0, 0, 0, 0);
          const isPast = numeric < todayNum;
          const isStart = selectedStart === local;
          const isEnd = selectedEnd === local;
          const inRange = startDateNum !== null && endDateNum !== null &&
            numeric > Math.min(startDateNum, endDateNum) &&
            numeric < Math.max(startDateNum, endDateNum);

          let classes = 'h-9 flex items-center justify-center text-sm transition';
          if (isPast) classes += ' text-gray-300 cursor-not-allowed';
          else if (isStart || isEnd) classes += ' bg-violet-600 text-white rounded-md';
          else if (inRange) classes += ' bg-violet-100 text-gray-800 rounded-none';
          else classes += ' hover:bg-violet-50 text-gray-700';

          return (
            <button key={index} disabled={isPast} onClick={() => onSelect(currentDateObj)} className={classes}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TestDetail({ formData, onUpdate, onNext, onCancel, loading }) {
  const [newSkill, setNewSkill] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeModalError, setTimeModalError] = useState('');
  const [selectedStart, setSelectedStart] = useState(formData.startDate || null);
  const [selectedEnd, setSelectedEnd] = useState(formData.endDate || null);
  const [selectedTime, setSelectedTime] = useState(formData.startTime || null);
  const [selectedEndTime, setSelectedEndTime] = useState(formData.endTime || null);

  useEffect(() => {
    try {
      const job = formData.jobDetails || {};
      const offerTitle = job?.offerId?.jobTitle || job?.jobTitle || '';
      const jobSkills = job?.offerId?.skills || job?.skills || [];
      if ((!formData.roleTitle || formData.roleTitle === '') && offerTitle) onUpdate({ roleTitle: offerTitle });
      if ((!formData.skills || formData.skills.length === 0) && Array.isArray(jobSkills) && jobSkills.length > 0) {
        const skills = jobSkills.map(s => (typeof s === 'string' ? s : String(s)));
        const skillLevels = skills.map(skill => ({ skill, level: 'Any', mcq: 0, coding: 0, audio: 0, video: 0 }));
        onUpdate({ skills, skillLevels });
      }
    } catch (e) { }
  }, [formData.jobDetails]);

  useEffect(() => {
    if (showDateModal || showTimeModal) {
      setSelectedStart(formData.startDate || null);
      setSelectedEnd(formData.endDate || null);
      setSelectedTime(formData.startTime || null);
      setSelectedEndTime(formData.endTime || null);
    }
    if (showTimeModal) setTimeModalError('');
  }, [showDateModal, showTimeModal, formData]);

  // const format12 = (date) => {
  //   const h = date.getHours(), m = date.getMinutes();
  //   const hour12 = h % 12 === 0 ? 12 : h % 12;
  //   return `${hour12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  // };
  // const generateStartTimeSlots = (dateString) => {
  //   const now = new Date();

  //   let start;

  //   if (!dateString) {
  //     // If no date selected → start from current time
  //     start = new Date(now);
  //     const minutes = now.getMinutes();
  //     let addMinutes = minutes < 30 ? 30 - minutes : 60 - minutes;
  //     start = new Date(now.getTime() + addMinutes * 60000);
  //   } else {
  //     const selectedDate = new Date(`${dateString}T00:00:00`);
  //     const isToday = selectedDate.toDateString() === now.toDateString();

  //     start = new Date(selectedDate);

  //     if (isToday) {
  //       const minutes = now.getMinutes();
  //       let addMinutes = minutes < 30 ? 30 - minutes : 60 - minutes;
  //       start = new Date(now.getTime() + addMinutes * 60000);
  //     } else {
  //       start.setHours(0, 0, 0, 0);
  //     }
  //   }

  //   const end = new Date(start);
  //   end.setHours(23, 30, 0, 0);

  //   const slots = [];
  //   const cur = new Date(start);
  //   cur.setSeconds(0, 0);

  //   while (cur <= end) {
  //     slots.push(format12(cur));
  //     cur.setMinutes(cur.getMinutes() + 30);
  //   }

  //   return slots;
  // };

  // const generateFullDaySlots = () => {
  //   const today = new Date();
  //   const start = new Date(today.setHours(0, 0, 0, 0));
  //   const end = new Date(today.setHours(23, 30, 0, 0));
  //   const slots = [];
  //   const cur = new Date(start);
  //   while (cur <= end) { slots.push(format12(cur)); cur.setMinutes(cur.getMinutes() + 30); }
  //   return slots;
  // };

  // const startTimeSlots = generateStartTimeSlots(selectedStart);
  // const fullDaySlots = generateFullDaySlots();

  const addSkill = () => {
    const skillTrim = newSkill.trim().toLowerCase();
    const existing = formData.skills.map(s => s.toLowerCase());
    if (skillTrim && !existing.includes(skillTrim)) {
      const properCase = newSkill.trim();
      onUpdate({
        skills: [...formData.skills, properCase],
        skillLevels: [...formData.skillLevels, { skill: properCase, level: 'Any', mcq: 0, coding: 0, audio: 0, video: 0 }],
      });
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove) => {
    onUpdate({
      skills: formData.skills.filter(s => s !== skillToRemove),
      skillLevels: formData.skillLevels.filter(sl => sl.skill !== skillToRemove),
    });
  };

  const setSkillField = (skill, field, value) => {
    const existing = Array.isArray(formData.skillLevels) ? formData.skillLevels : [];
    const found = existing.find(s => s.skill === skill);
    let updated;
    if (found) {
      updated = existing.map(sl => sl.skill === skill ? { ...sl, [field]: value } : sl);
    } else {
      const base = { skill, level: 'Any', mcq: 0, coding: 0, audio: 0, video: 0 };
      base[field] = value;
      updated = [...existing, base];
    }
    onUpdate({ skillLevels: updated });
  };

  const getTotalQuestions = () =>
    formData.skillLevels.reduce((sum, sl) => sum + (sl.mcq || 0) + (sl.coding || 0) + (sl.audio || 0) + (sl.video || 0), 0);

  const canGenerate = () => {
    if (!formData.roleTitle || String(formData.roleTitle).trim() === '') return false;
    if (!formData.skills || !Array.isArray(formData.skills) || formData.skills.length === 0) return false;
    if (!formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) return false;
    return true;
  };

  const handleDateSelect = (date) => {
    const localDate = date.toLocaleDateString('en-CA');
    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(localDate);
      setSelectedEnd(null);
    } else if (!selectedEnd) {
      if (new Date(localDate) < new Date(selectedStart)) {
        setSelectedEnd(selectedStart);
        setSelectedStart(localDate);
      } else {
        setSelectedEnd(localDate);
      }
    }
  };

  // Format date for display like "23-02-26"
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.slice(2).replace(/-/g, '-');
  };

  const handleSaveTime = () => {
    setTimeModalError('');
    if (!selectedTime || !selectedEndTime) return;

    const startM = parseTime12ToMinutes(selectedTime);
    const endM = parseTime12ToMinutes(selectedEndTime);

      const now = new Date();
  const today = now.toLocaleDateString('en-CA');

  // ✅ ADD THIS BLOCK HERE
  if (formData.startDate === today) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (startM < currentMinutes) {
      setTimeModalError("Start time cannot be in the past.");
      return;
    }
  }
    if (startM == null || endM == null) {
      setTimeModalError('Please choose valid start and end times.');
      return;
    }

    const startDate = formData.startDate;
    const endDate = formData.endDate;
    const sameCalendarDay =
      startDate && endDate && String(startDate) === String(endDate);

    if (sameCalendarDay && endM <= startM) {
      setTimeModalError(
        'When the exam starts and ends on the same date, end time must be after start time.'
      );
      return;
    }

    const daySpan = calendarDaysBetween(startDate, endDate);
    const totalMinutes = daySpan * 24 * 60 + (endM - startM);
    if (totalMinutes <= 0) {
      setTimeModalError('The overall schedule must end after it starts. Adjust dates or times.');
      return;
    }

    onUpdate({
      startTime: selectedTime,
      endTime: selectedEndTime,
    });
    setShowTimeModal(false);
  };

  const getMinTime = () => {
  if (!formData.startDate) return null;

  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  if (formData.startDate !== today) return null;

  const now = new Date();
  return now.toTimeString().slice(0, 5); // "HH:MM"
};


  const getScheduleDurationLabel = useCallback(() => {
    if (!selectedTime || !selectedEndTime) return null;
    const startM = parseTime12ToMinutes(selectedTime);
    const endM = parseTime12ToMinutes(selectedEndTime);
    if (startM == null || endM == null) return null;
    const startDate = formData.startDate;
    const endDate = formData.endDate;
    if (!startDate || !endDate) return null;
    const daySpan = calendarDaysBetween(startDate, endDate);
    const totalMinutes = daySpan * 24 * 60 + (endM - startM);
    return formatDuration(totalMinutes);
  }, [selectedTime, selectedEndTime, formData.startDate, formData.endDate]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* STEP HEADER */}
      <div className="w-full">



        {/* MAIN FORM CONTAINER */}
        <div className="mb-4">

          {/* TOP ROW: ROLE, DATE, TIME */}
          <div className="grid grid-cols-12 gap-4 mb-6">

            {/* ROLE TITLE - Takes up the most space */}
            <div className="col-span-12 md:col-span-6">
              <label className="block text-sm font-medium text-gray-800 mb-3">
                Role Title
              </label>
              <input
                type="text"
                value={formData.roleTitle || ""}
                onChange={(e) => onUpdate({ roleTitle: e.target.value })}
                placeholder="Front-end Developer"
                className="w-full px-4 py-4 bg-gray-50/50 border  bg-white border-gray-100 rounded-xl text-sm text-gray-600 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
              />
            </div>

            {/* DATE DURATION */}
            <div className="col-span-12 md:col-span-3">
              <label className="block text-sm font-medium text-gray-800 mb-3">
                Date Duration
              </label>
              <button
                onClick={() => setShowDateModal(true)}
                className="w-full flex items-center bg-white justify-between px-4 py-4 border border-gray-100 rounded-xl text-sm text-gray-600 hover:border-violet-300"
              >
                <span>
                  {formData.startDate && formData.endDate
                    ? `${formatDisplayDate(formData.startDate)} to ${formatDisplayDate(formData.endDate)}`
                    : "23-02-26 to 24-02-26"}
                </span>
                <Calendar size={18} className="text-gray-500" />
              </button>
            </div>

            {/* TIME RANGE */}
            <div className="col-span-12 md:col-span-3">
              <label className="mb-2 block text-sm font-medium text-gray-800">Daily time window</label>
              <button
                type="button"
                onClick={() => setShowTimeModal(true)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 text-left shadow-sm transition-all hover:border-violet-300 hover:shadow-md"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-inner">
                    <Clock size={18} strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Open — Close</p>
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {formData.startTime && formData.endTime
                        ? `${formData.startTime}  →  ${formData.endTime}`
                        : 'Set start & end time'}
                    </p>
                  </div>
                </div>
                <ChevronDown size={18} className="shrink-0 text-gray-400" />
              </button>
            </div>
          </div>

          {/* SKILLS SECTION */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-800 mb-3">Skills</label>

            <div className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 min-h-[56px] flex flex-wrap gap-3 items-center">
              {formData.skills.map(skill => (
                <span key={skill} className="bg-violet-50 text-violet-600 px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium border border-violet-100">
                  {skill.toLowerCase()}
                  <button onClick={() => removeSkill(skill)} className="hover:text-violet-900 transition">
                    <X size={14} />
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1 min-w-[150px]  outline-none text-sm text-gray-700 placeholder-gray-400"
                placeholder=""
              />
            </div>

            {/* SUGGESTED SKILLS (Matches the pill-style in your image) */}
            <div className="flex flex-wrap gap-3 mt-4">
              {['PowerBI', 'adobe xd', 'React', 'Node.js'].filter(s =>
                !formData.skills.map(x => x.toLowerCase()).includes(s.toLowerCase())
              ).map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => {/* add logic */ }}
                  className="px-4 py-1.5 rounded-lg bg-gray-50 text-sm text-gray-600 hover:bg-gray-100 transition-colors border border-transparent active:border-gray-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SKILL TABLE */}
        {formData.skills.length > 0 && (
          <div className="border border-violet-200 rounded-2xl overflow-hidden mb-6">

            <div className="w-full overflow-x-auto">
              <table className="w-full">

                {/* TABLE HEADER */}
                <thead className="bg-gray-50">
                  <tr>
                    {['Skills', 'Level', 'MCQ', 'Coding', 'Audio', 'Video'].map(h => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-700"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody className="divide-y divide-gray-100">
                  {formData.skills.map((skill) => {

                    const sl =
                      (formData.skillLevels || []).find(s => s.skill === skill) ||
                      { skill, level: 'Any', mcq: 0, coding: 0, audio: 0, video: 0 };

                    return (
                      <tr key={skill} className="bg-white">

                        {/* SKILL NAME */}
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {skill}
                        </td>

                        {/* LEVEL */}
                        <td className="px-6 py-4">
                          <div className="relative w-32">
                            <select
                              value={sl.level}
                              onChange={(e) => setSkillField(skill, 'level', e.target.value)}
                              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-400 outline-none"
                            >
                              <option>Any</option>
                              <option>Beginner</option>
                              <option>Medium</option>
                              <option>Advanced</option>
                            </select>

                            <ChevronDown
                              size={14}
                              className="absolute right-2 top-2.5 text-gray-400"
                            />
                          </div>
                        </td>

                        {/* QUESTION INPUTS */}
                        {['mcq', 'coding', 'audio', 'video'].map(field => (
                          <td key={field} className="px-6 py-4">

                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-24">

                              <input
                                type="number"
                                min="0"
                                value={sl[field] || 0}
                                onChange={(e) => setSkillField(skill, field, parseInt(e.target.value) || 0)}
                                className="w-full text-center text-sm py-2 outline-none"
                              />

                              <div className="flex flex-col border-l border-gray-200">

                                <button
                                  onClick={() => setSkillField(skill, field, (sl[field] || 0) + 1)}
                                  className="px-2 text-xs text-gray-500 hover:bg-gray-100"
                                >
                                  ▲
                                </button>

                                <button
                                  onClick={() => setSkillField(skill, field, Math.max(0, (sl[field] || 0) - 1))}
                                  className="px-2 text-xs text-gray-500 hover:bg-gray-100"
                                >
                                  ▼
                                </button>

                              </div>

                            </div>

                          </td>
                        ))}

                      </tr>
                    )
                  })}
                </tbody>

              </table>
            </div>


            {/* FOOTER */}
            {/* FOOTER */}
            <div className="flex items-center justify-between bg-gray-50 px-6 py-4 rounded-xl mt-4">

              <span className="text-base font-semibold text-gray-800">
                Total Questions: {getTotalQuestions()}
              </span>

              <div className="flex gap-3">

                <button
                  onClick={onCancel}
                  className="px-6 py-2 border border-violet-400 text-violet-600 rounded-xl hover:bg-violet-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={onNext}
                  disabled={!canGenerate() || loading || getTotalQuestions() === 0}
                  className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-400 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "Generating..." : "Generate"}
                </button>

              </div>

            </div>
          </div>
        )}
      </div>

      {showDateModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-[360px] rounded-2xl shadow-xl p-4">

      <div className="flex justify-between mb-3">
        <h2 className="text-lg font-semibold">Select Date</h2>
        <X onClick={() => setShowDateModal(false)} />
      </div>

      <CalendarPicker
        selectedStart={selectedStart}
        selectedEnd={selectedEnd}
        onSelect={handleDateSelect}
      />

      <button
        onClick={() => {
          onUpdate({
            startDate: selectedStart,
            endDate: selectedEnd
          });
          setShowDateModal(false);
        }}
        className="w-full mt-4 py-2 bg-violet-600 text-white rounded-lg"
      >
        Save
      </button>

    </div>
  </div>
)}
      {showTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200/80">
            <div className="relative bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 px-6 py-5 text-white">
              <button
                type="button"
                onClick={() => setShowTimeModal(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 transition hover:bg-white/15"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 pr-10">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                  <Timer size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Exam hours</h2>
                  <p className="text-sm text-violet-100">Daily window when candidates can take the test</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              {formData.startDate &&
                formData.endDate &&
                String(formData.startDate) === String(formData.endDate) && (
                  <p className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    Same start and end date: <strong>end time must be after start time</strong>.
                  </p>
                )}

              {(!formData.startDate || !formData.endDate) && (
                <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Choose <strong>date duration</strong> first. If start and end are on{' '}
                  <strong>different days</strong>, any clock times are allowed (e.g. 9:00 PM → 5:00 PM).
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block rounded-2xl border-2 border-gray-100 bg-gray-50/60 p-4 transition focus-within:border-violet-300 focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-violet-100/80">
                  <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <Clock className="h-3.5 w-3.5 text-violet-500" />
                    Start
                  </span>
                  <input
                    type="time"
                    step={300}
                    min={getMinTime()}  
                    value={time12ToInput24(selectedTime)}
                    onChange={(e) => setSelectedTime(input24ToTime12(e.target.value))}
                    className="w-full cursor-pointer rounded-lg border-0 bg-transparent text-2xl font-semibold tabular-nums text-gray-900 outline-none [color-scheme:light]"
                  />
                  <span className="mt-1 block text-xs text-gray-400">{selectedTime || 'Not set'}</span>
                </label>

                <label className="block rounded-2xl border-2 border-gray-100 bg-gray-50/60 p-4 transition focus-within:border-violet-300 focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-violet-100/80">
                  <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    End
                  </span>
                  <input
                    type="time"
                    step={300}
                    value={time12ToInput24(selectedEndTime)}
                    onChange={(e) => setSelectedEndTime(input24ToTime12(e.target.value))}
                    className="w-full cursor-pointer rounded-lg border-0 bg-transparent text-2xl font-semibold tabular-nums text-gray-900 outline-none [color-scheme:light]"
                  />
                  <span className="mt-1 block text-xs text-gray-400">{selectedEndTime || 'Not set'}</span>
                </label>
              </div>

              {timeModalError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {timeModalError}
                </div>
              )}

              {getScheduleDurationLabel() && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-violet-50 px-4 py-3 text-sm font-medium text-violet-900">
                  <Timer className="h-4 w-4 shrink-0 opacity-80" />
                  <span>
                    Total schedule window:{' '}
                    <span className="tabular-nums font-semibold">{getScheduleDurationLabel()}</span>
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTimeModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTime}
                  disabled={!selectedTime || !selectedEndTime}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Save times
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
