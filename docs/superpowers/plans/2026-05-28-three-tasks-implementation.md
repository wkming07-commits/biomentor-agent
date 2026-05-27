# BioMentor Three Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the three agreed tasks: make the four BioToolBox tools genuinely usable for demo/learning, add a progressive mind map inside Knowledge Map, and redesign the homepage/navigation with a light liquid-glass style.

**Architecture:** Keep the 6 existing top-level modules. Implement reusable pure helper functions in `frontend/lib/biotools.mjs` and `frontend/lib/mindmap-data.ts`, then consume them from focused Next.js client pages. Use CSS/Tailwind for liquid glass visuals and restrained motion; avoid exposing developer/API/fallback details in public UI.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, existing Node test runner for helper logic, public browser libraries already used by pages (3Dmol.js, Cytoscape.js).

---

## File Structure

- Modify `frontend/lib/biotools.mjs`: add protein candidate search, sequence typing/transcription/ORF helpers, pathway detail helpers, and user-facing labels.
- Modify `frontend/lib/biotools.mjs.d.ts`: type the new helper exports.
- Modify `frontend/lib/biotools.test.mjs`: add regression tests for protein search, sequence helpers, ORF detection, GenBank/FASTA behavior, and pathway graph metadata.
- Create `frontend/lib/mindmap-data.ts`: static learning map data and helper functions for node lookup/path traversal.
- Modify `frontend/app/tools/protein/page.tsx`: candidate search UI, no developer status, user-facing source/status copy.
- Modify `frontend/app/tools/plasmid/page.tsx`: selected feature explanation, FASTA-friendly upload state, no developer status.
- Modify `frontend/app/tools/sequence/page.tsx`: sequence type, transcription, reverse complement, ORF, restriction highlighting, user-facing teaching panels.
- Modify `frontend/app/tools/pathway/page.tsx`: node/edge click details, upstream/downstream highlighting, learning path, mindmap link.
- Modify `frontend/app/knowledge-map/page.tsx`: add view switch/entry for mind map or route users to the new mind map page.
- Create `frontend/app/knowledge-map/mindmap/page.tsx`: progressive radial/orbit BioMind Map with detail panel and tool links.
- Modify `frontend/components/Navbar.tsx`: 6 center nav links, remove “开始测评”, keep left logo.
- Modify `frontend/app/page.tsx`: liquid-glass homepage hero, 6-card second screen, knowledge-point expansion screen, value screen, simplified footer.
- Modify `frontend/app/globals.css`: liquid glass tokens, hero/motion styles, accessible reduced-motion rules.
- Update docs/progress files with implementation notes.

---

### Task 1: Red tests for helper behavior

- [ ] Add tests that require `searchProteinCandidates`, `detectSequenceType`, `transcribeDnaToRna`, `findOpenReadingFrames`, `describeFeature`, and `getPathwayLearningPath`.
- [ ] Run `node --test frontend/lib/biotools.test.mjs`; expected result before implementation: fail because exports are missing.

### Task 2: Implement helper behavior

- [ ] Implement the helper exports in `frontend/lib/biotools.mjs`.
- [ ] Update TypeScript declarations.
- [ ] Re-run `node --test frontend/lib/biotools.test.mjs`; expected result: pass.

### Task 3: Four tool page integration

- [ ] Protein page: replace single hardcoded resolve flow with candidate search cards and user-facing labels.
- [ ] Plasmid page: add feature selection, explanation card, FASTA/unannotated messaging, remove internal integration copy.
- [ ] Sequence page: add type detection, transcription, reverse complement, ORF list, restriction sequence highlight, remove internal API/fallback copy.
- [ ] Pathway page: add selected node/edge explanation, highlight upstream/downstream, learning path, mindmap link, remove internal API/fallback copy.

### Task 4: Mind map module

- [ ] Add `mindmap-data.ts` with a BioManufacturing learning tree and tool-linked nodes.
- [ ] Add `/knowledge-map/mindmap` page with progressive expansion, focused path, right detail panel, and tool links.
- [ ] Add entry/link from `/knowledge-map` to the mind map view.

### Task 5: Homepage and nav visual redesign

- [ ] Update Navbar to left logo + centered six nav items + empty right space; remove assessment CTA.
- [ ] Rebuild homepage structure: brand Hero, six-card function entry, knowledge-point expansion example, “not just a knowledge base” value cards, simple footer.
- [ ] Add liquid-glass motion styles and `prefers-reduced-motion` safeguards.

### Task 6: Verification and deployment

- [ ] Run `node --test frontend/lib/biotools.test.mjs`.
- [ ] Run `npm run build` in `frontend`.
- [ ] Start local frontend and inspect key pages in browser: `/`, `/tools/*`, `/knowledge-map/mindmap`.
- [ ] Commit all changes on master, push to GitHub, and deploy with `npx vercel --prod --yes`.
