# AdzOnRoad

## Project Overview

AdzOnRoad is a GPS-powered Digital Out-of-Home (DOOH) advertising platform based in Lebanon.

The platform allows advertisers to launch advertising campaigns on digital LED screens mounted on taxis. Every screen reports GPS location, playback status, and device health in real time.

The project consists of:

- Public Website
- Advertiser Portal
- Admin Portal
- Driver Mobile App
- Fleet Management Portal
- GPS Tracking Service
- Campaign Scheduling Engine
- Analytics & Reporting
- Billing & Payments
- Screen & Device Management

---

# Technology Stack

## Frontend

- React
- TypeScript
- Material UI (MUI)
- React Router
- TanStack Query
- Axios
- SignalR
- Mapbox GL JS

## Backend

- ASP.NET Core Web API
- Entity Framework Core
- SQL Server
- SignalR
- JWT Authentication

## Mobile

- Android (Kotlin)

## Hardware

- LED Taxi Roof Displays
- GPS Tracking Devices
- 4G LTE Connectivity

---

# Project Goals

The platform must be:

- Fast
- Reliable
- Scalable
- Secure
- Modular
- Easy to maintain

The codebase should support thousands of screens and advertisers without requiring major architectural changes.

---

# Development Principles

Always:

- Write production-quality code.
- Reuse existing components whenever possible.
- Keep components small and focused.
- Follow SOLID principles.
- Avoid duplicate code.
- Prefer composition over inheritance.
- Separate UI, business logic, and API calls.
- Write clean, readable TypeScript.
- Keep business logic outside React components.

Never:

- Hardcode API URLs.
- Hardcode secrets or credentials.
- Duplicate components.
- Ignore TypeScript errors.
- Use `any` unless absolutely necessary.

---

# Folder Structure

Frontend follows a feature-based structure (this is the actual current layout of `AdzOnRoadFinal/src`, not just an aspiration):

