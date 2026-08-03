# Source control & portfolio mirror

## Employer context

| | |
|---|---|
| **Built for** | **Revantage** (Blackstone portfolio company) |
| **Project** | Insurance Intelligence Assistant — structured-data copilot for insurance business questions (intent routing + on-demand fetch, not RAG) |
| **Internship** | AI Engineering (Blackstone Launchpad), 2026 |

---

## Where the real project lives

| | Azure DevOps (canonical) | GitHub (portfolio) |
|---|---|---|
| **Repo** | `RevantageCS/RNA-APP/ias-insurance-intelligence` (private) | [github.com/tominister/ias-insurance-intelligence](https://github.com/tominister/ias-insurance-intelligence) |
| **Purpose** | Production development, PRs, CI/CD, hosted deploy | Sanitized public showcase for recruiters |
| **Commit history** | Full team history | Periodic snapshots only — **not** the live dev timeline |
| **Deployment** | Platform team deploys to Azure | Not deployed from GitHub |
| **Proprietary content** | RMIS mappings, live API credentials, internal hostnames | Removed or replaced with synthetic demo data |

**For recruiters and reviewers:** Evaluating this work from GitHub alone will **not** show Azure DevOps commits, pull requests, pipeline runs, or production release history. Those live in the employer's private Azure DevOps org. The GitHub repo is an **approved, sanitized mirror** of architecture and code patterns — ask the candidate to walk through the system in an interview.

---

## GitHub mirror policy

1. **Develop in ADO first** — all internship and team changes land in Azure DevOps first.
2. **Publish to GitHub on approval** — portfolio pushes are manual, sanitized, and may lag ADO by weeks.
3. **Never push** proprietary mappings, credentials, or internal URLs to GitHub.

---

## Related Revantage project

**Loan Agreement Insurance Extraction** — RAG over loan agreement PDFs (pgvector, async jobs, feedback learning). Same ADO → GitHub mirror pattern.  
GitHub: [ias-loan-agreement-extraction](https://github.com/tominister/ias-loan-agreement-extraction)

---

## Disclaimer

GitHub content is MIT-licensed portfolio material. Production intellectual property (data mappings, prompts, business logic) remains with the employer. Do not copy employer-specific artifacts into public repos.
