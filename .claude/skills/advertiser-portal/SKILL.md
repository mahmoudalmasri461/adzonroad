---
name: advertiser-portal
description: Use this skill whenever building or modifying the AdzOnRoad advertiser portal, dashboard, campaigns, analytics, reports, billing, maps, or related UI components.
---

# AdzOnRoad Advertiser Portal Skill

## Project Overview

AdzOnRoad is a GPS-powered Digital Out-of-Home (DOOH) advertising platform.

Advertisers can:

- Create advertising campaigns
- Upload images and videos
- Select campaign regions
- Choose campaign dates
- Select campaign duration
- Track campaigns in real time
- View GPS verified delivery
- View analytics
- Download reports
- Manage billing

---

# Technology Stack

Frontend

- React
- TypeScript
- Material UI (MUI)
- React Router
- TanStack Query
- Axios
- SignalR
- Mapbox GL JS

Backend

- .NET Web API
- SQL Server

---

# UI Style

Always build a premium SaaS dashboard.

Design inspiration:

- Uber
- Stripe
- Tesla
- Notion
- Linear

Theme

- Primary: Orange (#FF6A00)
- Background: White
- Text: #1F2937
- Cards: White
- Borders: #E5E7EB

Avoid:

- Heavy gradients
- Excessive glassmorphism
- Cartoon UI
- Large shadows

Use:

- Rounded corners
- Clean spacing
- Professional typography
- Consistent margins

---

# Layout Rules

Every page should include

Top Navigation

Left Sidebar

Main Content

Responsive Design

Desktop

Tablet

Mobile

---

# Components

Always reuse components.

Create reusable:

- PageHeader
- MetricCard
- DataTable
- StatusChip
- LoadingState
- ErrorState
- EmptyState
- ConfirmationDialog
- FilterBar
- SearchBox

Never duplicate UI.

---

# Dashboard

Dashboard should contain

- KPI Cards
- Live Map
- Active Campaigns
- Recent Campaigns
- Campaign Progress
- Notifications
- Reports
- Billing Summary

---

# Campaign Pages

Campaigns must support

Draft

Pending Approval

Scheduled

Active

Paused

Completed

Cancelled

Rejected

Each campaign contains

- Name
- Creative
- Regions
- Budget
- Start Date
- End Date
- Active Screens
- Verified Plays
- Impressions
- Delivery %
- Status

---

# Live Map

Display

- Orange taxi markers
- Campaign regions
- Screen locations
- GPS updates
- Marker clustering
- Playback verification

Support

Zoom

Filters

Region selection

Campaign selection

---

# API Pattern

Use REST APIs.

Use SignalR for

- GPS
- Notifications
- Live statistics
- Screen status

Never hardcode endpoints.

Create reusable API services.

---

# Code Rules

Always

Use TypeScript

Use interfaces

Use React functional components

Use hooks

Use React Query

Use Material UI components

Create loading states

Create empty states

Create error states

Keep components small

Split large pages

Avoid duplicate code

---

# Folder Structure

pages/

components/

services/

hooks/

types/

utils/

assets/

layouts/

---

# Accessibility

Support keyboard navigation.

Use ARIA labels.

Maintain color contrast.

Do not rely only on color for status.

---

# Performance

Lazy load pages.

Memoize expensive components.

Virtualize large tables.

Avoid unnecessary re-renders.

---

# Responsive

Desktop first.

Tablet optimized.

Mobile friendly.

Tables should become scrollable.

Cards should stack vertically.

---

# Final Rule

Whenever generating code:

1. Follow the existing architecture.
2. Reuse existing components.
3. Write production-ready code.
4. Do not generate placeholder UI unless requested.
5. Make the UI look like a premium enterprise SaaS application.