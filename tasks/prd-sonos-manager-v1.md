# Product Requirements Document (PRD): Sonos Manager v1

## Document Info

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Draft |
| Author | AI Assistant |
| Created | 2026-01-25 |
| Research Reference | [rsd-sonos-manager-v1.md](./rsd-sonos-manager-v1.md) |

---

## 1. Overview

**Sonos Manager** is a web-based application for power users to oversee and manage large Sonos installations (15-30+ devices) using the hidden/undocumented local API functionality exposed on port 1400. The application provides centralized visibility, real-time status monitoring, playback control, and access to diagnostic tools not available in the official Sonos app.

### Problem Statement

The official Sonos app has several pain points for users managing large installations:
- **Volume control latency** - Noticeable delay when adjusting volume
- **Limited diagnostics** - No access to network matrix, device logs, or system health
- **Cluttered UI** - Designed for casual users, not power users managing 30+ devices
- **No bulk operations** - Cannot pause all, adjust multiple zones efficiently
- **Hidden functionality** - Sonos devices expose rich diagnostic endpoints that are inaccessible

### Solution

A Linear-style dark-mode dashboard that:
- Discovers all devices from a single known IP address
- Provides real-time status updates with minimal latency
- Exposes hidden diagnostic tools in a clean interface
- Enables fast control via keyboard shortcuts and command palette
- Offers bulk operations for managing many devices at once

---

## 2. Goals

| ID | Goal | Success Indicator |
|----|------|-------------------|
| G-1 | Enable device discovery from single IP | User enters one IP, all household devices appear |
| G-2 | Provide real-time device status | Status updates within 2 seconds of device state change |
| G-3 | Reduce volume control latency | Volume changes reflect in <500ms (vs 1-2s in official app) |
| G-4 | Surface hidden diagnostics | Network matrix, logs, and tools accessible in UI |
| G-5 | Support keyboard-first workflow | All primary actions accessible via keyboard shortcuts |
| G-6 | Manage 30+ devices efficiently | UI remains responsive with 30 devices; bulk actions available |

---

## 3. Non-Goals (Out of Scope for v1)

| ID | Non-Goal | Rationale |
|----|----------|-----------|
| NG-1 | Initial Sonos setup/pairing | Users should use official app for first-time device setup |
| NG-2 | Music service authentication | Complex OAuth flows; rely on existing device config |
| NG-3 | TTS/announcement features | Nice-to-have but not core to management |
| NG-4 | Mobile-responsive design | Focus on desktop/tablet for power user workflow |
| NG-5 | Multi-household support | Target single household per deployment |
| NG-6 | Remote access over internet | Local network only for v1; security implications |
| NG-7 | Alarm management | Lower priority; available in official app |
| NG-8 | Custom backend (for now) | Start with node-sonos-http-api; migrate later |

---

## 4. User Stories

### US-1: First-Time Setup
> **As a** new user
> **I want to** enter a single Sonos device IP and have all my devices discovered
> **So that** I don't have to manually configure each of my 25 speakers

**Acceptance Criteria:**
- First launch shows setup wizard
- User enters one known device IP
- System discovers and displays all devices in household
- Configuration persists across sessions
- User can re-run setup from settings

### US-2: Dashboard Overview
> **As a** power user
> **I want to** see all my devices at a glance with their current status
> **So that** I know what's playing where without opening each room

**Acceptance Criteria:**
- Dashboard shows all devices in a scannable list/grid
- Each device shows: room name, model, status (playing/paused/idle), current track, volume level
- Playing devices are visually distinct
- Status updates in real-time

### US-3: Quick Volume Control
> **As a** user adjusting audio
> **I want to** change volume with immediate feedback
> **So that** I'm not waiting for the UI to catch up

**Acceptance Criteria:**
- Volume slider responds instantly to input
- Device reflects volume change within 500ms
- Group volume affects all grouped devices
- Keyboard shortcuts for volume up/down

