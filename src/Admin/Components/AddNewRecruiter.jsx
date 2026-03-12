import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCompany } from '../../Context/companyContext';
import { baseUrl } from '../../utils/ApiConstants';

function AddNewRecruiter({ onSave, onCancel, editData }) {
    const { companies } = useCompany();

    const companiesList = companies?.data || [];

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        companyId: '',
        companyName: ''
    });

    const [errors, setErrors] = useState({});

    const validatePhone = (phone) => {
        const phoneRegex = /^\d{10,}$/;
        return phoneRegex.test(phone);
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, phone: value });
        if (value && !validatePhone(value)) {
            setErrors({ ...errors, phone: 'Phone number must be at least 10 digits' });
        } else {
            setErrors({ ...errors, phone: '' });
        }
    };

    const handleKeyPress = (e) => {
        if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    };

    useEffect(() => {
        if (editData) {
            const company = companiesList.find(c => c._id === editData.company);
            setFormData({
                fullName: editData.name || '',
                email: editData.email || '',
                phone: editData.phone || '',
                companyId: editData.company || '',
                companyName: company?.companyName || editData.companyName || ''
            });
        } else {
            if (companiesList.length > 0) {
                setFormData({
                    fullName: '',
                    email: '',
                    phone: '',
                    companyId: companiesList[0]._id,
                    companyName: companiesList[0].companyName
                });
            }
        }
    }, [editData, companiesList]);

    const handleCompanyChange = (e) => {
        const selectedId = e.target.value;
        const selectedCompany = companiesList.find(c => c._id === selectedId);

        setFormData({
            ...formData,
            companyId: selectedId,
            companyName: selectedCompany?.companyName || ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.phone && !validatePhone(formData.phone)) {
            setErrors({ ...errors, phone: 'Phone number must be at least 10 digits' });
            return;
        }

        try {
            if (editData) {
                const response = await axios.put(
                    `${baseUrl}/admin/hr/${editData.id}`,
                    {
                        name: formData.fullName,
                        phone: formData.phone,
                        email: formData.email,
                        company: formData.companyId
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                if (response.data.success) {
                    alert("HR updated successfully!");
                    onSave({
                        ...response.data.data,
                        fullName: response.data.data.name
                    });
                }
            } else {
                const response = await axios.post(`${baseUrl}/admin/hr`, {
                    name: formData.fullName,
                    phone: formData.phone,
                    email: formData.email,
                    company: formData.companyId
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                alert("HR created successfully!");
                onSave(response.data);
            }

            setFormData({
                fullName: '',
                email: '',
                phone: '',
                companyId: companiesList[0]?._id || '',
                companyName: companiesList[0]?.companyName || ''
            });

        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || `Failed to ${editData ? 'update' : 'create'} HR`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-[560px] bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {editData ? 'Edit Recruiters' : 'Add Recruiters'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="w-9 h-9 rounded-full hover:bg-gray-100 grid place-items-center"
                    >
                        <X className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Enter name"
                                className="w-full h-12 rounded-lg border border-gray-200 bg-[#FBFBFF] px-4 outline-none focus:ring-2 focus:ring-[#6D5DD3]/25"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">
                                Email Id <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Enter email"
                                className="w-full h-12 rounded-lg border border-gray-200 bg-[#FBFBFF] px-4 outline-none focus:ring-2 focus:ring-[#6D5DD3]/25"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">
                                Phone No. <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter phone no."
                                className={`w-full h-12 rounded-lg border bg-[#FBFBFF] px-4 outline-none focus:ring-2 focus:ring-[#6D5DD3]/25 ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                                required
                            />
                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">
                                Company Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.companyName}
                                readOnly
                                placeholder="Company name"
                                className="w-full h-12 rounded-lg border border-gray-200 bg-[#FBFBFF] px-4 outline-none focus:ring-2 focus:ring-[#6D5DD3]/25"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 h-10 rounded-lg border border-[#6D5DD3] text-[#6D5DD3] font-medium hover:bg-[#6D5DD3]/5 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="flex-[2] h-10 rounded-lg bg-gradient-to-r from-[#684FBC] to-[#886BE6] text-white font-medium hover:brightness-95 transition"
                        >
                            {editData ? "Update" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddNewRecruiter;