<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- MCP server lives in src/lib/mcp (one tool per file, OAuth via Lovable Cloud auth); sign-in exists only at /login for assistant connections — the app itself stays open.
- All styling must use the design tokens in src/styles.css (Harmattan/Danfo/Lagoon palette, Familjen Grotesk + Literata); never hardcode colors in components. Light theme only — no dark mode toggle, no .dark values.
- Routing: "/" is the marketing landing page; the app dashboard is "/dashboard". The Evidence rail (right, 320px; bottom sheet on mobile) is part of Shell and is filled via useCorpusState().openEvidence(posts, focusId?) from any selection (topic bar, mood note, network node, table row, answer citation).
