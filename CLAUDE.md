# CLAUDE.md - Karpathy Guidelines for Capstone AI Triage

> Derived from Andrej Karpathy's observations on LLM coding pitfalls.
> Source: https://github.com/forrestchang/andrej-karpathy-skills

## The Four Principles

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State assumptions explicitly — If uncertain, ask rather than guess
- Present multiple interpretations — Don't pick silently when ambiguity exists
- Push back when warranted — If a simpler approach exists, say so
- Stop when confused — Name what's unclear and ask for clarification

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked
- No abstractions for single-use code
- No "flexibility" or "configurability" that wasn't requested
- No error handling for impossible scenarios
- If 200 lines could be 50, rewrite it

**Test:** Would a senior engineer say this is overcomplicated? If yes, simplify.

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting
- Don't refactor things that aren't broken
- Match existing style, even if you'd do it differently
- If you notice unrelated dead code, mention it — don't delete it

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused
- Don't remove pre-existing dead code unless asked

**Test:** Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**

Transform imperative tasks into verifiable goals:

| Instead of... | Transform to... |
|--------------|-----------------|
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug" | "Write a test that reproduces it, then make it pass" |
| "Refactor X" | "Ensure tests pass before and after" |

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

---

## Project-Specific Guidelines

### Stack Decisions (Made Once)
- **Language**: Python 3.11+ (engine), TypeScript/Next.js 14 (frontend)
- **LLM**: Local Ollama (Llama 3.1 8B) — zero PHI egress
- **Data**: Synthetic FHIR R4 bundles only — no real PHI ever
- **Frontend**: Next.js + Tailwind + shadcn/ui
- **Deploy**: Vercel (frontend), local Python API for demo

### Code Standards
- Python: ruff for lint/format, type hints on public functions
- TypeScript: strict mode, no `any`, explicit return types
- Tests: pytest (Python), vitest (frontend) — run before commit
- Commits: Conventional commits (`feat:`, `fix:`, `chore:`)

### Clinical Safety
- Every summary must pass clinical eval checklist (≥ 8/10)
- No hallucinated medications/conditions — deterministic parser only
- Red flags based on explicit clinical rules (HbA1c >9%, missed FU >90d, etc.)
- Missing data section mandatory — surfaces what doctor would ask

### Privacy by Design
- Zero network calls with PHI in summarization pipeline
- Synthetic data only in repo
- Local LLM only (Ollama)
- No logging of patient identifiers

---

## Anti-Patterns to Avoid

| Principle | Anti-Pattern | Fix |
|-----------|-------------|-----|
| Think Before Coding | Silently assumes FHIR fields, archetypes, scope | List assumptions in PR description |
| Simplicity First | Strategy pattern for single discount calculation | One function until complexity needed |
| Surgical Changes | Reformats quotes, adds type hints while fixing bug | Only change lines that fix the issue |
| Goal-Driven | "I'll review and improve the code" | "Write test for bug X → make it pass → verify no regressions" |

---

## Daily Standup Questions (Self-Check)

1. **Think Before Coding**: Did I write assumptions before each task? Did I ask clarifying questions when ambiguous?
2. **Simplicity First**: Is today's code the minimum to meet the verifiable goal? Any speculative features?
3. **Surgical Changes**: Did I only touch files related to today's goal? Match existing style?
4. **Goal-Driven**: Does each task have a `Verify:` step that I actually ran?