src/
- components/ — shared components (`PageHeader`, `SearchBox`, `FilterBar`, `ConfirmationDialog`, `EmptyState`/`LoadingState`/`ErrorState`, `StatusTag`, `StatCard`, `DevSwitcher`, `Logo`, `ActionDialog`, `ImageUploadField`, etc.), plus two portal-scoped subtrees: `components/advertiser/` — a deliberately separate, scoped design system for the Advertiser portal (its own `theme.ts`, `StatusChip`, `EmptyState`/`LoadingState`/`ErrorState` — never import across that boundary, see the design-system skill) — and `components/taxiCompany/` (`AddCarDialog`, `AddDriverDialog`, `FleetMap`), which is just organizational (it uses the shared global theme, not its own token file — see the taxi-company-portal skill).
- pages/ — one file per route (`Homepage`, `AdvertiserDashboard`, `AdminDashboard`, `DriverDashboard`, `LoginPage`, `SignupPage`), plus two per-portal subfolders for their sidebar sub-pages: `pages/advertiser/` (`CampaignsPage`, `LiveMapPage`, `AnalyticsPage`, `CreativesPage`, `ReportsPage`, `BillingPage`, `SupportPage`, `SettingsPage`) and `pages/taxiCompany/` (`OverviewPage`, `CarsPage`, `DriversPage`, `EarningsPage`, `ScreensPage`, `ReportsPage`, `SupportPage`, `SettingsPage`) — scoped subfolders instead of the flat top level since there are 8 of each, all specific to one portal.
- layouts/ — page-shell wrappers: `DashboardShell` (Admin, and wrapped by the Taxi Company layout), `MobileShell` (Driver), `AuthLayout` (Login/Signup, now a 4-role union including `taxiCompany`). Two portals keep their shell under `components/<portal>/` instead: `AdvertiserLayout` (colocated with its scoped design system) and `TaxiCompanyLayout` (colocated with `FleetContext`, which it mounts). **Routing differs between those two portals on purpose** — Taxi Company is a react-router *layout route* (`<Outlet />`, shell stays mounted so fleet edits survive navigation), Advertiser re-wraps per page. See the taxi-company-portal skill.
- routes/ — `AppRoutes.tsx`, the `<Routes>` declarations; `App.tsx` itself is just the composition root (BrowserRouter + ToastProvider + AppRoutes + DevSwitcher)
- hooks/ — cross-cutting hooks not tied to a single context, e.g. `useSearchFilter`
- services/ — business-logic calculations kept out of components, e.g. `pricingService` (campaign price estimation), `earningsService` (driver earnings formula)
- types/ — one file per domain (`advertiser.ts`, `admin.ts`, `driver.ts`, `taxiCompany.ts`)
- data/ — mock fixture data matching the `types/` shapes (`advertiserMockData.ts`, `adminMockData.ts`, `driverMockData.ts`, `taxiCompanyMockData.ts`), plus small shared fixtures like `lebanonRegions.ts` (used by both campaign region-targeting and taxi company signup) — this stands in for a real API until a backend exists; see below
- utils/ — small stateless helpers, e.g. `format.ts` (currency/number formatting)
- assets/ — images, fonts, static JSON (e.g. the Lebanon boundary GeoJSON)
- contexts/ — React context + provider pairs, e.g. `ToastProvider` (co-locates the `useToast` hook with its provider — the standard pattern, not split into `hooks/` since it's a single hook tied 1:1 to its context)

**`api/` does not exist yet** — there is no backend, so there is nothing to call. `data/` (static mock fixtures) fills that role for now. When a real backend exists, `api/` is where the HTTP/SignalR client layer belongs; don't create it preemptively with fake fetch wrappers.

---

# UI Guidelines

Design should resemble premium SaaS products such as:

- Uber
- Stripe
- Linear
- Tesla

Theme:

Primary Color:
Orange (#FF6A00)

Secondary:
Dark Gray

Background:
White

Cards:
White

Use:

- Rounded corners
- Consistent spacing
- Modern typography
- Responsive layouts

Avoid:

- Excessive gradients
- Heavy shadows
- Cartoon-like UI

---

# Responsive Design

Every page must support:

Desktop

Tablet

Mobile

Tables should become horizontally scrollable on smaller devices.

Cards should stack vertically.

---

# Component Standards

Create reusable components.

Examples:

- PageHeader
- MetricCard
- StatusChip
- FilterBar
- DataTable
- SearchBox
- LoadingState
- ErrorState
- EmptyState
- ConfirmationDialog

Never duplicate UI.

---

# API Standards

REST APIs for CRUD operations.

SignalR for:

- Live GPS
- Screen status
- Notifications
- Live dashboard metrics

All endpoints should be versioned.

Example:

/api/v1/

Use DTOs between frontend and backend.

---

# Authentication

JWT Authentication.

Role-based authorization.

Roles:

- Super Admin
- Admin
- Advertiser
- Fleet Manager
- Driver

Never expose sensitive data to unauthorized users.

---

# GPS Tracking

Every screen should report:

- Latitude
- Longitude
- Speed
- Heading
- Timestamp
- Device ID
- Network Status
- Playback Status

Store all timestamps in UTC.

---

# Offline Synchronization

If a screen loses internet:

- Continue displaying downloaded advertisements.
- Store GPS data locally.
- Store playback events locally.
- Synchronize automatically when connectivity returns.

Never lose verified delivery records because of temporary network interruptions.

---

# Campaign Engine

Campaigns should support:

- Draft
- Pending Approval
- Scheduled
- Active
- Paused
- Completed
- Cancelled

Campaigns should be dynamically assigned to eligible screens based on:

- Region
- Availability
- Schedule
- Screen Health
- GPS Status

---

# Code Quality

Every feature should include:

- Loading state
- Empty state
- Error state

Prefer reusable hooks.

Keep functions small.

Use meaningful variable names.

Comment only where necessary.

---

# Accessibility

Support:

- Keyboard navigation
- ARIA labels
- Proper contrast
- Screen readers

Do not rely only on color for status.

---

# Performance

Lazy-load large pages.

Memoize expensive components.

Virtualize large tables.

Avoid unnecessary re-renders.

---

# Testing

Before completing any feature:

- Ensure TypeScript passes.
- Ensure ESLint passes.
- Test responsive layouts.
- Verify loading/error states.
- Verify accessibility basics.

---

# AdzOnRoad Business Rules

- GPS verification is required before counting advertisement delivery.
- Offline periods should be reconciled after synchronization.
- Advertisers must only see their own campaigns and reports.
- Fleet managers must only see vehicles belonging to their fleet.
- Campaign reporting should distinguish between live verified data and pending synchronization.
- The platform should never depend exclusively on a hardware vendor's CMS. Integrations should be abstracted so different screen manufacturers can be supported.

---

# Final Rule

When generating code:

1. Follow the existing architecture.
2. Keep the design consistent.
3. Reuse components whenever possible.
4. Produce production-ready code.
5. If unsure, ask before making breaking architectural changes.