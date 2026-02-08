"""Evaluation service for scoring interview performance."""

import json
import logging
from typing import Dict, List, Optional

from dsa_interviewer.services.groq_llm import GroqLLM

logger = logging.getLogger(__name__)


EVALUATION_PROMPT = """
You are an expert technical interview evaluator. Analyze the following DSA interview conversation and provide a detailed evaluation.

SCORING CRITERIA (use these weights):
1. Problem Understanding (15%): Did the candidate clarify requirements and identify edge cases?
2. Approach/Algorithm (25%): Was the approach correct, optimal, and well-reasoned?
3. Code Quality (20%): Is the code clean, readable, and correct (if provided)?
4. Time/Space Complexity (15%): Did they correctly analyze and discuss complexity?
5. Communication (15%): Did they explain their thinking clearly throughout?
6. Code Execution (10%): Does the code work or is it near-working (if provided)?

SCORING LEVELS (1-5 for each question):
- 5 (Excellent): Working code with optimal solution, clear explanation
- 4 (Good): Near-working code OR correct verbal explanation with good approach
- 3 (Satisfactory): Correct approach but incomplete implementation
- 2 (Needs Improvement): Struggled but showed some understanding
- 1 (Insufficient): Could not solve or explain

INTERVIEW DATA:
{interview_data}

QUESTIONS ASKED:
{questions}

Provide your evaluation in the following JSON format ONLY (no other text):
{{
  "overall_score": <0-100>,
  "recommendation": "<Strong Hire / Hire / No Hire>",
  "questions": [
    {{
      "question_title": "<extracted from question>",
      "score": <1-5>,
      "completion_method": "<code / verbal / incomplete>",
      "time_taken_minutes": <estimated>,
      "criteria_scores": {{
        "problem_understanding": <1-5>,
        "approach_algorithm": <1-5>,
        "code_quality": <1-5 or null if no code>,
        "complexity_analysis": <1-5>,
        "communication": <1-5>,
        "code_execution": <1-5 or null if no code>
      }},
      "strengths": ["<strength 1>", "<strength 2>"],
      "areas_for_improvement": ["<area 1>", "<area 2>"]
    }}
  ],
  "overall_feedback": "<2-3 sentences of constructive feedback>",
  "technical_skills_summary": "<brief assessment of DSA knowledge>",
  "communication_skills_summary": "<brief assessment of communication>"
}}
"""


