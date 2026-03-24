import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../../Context/companyContext';
import { baseUrl } from '../../utils/ApiConstants';
import { cities } from '../../utils/cities';

function TagInput({ label, required, optional, name, value, onValueChange, placeholder }) {
  const [draft, setDraft] = useState('');

  const tags = useMemo(() => {
    return (value || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [value]);

  const commit = (raw) => {
    const next = (raw || '').trim();
    if (!next) return;

    const nextTags = Array.from(new Set([...tags, next]));
    onValueChange(name, nextTags.join(', '));
    setDraft('');
  };

  const remove = (t) => {
    const nextTags = tags.filter(x => x !== t);
    onValueChange(name, nextTags.join(', '));
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft.replace(/,$/, ''));
    }
    if (e.key === 'Backspace' && !draft && tags.length) {
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div>
      <label className="block text-[13px] font-medium text-[#111827] mb-2">
        {label} {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-gray-400 font-normal"> (Optional)</span>}
      </label>

      <div className="min-h-[44px] w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 flex flex-wrap items-center gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-2 bg-[#EEF2FF] text-[#3730A3] px-2.5 py-1 rounded-full text-xs font-medium"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="text-[#3730A3]/70 hover:text-red-600 leading-none"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => commit(draft)}
          placeholder={tags.length ? '' : placeholder}
          className="flex-1 min-w-[180px] outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent"
        />
      </div>
      <p className="mt-1 text-[12px] text-gray-400">Tip: press Enter or comma to add a skill.</p>
    </div>
  );
}

function RequirementForm() {
  const { companies } = useCompany();
  const companyName = companies?.data?.[0]?.companyName || "NA";

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    jobTitle: '',
    priority: '',
    dueDate: '',
    assignedTo: '',
    description: '',
    skills: '',
    preferredSkills: '',
    experience: '',
    positionAvailable: '',
    workMode: '',
    location: [],
    city: '',
    state: '',
    country: '',
    employmentType: '',
    salary: '',
    currency: 'INR',
    attachments: null
  });

  const [hrUsers, setHrUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [skillSuggestionsLoading, setSkillSuggestionsLoading] = useState(false);
  const [skillSuggestionsError, setSkillSuggestionsError] = useState('');

  useEffect(() => {
    fetchHRUsers();
  }, []);

  const fetchHRUsers = async () => {
    try {
      const response = await axios.get(`${baseUrl}/offer/hr`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data && response.data.data) setHrUsers(response.data.data);
    } catch (error) {
      console.error("Error fetching HR users:", error);
      setError('Failed to fetch HR users');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      setFormData({ ...formData, attachments: files[0] });
    } else if (name === 'location') {
      if (value && !formData.location.includes(value)) {
        setFormData({ ...formData, location: [...formData.location, value] });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleStringField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSuggestedSkill = (skill) => {
    const trimmed = String(skill).trim();
    if (!trimmed) return;
    const current = (formData.skills || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = current.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    handleStringField('skills', [...current, trimmed].join(', '));
  };

  const fetchSkillSuggestions = async () => {
    if (!formData.jobTitle.trim()) {
      setSkillSuggestionsError('Enter a job title first, then load AI skills.');
      return;
    }
    setSkillSuggestionsError('');
    setSkillSuggestionsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${baseUrl}/offer/suggest-skills`,
        {
          jobTitle: formData.jobTitle,
          description: formData.description,
          employmentType: formData.employmentType,
          experience: formData.experience,
          workMode: formData.workMode,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.success && Array.isArray(response.data.skills)) {
        setSkillSuggestions(response.data.skills);
        if (response.data.skills.length === 0) {
          setSkillSuggestionsError('No skills returned. Add more description and try again.');
        } else {
          setSkillSuggestionsError('');
        }
      } else {
        setSkillSuggestions([]);
        setSkillSuggestionsError('No suggestions returned.');
      }
    } catch (err) {
      console.error('AI skill suggestions:', err.response?.data || err);
      setSkillSuggestions([]);
      setSkillSuggestionsError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Could not load AI skills. Ensure the server has GEMINI_API_KEY set.'
      );
    } finally {
      setSkillSuggestionsLoading(false);
    }
  };

  const handleRemoveLocation = (city) => {
    setFormData({
      ...formData,
      location: formData.location.filter(loc => loc !== city)
    });
  };

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setLocationDropdownOpen(false);
        setLocationSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      const preferredSkillsArray = formData.preferredSkills
        ? formData.preferredSkills.split(',').map(skill => skill.trim()).filter(skill => skill)
        : [];

      const salaryValue = parseInt(String(formData.salary).replace(/[^\d]/g, ''), 10) || 0;

      const submitData = {
        ...formData,
        companyName: companyName,
        skills: skillsArray,
        preferredSkills: preferredSkillsArray,
        salary: salaryValue,
        assignedTo: formData.assignedTo,
        location: formData.location
      };

      delete submitData.attachments;

      const response = await axios.post(`${baseUrl}/offer`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      alert('Requirement form submitted successfully!');

      if (response.data.success) {
        navigate("/RMGAdmin-Dashboard/AssignedRecruiters");
        setSuccess(response.data.message || 'Requirement created successfully!');
        setFormData({
          jobTitle: '',
          companyName: companyName,
          priority: '',
          dueDate: '',
          assignedTo: '',
          description: '',
          skills: '',
          preferredSkills: '',
          experience: '',
          positionAvailable: '',
          workMode: '',
          location: [],
          employmentType: '',
          salary: '',
          currency: '',
          attachments: null
        });
      }
    } catch (err) {
      console.error('Submit error:', err.response?.data);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to create requirement. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = useMemo(() => {
    switch (formData.currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'INR': return '₹';
      case 'USD':
      default: return '$';
    }
  }, [formData.currency]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#111827]">
            Generate Assessment
          </h1>
        </div>

        {success && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#111827] mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="Enter job title"
                    required
                    className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" clipRule="evenodd" />
                  </svg> */}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#111827] mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={companyName}
                  readOnly
                  disabled
                  className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#111827] mb-2">
                  Priority
                </label>
                <div className="relative">
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                    className="h-11 w-full appearance-none rounded-xl border border-[#E5E7EB] bg-white px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#111827] mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500 
        [&::-webkit-calendar-picker-indicator]:absolute
        [&::-webkit-calendar-picker-indicator]:right-0
        [&::-webkit-calendar-picker-indicator]:top-0
        [&::-webkit-calendar-picker-indicator]:h-full
        [&::-webkit-calendar-picker-indicator]:w-10
        [&::-webkit-calendar-picker-indicator]:opacity-0
        [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M8 7V3m8 4V3M4 11h16M6 19h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#111827] mb-2">
                  Assigned to (HR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    required
                    className="h-11 w-full appearance-none rounded-xl border border-[#E5E7EB] bg-white px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select name</option>
                    {hrUsers.map(user => (
                      <option key={user._id || user.id} value={user._id || user.id}>
                        {user.name || user.fullName || 'Unknown User'}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[13px] font-medium text-[#111827] mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter description"
                rows={5}
                required
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="my-6 border-t border-[#EEF2F7]" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <TagInput
                  label="Skills"
                  required
                  name="skills"
                  value={formData.skills}
                  onValueChange={handleStringField}
                  placeholder="Type to add, or choose from AI below"
                />
                <div className="mt-3 rounded-xl border border-[#E0E7FF] bg-gradient-to-b from-[#FAFBFF] to-[#F4F6FF] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-[12px] font-semibold text-[#312E81]">AI-recommended skills</span>
                    <button
                      type="button"
                      onClick={fetchSkillSuggestions}
                      disabled={skillSuggestionsLoading || !formData.jobTitle.trim()}
                      className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition
                        ${skillSuggestionsLoading || !formData.jobTitle.trim()
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        }`}
                    >
                      {skillSuggestionsLoading ? 'Generating…' : 'Load AI skills'}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-600 mb-2">
                    Uses job title, description, and any of experience / employment type / work mode you have filled.
                    Click a chip to add it to Skills. Re-run after filling fields below for stronger suggestions.
                  </p>
                  {skillSuggestionsError && (
                    <p className="text-[12px] text-red-600 mb-2">{skillSuggestionsError}</p>
                  )}
                  {skillSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skillSuggestions.map((s) => {
                        const already = (formData.skills || '')
                          .split(',')
                          .map((x) => x.trim().toLowerCase())
                          .filter(Boolean)
                          .includes(String(s).trim().toLowerCase());
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => addSuggestedSkill(s)}
                            disabled={already}
                            title={already ? 'Already in Skills' : `Add ${s}`}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition
                              ${already
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-default'
                                : 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 cursor-pointer shadow-sm'
                              }`}
                          >
                            {already ? '✓ ' : '+ '}
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <TagInput
                label="Preferred Skills"
                optional
                name="preferredSkills"
                value={formData.preferredSkills}
                onValueChange={handleStringField}
                placeholder="Add preferred skills"
              />
            </div>

            <div className="my-6 border-t border-[#EEF2F7]" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#111827] mb-2">
                  Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="Enter experience in numbers"
                  required
                  className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#111827] mb-2">
                  Position Available <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="positionAvailable"
                  value={formData.positionAvailable}
                  onChange={handleChange}
                  placeholder="Position"
                  required
                  min="1"
                  className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#111827] mb-2">
                  Work Mode <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="workMode"
                    value={formData.workMode}
                    onChange={handleChange}
                    required
                    className="h-11 w-full appearance-none rounded-xl border border-[#E5E7EB] bg-white px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select work mode</option>
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#111827] mb-2">
                  Location <span className="text-red-500">*</span>
                </label>

                <div className="relative" ref={locationDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                    className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 pr-10 text-left text-sm outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
                  >
                    <span className="truncate text-gray-700">
                      {formData.location.length ? formData.location.join(', ') : 'Select location'}
                    </span>
                  </button>

                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" clipRule="evenodd" />
                  </svg>

                  {locationDropdownOpen && (
                    <div className="absolute z-10 mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-[#EEF2F7]">
                        <input
                          type="text"
                          placeholder="Search cities..."
                          value={locationSearchQuery}
                          onChange={(e) => setLocationSearchQuery(e.target.value)}
                          className="h-10 w-full rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {formData.location.length > 0 && (
                        <div className="px-3 py-2 flex flex-wrap gap-2 border-b border-[#EEF2F7]">
                          {formData.location.map((city) => (
                            <span
                              key={city}
                              className="flex items-center gap-2 bg-[#F3F4F6] text-gray-700 px-2.5 py-1 rounded-full text-xs"
                            >
                              {city}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveLocation(city); }}
                                className="text-gray-500 hover:text-red-600"
                                aria-label={`Remove ${city}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="max-h-56 overflow-auto">
                        {cities
                          .filter(city =>
                            !formData.location.includes(city) &&
                            city.toLowerCase().includes(locationSearchQuery.toLowerCase())
                          ).length === 0 ? (
                          <div className="px-4 py-3 text-gray-400 text-sm">
                            {locationSearchQuery ? 'No cities found' : 'No more cities to select'}
                          </div>
                        ) : (
                          cities
                            .filter(city =>
                              !formData.location.includes(city) &&
                              city.toLowerCase().includes(locationSearchQuery.toLowerCase())
                            )
                            .map((city) => (
                              <button
                                type="button"
                                key={city}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50"
                                onClick={() => {
                                  handleChange({ target: { name: 'location', value: city } });
                                  setLocationSearchQuery('');
                                  setLocationDropdownOpen(false);
                                }}
                              >
                                {city}
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#111827] mb-2">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    required
                    className="h-11 w-full appearance-none rounded-xl border border-[#E5E7EB] bg-white px-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select employment type</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="my-6 border-t border-[#EEF2F7]" />

            <div>
              <label className="block text-[13px] font-medium text-[#111827] mb-2">
                Salary (Per annum in numbers) <span className="text-red-500">*</span>
              </label>

              <div className="flex w-full">
                <div className="relative w-[110px]">
                  <div className="h-11 w-full rounded-l-xl border border-[#E5E7EB] bg-white pl-10 pr-8 text-sm flex items-center">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      ₹
                    </span>
                    <span className="ml-8">INR</span>
                  </div>
                  {/* <svg className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" clipRule="evenodd" />
                  </svg> */}
                </div>

                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Enter salary in numbers"
                  required
                  min="0"
                  className="h-11 flex-1 rounded-r-xl border border-l-0 border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`h-11 px-6 rounded-xl text-sm font-semibold text-white transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#111827] hover:bg-[#0B1220]'
                  }`}
              >
                {loading ? 'Creating...' : 'Create Requirement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RequirementForm;