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

function QuestionCard({ question, index }: { question: QuestionScore; index: number }) {
  const getScoreBadge = (score: number) => {
    if (score >= 4) return "bg-emerald-950/50 text-emerald-400 border-emerald-900/60";
    if (score >= 3) return "bg-amber-950/40 text-amber-400 border-amber-900/60";
    return "bg-red-950/50 text-red-400 border-red-900/60";
  };

  const getCompletionBadge = (method: string) => {
    switch (method) {
      case "code":
        return (
          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded text-[10px] font-mono flex items-center gap-1">
            <Code2 className="w-3 h-3 text-zinc-400" /> Code Implementation
          </span>
        );
      case "verbal":
        return (
          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded text-[10px] font-mono flex items-center gap-1">
            <MessageCircle className="w-3 h-3 text-zinc-400" /> Verbal Explanation
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded text-[10px] font-mono">
            Incomplete
          </span>
        );
    }
  };

  return (
    <div className="bg-[#121215] border border-zinc-800/80 rounded-md p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Question #{index + 1} Evaluation
          </span>
          <h3 className="text-sm font-semibold text-zinc-100 mt-0.5">
            {question.question_title || `Problem ${index + 1}`}
          </h3>
        </div>
        <div className={`px-2.5 py-1 rounded border font-mono font-bold text-xs ${getScoreBadge(question.score)}`}>
          {question.score} / 5
        </div>
      </div>

      <div className="flex items-center gap-3">
        {getCompletionBadge(question.completion_method)}
        <span className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          ~{question.time_taken_minutes} min
        </span>
      </div>

      {/* Criteria Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {question.criteria_scores.problem_understanding !== undefined && (
          <div className="flex justify-between px-3 py-2 bg-[#18181b] border border-zinc-800/60 rounded">
            <span className="text-zinc-400">Problem Understanding</span>
            <span className="font-mono text-zinc-200">{question.criteria_scores.problem_understanding}/5</span>
          </div>
        )}
        {question.criteria_scores.approach_algorithm !== undefined && (
          <div className="flex justify-between px-3 py-2 bg-[#18181b] border border-zinc-800/60 rounded">
            <span className="text-zinc-400">Algorithm Strategy</span>
            <span className="font-mono text-zinc-200">{question.criteria_scores.approach_algorithm}/5</span>
          </div>
        )}
        {question.criteria_scores.code_quality !== null && question.criteria_scores.code_quality !== undefined && (
          <div className="flex justify-between px-3 py-2 bg-[#18181b] border border-zinc-800/60 rounded">
            <span className="text-zinc-400">Code Architecture</span>
            <span className="font-mono text-zinc-200">{question.criteria_scores.code_quality}/5</span>
          </div>
        )}
        {question.criteria_scores.complexity_analysis !== undefined && (
          <div className="flex justify-between px-3 py-2 bg-[#18181b] border border-zinc-800/60 rounded">
            <span className="text-zinc-400">Complexity Bounds</span>
            <span className="font-mono text-zinc-200">{question.criteria_scores.complexity_analysis}/5</span>
          </div>
        )}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/60">
        {question.strengths.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-zinc-200 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Technical Strengths
            </h4>
            <ul className="space-y-1">
              {question.strengths.map((s, i) => (
                <li key={i} className="text-xs text-zinc-400 leading-relaxed">• {s}</li>
              ))}
            </ul>
          </div>
        )}
        {question.areas_for_improvement.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-zinc-200 mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Focus Areas
            </h4>
            <ul className="space-y-1">
              {question.areas_for_improvement.map((a, i) => (
                <li key={i} className="text-xs text-zinc-400 leading-relaxed">• {a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function EvaluationViewer({ evaluation }: { evaluation: Evaluation }) {
  const getRecommendationBadge = (rec: string) => {
    const upper = rec.toUpperCase();
    if (upper.includes("STRONG HIRE"))
      return "bg-emerald-950/50 text-emerald-400 border-emerald-900/60";
    if (upper.includes("HIRE"))
      return "bg-blue-950/50 text-blue-400 border-blue-900/60";
    if (upper.includes("NO HIRE"))
      return "bg-red-950/50 text-red-400 border-red-900/60";
    return "bg-zinc-900 text-zinc-300 border-zinc-800";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Summary */}
      <div className="bg-[#121215] border border-zinc-800/80 rounded-md p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Rubric Assessment Result
            </span>
            <h2 className="text-lg font-semibold text-zinc-100 mt-0.5">
              Performance Evaluation Report
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {evaluation.recommendation && (
              <span
                className={`px-3 py-1 rounded border font-mono text-xs font-semibold ${getRecommendationBadge(
                  evaluation.recommendation
                )}`}
              >
                {evaluation.recommendation}
              </span>
            )}
            <div className="bg-[#18181b] border border-zinc-800 rounded px-4 py-2 text-center">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block">Overall Score</span>
              <span className="text-xl font-bold font-mono text-zinc-100">{evaluation.overall_score}</span>
            </div>
          </div>
        </div>

        {/* Skill Summaries */}
        <div className="grid md:grid-cols-2 gap-4">
          {evaluation.technical_skills_summary && (
            <div className="p-4 bg-[#18181b] border border-zinc-800/60 rounded space-y-1.5">
              <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-zinc-400" /> Technical Assessment
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{evaluation.technical_skills_summary}</p>
            </div>
          )}
          {evaluation.communication_skills_summary && (
            <div className="p-4 bg-[#18181b] border border-zinc-800/60 rounded space-y-1.5">
              <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-zinc-400" /> Communication & Approach
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{evaluation.communication_skills_summary}</p>
            </div>
          )}
        </div>

        {/* Feedback */}
        {evaluation.overall_feedback && (
          <div className="p-4 bg-[#18181b] border border-zinc-800/60 rounded space-y-1.5">
            <h4 className="text-xs font-semibold text-zinc-200">Overall Feedback</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">{evaluation.overall_feedback}</p>
          </div>
        )}
      </div>

      {/* Question Breakdown */}
      {evaluation.questions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Per-Question Breakdown
          </h3>
          {evaluation.questions.map((q, i) => (
            <QuestionCard key={i} question={q} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

