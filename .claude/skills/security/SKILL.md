---
name: security
description: Use this skill whenever working on authentication, authorization, roles, or anything that looks like a security boundary — to know what's real vs. mock in this codebase before assuming a protection exists. Also covers general secret-handling hygiene for this project.
---

# AdzOnRoad Security Skill

## There is no real authentication or authorization anywhere in this workspace

`LoginPage.tsx` ([src/pages/LoginPage.tsx](../../../src/pages/LoginPage.tsx)) says so explicitly in its own UI copy: *"This is a preview — any email and password will sign you in."* Submitting the form does nothing but `navigate()` to the role's dashboard route — no request is sent, no session/token is created, no credential is checked. There is no JWT, no session storage, no cookie, no backend to authenticate against.

There are also **no route guards**. `/advertiser`, `/admin`, and `/driver` are open routes reachable directly by URL, with no check that a "session" (which doesn't exist) grants access to that role. The floating `DevSwitcher` in `App.tsx` deliberately makes every role one click away, by design, for this preview stage — don't remove it under the assumption it's a security hole to "fix"; ask the user first, since it may still be wanted for demos.

`CLAUDE.md` names the target model: JWT auth, role-based authorization, five roles (Super Admin, Admin, Advertiser, Fleet Manager, Driver). Only three of those five roles have any UI today (`advertiser`/`admin`/`driver`, per `AuthRole` in `src/components/AuthLayout.tsx`) — Super Admin and Fleet Manager are not represented anywhere yet.

## If asked to "add real login" or "secure the dashboards"

That's a from-scratch backend auth task (no existing scaffold to extend) plus frontend route-guarding (e.g. a `RequireAuth` wrapper around the protected routes in `App.tsx`, redirecting to `/login` if no valid session). Don't build a frontend-only fake gate (e.g. a password check against a hardcoded string, or `localStorage`-based "logged in" flag with no real backend behind it) and present it as secure — that would be worse than the current honest "this is a preview" state, since it implies protection that isn't real.

## General hygiene for this repo regardless of auth status

- No secrets, API keys, or credentials exist in this frontend codebase today — keep it that way. Anything added later (map SDK keys, backend API base URLs) should come from environment variables (Vite's `import.meta.env.VITE_*`), never hardcoded, and never committed if it's a genuine secret (the Vercel deploy is a public static site — anything in the built JS bundle is visible to anyone).
- The Android app's `data/ApiClient.kt`/`ApiService.kt` (see [driver-app skill](../driver-app/SKILL.md)) currently points at a mock/test endpoint — check its base URL before assuming it's safe to point at a real backend without review.
- Git commit-email hygiene matters for this specific repo's Vercel deployment: a commit authored under an email not verified on the connected GitHub account gets the deployment blocked (already hit and fixed once — see the repo's git log around the Vercel domain-connection work). Not a security issue per se, but worth knowing before troubleshooting a "why is my deploy blocked" report.
