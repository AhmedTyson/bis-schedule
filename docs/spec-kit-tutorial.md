# Spec-Kit Tutorial: Spec-Driven Development (SDD)

Welcome to Spec-Kit! This tool helps you build better software by focusing on specifications before writing code.

## 🚀 The SDD Workflow

Spec-Driven Development follows a 4-step cycle:

1.  **Specify**: Define _what_ you want to build in a clear, high-level vision.
2.  **Plan**: Draft a _technical_ approach, choosing the right architecture and tools.
3.  **Task**: Break the plan into small, _actionable_ steps.
4.  **Implement**: Write the code following the tasks and verification plan.

## 📁 Your New Specs

We've set up the following for you:

- [Constitution](file:///c:/Programming/synapse/learn-practice-js/scedule-level-3-s2/.spec-kit/constitution.md): Project principles and tech stack.
- [Example Feature](file:///c:/Programming/synapse/learn-practice-js/scedule-level-3-s2/.spec-kit/features/example-feature.md): A sample spec for "Real-time Schedule Updates".

## 🛠️ Commands (via specify)

Since `specify` is installed via `uv`, you can use these commands directly:

```bash
# Get help and see available commands
specify --help

# Establishment of project principles
specify constitution

# Define features
specify specify

# Plan technical implementation
specify plan

# Create actionable task lists
specify tasks
```

## 💡 How to use with Antigravity

Whenever you want to add a new feature:

1.  Ask me to "Create a new spec for [Feature Name]".
2.  I'll add it to `.spec-kit/features/`.
3.  We'll refine the spec together using `specify`.
4.  Once ready, I'll implement it following the tasks in the spec.