### US-4: Command Palette
> **As a** keyboard-first user
> **I want to** access any action via Cmd+K
> **So that** I can control my system without reaching for the mouse

**Acceptance Criteria:**
- Cmd/Ctrl+K opens command palette
- Search filters available actions
- Actions include: pause all, play room, adjust volume, open diagnostics
- Arrow keys navigate, Enter executes

### US-5: Device Grouping
> **As a** user hosting a party
> **I want to** quickly group multiple rooms together
> **So that** the same music plays throughout the house

**Acceptance Criteria:**
- Drag-and-drop grouping OR selection-based grouping
- Visual indication of grouped devices
- Ungroup individual devices or all
- Group volume control available

### US-6: Diagnostics Access
> **As a** technical user troubleshooting network issues
> **I want to** view the network matrix and device logs
> **So that** I can identify interference or connectivity problems

**Acceptance Criteria:**
- Network matrix visualization shows signal strength between devices
- Device logs (dmesg, netstat output) viewable per device
- System info (firmware, IP, MAC, serial) displayed
- Diagnostic data refreshable on demand

### US-7: Bulk Operations
> **As a** user leaving home
> **I want to** pause all devices with one action
> **So that** I don't have to stop each room individually

**Acceptance Criteria:**
- "Pause All" available in command palette and UI
- "Resume All" restores previous state
- Bulk volume adjustment (set all to X%)
- Confirmation for destructive bulk actions (like reboot all)

### US-8: PIN Protection
> **As a** user with household members
> **I want to** protect the dashboard with a PIN
> **So that** others can't accidentally disrupt my setup

**Acceptance Criteria:**
- Optional PIN setup during first-run wizard
- PIN required on app launch (if configured)
- Settings to change/disable PIN
- PIN stored securely (hashed in local storage or config)

---

## 5. Functional Requirements

### 5.1 Setup & Configuration

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-1 | The system SHALL display a first-run wizard when no configuration exists | Must Have | US-1 |
| FR-2 | The wizard SHALL accept a single Sonos device IP address as input | Must Have | US-1 |
| FR-3 | The system SHALL validate the IP by attempting to fetch `/status/info` | Must Have | US-1 |
| FR-4 | Upon valid IP, the system SHALL discover all devices via `/support/review` or topology endpoints | Must Have | US-1 |
| FR-5 | The system SHALL persist discovered device configuration to local storage or config file | Must Have | US-1 |
| FR-6 | The settings page SHALL allow re-running device discovery | Should Have | US-1 |
| FR-7 | The wizard SHALL offer optional PIN protection setup | Must Have | US-8 |
| FR-8 | If PIN is configured, the system SHALL require PIN entry on application launch | Must Have | US-8 |
| FR-9 | The system SHALL store PIN as a hashed value, never plaintext | Must Have | US-8, SEC-1 |

### 5.2 Dashboard & Device List

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-10 | The dashboard SHALL display all discovered devices in a list or grid view | Must Have | US-2 |
| FR-11 | Each device card SHALL show: room name, model name, IP address, current status | Must Have | US-2 |
| FR-12 | Playing devices SHALL display: track title, artist, album art (if available) | Must Have | US-2 |
| FR-13 | Each device card SHALL show current volume level as a visual indicator | Must Have | US-2 |
| FR-14 | The system SHALL poll device status at a configurable interval (default: 2 seconds) | Must Have | US-2 |
| FR-15 | Playing devices SHALL be visually distinguished (e.g., accent border, glow effect) | Should Have | US-2 |
| FR-16 | The dashboard SHALL support sorting by: room name, status, model | Should Have | US-2 |
| FR-17 | The dashboard SHALL support filtering by: status (playing/paused/idle), model type | Nice to Have | US-2 |

