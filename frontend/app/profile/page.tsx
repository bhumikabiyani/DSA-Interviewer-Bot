"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getRecentInterviews, getUserProfile } from "@/lib/api";
import { useChatStore } from "@/lib/store";
import { Interview, UserProfile } from "@/lib/types";
import { logout } from "@/lib/auth";
import {
    Clock,
    User,
    Mail,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Play,
    LogOut,
    Home,
    ArrowLeft,
    CheckCircle,
} from "lucide-react";

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingInterviews, setLoadingInterviews] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);
    const { reset } = useChatStore();

    const PAGE_SIZE = 9;

    const fetchProfile = async () => {
        try {
            setLoadingProfile(true);
            const data = await getUserProfile();
            setProfile(data);
        } catch (err) {
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoadingProfile(false);
        }
    };

    const fetchInterviews = useCallback(async (page: number) => {
        try {
            setLoadingInterviews(true);
            const response = await getRecentInterviews(page, PAGE_SIZE);
            setInterviews(response.interviews);
            setTotalPages(response.total_pages);
            setTotalCount(response.total_count);
            setHasNext(response.has_next);
            setHasPrev(response.has_prev);
            setCurrentPage(page);
        } catch (err) {
            console.error("Failed to fetch interviews:", err);
        } finally {
            setLoadingInterviews(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
        fetchInterviews(1);
    }, [fetchInterviews]);

    const handleResumeInterview = (sessionId: string) => {
        reset();
        router.push(`/interview/${sessionId}`);
    };

    const handleLogout = () => {
        logout();
    };

    const handleGoBack = () => {
        router.push("/");
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
            {/* Header */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <button
                    onClick={handleGoBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">Back</span>
                </button>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/90 hover:bg-red-600 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-white"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-20">
                {/* Profile Section */}
                <div className="max-w-4xl mx-auto mb-12 animate-fade-in">
                    {loadingProfile ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                            <div className="flex flex-col md:flex-row items-center gap-8 animate-pulse">
                                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700" />
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                                </div>
                            </div>
                        </div>
                    ) : profile ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                            {/* Profile Header with Gradient */}
                            <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                            <div className="px-8 pb-8">
                                {/* Avatar */}
                                <div className="relative -mt-16 mb-6">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-xl ring-4 ring-white dark:ring-gray-800">
                                        <span className="text-5xl font-bold text-white">
                                            {profile.username.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Profile Info */}
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                            {profile.username}
                                        </h1>
                                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                                            DSA Interview Candidate
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                                                <Mail className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {profile.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Member Since</p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatDate(profile.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {totalCount}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Total Interviews
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Unable to load profile
                            </p>
                        </div>
                    )}
                </div>

                {/* Interviews Section */}
                <div className="max-w-4xl mx-auto animate-slide-up">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                            Your Interviews
                        </h2>
                        {totalCount > 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow">
                                Page {currentPage} of {totalPages}
                            </span>
                        )}
                    </div>

                    {loadingInterviews ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md animate-pulse"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                                    </div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-4" />
                                </div>
                            ))}
                        </div>
                    ) : interviews.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <Clock className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No Interviews Yet
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Start your first mock interview to see it here
                            </p>
                            <button
                                onClick={() => router.push("/")}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                <Home className="h-5 w-5" />
                                Start Interview
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {interviews.map((interview, index) => {
                                    const isEnded = interview.phase === "ended";
                                    return (
                                        <button
                                            key={interview.interview_id}
                                            onClick={() => handleResumeInterview(interview.session_id)}
                                            className={`group p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-left border border-gray-100 dark:border-gray-700 transform hover:scale-[1.02] hover:-translate-y-1 ${isEnded
                                                ? "hover:border-emerald-500 dark:hover:border-emerald-500"
                                                : "hover:border-indigo-500 dark:hover:border-indigo-500"
                                                }`}
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`p-2 rounded-lg shadow-lg ${isEnded
                                                    ? "bg-gradient-to-br from-emerald-500 to-teal-500 group-hover:shadow-emerald-500/25"
                                                    : "bg-gradient-to-br from-indigo-500 to-purple-500 group-hover:shadow-indigo-500/25"
                                                    }`}>
                                                    {isEnded ? (
                                                        <CheckCircle className="h-5 w-5 text-white" />
                                                    ) : (
                                                        <Clock className="h-5 w-5 text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className={`font-semibold transition-colors ${isEnded
                                                        ? "text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                                                        : "text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                                                        }`}>
                                                        Interview #{interview.interview_id}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isEnded
                                                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                                                    : "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30"
                                                    }`}>
                                                    {isEnded ? (
                                                        <>
                                                            <CheckCircle className="h-3 w-3" />
                                                            Completed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play className="h-3 w-3" />
                                                            Resume
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-8">
                                    <button
                                        onClick={() => fetchInterviews(currentPage - 1)}
                                        disabled={!hasPrev}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md text-gray-700 dark:text-gray-200"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                        Previous
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => fetchInterviews(pageNum)}
                                                    className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${currentPage === pageNum
                                                        ? "bg-indigo-600 text-white shadow-lg"
                                                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => fetchInterviews(currentPage + 1)}
                                        disabled={!hasNext}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md text-gray-700 dark:text-gray-200"
                                    >
                                        Next
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
