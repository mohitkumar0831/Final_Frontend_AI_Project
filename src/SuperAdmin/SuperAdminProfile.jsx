import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import axios from 'axios';
import { superAdminBaseUrl } from '../utils/ApiConstants';
const SuperAdminProfile = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${superAdminBaseUrl}/superadmin/profile`, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                const data = response.data;

                console.log(data);

                if (data.status === 'success' && data.data) {
                    setFormData({
                        name: data.data.name || '',
                        email: data.data.email || '',
                        role: data.data.role || ''
                    });
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching profile data:", error);
                setLoading(false);
            }
        };
        fetchProfileData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        console.log('Saving profile:', formData);
    };

    const handleCancel = () => {
        console.log('Cancelling changes');
    };

    const getInitials = (name) => {
        if (!name) return 'NA';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    if (loading) {
        return (
            <div className="p-4 md:p-6 lg:p-8 shadow-[0px_0px_10px_0px_rgba(0,_0,_0,_0.1)] max-w-3xl mx-auto rounded-xl">
                <p className="text-center text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 shadow-[0px_0px_10px_0px_rgba(0,_0,_0,_0.1)] max-w-3xl mx-auto rounded-xl">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">Profile</h1>

            {/* Profile Avatar Section */}
            <div className="flex flex-col md:flex-row items-center mb-8 space-x-8">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold mb-4">
                    {getInitials(formData.name)}
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <span>Upload Image</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-red-300 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            {/* Profile Form */}
            <form className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <Check className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                    </label>
                    <input
                        type="text"
                        name="role"
                        value={formData.role}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                </div>

                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SuperAdminProfile;