### 5.3 Playback Control

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-20 | Each device card SHALL have play/pause toggle control | Must Have | US-3 |
| FR-21 | Each device card SHALL have next/previous track controls | Must Have | US-3 |
| FR-22 | Each device card SHALL have a volume slider | Must Have | US-3 |
| FR-23 | Volume changes SHALL be sent to the device within 100ms of user input | Must Have | US-3, G-3 |
| FR-24 | The UI SHALL optimistically update volume display before server confirmation | Should Have | US-3 |
| FR-25 | Grouped devices SHALL display a group volume control | Must Have | US-5 |
| FR-26 | Individual device volume within a group SHALL remain adjustable | Should Have | US-5 |

### 5.4 Device Grouping

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-30 | The system SHALL display current device groupings visually | Must Have | US-5 |
| FR-31 | Users SHALL be able to add a device to an existing group | Must Have | US-5 |
| FR-32 | Users SHALL be able to remove a device from a group | Must Have | US-5 |
| FR-33 | Users SHALL be able to create a new group from selected devices | Must Have | US-5 |
| FR-34 | Grouping actions SHALL take effect within 2 seconds | Should Have | US-5 |
| FR-35 | The coordinator device of each group SHALL be visually indicated | Nice to Have | US-5 |

### 5.5 Command Palette

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-40 | The system SHALL open a command palette when user presses Cmd/Ctrl+K | Must Have | US-4 |
| FR-41 | The command palette SHALL have a search input that filters available commands | Must Have | US-4 |
| FR-42 | The command palette SHALL support navigation via arrow keys and selection via Enter | Must Have | US-4 |
| FR-43 | The command palette SHALL close on Escape or clicking outside | Must Have | US-4 |
| FR-44 | Commands SHALL include: Pause All, Resume All, Go to [Room], Open Settings, Open Diagnostics | Must Have | US-4, US-7 |
| FR-45 | Commands SHALL include volume presets: Set All to 25%, 50%, 75% | Should Have | US-4, US-7 |
| FR-46 | The command palette SHALL display keyboard shortcut hints for common actions | Should Have | US-4 |

### 5.6 Bulk Operations

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-50 | The system SHALL provide a "Pause All" action accessible from command palette and UI | Must Have | US-7 |
| FR-51 | The system SHALL provide a "Resume All" action that resumes previously playing devices | Must Have | US-7 |
| FR-52 | The system SHALL provide "Set All Volume" action with preset levels | Should Have | US-7 |
| FR-53 | Destructive bulk actions (e.g., Reboot All) SHALL require confirmation | Must Have | US-7 |
| FR-54 | Bulk actions SHALL provide feedback on success/failure per device | Should Have | US-7 |

### 5.7 Diagnostics

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-60 | Each device SHALL have an expandable diagnostics panel or detail view | Must Have | US-6 |
| FR-61 | Diagnostics SHALL display: firmware version, IP address, MAC address, serial number | Must Have | US-6 |
| FR-62 | Diagnostics SHALL display device uptime and last reboot time (if available) | Should Have | US-6 |
| FR-63 | The system SHALL provide a Network Matrix view showing signal strength between devices | Must Have | US-6, G-4 |
| FR-64 | The Network Matrix SHALL visualize strength as a color-coded grid | Should Have | US-6 |
| FR-65 | Device detail view SHALL allow viewing raw dmesg/netstat output | Should Have | US-6 |
| FR-66 | Diagnostic data SHALL be refreshable on demand via a refresh button | Must Have | US-6 |
| FR-67 | Device detail view SHALL provide a "Reboot Device" action with confirmation | Nice to Have | US-6 |

### 5.8 Keyboard Shortcuts

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| FR-70 | The system SHALL support the following global keyboard shortcuts | Must Have | US-4, G-5 |
| FR-71 | Cmd/Ctrl+K: Open command palette | Must Have | US-4 |
| FR-72 | Escape: Close modals/panels, deselect | Must Have | US-4 |
| FR-73 | Space: Toggle play/pause on selected device | Should Have | US-4 |
| FR-74 | Arrow Up/Down: Adjust volume on selected device | Should Have | US-4 |
| FR-75 | /: Focus search/filter | Should Have | US-4 |

