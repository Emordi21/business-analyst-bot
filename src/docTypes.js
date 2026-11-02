// The documents the AI can generate for a project. "prompt" tells the AI what to include.
export const DOC_TYPES = [
  { id: 'problem', icon: '🎯', label: 'Problem Statement', prompt: 'A crisp problem statement: the problem, who is affected, the impact/cost of inaction, root causes (known or suspected), and a one-paragraph summary statement. Include success indicators.' },
  { id: 'objectives', icon: '🏁', label: 'Project Objectives', prompt: 'SMART project objectives (Specific, Measurable, Achievable, Relevant, Time-bound) with a measurable KPI/target for each, linked to business goals. Add success criteria and out-of-scope notes.' },
  { id: 'scope', icon: '🧭', label: 'Scope Document', prompt: 'A scope document: purpose, in-scope, out-of-scope, deliverables, assumptions, constraints, dependencies, high-level milestones, acceptance criteria for the project, and a scope-change process.' },
  { id: 'business-case', icon: '💼', label: 'Business Case', prompt: 'A business case: executive summary, problem/opportunity, options considered (including do nothing) with pros/cons, recommended option, cost-benefit analysis with [TBC] figures where unknown, risks, implementation approach and a recommendation.' },
  { id: 'prd', icon: '📄', label: 'PRD', prompt: 'A Product Requirements Document: overview, goals and non-goals, target users/personas, user problems, key features with priorities (MoSCoW), functional requirements with IDs, non-functional requirements, user flows, success metrics, release plan, open questions.' },
  { id: 'brd', icon: '📘', label: 'BRD', prompt: 'A Business Requirements Document: executive summary, business objectives, stakeholders, current vs future state, business requirements with IDs, assumptions, constraints, risks, success measures and sign-off section.' },
  { id: 'stakeholders', icon: '👥', label: 'Stakeholder Register', prompt: 'A stakeholder register table (name/role, interest, influence, attitude, needs, engagement strategy) and a Power/Interest grid summary, plus a communication plan.' },
  { id: 'risks', icon: '⚠️', label: 'Risk Register', prompt: 'A risk register table: ID, risk, cause, impact, likelihood (H/M/L), severity, mitigation, contingency, owner. Add a short summary of the top 3 risks.' },
  { id: 'stories', icon: '🧩', label: 'User Story Backlog', prompt: 'A prioritised backlog: epics with INVEST-style user stories ("As a... I want... so that..."), each with 2-3 Given/When/Then acceptance criteria and a MoSCoW priority.' },
];

export const NOTE_TYPE = { id: 'note', icon: '🗒️', label: 'Chat note' };
export const docTypeOf = (id) => DOC_TYPES.find((d) => d.id === id) ?? NOTE_TYPE;
