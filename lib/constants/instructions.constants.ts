export const PR_COMMENTS_RESPONSE_INSTRUCTIONS = [
  // Initial Setup and Display
  `1. Display all unhandled PR comments in a clear, organized list`,
  `2. Always ask the user if they want to handle all comments or specific ones`,

  // Comment Analysis and Context
  `3. For each comment, analyze its type and context before proceeding`,
  `4. Identify if comment is: a) Actionable fix b) Question c) Feedback d) Multiple related comments`,
  `5. For unclear or complex comments, request additional context from user`,
  `6. For multiple comments on same line, analyze them together for combined context`,
  `7. For each comment, outline a short plan (included examples: Required file changes, New files to create, Tests to add/modify, Dependencies to update, Impact analysis)`,
  `8. If a comment references code or context from another repository, STOP and ask the user for: a) The repository name b) The relevant file paths c) The specific code context needed d) any other information needed to understand the comment`,
  `9. If a comment requires understanding of external systems or dependencies, STOP and ask the user for: a) System documentation b) API specifications c) Integration requirements`,

  // Code Move and Refactoring Instructions
  `10. When moving code between files: a). First identify all usages of the code being moved b). Update all import statements in files using the moved code c). Remove the original code only after all imports are updated d). Never leave unused imports in the original file`,
  `11. For code moves: a). Use semantic search to find all usages b). Verify each usage is properly updated c). Test the changes to ensure functionality is preserved`,
  `12. After moving code: a). Run the code to verify it works b). Check for any compilation errors c). Verify all imports are correct d). Remove any unused imports`,

  // Comment Handling
  `13. For actionable fixes: implement changes without separate confirmations`,
  `14. For questions: request user input before proceeding`,
  `15. For feedback: acknowledge and determine if action needed`,
  `16. For unclear comments: STOP immediately and request clarification before proceeding`,
  `17. Design each solution end-to-end, considering: a) Code best practices b) Existing logic reuse c) Unused variable removal d) Import fixes e) Cross-file impact f) Error verification`,
  `18. Ensure solution maintains existing functionality while implementing fixes`,
  `19. Verify all changes for potential side effects, edge cases, and errors`,
  `20. If any part of the solution requires understanding of external systems or repositories, STOP and gather all necessary information before proceeding`,

  // Git Operations
  `21. After handling comments, you must ask the user if they want you to commit and push the changes`,
  `22. If committing: suggest commit message and execute git commands`,
  `23. Git commands sequence: "git add ." -> "git commit -m <message>" -> "git push"`,
  `24. Handle any git push errors by analyzing and reporting to user`,

  // Final Steps
  `25. **STOP and ask for clarification if any part of the process requires understanding of external systems, repositories, or unclear context**`,
];

export const PR_REPLIES_RESPONSE_INSTRUCTIONS = [
  `1. If havn't asked the user to commit prevusly, Ask the user if he want's to commit and push the changes.`,
  `2. If the user wants to commit and push the changes, Suggest him a suitable commit message.`,
  `3. If the user doesn't want your suggestion, ask him to provide a commit message.`,
  `4. Use the user's GIT CLI to execute from the user commandline the add, commit and push changes as followed: A. ""git add ."" B. ""git commit -m "<commit message>"" C. ""git push""`,
  `5. If for some reason the push command fails, Analyze the error output and ask him to handle it.`,
];
