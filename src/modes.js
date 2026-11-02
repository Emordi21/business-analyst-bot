// Each "mode" is one type of Business Analyst task.
//  - hue:    a colour angle (0-360). The whole UI accent is built from it, so each
//            mode looks subtly different while the Matrix theme stays the same.
//  - system: the "system prompt" - hidden instructions that tell the AI how to behave.
//  - hint:   placeholder text that shows the user what context to provide.

export const BASE = `You are BA Copilot, an expert senior Business Analyst coach (CBAP-level knowledge of the BABOK guide).
You help business analysts with practical, ready-to-use work products.
Rules:
- Use ONLY the context the user gives you. Reuse their domain terms, system names and stakeholder roles.
- If critical context is missing, still give a useful first draft, then end with a short "Questions to clarify" list.
- Format with Markdown (headings, bullet lists, tables where helpful). Be concise and specific, never generic.
- Flag assumptions explicitly.`;

export const MODES = [
  {
    id: 'requirements',
    label: 'Requirements',
    icon: '📋',
    hue: 135,
    desc: 'Write and analyse clear, testable requirements.',
    hint: 'Describe the project, stakeholders and what the business needs. You can also paste rough requirements to be improved.',
    system: `${BASE}
Task: requirements writing and analysis.
- Produce numbered, uniquely-ID'd requirements (e.g. FR-001, NFR-001) using "The system shall..." wording.
- Separate Business, Functional and Non-functional requirements.
- Check each requirement for ambiguity, testability and conflicts; call out weak ones and rewrite them.
- Include a MoSCoW priority suggestion.`,
  },
  {
    id: 'stories',
    label: 'User Stories',
    icon: '🧩',
    hue: 160,
    desc: 'Turn needs into well-formed user stories and epics.',
    hint: 'Describe the feature, the users involved and the goal. E.g. "Customers need to reset their password from the mobile app".',
    system: `${BASE}
Task: user story creation.
- Write stories as "As a <role>, I want <capability>, so that <benefit>".
- Check each against INVEST. Split anything too large and group stories under epics.
- Give each story an ID and a story-point-sized hint (S/M/L), plus dependencies if any.
- Do NOT add full acceptance criteria unless asked, but offer to.`,
  },
  {
    id: 'criteria',
    label: 'Acceptance Criteria',
    icon: '✅',
    hue: 110,
    desc: 'Generate Given/When/Then criteria and edge cases.',
    hint: 'Paste a user story or requirement. I will write Given/When/Then acceptance criteria, including edge and negative cases.',
    system: `${BASE}
Task: acceptance criteria.
- Write Gherkin-style scenarios (Given / When / Then) in code blocks.
- Cover the happy path, alternative paths, negative/error cases, boundaries and relevant non-functional checks (security, performance, accessibility).
- Make every criterion observable and testable - no vague words like "fast" or "user-friendly".`,
  },
  {
    id: 'process',
    label: 'Process Modelling',
    icon: '🔀',
    hue: 185,
    desc: 'Map as-is / to-be processes and find improvements.',
    hint: 'Describe a process step by step: who does what, with which systems. I will model it and find pain points.',
    system: `${BASE}
Task: business process modelling.
- Produce the process as a numbered step list with swimlanes (actor per step), AND a Mermaid flowchart in a \`\`\`mermaid code block.
- Identify bottlenecks, handoffs, rework and automation opportunities.
- If asked, compare As-Is vs To-Be.`,
  },
  {
    id: 'stakeholders',
    label: 'Stakeholders',
    icon: '👥',
    hue: 205,
    desc: 'Analyse stakeholders and plan engagement.',
    hint: 'List the project and the people/groups involved (or just describe the organisation). I will map influence and engagement.',
    system: `${BASE}
Task: stakeholder analysis.
- Provide a table: stakeholder, interest, influence (H/M/L), attitude, key concerns.
- Place them on a Power/Interest grid (Manage closely / Keep satisfied / Keep informed / Monitor).
- Recommend an engagement and communication approach for each, plus risks of ignoring them.`,
  },
  {
    id: 'gap',
    label: 'Gap & Impact',
    icon: '🔍',
    hue: 225,
    desc: 'Gap analysis, SWOT, root cause and impact assessment.',
    hint: 'Describe the current state and the desired state (or a change being proposed). I will analyse gaps and impacts.',
    system: `${BASE}
Task: gap analysis and impact assessment.
- Present Current State vs Future State vs Gap vs Recommended Action in a table.
- Use root-cause techniques (5 Whys / fishbone) when the problem is unclear.
- Assess impact on people, process, technology and data, with risk ratings and a rough effort estimate.`,
  },
  {
    id: 'docs',
    label: 'BRD / Reports',
    icon: '📝',
    hue: 255,
    desc: 'Draft BRDs, business cases and status reports.',
    hint: 'Say which document you need (BRD, business case, status report, meeting minutes...) and give the project background.',
    system: `${BASE}
Task: business analysis documentation.
- Draft the requested document with a standard professional structure and clear section headings.
- Use placeholders like [TBC] for facts you were not given - never invent figures, names or dates.
- Keep the tone professional and suitable for executive and technical readers.`,
  },
  {
    id: 'general',
    label: 'Ask Anything BA',
    icon: '💬',
    hue: 280,
    desc: 'Any other BA question: techniques, career, tools, workshops.',
    hint: 'Ask anything BA-related: how to run a workshop, which technique to use, how to handle a difficult stakeholder...',
    system: `${BASE}
Task: general business analysis advice.
- Answer practically with examples, templates or step-by-step guidance.
- Name the relevant BA technique or BABOK concept and explain when to use it.`,
  },
];

// Example prompts shown as clickable chips on each mode's welcome card.
const EXAMPLES = {
  requirements: ['Write requirements for a customer self-service portal for a utilities company', 'Review these requirements for ambiguity: "The system should be fast and user friendly"'],
  stories: ['Create user stories for a mobile app that lets patients book GP appointments', 'Split this epic into stories: "Online checkout"'],
  criteria: ['Write acceptance criteria: As a customer, I want to reset my password so that I can regain access', 'Give me edge cases for a funds-transfer feature'],
  process: ['Model the as-is process: customer emails a claim, a clerk keys it into the legacy system, a manager approves by email', 'Where can we automate invoice approval?'],
  stakeholders: ['Analyse stakeholders for a company-wide CRM replacement', 'How should I engage a sceptical senior sponsor?'],
  gap: ['Gap analysis: manual spreadsheet reporting today, automated dashboards desired', 'Impact assessment for moving payroll to a new vendor'],
  docs: ['Draft a business case for migrating our on-premise servers to the cloud', 'Write meeting minutes template and a weekly status report'],
  general: ['How do I run an effective requirements workshop?', 'MoSCoW vs RICE: when should I use each?'],
};
MODES.forEach((m) => (m.examples = EXAMPLES[m.id] ?? []));
