"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Code2, GraduationCap, Briefcase, Building, Target, ArrowRight, Loader2 } from "lucide-react";
import { startInterviewWithForm } from "@/lib/api";
import { useChatStore } from "@/lib/store";

interface CandidateInfo {
    type: "student" | "professional";
    currentRole: string;
    organization: string;
    expectations: string;
}

export default function StartInterviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setInterviewState, setInitialQuestion, reset } = useChatStore();

    const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
        type: "student",
        currentRole: "",
        organization: "",
        expectations: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!candidateInfo.currentRole.trim() || !candidateInfo.organization.trim()) {
            setError("Please fill in all required fields");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await startInterviewWithForm(candidateInfo);

            // Reset store and set up new interview state
            reset();
            setInterviewState({
                currentQuestion: data.current_question,
                totalQuestions: data.total_questions,
                timeRemaining: data.time_remaining,
                phase: "intro",
            });
            setInitialQuestion(data.intro_message);

            // Navigate to interview page
            router.push(`/interview/${data.session_id}`);
        } catch (err) {
            if ((err as Error).message === "Unauthorized") {
                localStorage.removeItem("access_token");
                router.push("/login");
                return;
            }
            setError("Failed to start interview. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="container mx-auto px-4 py-12 max-w-2xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500 mb-4">
                        <Code2 className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Start Your DSA Interview
                    </h1>
                    <p className="text-gray-400">
                        Tell us a bit about yourself before we begin
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type Selection */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <label className="block text-sm font-medium text-gray-300 mb-4">
                            I am a...
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setCandidateInfo(prev => ({ ...prev, type: "student", currentRole: "", organization: "" }))}
                                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                  ${candidateInfo.type === "student"
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                                    }`}
                            >
                                <GraduationCap className="w-8 h-8" />
                                <span className="font-medium">Student</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCandidateInfo(prev => ({ ...prev, type: "professional", currentRole: "", organization: "" }))}
                                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                  ${candidateInfo.type === "professional"
                                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                                    }`}
                            >
                                <Briefcase className="w-8 h-8" />
                                <span className="font-medium">Professional</span>
                            </button>
                        </div>
                    </div>

                    {/* Current Role */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {candidateInfo.type === "student" ? (
                                <>
                                    <GraduationCap className="w-4 h-4 inline mr-2" />
                                    Current Degree / Year
                                </>
                            ) : (
                                <>
                                    <Briefcase className="w-4 h-4 inline mr-2" />
                                    Current Position / Role
                                </>
                            )}
                        </label>
                        <input
                            type="text"
                            value={candidateInfo.currentRole}
                            onChange={(e) => setCandidateInfo(prev => ({ ...prev, currentRole: e.target.value }))}
                            placeholder={candidateInfo.type === "student"
                                ? "e.g., BTech CSE, 3rd Year"
                                : "e.g., Software Engineer"
                            }
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Organization */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Building className="w-4 h-4 inline mr-2" />
                            {candidateInfo.type === "student" ? "University / College" : "Company / Organization"}
                        </label>
                        <input
                            type="text"
                            value={candidateInfo.organization}
                            onChange={(e) => setCandidateInfo(prev => ({ ...prev, organization: e.target.value }))}
                            placeholder={candidateInfo.type === "student"
                                ? "e.g., IIT Delhi"
                                : "e.g., Google"
                            }
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Expectations */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Target className="w-4 h-4 inline mr-2" />
                            What are you hoping to get from this interview?
                        </label>
                        <textarea
                            value={candidateInfo.expectations}
                            onChange={(e) => setCandidateInfo(prev => ({ ...prev, expectations: e.target.value }))}
                            placeholder="e.g., Practice for upcoming FAANG interviews, improve my problem-solving skills, get comfortable with live coding..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Starting Interview...
                            </>
                        ) : (
                            <>
                                Start Interview
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    {/* Info */}
                    <p className="text-center text-sm text-gray-500">
                        You&apos;ll be asked 2 DSA questions over ~50 minutes
                    </p>
                </form>
            </div>
        </div>
    );
}
