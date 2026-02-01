"use client";
import { useState } from "react";
import { X, Loader2, User, Briefcase, Building2, Target, GraduationCap, Goal } from "lucide-react";
import { CandidateInfo } from "@/lib/types";

interface PreInterviewFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CandidateInfo) => void;
    loading: boolean;
}

export function PreInterviewForm({ isOpen, onClose, onSubmit, loading }: PreInterviewFormProps) {
    const [formData, setFormData] = useState<CandidateInfo>({
        type: "student",
        currentRole: "",
        organization: "",
        expectations: "",
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Interview Setup</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tell us a bit about yourself</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Helper function for input fields */}
                    <div className="space-y-4">

                        {/* Type Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Are you a Student or Professional ? <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'student' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="student"
                                        checked={formData.type === 'student'}
                                        onChange={(e) => setFormData({ ...formData, type: "student" as any })}
                                        className="hidden"
                                    />
                                    <User className={`w-4 h-4 ${formData.type === 'student' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                                    <span className={`font-medium ${formData.type === 'student' ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}`}>Student</span>
                                </label>

                                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.type === 'professional' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="professional"
                                        checked={formData.type === 'professional'}
                                        onChange={(e) => setFormData({ ...formData, type: "professional" as any })}
                                        className="hidden"
                                    />
                                    <Briefcase className={`w-4 h-4 ${formData.type === 'professional' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                                    <span className={`font-medium ${formData.type === 'professional' ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400'}`}>Professional</span>
                                </label>
                            </div>
                        </div>

                        {/* Current Role */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formData.type === 'student' ? "Degree & Study Year" : "Current Role"} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                {formData.type === 'student' ? <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-gray-400" /> : <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />} 
                                <input
                                    type="text"
                                    required
                                    placeholder={formData.type === 'student' ? "B.Tech 3rd Year CSE" : "SDE 1, Frontend Dev, etc."}
                                    value={formData.currentRole}
                                    onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Organization */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formData.type === 'student' ? "University Name" : "Company Name"} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder={formData.type === 'student' ? "IIT Madras" : "Microsoft"}
                                    value={formData.organization}
                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Expectations */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                What are your goal for this interview?
                            </label>
                            <div className="relative">
                                <Goal className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <textarea
                                    rows={3}
                                    placeholder="Prepare for a technical interview"
                                    value={formData.expectations}
                                    onChange={(e) => setFormData({ ...formData, expectations: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white resize-none"
                                />
                            </div>
                        </div>

                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.currentRole || !formData.organization }
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                "Start Interview"
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
