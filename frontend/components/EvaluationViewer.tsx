"use client";

import { Evaluation, QuestionScore } from "@/lib/types";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    Star,
    TrendingUp,
    MessageCircle,
    Code2,
    Brain,
    Clock,
} from "lucide-react";

function ScoreCircle({ score, maxScore = 100 }: { score: number; maxScore?: number }) {
    const percentage = (score / maxScore) * 100;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percentage / 100) * circumference;

    let color = "text-red-500";
    if (percentage >= 70) color = "text-green-500";
    else if (percentage >= 40) color = "text-amber-500";

    return (
        <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
                <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                />
                <circle
                    cx="64"
                    cy="64"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`${color} transition-all duration-1000`}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${color}`}>{score}</span>
            </div>
        </div>
    );
}

function QuestionCard({ question, index }: { question: QuestionScore; index: number }) {
    const getScoreColor = (score: number) => {
        if (score >= 4) return "text-green-500";
        if (score >= 3) return "text-amber-500";
        return "text-red-500";
    };

    const getCompletionBadge = (method: string) => {
        switch (method) {
            case "code":
                return <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs font-medium flex items-center gap-1"><Code2 className="w-3 h-3" /> Code Solution</span>;
            case "verbal":
                return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Verbal Explanation</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">Incomplete</span>;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Question {index + 1}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{question.question_title}</p>
                </div>
                <div className={`text-4xl font-bold ${getScoreColor(question.score)}`}>
                    {question.score}<span className="text-lg text-gray-400">/5</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {getCompletionBadge(question.completion_method)}
                <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    ~{question.time_taken_minutes} min
                </span>
            </div>

            {/* Criteria Scores */}
            <div className="grid grid-cols-2 gap-2 text-sm">
                {question.criteria_scores.problem_understanding && (
                    <div className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <span className="text-gray-600 dark:text-gray-400">Problem Understanding</span>
                        <span className={getScoreColor(question.criteria_scores.problem_understanding)}>{question.criteria_scores.problem_understanding}/5</span>
                    </div>
                )}
                {question.criteria_scores.approach_algorithm && (
                    <div className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <span className="text-gray-600 dark:text-gray-400">Algorithm</span>
                        <span className={getScoreColor(question.criteria_scores.approach_algorithm)}>{question.criteria_scores.approach_algorithm}/5</span>
                    </div>
                )}
                {question.criteria_scores.code_quality !== null && (
                    <div className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <span className="text-gray-600 dark:text-gray-400">Code Quality</span>
                        <span className={getScoreColor(question.criteria_scores.code_quality)}>{question.criteria_scores.code_quality}/5</span>
                    </div>
                )}
                {question.criteria_scores.complexity_analysis && (
                    <div className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <span className="text-gray-600 dark:text-gray-400">Complexity Analysis</span>
                        <span className={getScoreColor(question.criteria_scores.complexity_analysis)}>{question.criteria_scores.complexity_analysis}/5</span>
                    </div>
                )}
                {question.criteria_scores.communication && (
                    <div className="flex justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <span className="text-gray-600 dark:text-gray-400">Communication</span>
                        <span className={getScoreColor(question.criteria_scores.communication)}>{question.criteria_scores.communication}/5</span>
                    </div>
                )}
            </div>

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4 pt-2">
                {question.strengths.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Strengths
                        </h4>
                        <ul className="space-y-1">
                            {question.strengths.map((s, i) => (
                                <li key={i} className="text-sm text-gray-600 dark:text-gray-300">• {s}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {question.areas_for_improvement.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" /> Areas to Improve
                        </h4>
                        <ul className="space-y-1">
                            {question.areas_for_improvement.map((a, i) => (
                                <li key={i} className="text-sm text-gray-600 dark:text-gray-300">• {a}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export function EvaluationViewer({ evaluation }: { evaluation: Evaluation }) {
    const getRecommendationStyle = (rec: string) => {
        const upper = rec.toUpperCase();
        if (upper.includes("STRONG HIRE")) return { bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300", icon: <Star className="w-5 h-5" /> };
        if (upper.includes("HIRE")) return { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300", icon: <CheckCircle2 className="w-5 h-5" /> };
        if (upper.includes("NO HIRE")) return { bg: "bg-red-100 dark:bg-red-900", text: "text-red-700 dark:text-red-300", icon: <XCircle className="w-5 h-5" /> };
        return { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-300", icon: <AlertCircle className="w-5 h-5" /> };
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Overall Score Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                            Overall Performance
                        </h2>
                        {evaluation.recommendation && (
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getRecommendationStyle(evaluation.recommendation).bg} ${getRecommendationStyle(evaluation.recommendation).text}`}>
                                {getRecommendationStyle(evaluation.recommendation).icon}
                                <span className="font-semibold">{evaluation.recommendation}</span>
                            </div>
                        )}
                    </div>
                    <ScoreCircle score={evaluation.overall_score} />
                </div>

                {/* Summaries */}
                <div className="mt-6 grid md:grid-cols-2 gap-4">
                    {evaluation.technical_skills_summary && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <h4 className="font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-2 mb-2">
                                <Brain className="w-4 h-4" /> Technical Skills
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{evaluation.technical_skills_summary}</p>
                        </div>
                    )}
                    {evaluation.communication_skills_summary && (
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <h4 className="font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2 mb-2">
                                <MessageCircle className="w-4 h-4" /> Communication
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{evaluation.communication_skills_summary}</p>
                        </div>
                    )}
                </div>

                {/* Feedback */}
                {evaluation.overall_feedback && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h4 className="font-medium text-gray-800 dark:text-white mb-2">Feedback</h4>
                        <p className="text-gray-600 dark:text-gray-300">{evaluation.overall_feedback}</p>
                    </div>
                )}
            </div>

            {/* Question Cards */}
            {evaluation.questions.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Question Breakdown</h2>
                    {evaluation.questions.map((q, i) => (
                        <QuestionCard key={i} question={q} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}
