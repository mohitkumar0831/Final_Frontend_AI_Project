import React, { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import axios from "axios";
import { baseUrl } from "../utils/ApiConstants";
import banner from "../img/profile-banner.png"

const RecruiterProfile = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "",
        phone: "",
        isActive: true,
    });

    const [originalData, setOriginalData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                const response = await axios.get(`${baseUrl}/auth/meAll`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log("hr profile", response.data);

                const data = response.data;

                if (data.data) {
                    const profileData = {
                        name: data.data.name || "",
                        email: data.data.email || "",
                        role: data.data.role || "",
                        phone: data.data.phone || "",
                        isActive: data.data.isActive ?? true,
                    };

                    setFormData(profileData);
                    setOriginalData(profileData);
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

        if (name === "phone") {
            const phoneValue = value.replace(/[^0-9]/g, "").slice(0, 10);
            setFormData((prev) => ({ ...prev, [name]: phoneValue }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");

            const response = await axios.put(
                `${baseUrl}/recruiter/profile/me`,
                { phone: formData.phone },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("hr profile", response.data);

            if (response.data.data) {
                setFormData((prev) => ({
                    ...prev,
                    phone: response.data.data.phone || "",
                }));

                setOriginalData((prev) => ({
                    ...prev,
                    phone: response.data.data.phone || "",
                }));
            }

            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(originalData);
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">Loading...</div>
        );
    }

    return (
        <div className="overflow-hidden">

            <div className="relative ">
                <img src={banner} alt="Banner" />
            </div>

            <div className="relative flex left-15">
                <div className="-mt-12 relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                        <img
                            src="https://i.pravatar.cc/150"
                            alt="profile"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
                        <Camera size={16} />
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">

                <div className="grid md:grid-cols-2 gap-6">

                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            disabled
                            className="mt-2 w-full h-11 px-4 border rounded-lg hover:cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="mt-2 w-full h-11 px-4 border rounded-lg hover:cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Phone No.
                        </label>

                        <div className="flex mt-2">
                            <div className="flex items-center px-3 w-22 border rounded-l-lg">
                                IN +91
                            </div>

                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full h-11 px-4 border rounded-r-lg focus:outline-none bg-white"
                                maxLength={10}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Role
                        </label>

                        <select
                            name="role"
                            value={formData.role}
                            disabled
                            className="mt-2 w-full h-11 px-4 border rounded-lg hover:cursor-not-allowed"
                        >
                            <option>{formData.role}</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-6 py-2 border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-gradient-to-r from-[#6950BD] to-[#896BE6] text-white rounded-lg hover:bg-purple-700"
                    >
                        {saving ? "Saving..." : "Generate"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default RecruiterProfile;