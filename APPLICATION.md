# Codex for Open Source — Application Guide

Use this guide to apply for **6 months of ChatGPT Pro + Codex**, **Codex Security access**, and **API credits**.

**Apply here:** https://openai.com/form/codex-for-oss/

---

## Before you apply (checklist)

- [ ] GitHub profile set to **public** ([settings](https://github.com/settings/profile))
- [ ] Repository **public** at `https://github.com/zayidelkhair/maintainflow`
- [ ] Repo pushed with README, LICENSE, CI, SECURITY.md, CONTRIBUTING.md
- [ ] Published to npm: `npm publish --access public` (after creating npm account)
- [ ] OpenAI Organization ID ready: https://platform.openai.com/settings/organization/general
- [ ] ChatGPT account email matches form email: `seeknoobwisdom@gmail.com`

### Growing traction (do before or right after applying)

OpenAI reviews for "meaningful usage, broad adoption, or ecosystem importance." A new project can still qualify — explain the **problem** and **maintainer workflow** clearly. To strengthen your application:

1. **Publish to npm** — `npx maintainflow` counts as monthly downloads
2. **Post on** r/opensource, r/node, Dev.to, Hacker News Show HN
3. **Add to awesome lists** — awesome-maintainer-tools, awesome-cli
4. **Use in your other repos** — add `npx maintainflow audit` to CI in 2–3 public repos
5. **Write a short blog post** — "Automating OSS maintainer workflows with maintainflow"

---

## Form answers (copy-paste ready)

### Personal info

| Field | Value |
|-------|-------|
| First name | Zayid |
| Last name | Elkahir |
| Email | seeknoobwisdom@gmail.com |
| GitHub username | zayidelkhair |
| GitHub repository URL | https://github.com/zayidelkhair/maintainflow |

### Describe your role

> Primary maintainer and creator. I designed, implemented, and maintain the full codebase — CLI commands, security scanner, CI workflows, documentation, and release process. I have sole write access and am responsible for triaging issues, reviewing PRs, and cutting releases.

### Why does this repository qualify? (max 500 chars)

> maintainflow is a CLI toolkit that reduces maintainer burden across the OSS ecosystem: repo health audits, secret/vulnerability scanning, GitHub issue-PR triage, release checklists, and AGENTS.md generation for AI-assisted workflows. It targets the exact pain points OpenAI's program addresses — PR review load, security, and release automation. Published on npm for `npx maintainflow` usage; integrated into CI pipelines. Fills a gap between generic linters and heavyweight security platforms for solo/small-team maintainers.

**Character count:** ~497

### I'm interested in...

Check all that apply:
- ✅ ChatGPT Pro with Codex
- ✅ Codex Security
- ✅ API credits

### Why does your project need Codex Security? (max 500 chars)

> maintainflow ships a security scanner that detects leaked API keys, private keys, JWTs, and vulnerability patterns (eval, SQL injection, XSS). Maintainers using our tool need trustworthy, deep security analysis — false negatives put entire ecosystems at risk. Codex Security would let me validate and expand detection rules against real CVE patterns, audit the scanner itself before releases, and offer maintainers a documented security review workflow. As a security-focused OSS tool, rigorous analysis is core to our mission.

**Character count:** ~498

### OpenAI Organization ID

Get yours at: https://platform.openai.com/settings/organization/general

Paste the ID (format: `org-xxxxxxxxxxxxxxxx`).

### How will you use API credits? (max 500 chars)

> API credits will power: (1) automated PR review summaries and triage labels via GitHub Actions, (2) release-note generation from merged PRs and changelog diffs, (3) expanding maintainflow's AGENTS.md and security rule generation using GPT for new language/ecosystem patterns, (4) maintainer office-hours — answering contributor questions and drafting CONTRIBUTING docs. All usage stays in public repo workflows and benefits downstream OSS maintainers using maintainflow in their own projects.

**Character count:** ~497

### Anything else we should know? (max 500 chars)

> I'm a data science student actively building OSS maintainer infrastructure. maintainflow is dogfooded — we run `maintainflow audit` in our own CI. I plan to integrate Codex SDK for optional AI-powered PR summaries (opt-in, documented). The project aligns with OpenAI's blog on using skills to accelerate OSS maintenance. I'm committed to 6 months of active maintenance, weekly releases, and community support regardless of program outcome.

**Character count:** ~497

---

## After submitting

- Watch `seeknoobwisdom@gmail.com` for acceptance email (rolling review)
- Keep committing — activity signals an active maintainer
- Respond to any GitHub issues within 48h
- If rejected, reapply after gaining npm downloads or community mentions

## Terms

By submitting you agree to: https://developers.openai.com/codex/codex-for-oss-terms