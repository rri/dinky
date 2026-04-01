# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dinky is a React 18 + TypeScript SPA for personal productivity (tasks, notes, topics, work items). It uses a local-first architecture with optional AWS S3 cloud sync. Deployed as a PWA to https://dinky.dev.

## Commands

- **Dev server**: `npm start` (HTTPS enabled via `.env`)
- **Production build**: `npm run build`
- **Run tests**: `node scripts/test.js --watchAll=false` (Jest with jsdom, no `npm test` script defined)
- **Run a single test**: `node scripts/test.js --watchAll=false --testPathPattern="<pattern>"`

There are no dedicated lint or format scripts; ESLint runs via webpack during development.

## Architecture

### Data Model (Interface Composition)

Content types are built by composing small interfaces defined in `src/models/Item.tsx`:
- `Identifiable`, `Creatable`, `Updatable`, `Deletable`, `Syncable`, `DataObj`, `Schedulable`, `Completable`, `Named`
- **Task** = DataObj + Creatable + Deletable + Updatable + Syncable + Schedulable + Completable
- **Topic** = DataObj + Creatable + Deletable + Updatable + Syncable + Named
- **Note** = DataObj + Creatable + Deletable + Updatable + Syncable + Completable
- **Work** = DataObj + Creatable + Deletable + Updatable + Syncable + Schedulable + Completable

Each model file (e.g., `src/models/Task.tsx`) exports a `fetch*()` function that filters, searches (regex), sorts, and returns items.

### State Management

- `AppState` (in `src/models/AppState.tsx`) holds `settings` and `contents` (tasks, topics, notes, works as `Record<string, T>`)
- `Store` class (`src/models/Store.tsx`) wraps React `useState` with immutable update helpers (`merge*` functions)
- Data persisted to IndexedDB (with fallback/migration from localStorage) and optionally synced to S3 via `Cloud` class (`src/models/Cloud.tsx`)
- Soft deletes with configurable retention periods

### Source Layout

- `src/models/` — Data types, state management, cloud sync, search (Term)
- `src/pages/` — Route-level components (Today, Tasks, Notes, Topics, Works, Search, Profile, Help, plus detail pages)
- `src/views/` — Reusable UI components; `App.tsx` is the central hub (~400 LOC) managing state, routing, keyboard shortcuts, and sync
- `src/styles/` — CSS Modules (one per component) + Tailwind utilities
- `config/` — Webpack 5, Babel, Jest, dev server configuration
- `scripts/` — Entry points for start, build, test

### Styling

CSS Modules for scoped styles, Tailwind for utilities, CSS custom properties for theming (Light/Dark/Auto via `data-theme` attribute on root). Theme variables defined in `src/index.css`.

### Key Conventions

- UUIDs (v4) for all entity IDs; ISO strings for timestamps (parsed with moment.js)
- Markdown content rendered via `remark` + GFM plugin
- Global keyboard shortcuts via `react-hotkeys`
- CI/CD: GitHub Actions builds on push to main and deploys to S3 + CloudFront
