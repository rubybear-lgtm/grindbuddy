You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

---

## Design Context

### Users
Engineers at any level (student through senior) practicing LeetCode for technical interviews. Mental state: focused, time-constrained, impatient with fluff. They want to study smarter, not harder. They respond to tools that feel sharp and purposeful.

### Brand Personality
**Sharp · Focused · Relentless.** Terse, direct, earned. No hype, no hand-holding. Copy should feel like it was written by someone who's been through the process. Emotional goal: the user feels *in control* and *clear-headed* — Grind Buddy removes decision fatigue and tells you what to practice today.

### Aesthetic Direction
Dark-first, but light mode is a **full first-class experience** — not a palette swap. Both themes must be verified when adding new UI.

Keep the existing visual style:
- Near-black backgrounds, high contrast, Allium green-teal primary (`oklch(0.85 0.18 165)`)
- Brand cyan (`oklch(0.75 0.15 190)`) as secondary accent
- Brand purple (`oklch(0.65 0.2 300)`) defined but exploratory — no established role yet
- Outfit (bold, uppercase, tight) for headings; Inter for body; JetBrains Mono for data/code
- Bento grids, glassmorphism panels, subtle shimmer and pulse animations
- Geometry over illustrations. Motion serves state, not decoration.

Anti-references: generic SaaS gradients, enterprise gray dashboards, gamified/Duolingo aesthetic.

### Design Principles
1. **Copy names the thing.** Say what the feature does — not what it metaphorically resembles. "Due for review" not "Priority Recall Stream."
2. **Visual boldness, verbal restraint.** Heavy type and motion welcome. Copy: fewer words, more impact.
3. **Respect the user's intelligence.** Write for engineers who know LeetCode. No patronizing explanations.
4. **Both themes are first-class.** Dark mode is canonical, but light mode is not an afterthought. Check new UI in both. The same character must read through in both.
5. **Function first, then delight.** If an animation doesn't communicate state or guide attention, remove it.