---

## 6. Design Considerations

### 6.1 Visual Design

Per corporate standards (DESIGN-1 through DESIGN-10), the UI SHALL:

- Use **dark mode as primary** with deep, rich backgrounds (not pure black)
- Apply **subtle gradients** for depth
- Use **muted color palette** with vibrant accents only for status indicators
- Implement **generous whitespace** - avoid cramped layouts
- Use **system font stack** (Inter, SF Pro, system-ui)
- Provide **instant feedback** (<100ms perceived response)
- Include **keyboard shortcut hints** on hover

### 6.2 Layout

- **Sidebar navigation** (collapsible) for: Dashboard, Diagnostics, Settings
- **Main content area** with device grid/list
- **Right panel** for device detail/diagnostics (contextual)
- **Command palette** as modal overlay with backdrop blur

### 6.3 Component Patterns

| Component | Pattern |
|-----------|---------|
| Device Card | bg-surface, subtle hover lift, status indicator as colored dot |
| Volume Slider | Borderless, custom track with accent color |
| Buttons | Ghost style for secondary, accent for primary |
| Command Palette | Centered modal, blur backdrop, search input auto-focused |

### 6.4 Reference

- See [Linear.app](https://linear.app) for primary UI inspiration
- See corporate standard: `domains/design-ui.md` for full design tokens

---

## 7. Technical Considerations

### 7.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Next.js)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Dashboard  │  │ Diagnostics │  │  Settings/Wizard    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          │                                   │
│                    React Query / SSE                         │
└──────────────────────────┼───────────────────────────────────┘
                           │
                    HTTP (localhost)
                           │
┌──────────────────────────┼───────────────────────────────────┐
│              node-sonos-http-api (Backend)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Discovery  │  │  Control    │  │  Events/SSE         │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼─────────────────────┼─────────────┘
          │                │                     │
          └────────────────┼─────────────────────┘
                           │
              HTTP/SOAP (Port 1400) + UPnP Events
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                    Sonos Devices                             │
│   [Living Room]  [Kitchen]  [Bedroom]  [Office]  [...]       │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14+ (App Router) | Corporate standard |
| UI Components | shadcn/ui + Radix | Corporate standard, accessible |
| Styling | Tailwind CSS | Corporate standard |
| State/Fetching | React Query + SSE | Real-time updates with caching |
| Backend | node-sonos-http-api | Mature, handles discovery, extensible |
| Validation | Zod | Corporate standard |

### 7.3 Backend Notes

**node-sonos-http-api** provides:
- Automatic device discovery via SSDP
- REST endpoints: `/zones`, `/{room}/{action}`
- Event stream for state changes
- Extensible preset system

**Future migration path:** When custom backend is needed, replace node-sonos-http-api with custom Next.js API routes that make direct SOAP/HTTP calls to devices. Frontend API layer abstracts this, minimizing migration impact.

### 7.4 Data Flow

1. **Discovery:** Backend performs SSDP scan or fetches topology from seed IP
2. **Status Polling:** Frontend subscribes to SSE stream from backend
3. **Control Actions:** Frontend POSTs to backend REST endpoints
4. **Diagnostics:** Frontend fetches directly from backend proxy (which calls device HTTP endpoints)

### 7.5 Security Considerations

| Concern | Mitigation |
|---------|------------|
| PIN storage | Hash PIN before storing (bcrypt or similar) |
| Network exposure | Bind to localhost only for v1; no remote access |
| CORS | Backend proxies all Sonos calls; no direct browser-to-device |
| Secrets | No API keys needed for local Sonos control |

---

## 8. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Device discovery success | 100% of household devices found | Manual test with 25+ devices |
| Volume control latency | <500ms end-to-end | Stopwatch test, user perception |
| Status update latency | <2 seconds | Measure SSE delivery time |
| Command palette response | <100ms to open | Performance profiling |
| Dashboard load time | <2 seconds initial load | Lighthouse, manual |
| Device capacity | Handles 30+ devices smoothly | Test with simulated/real devices |

---

## 9. Assumptions

| ID | Assumption | Impact if Wrong |
|----|------------|-----------------|
| A-1 | User has at least one Sonos device IP known | Discovery won't work; need fallback |
| A-2 | All devices are on same subnet as the server | Multi-subnet would need routing/proxy |
| A-3 | node-sonos-http-api is stable and maintained | May need earlier custom migration |
| A-4 | Sonos local API remains available in firmware updates | Feature breakage; monitor community |
| A-5 | User runs on modern browser (Chrome, Firefox, Safari, Edge) | No IE11 support planned |
| A-6 | Local network is trusted (no auth between backend and devices) | Security review needed if exposed |

---

## 10. Open Questions

| ID | Question | Impact | Owner |
|----|----------|--------|-------|
| OQ-1 | How do we handle devices that go offline during session? | UX for error states | Product |
| OQ-2 | Should PIN be session-based or persistent? | Security vs convenience tradeoff | Product |
| OQ-3 | What's the fallback if node-sonos-http-api can't discover devices? | Manual IP entry? | Engineering |
| OQ-4 | Should we support S1 (legacy) devices? | May have different API surface | Engineering |
| OQ-5 | How to handle firmware updates that break endpoints? | Graceful degradation strategy | Engineering |
| OQ-6 | Do we need to handle Sonos households with >50 devices? | Performance testing scope | Engineering |

---

## 11. Dependencies

| Dependency | Type | Risk Level | Notes |
|------------|------|------------|-------|
| node-sonos-http-api | External package | Medium | Core backend; actively maintained |
| Sonos local API (undocumented) | External service | Medium | May change without notice |
| shadcn/ui | External package | Low | Stable, corporate standard |
| Network connectivity | Infrastructure | Low | Local network assumed reliable |

---

## 12. Standards Compliance

| Standard | Version | Status | Notes |
|----------|---------|--------|-------|
| PRINCIPLES | 1.0.0 | Compliant | User-first, maintainability prioritized |
| SECURITY | 1.0.0 | Compliant | PIN hashed (SEC-1), local-only (SEC-6 N/A for local) |
| TERMS | 1.0.0 | Compliant | Using "Sign in" not "Login", "Settings" not "Preferences" |
| CODE-INTERNAL | 1.0.0 | Will Apply | Next.js, TypeScript strict, shadcn/ui, Zod |
| PHASE-PRD | 1.0.0 | Compliant | All required sections present, requirements numbered |

**Standards Applied:**
- global/principles.md
- global/security-privacy.md
- global/terminology.md
- domains/code-internal-architecture.md
- phases/create-prd.md

---

## Appendix A: Keyboard Shortcut Reference

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + K | Open command palette |
| Escape | Close modal/panel, deselect |
| Space | Toggle play/pause (when device selected) |
| ↑ / ↓ | Volume up/down (when device selected) |
| / | Focus search/filter |
| Cmd/Ctrl + , | Open settings |
| Cmd/Ctrl + Shift + P | Pause all |
| Cmd/Ctrl + Shift + R | Resume all |

---

## Appendix B: API Endpoints (node-sonos-http-api)

Key endpoints the frontend will use:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/zones` | GET | List all zones/devices with status |
| `/{room}/play` | GET | Start playback |
| `/{room}/pause` | GET | Pause playback |
| `/{room}/volume/{level}` | GET | Set volume (0-100) |
| `/{room}/next` | GET | Next track |
| `/{room}/previous` | GET | Previous track |
| `/{room}/join/{other}` | GET | Join room to another |
| `/{room}/leave` | GET | Leave current group |
| `/pauseall` | GET | Pause all zones |
| `/resumeall` | GET | Resume all zones |

See [node-sonos-http-api documentation](https://jishi.github.io/node-sonos-http-api/) for full reference.
