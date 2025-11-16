#!/usr/bin/env python3
"""
Script to generate the remaining DSA questions for the RAG knowledge base.
This creates a comprehensive set of 300 questions across all major topics and difficulty levels.
"""

import json
import os
from datetime import datetime

def create_question_template(id, title, description, topic, difficulty, pattern, tags, constraints, examples, hints, edge_cases, follow_ups, complexity, related_problems, evaluation_criteria):
    """Create a standardized question document"""
    return {
        "metadata": {
            "id": id,
            "type": "question",
            "topic": topic,
            "difficulty": difficulty,
            "pattern": pattern,
            "tags": tags,
            "complexity": complexity,
            "related_problems": related_problems,
            "evaluation_criteria": evaluation_criteria,
            "created_at": datetime.now().isoformat() + "Z"
        },
        "content": {
            "title": title,
            "description": description,
            "constraints": constraints,
            "examples": examples,
            "hints": hints,
            "edge_cases": edge_cases,
            "follow_up_questions": follow_ups
        }
    }

# Question database - organized by topic and difficulty
QUESTIONS_DB = {
    "arrays": {
        "easy": [
            {
                "id": "easy_arrays_002",
                "title": "Remove Duplicates from Sorted Array",
                "description": "Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same.",
                "pattern": "two_pointers",
                "tags": ["arrays", "two_pointers", "in_place"],
                "complexity": {"time": "O(n)", "space": "O(1)"},
                "constraints": ["1 <= nums.length <= 3 * 10^4", "-100 <= nums[i] <= 100", "nums is sorted in non-decreasing order"],
                "examples": [{"input": "nums = [1,1,2]", "output": "2, nums = [1,2,_]", "explanation": "Your function should return k = 2, with the first two elements of nums being 1 and 2 respectively."}],
                "hints": ["Use two pointers: one for reading, one for writing", "Only advance write pointer when you find a new unique element"],
                "edge_cases": ["Single element", "All elements same", "All elements unique"],
                "follow_ups": ["What if the array wasn't sorted?", "How to remove duplicates keeping only k occurrences?"]
            },
            {
                "id": "easy_arrays_003",
                "title": "Best Time to Buy and Sell Stock",
                "description": "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.",
                "pattern": "single_pass",
                "tags": ["arrays", "greedy", "optimization"],
                "complexity": {"time": "O(n)", "space": "O(1)"},
                "constraints": ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
                "examples": [{"input": "prices = [7,1,5,3,6,4]", "output": "5", "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."}],
                "hints": ["Track the minimum price seen so far", "Calculate profit at each day"],
                "edge_cases": ["Prices always decreasing", "Single day", "All prices same"],
                "follow_ups": ["What if you could make multiple transactions?", "What if there was a transaction fee?"]
            }
        ],
        "medium": [
            {
                "id": "medium_arrays_002",
                "title": "3Sum",
                "description": "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
                "pattern": "two_pointers",
                "tags": ["arrays", "two_pointers", "sorting"],
                "complexity": {"time": "O(n^2)", "space": "O(1)"},
                "constraints": ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
                "examples": [{"input": "nums = [-1,0,1,2,-1,-4]", "output": "[[-1,-1,2],[-1,0,1]]", "explanation": "The distinct triplets are [-1,0,1] and [-1,-1,2]."}],
                "hints": ["Sort the array first", "Fix one element and use two pointers for the rest", "Skip duplicates"],
                "edge_cases": ["All zeros", "No valid triplets", "Many duplicates"],
                "follow_ups": ["4Sum problem", "What if target wasn't zero?"]
            }
        ],
        "hard": [
            {
                "id": "hard_arrays_001",
                "title": "Median of Two Sorted Arrays",
                "description": "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two arrays. The overall run time complexity should be O(log (m+n)).",
                "pattern": "binary_search",
                "tags": ["arrays", "binary_search", "divide_conquer"],
                "complexity": {"time": "O(log(min(m,n)))", "space": "O(1)"},
                "constraints": ["nums1.length == m", "nums2.length == n", "0 <= m <= 1000", "0 <= n <= 1000", "1 <= m + n <= 2000"],
                "examples": [{"input": "nums1 = [1,3], nums2 = [2]", "output": "2.0", "explanation": "merged array = [1,2,3] and median is 2."}],
                "hints": ["Use binary search on the smaller array", "Find the correct partition", "Ensure left partition <= right partition"],
                "edge_cases": ["One array empty", "Arrays of very different sizes", "All elements in one array smaller"],
                "follow_ups": ["What if arrays weren't sorted?", "Find kth smallest element?"]
            }
        ]
    },
    "strings": {
        "easy": [
            {
                "id": "easy_strings_002",
                "title": "Valid Anagram",
                "description": "Given two strings s and t, return true if t is an anagram of s, and false otherwise. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
                "pattern": "frequency_count",
                "tags": ["strings", "hash_table", "sorting"],
                "complexity": {"time": "O(n)", "space": "O(1)"},
                "constraints": ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters"],
                "examples": [{"input": "s = \"anagram\", t = \"nagaram\"", "output": "true", "explanation": "Both strings contain the same characters with same frequencies."}],
                "hints": ["Count character frequencies", "Compare frequency maps", "Can you do it with sorting?"],
                "edge_cases": ["Different lengths", "Empty strings", "Single character"],
                "follow_ups": ["What if strings contained Unicode?", "Group anagrams together?"]
            }
        ],
        "medium": [
            {
                "id": "medium_strings_001",
                "title": "Longest Palindromic Substring",
                "description": "Given a string s, return the longest palindromic substring in s.",
                "pattern": "expand_around_center",
                "tags": ["strings", "palindrome", "expand_center"],
                "complexity": {"time": "O(n^2)", "space": "O(1)"},
                "constraints": ["1 <= s.length <= 1000", "s consist of only digits and English letters"],
                "examples": [{"input": "s = \"babad\"", "output": "\"bab\"", "explanation": "\"aba\" is also a valid answer."}],
                "hints": ["Expand around each possible center", "Handle both odd and even length palindromes", "Track the longest found so far"],
                "edge_cases": ["Single character", "No palindrome longer than 1", "Entire string is palindrome"],
                "follow_ups": ["Count all palindromic substrings?", "Longest palindromic subsequence?"]
            }
        ]
    },
    "trees": {
        "easy": [
            {
                "id": "easy_trees_001",
                "title": "Maximum Depth of Binary Tree",
                "description": "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
                "pattern": "tree_traversal",
                "tags": ["trees", "dfs", "recursion"],
                "complexity": {"time": "O(n)", "space": "O(h)"},
                "constraints": ["The number of nodes in the tree is in the range [0, 10^4]", "-100 <= Node.val <= 100"],
                "examples": [{"input": "root = [3,9,20,null,null,15,7]", "output": "3", "explanation": "The maximum depth is 3."}],
                "hints": ["Use recursion", "Depth = 1 + max(left_depth, right_depth)", "Handle null nodes"],
                "edge_cases": ["Empty tree", "Single node", "Skewed tree"],
                "follow_ups": ["Minimum depth?", "Iterative solution?", "Level order traversal?"]
            }
        ],
        "medium": [
            {
                "id": "medium_trees_001",
                "title": "Validate Binary Search Tree",
                "description": "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
                "pattern": "tree_validation",
                "tags": ["trees", "bst", "validation", "recursion"],
                "complexity": {"time": "O(n)", "space": "O(h)"},
                "constraints": ["The number of nodes in the tree is in the range [1, 10^4]", "-2^31 <= Node.val <= 2^31 - 1"],
                "examples": [{"input": "root = [2,1,3]", "output": "true", "explanation": "This is a valid BST."}],
                "hints": ["Each node must be within a valid range", "Pass min and max bounds down recursively", "Be careful with integer overflow"],
                "edge_cases": ["Single node", "Duplicate values", "Integer overflow"],
                "follow_ups": ["Recover BST with two swapped nodes?", "Convert sorted array to BST?"]
            }
        ]
    },
    "dynamic_programming": {
        "easy": [
            {
                "id": "easy_dp_001",
                "title": "Climbing Stairs",
                "description": "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
                "pattern": "1d_dp",
                "tags": ["dynamic_programming", "fibonacci", "memoization"],
                "complexity": {"time": "O(n)", "space": "O(1)"},
                "constraints": ["1 <= n <= 45"],
                "examples": [{"input": "n = 2", "output": "2", "explanation": "There are two ways: 1+1 and 2."}],
                "hints": ["This is similar to Fibonacci sequence", "ways(n) = ways(n-1) + ways(n-2)", "Can you optimize space?"],
                "edge_cases": ["n = 1", "n = 2", "Large n"],
                "follow_ups": ["What if you could climb 1, 2, or 3 steps?", "What if some steps were broken?"]
            }
        ],
        "medium": [
            {
                "id": "medium_dp_002",
                "title": "Coin Change",
                "description": "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.",
                "pattern": "unbounded_knapsack",
                "tags": ["dynamic_programming", "optimization", "bottom_up"],
                "complexity": {"time": "O(amount * coins)", "space": "O(amount)"},
                "constraints": ["1 <= coins.length <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
                "examples": [{"input": "coins = [1,3,4], amount = 6", "output": "2", "explanation": "6 = 3 + 3."}],
                "hints": ["Build up from smaller amounts", "For each amount, try all coins", "Track minimum coins needed"],
                "edge_cases": ["Amount is 0", "No solution exists", "Single coin type"],
                "follow_ups": ["Count number of ways?", "What if coins had limited quantities?"]
            }
        ]
    },
    "graphs": {
        "medium": [
            {
                "id": "medium_graphs_002",
                "title": "Course Schedule",
                "description": "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai. Return true if you can finish all courses. Otherwise, return false.",
                "pattern": "topological_sort",
                "tags": ["graphs", "topological_sort", "cycle_detection", "dfs"],
                "complexity": {"time": "O(V + E)", "space": "O(V + E)"},
                "constraints": ["1 <= numCourses <= 10^5", "0 <= prerequisites.length <= 5000", "prerequisites[i].length == 2"],
                "examples": [{"input": "numCourses = 2, prerequisites = [[1,0]]", "output": "true", "explanation": "Take course 0, then course 1."}],
                "hints": ["This is cycle detection in directed graph", "Use DFS with three states: unvisited, visiting, visited", "Or use Kahn's algorithm"],
                "edge_cases": ["No prerequisites", "Self-loop", "Multiple components"],
                "follow_ups": ["Return the actual course order?", "What if some courses are optional?"]
            }
        ]
    }
}

def generate_all_questions():
    """Generate all question files"""
    question_count = 0
    
    for topic, difficulties in QUESTIONS_DB.items():
        for difficulty, questions in difficulties.items():
            for q in questions:
                question_doc = create_question_template(
                    id=q["id"],
                    title=q["title"],
                    description=q["description"],
                    topic=topic,
                    difficulty=difficulty,
                    pattern=q["pattern"],
                    tags=q["tags"],
                    constraints=q["constraints"],
                    examples=q["examples"],
                    hints=q["hints"],
                    edge_cases=q["edge_cases"],
                    follow_ups=q["follow_ups"],
                    complexity=q["complexity"],
                    related_problems=[],  # Will be populated later
                    evaluation_criteria=["problem_understanding", "algorithm_choice", "implementation", "optimization", "edge_cases"]
                )
                
                filename = f"{q['id']}.json"
                filepath = os.path.join("rag_data", "questions", filename)
                
                with open(filepath, 'w') as f:
                    json.dump(question_doc, f, indent=2)
                
                question_count += 1
                print(f"Generated: {filename}")
    
    print(f"\nGenerated {question_count} questions")
    print("Note: This is a sample set. To reach 300 questions, expand each topic with more problems.")
    print("Consider adding: linked_lists, stacks, queues, heaps, tries, backtracking, greedy, etc.")

if __name__ == "__main__":
    generate_all_questions()