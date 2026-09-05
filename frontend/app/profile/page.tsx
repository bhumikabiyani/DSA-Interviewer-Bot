"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  LogOut,
  ArrowLeft,
  CheckCircle,
  Code2,
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
    router.push("/dashboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 selection:bg-blue-500/20 selection:text-blue-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full space-y-10">
        {/* Profile Card */}
        <section className="bg-[#121215] border border-zinc-800/80 rounded-md p-6">
          {loadingProfile ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-zinc-800 rounded w-48" />
              <div className="h-4 bg-zinc-800 rounded w-64" />
            </div>
          ) : profile ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-zinc-800/60 pb-6">
                <div className="w-12 h-12 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-lg text-zinc-100">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
                    {profile.username}
                  </h1>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Candidate Profile
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-[#18181b] border border-zinc-800/60 rounded flex items-center gap-3">
                  <Mail className="h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Email</div>
                    <div className="font-medium text-zinc-200">{profile.email}</div>
                  </div>
                </div>

                <div className="p-3 bg-[#18181b] border border-zinc-800/60 rounded flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Joined</div>
                    <div className="font-medium text-zinc-200">{formatDate(profile.created_at)}</div>
                  </div>
                </div>

                <div className="p-3 bg-[#18181b] border border-zinc-800/60 rounded flex items-center gap-3">
                  <Code2 className="h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">Total Sessions</div>
                    <div className="font-semibold text-zinc-100 text-sm">{totalCount}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Failed to load candidate record.</p>
          )}
        </section>

        {/* Interview Records Table/List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
                Interview Session History
              </h2>
              <p className="text-xs text-zinc-400">Complete archive of simulated assessment sessions.</p>
            </div>
            {totalCount > 0 && (
              <span className="text-xs font-mono text-zinc-500">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          {loadingInterviews ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-[#121215] border border-zinc-800/60 rounded-md animate-pulse" />
              ))}
            </div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-12 bg-[#121215] border border-zinc-800/80 rounded-md">
              <Clock className="mx-auto h-8 w-8 mb-2 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-300">No session history</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-md transition-all"
              >
                Start Session
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {interviews.map((interview) => {
                  const isEnded = interview.phase === "ended";
                  return (
                    <div
                      key={interview.interview_id}
                      onClick={() => handleResumeInterview(interview.session_id)}
                      className="group bg-[#121215] hover:bg-[#18181b] border border-zinc-800/80 hover:border-zinc-700 rounded-md p-4 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-300">
                            {isEnded ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Clock className="h-3.5 w-3.5" />}
                          </div>
                          <span className="font-semibold text-xs text-zinc-200">
                            Session #{interview.interview_id}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            isEnded
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                              : "bg-blue-950/40 text-blue-400 border-blue-900/60"
                          }`}
                        >
                          {isEnded ? "Completed" : "Active"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/40">
                        <span>{isEnded ? "Report Generated" : "In Progress"}</span>
                        <span className="group-hover:text-zinc-100 flex items-center gap-1 font-medium text-xs transition-colors">
                          {isEnded ? "View Scorecard" : "Resume"}
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => fetchInterviews(currentPage - 1)}
                    disabled={!hasPrev}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#121215] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium rounded-md disabled:opacity-50 transition-all"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>

                  <span className="text-xs font-mono text-zinc-400">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => fetchInterviews(currentPage + 1)}
                    disabled={!hasNext}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#121215] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium rounded-md disabled:opacity-50 transition-all"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