class EvaluationService:
    """Service for evaluating interview performance using LLM."""
    
    def __init__(self):
        self.llm = GroqLLM()
    
    def evaluate_interview(
        self, 
        history: List[Dict], 
        questions: List[str],
        question_times: Optional[List[int]] = None
    ) -> Dict:
        """
        Evaluate an interview based on conversation history.
        
        Args:
            history: List of conversation messages with 'role' and 'message' keys
            questions: List of question texts that were asked
            question_times: Optional list of time spent on each question in seconds
            
        Returns:
            Evaluation dictionary with scores and feedback
        """
        try:
            # Format interview data for the prompt
            interview_data = self._format_interview_data(history)
            questions_text = self._format_questions(questions, question_times)
            
            # Build the evaluation prompt
            prompt = EVALUATION_PROMPT.format(
                interview_data=interview_data,
                questions=questions_text
            )
            
            # Get evaluation from LLM
            messages = [
                {"role": "system", "content": "You are an expert technical interview evaluator. Respond only with valid JSON."},
                {"role": "user", "content": prompt}
            ]
            
            response = self.llm.chat(messages)
            
            # Parse the JSON response
            evaluation = self._parse_evaluation_response(response)
            
            logger.info(f"Evaluation completed: overall_score={evaluation.get('overall_score')}")
            return evaluation
            
        except Exception as e:
            logger.error(f"Error evaluating interview: {e}")
            return self._get_default_evaluation(str(e))
    
    def _format_interview_data(self, history: List[Dict]) -> str:
        """Format conversation history for the evaluation prompt."""
        formatted = []
        for msg in history:
            role = msg.get("role", "unknown")
            message = msg.get("message", "")
            
            if role == "interviewer":
                formatted.append(f"INTERVIEWER: {message}")
            elif role == "candidate":
                formatted.append(f"CANDIDATE: {message}")
        
        return "\n\n".join(formatted)
    
    def _format_questions(self, questions: List[str], times: Optional[List[int]]) -> str:
        """Format questions list for the evaluation prompt."""
        formatted = []
        for i, q in enumerate(questions):
            time_info = ""
            if times and i < len(times) and times[i]:
                minutes = times[i] // 60
                time_info = f" (Time spent: ~{minutes} minutes)"
            
            formatted.append(f"Question {i + 1}{time_info}:\n{q}")
        
        return "\n\n---\n\n".join(formatted)
    
    def _parse_evaluation_response(self, response: str) -> Dict:
        """Parse the LLM response into a structured evaluation."""
        # Try to extract JSON from the response
        try:
            # Remove any markdown code blocks if present
            if "```json" in response:
                response = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                response = response.split("```")[1].split("```")[0]
            
            evaluation = json.loads(response.strip())
            
            # Validate required fields
            required_fields = ["overall_score", "recommendation", "questions", "overall_feedback"]
            for field in required_fields:
                if field not in evaluation:
                    evaluation[field] = self._get_default_value(field)
            
            # Ensure overall_score is within bounds
            evaluation["overall_score"] = max(0, min(100, evaluation.get("overall_score", 50)))
            
            return evaluation
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse evaluation JSON: {e}")
            logger.debug(f"Raw response: {response}")
            return self._get_default_evaluation(f"Failed to parse evaluation: {e}")
    
    def _get_default_value(self, field: str):
        """Get default values for missing fields."""
        defaults = {
            "overall_score": 50,
            "recommendation": "Unable to determine",
            "questions": [],
            "overall_feedback": "Evaluation could not be completed.",
            "technical_skills_summary": "Not available",
            "communication_skills_summary": "Not available",
        }
        return defaults.get(field)
    
    def _get_default_evaluation(self, error_msg: str) -> Dict:
        """Return a default evaluation when the process fails."""
        return {
            "overall_score": 0,
            "recommendation": "Unable to evaluate",
            "questions": [],
            "overall_feedback": f"Evaluation could not be completed due to an error: {error_msg}",
            "technical_skills_summary": "Not available",
            "communication_skills_summary": "Not available",
            "error": error_msg
        }
    
    def get_score_summary(self, evaluation: Dict) -> str:
        """Generate a human-readable summary of the evaluation."""
        if "error" in evaluation:
            return f"Evaluation Error: {evaluation['error']}"
        
        summary_parts = [
            f"Overall Score: {evaluation.get('overall_score', 'N/A')}/100",
            f"Recommendation: {evaluation.get('recommendation', 'N/A')}",
            "",
            "Questions:",
        ]
        
        for i, q in enumerate(evaluation.get("questions", [])):
            summary_parts.append(
                f"  Q{i + 1}: {q.get('question_title', 'Unknown')} - "
                f"Score: {q.get('score', 'N/A')}/5 ({q.get('completion_method', 'unknown')})"
            )
            
            strengths = q.get("strengths", [])
            if strengths:
                summary_parts.append(f"    Strengths: {', '.join(strengths)}")
            
            improvements = q.get("areas_for_improvement", [])
            if improvements:
                summary_parts.append(f"    Areas to improve: {', '.join(improvements)}")
        
        summary_parts.extend([
            "",
            f"Feedback: {evaluation.get('overall_feedback', 'No feedback available')}",
        ])
        
        return "\n".join(summary_parts)


# Singleton instance
_evaluation_service = None

def get_evaluation_service() -> EvaluationService:
    """Get or create the singleton evaluation service."""
    global _evaluation_service
    if _evaluation_service is None:
        _evaluation_service = EvaluationService()
    return _evaluation_service
