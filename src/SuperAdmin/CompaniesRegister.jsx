import React, { useState } from 'react';
import { Upload, ChevronDown, Trash2, CheckCircle, AlertCircle, Loader2, Mail, Globe, Key } from 'lucide-react';
import SpinLoader from '../components/SpinLoader';
import { superAdminBaseUrl } from '../utils/ApiConstants';

function CompaniesRegister() {
    const [formData, setFormData] = useState({
        companyName: '',
        companyType: '',
        contactPerson: '',
        email: '',
        phoneNo: '',
        numberOfEmployees: '',
        gstNumber: '',
        panNumber: '',
        typeOfStaffing: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        logo: null
    });

    const [selectedCountryCode, setSelectedCountryCode] = useState('+91');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    const [message, setMessage] = useState('');
    const [tenantDetails, setTenantDetails] = useState(null);
    const [showSuccessDetails, setShowSuccessDetails] = useState(false);

    const countryCode = ['+91', '+1', '+44', '+86', '+81'];
    const states = [
        'Select State',
        'Maharashtra',
        'Delhi',
        'Karnataka',
        'Tamil Nadu',
        'Gujarat',
        'Uttar Pradesh',
        'West Bengal',
        'Rajasthan'
    ];

    const staffingTypes = [
        { value: '', label: 'Select Type of Staffing' },
        { value: 'contract', label: 'Contract' },
        { value: 'permanent', label: 'Permanent' },
        { value: 'both', label: 'Both' }
    ];

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (submitStatus === 'error') {
            setSubmitStatus(null);
            setMessage('');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({
                ...formData,
                logo: file
            });
        }
    };

    const validateForm = () => {
        const errors = [];

        if (!formData.companyName.trim()) errors.push('Company name is required');
        if (!formData.companyType.trim()) errors.push('Company type is required');
        if (!formData.email.trim()) errors.push('Email is required');
        if (!formData.phoneNo.trim()) errors.push('Phone number is required');
        if (!formData.numberOfEmployees.trim()) errors.push('Number of employees is required');
        if (!formData.gstNumber.trim()) errors.push('GST number is required');
        if (!formData.panNumber.trim()) errors.push('PAN number is required');
        if (!formData.typeOfStaffing.trim()) errors.push('Type of staffing is required');
        if (!formData.address1.trim()) errors.push('Address is required');
        if (!formData.city.trim()) errors.push('City is required');
        if (formData.state === 'Select State' || !formData.state) errors.push('Please select a state');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            errors.push('Please enter a valid email address');
        }

        const phoneRegex = /^\d{10}$/;
        if (formData.phoneNo && !phoneRegex.test(formData.phoneNo)) {
            errors.push('Please enter a valid 10-digit phone number');
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSubmitStatus(null);
        setMessage('');
        setTenantDetails(null);
        setShowSuccessDetails(false);

        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setSubmitStatus('error');
            setMessage(validationErrors.join(', '));
            return;
        }

        setIsSubmitting(true);

        try {
            const apiData = {
                companyName: formData.companyName,
                email: formData.email,
                companyType: formData.companyType,
                gstNumber: formData.gstNumber,
                typeOfStaffing: formData.typeOfStaffing,
                panNumber: formData.panNumber,
                phoneNo: `${selectedCountryCode}${formData.phoneNo}`,
                numberOfEmployees: formData.numberOfEmployees,
                address1: formData.address1,
                address2: formData.address2,
                city: formData.city,
                state: formData.state
            };

            console.log('Sending data:', apiData);

            const response = await fetch(`${superAdminBaseUrl}/company/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(apiData)
            });

            console.log('Response status:', response.status);

            const data = await response.json();
            if (response.ok && (data.success || data.company)) {
                setSubmitStatus('success');
                setMessage('Registration successful! Company has been registered.');
                setTenantDetails(data.data || data);
                setShowSuccessDetails(true);

                setTimeout(() => {
                    setFormData({
                        companyName: '',
                        companyType: '',
                        contactPerson: '',
                        email: '',
                        phoneNo: '',
                        numberOfEmployees: '',
                        gstNumber: '',
                        panNumber: '',
                        typeOfStaffing: '',
                        address1: '',
                        address2: '',
                        city: '',
                        state: '',
                        logo: null
                    });
                    setShowSuccessDetails(false);
                    setSubmitStatus(null);
                }, 5000);
            } else {
                setSubmitStatus('error');
                setMessage(data.message || data.error || 'Registration failed. Please try again.');
            }
        } catch (error) {
            setSubmitStatus('error');
            setMessage('Network error. Please check your connection and try again.');
            console.log('Registration error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen">
            {isSubmitting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <SpinLoader />
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                <h1 className="text-md font-semibold text-gray-900 mb-6">
                    Company Details
                </h1>

                {submitStatus && (
                    <div
                        className={[
                            "mb-5 rounded-xl border p-4",
                            submitStatus === "success"
                                ? "bg-green-50 border-green-200"
                                : "bg-red-50 border-red-200",
                        ].join(" ")}
                    >
                        <div className="flex items-start gap-3">
                            {submitStatus === "success" ? (
                                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                            ) : (
                                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600" />
                            )}
                            <p
                                className={[
                                    "font-medium",
                                    submitStatus === "success" ? "text-green-800" : "text-red-800",
                                ].join(" ")}
                            >
                                {message}
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="h-24 w-24 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                                {formData.logo ? (
                                    <img
                                        src={
                                            typeof formData.logo === "string"
                                                ? formData.logo
                                                : URL.createObjectURL(formData.logo)
                                        }
                                        alt="Logo"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="text-gray-300">
                                        <Upload className="h-8 w-8" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={isSubmitting}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="logo-upload"
                                    className={[
                                        "inline-flex items-center justify-center",
                                        "h-9 px-6 rounded-md",
                                        "border border-indigo-500 text-indigo-600 bg-white",
                                        "text-sm font-medium",
                                        isSubmitting
                                            ? "opacity-50 cursor-not-allowed"
                                            : "cursor-pointer hover:bg-indigo-50",
                                    ].join(" ")}
                                >
                                    Upload
                                </label>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (
                                            formData.logo &&
                                            typeof formData.logo === "string" &&
                                            formData.logo.startsWith("blob:")
                                        ) {
                                            try {
                                                URL.revokeObjectURL(formData.logo);
                                            } catch { }
                                        }
                                        setFormData({ ...formData, logo: null });
                                        const input = document.getElementById("logo-upload");
                                        if (input) input.value = "";
                                    }}
                                    disabled={!formData.logo || isSubmitting}
                                    className={[
                                        "h-9 px-4 rounded-md text-sm font-medium border",
                                        formData.logo && !isSubmitting
                                            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                            : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed",
                                    ].join(" ")}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Company Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        placeholder="Enter company name"
                                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Company Type
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="companyType"
                                        value={formData.companyType}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        placeholder="Company type"
                                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        placeholder="Enter email"
                                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Contact Person
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="contactPerson"
                                        value={formData.contactPerson}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        placeholder="Enter contact person"
                                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Contact No.
                                </label>
                                <div className="flex h-11 overflow-hidden rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
                                    <div className="relative w-24 border-r border-gray-200">
                                        <select
                                            value={selectedCountryCode}
                                            onChange={(e) => setSelectedCountryCode(e.target.value)}
                                            disabled={isSubmitting}
                                            className="h-full w-full appearance-none bg-white pl-3 pr-8 text-sm focus:outline-none"
                                        >
                                            {countryCode.map((code) => (
                                                <option key={code} value={code}>
                                                    {code}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                    </div>

                                    <input
                                        type="tel"
                                        name="phoneNo"
                                        value={formData.phoneNo}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        placeholder="Enter number"
                                        pattern="[0-9]{10}"
                                        maxLength="10"
                                        className="h-full flex-1 px-3 text-sm placeholder:text-gray-400 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    GST No.
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="gstNumber"
                                        value={formData.gstNumber}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        placeholder="Enter GST"
                                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    PAN No.
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="panNumber"
                                        value={formData.panNumber}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        placeholder="Enter PAN"
                                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Type of Staffing
                                </label>
                                <div className="relative">
                                    <select
                                        name="typeOfStaffing"
                                        value={formData.typeOfStaffing}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        className="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    >
                                        {staffingTypes.map((type) => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                                disabled={type.value === ""}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="my-8 border-t border-gray-300" />


                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Address 1
                                </label>
                                <input
                                    type="text"
                                    name="address1"
                                    value={formData.address1}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    placeholder="Enter address"
                                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Address 2
                                </label>
                                <input
                                    type="text"
                                    name="address2"
                                    value={formData.address2}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    placeholder="Address line 2"
                                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    City
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        placeholder="City"
                                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    State
                                </label>
                                <div className="relative">
                                    <select
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        className="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    >
                                        {states.map((s) => (
                                            <option key={s} value={s} disabled={s === "Select State"}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Number of Employees
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="numberOfEmployees"
                                        value={formData.numberOfEmployees}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        placeholder="In numbers"
                                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={[
                                    "h-10 px-6 rounded-lg text-sm font-medium text-white",
                                    "bg-[#6D5BD0] hover:bg-[#5B4BC7] shadow-sm",
                                    isSubmitting ? "opacity-60 cursor-not-allowed" : "",
                                ].join(" ")}
                            >
                                {isSubmitting ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Registering...
                                    </span>
                                ) : (
                                    "Register"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CompaniesRegister;