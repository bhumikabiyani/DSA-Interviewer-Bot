"use client";
import { useState, useEffect } from "react";
import { X, Loader2, User, Briefcase, Building2, GraduationCap, Goal } from "lucide-react";
import { CandidateInfo } from "@/lib/types";

interface PreInterviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CandidateInfo) => void;
  loading: boolean;
  initialData?: {
    type?: string;
    current_role?: string;
    organization?: string;
    expectations?: string;
    difficulty?: string;
  } | null;
}

export function PreInterviewForm({ isOpen, onClose, onSubmit, loading, initialData }: PreInterviewFormProps) {
  const [formData, setFormData] = useState<CandidateInfo>({
    type: "student",
    currentRole: "",
    organization: "",
    expectations: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: (initialData.type as "student" | "professional") || "student",
        currentRole: initialData.current_role || "",
        organization: initialData.organization || "",
        expectations: initialData.expectations || "",
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121215] border border-zinc-800/80 rounded-md shadow-2xl w-full max-w-md overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between bg-[#121215]">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Candidate Setup Profile</h2>
            <p className="text-xs text-zinc-400">Personalize interviewer context and baseline prompts</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">
              Candidate Background <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-xs cursor-pointer transition-all ${
                  formData.type === "student"
                    ? "bg-zinc-800 border-zinc-600 text-zinc-100 font-semibold"
                    : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="student"
                  checked={formData.type === "student"}
                  onChange={() => setFormData({ ...formData, type: "student" as any })}
                  className="hidden"
                />
                <User className="w-3.5 h-3.5" />
                <span>Student / Scholar</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-2.5 rounded-md border text-xs cursor-pointer transition-all ${
                  formData.type === "professional"
                    ? "bg-zinc-800 border-zinc-600 text-zinc-100 font-semibold"
                    : "bg-[#18181b] border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="professional"
                  checked={formData.type === "professional"}
                  onChange={() => setFormData({ ...formData, type: "professional" as any })}
                  className="hidden"
                />
                <Briefcase className="w-3.5 h-3.5" />
                <span>Industry Engineer</span>
              </label>
            </div>
          </div>

          {/* Current Role */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">
              {formData.type === "student" ? "Degree Program & Year" : "Current Engineering Title"} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              {formData.type === "student" ? (
                <GraduationCap className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <Briefcase className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
              )}
              <input
                type="text"
                required
                placeholder={formData.type === "student" ? "B.Tech Computer Science 3rd Year" : "Senior Software Engineer"}
                value={formData.currentRole}
                onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-zinc-800 text-zinc-100 text-xs rounded-md placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Organization */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">
              {formData.type === "student" ? "University / Institute" : "Current Organization"} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                required
                placeholder={formData.type === "student" ? "Stanford University" : "Stripe"}
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-zinc-800 text-zinc-100 text-xs rounded-md placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Expectations */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">
              Session Objective (Optional)
            </label>
            <div className="relative">
              <Goal className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
              <textarea
                rows={2}
                placeholder="Simulate Staff-level algorithms interview..."
                value={formData.expectations}
                onChange={(e) => setFormData({ ...formData, expectations: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-[#18181b] border border-zinc-800 text-zinc-100 text-xs rounded-md placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.currentRole || !formData.organization}
              className="px-4 py-1.5 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Building Prompt...
                </>
              ) : (
                "Launch Session"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

