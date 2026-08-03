# Source control & portfolio mirror

## Employer context

| | |
|---|---|
| **Built for** | **Revantage** (Blackstone portfolio company) |
| **Project** | Insurance Intelligence Assistant — structured-data copilot with embedding intent routing |
| **Internship** | AI Engineering (Blackstone Launchpad), 2026 |

---

## Where the real project lives

| | Azure DevOps (canonical) | GitHub (portfolio) |
|---|---|---|
| **Repo** | Private ADO project (RNA-APP org) | [github.com/tominister/ias-insurance-intelligence](https://github.com/tominister/ias-insurance-intelligence) |
| **Purpose** | Production development, PRs, CI/CD, hosted deploy | Sanitized public showcase for recruiters |
| **Commit history** | Full team history | Periodic snapshots only — **not** the live dev timeline |
| **Deployment** | Platform / engineering team deploys to Azure | Not deployed from GitHub |
| **Proprietary content** | RMIS mappings, semantic layer, internal URLs | Removed; synthetic demo dataset only |

**For recruiters and reviewers:** GitHub will **not** show Azure DevOps commits, pull requests, pipeline runs, or production releases. Ask the candidate to walk through the architecture and impact in conversation — this mirror shows **code patterns**, not employer VCS activity.

---

## GitHub mirror policy

1. Develop in **Azure DevOps** first.
2. Publish to GitHub **on approval** — sanitized snapshots only.
3. Never push live RMIS credentials, proprietary mappings, or internal infra to GitHub.

---

## Related Revantage project

**Loan Agreement Insurance Extraction** — RAG over loan agreement PDFs (pgvector, async jobs, correction workflow).  
GitHub: [ias-loan-agreement-extraction](https://github.com/tominister/ias-loan-agreement-extraction)

---

## Disclaimer

MIT portfolio license. Production IP remains with the employer.
