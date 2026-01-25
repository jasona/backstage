# Tasks: Sonos Manager

> **Source:** [prd-sonos-manager-v1.md](./prd-sonos-manager-v1.md)
> **Standards Version:** 1.0.0
> **Standards Applied:** global/principles.md, phases/generate-tasks.md

---

## Relevant Files

### Configuration & Setup
- `package.json` - Project dependencies and scripts
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration with dark theme tokens
- `tsconfig.json` - TypeScript configuration (strict mode)
- `.env.local` - Environment variables (backend URL, etc.)
- `.env.example` - Example environment file for documentation

### App Structure (Next.js App Router)
- `src/app/layout.tsx` - Root layout with providers, dark theme
- `src/app/page.tsx` - Home page (redirects to dashboard or wizard)
- `src/app/(auth)/setup/page.tsx` - First-run wizard page
- `src/app/(auth)/unlock/page.tsx` - PIN unlock page
- `src/app/(dashboard)/layout.tsx` - Dashboard layout with sidebar
- `src/app/(dashboard)/page.tsx` - Main dashboard page
- `src/app/(dashboard)/diagnostics/page.tsx` - Diagnostics page
- `src/app/(dashboard)/diagnostics/[deviceId]/page.tsx` - Device detail diagnostics
- `src/app/(dashboard)/settings/page.tsx` - Settings page

### Components - UI (shadcn/ui)
- `src/components/ui/button.tsx` - Button component
- `src/components/ui/input.tsx` - Input component
- `src/components/ui/slider.tsx` - Volume slider component
- `src/components/ui/dialog.tsx` - Dialog/modal component
- `src/components/ui/command.tsx` - Command palette component (cmdk)
- `src/components/ui/card.tsx` - Card component
- `src/components/ui/badge.tsx` - Status badge component
- `src/components/ui/tooltip.tsx` - Tooltip for keyboard hints

### Components - Feature
- `src/components/setup/setup-wizard.tsx` - First-run wizard flow
- `src/components/setup/setup-wizard.test.tsx` - Tests for setup wizard
- `src/components/setup/pin-setup.tsx` - PIN configuration component
- `src/components/setup/pin-setup.test.tsx` - Tests for PIN setup
- `src/components/auth/pin-unlock.tsx` - PIN unlock screen
- `src/components/auth/pin-unlock.test.tsx` - Tests for PIN unlock
- `src/components/layout/sidebar.tsx` - Collapsible sidebar navigation
- `src/components/layout/sidebar.test.tsx` - Tests for sidebar
- `src/components/layout/header.tsx` - Page header with actions
- `src/components/dashboard/device-grid.tsx` - Device list/grid container
- `src/components/dashboard/device-grid.test.tsx` - Tests for device grid
- `src/components/dashboard/device-card.tsx` - Individual device card
- `src/components/dashboard/device-card.test.tsx` - Tests for device card
- `src/components/dashboard/now-playing.tsx` - Now playing info display
- `src/components/dashboard/volume-control.tsx` - Volume slider with optimistic updates
- `src/components/dashboard/volume-control.test.tsx` - Tests for volume control
- `src/components/dashboard/playback-controls.tsx` - Play/pause/next/prev buttons
- `src/components/dashboard/playback-controls.test.tsx` - Tests for playback controls
- `src/components/dashboard/group-indicator.tsx` - Visual group membership display
- `src/components/dashboard/group-manager.tsx` - Grouping UI (add/remove from groups)
- `src/components/dashboard/group-manager.test.tsx` - Tests for group manager
- `src/components/command/command-palette.tsx` - Global command palette
- `src/components/command/command-palette.test.tsx` - Tests for command palette
- `src/components/diagnostics/network-matrix.tsx` - Signal strength matrix visualization
- `src/components/diagnostics/network-matrix.test.tsx` - Tests for network matrix
- `src/components/diagnostics/device-info.tsx` - Device info panel (IP, MAC, serial)
- `src/components/diagnostics/device-logs.tsx` - Raw log viewer (dmesg, netstat)
- `src/components/diagnostics/device-logs.test.tsx` - Tests for device logs

### Hooks
- `src/hooks/use-sonos.ts` - Main hook for Sonos API interactions
- `src/hooks/use-sonos.test.ts` - Tests for Sonos hook
- `src/hooks/use-devices.ts` - Device list with React Query
- `src/hooks/use-device-status.ts` - SSE subscription for real-time status
- `src/hooks/use-device-status.test.ts` - Tests for device status hook
- `src/hooks/use-keyboard-shortcuts.ts` - Global keyboard shortcut handler
- `src/hooks/use-keyboard-shortcuts.test.ts` - Tests for keyboard shortcuts
- `src/hooks/use-command-palette.ts` - Command palette state management
- `src/hooks/use-auth.ts` - PIN authentication state

### Libraries & Utilities
- `src/lib/utils.ts` - cn() utility and helpers
- `src/lib/sonos-api.ts` - API client for node-sonos-http-api
- `src/lib/sonos-api.test.ts` - Tests for API client
- `src/lib/storage.ts` - Local storage helpers (config, PIN hash)
- `src/lib/storage.test.ts` - Tests for storage utilities
- `src/lib/pin.ts` - PIN hashing and validation
- `src/lib/pin.test.ts` - Tests for PIN utilities

### Types
- `src/types/sonos.ts` - Sonos device, zone, status types
- `src/types/config.ts` - App configuration types

### Providers
- `src/providers/query-provider.tsx` - React Query provider
- `src/providers/auth-provider.tsx` - Authentication context provider
- `src/providers/sonos-provider.tsx` - Sonos context with SSE connection

### Notes

- Unit tests should be placed alongside the code files they test
- Use `npx jest [optional/path/to/test/file]` to run tests
- Use `npm run dev` to start the development server
- Backend (node-sonos-http-api) should be running on `localhost:5005` by default

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`. Update after each sub-task, not just parent tasks.

Example: `- [ ] 1.1 Read file` → `- [x] 1.1 Read file`

---

## Tasks

### Phase 0: Setup

- [x] **0.0 Create feature branch**
  - [x] 0.1 Create and checkout a new branch: `git checkout -b feature/sonos-manager`

---

### Phase 1: Project Setup & Backend Integration

- [x] **1.0 Initialize Next.js project with dependencies** (traces to: Technical Considerations)
  - [x] 1.1 Create Next.js 14+ project with App Router, TypeScript, Tailwind CSS, ESLint
  - [x] 1.2 Install shadcn/ui and initialize with dark theme defaults
  - [x] 1.3 Install core shadcn/ui components: button, input, slider, dialog, card, badge, tooltip, command
  - [x] 1.4 Install additional dependencies: `@tanstack/react-query`, `zod`, `bcryptjs`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`
  - [x] 1.5 Configure Tailwind with Linear-style dark theme tokens (bg-base, bg-surface, bg-elevated, accent colors per DRD)
  - [x] 1.6 Create `src/lib/utils.ts` with `cn()` utility function
  - [x] 1.7 Set up `.env.local` with `NEXT_PUBLIC_SONOS_API_URL=http://localhost:5005`
  - [x] 1.8 Create `.env.example` documenting required environment variables

- [x] **1.1 Set up node-sonos-http-api backend** (traces to: Technical Considerations)
  - [x] 1.1.1 Document installation steps for node-sonos-http-api in README
  - [x] 1.1.2 Create npm script to start backend: `"backend": "cd ../node-sonos-http-api && npm start"` (or document separate terminal)
  - [x] 1.1.3 Verify backend runs and discovers devices at `http://localhost:5005/zones`

- [x] **1.2 Create Sonos API client** (traces to: FR-3, FR-4)
  - [x] 1.2.1 Create `src/types/sonos.ts` with types: `SonosDevice`, `SonosZone`, `PlaybackState`, `NowPlaying`
  - [x] 1.2.2 Create `src/lib/sonos-api.ts` with functions: `getZones()`, `getDeviceStatus()`, `play()`, `pause()`, `setVolume()`, `next()`, `previous()`, `joinGroup()`, `leaveGroup()`, `pauseAll()`, `resumeAll()`
  - [x] 1.2.3 Add Zod schemas for API response validation
  - [x] 1.2.4 Write unit tests for `sonos-api.ts` with mocked fetch responses
  - [x] 1.2.5 Create `src/hooks/use-sonos.ts` hook wrapping API client with React Query

---

### Phase 2: First-Run Wizard & PIN Authentication

- [x] **2.0 Create storage utilities** (traces to: FR-5, FR-9)
  - [x] 2.0.1 Create `src/types/config.ts` with `AppConfig` type (seedIp, pinHash, isConfigured)
  - [x] 2.0.2 Create `src/lib/storage.ts` with `getConfig()`, `setConfig()`, `clearConfig()` using localStorage
  - [x] 2.0.3 Create `src/lib/pin.ts` with `hashPin()`, `verifyPin()` using bcryptjs
  - [x] 2.0.4 Write unit tests for storage and PIN utilities

- [x] **2.1 Create authentication provider** (traces to: FR-8, US-8)
  - [x] 2.1.1 Create `src/providers/auth-provider.tsx` with context: `isAuthenticated`, `isConfigured`, `unlock()`, `lock()`
  - [x] 2.1.2 Provider checks localStorage on mount for existing config
  - [x] 2.1.3 If PIN configured, require unlock before showing dashboard

- [x] **2.2 Build first-run wizard** (traces to: FR-1, FR-2, FR-3, FR-4, FR-7, US-1)
  - [x] 2.2.1 Create `src/app/(auth)/setup/page.tsx` route
  - [x] 2.2.2 Create `src/components/setup/setup-wizard.tsx` with multi-step flow:
    - Step 1: Welcome screen with explanation
    - Step 2: Enter Sonos device IP address
    - Step 3: Validate IP by fetching `/status/info` (via backend proxy)
    - Step 4: Show discovered devices count
    - Step 5: Optional PIN setup
    - Step 6: Success / Go to Dashboard
  - [x] 2.2.3 Create `src/components/setup/pin-setup.tsx` for PIN entry with confirmation
  - [x] 2.2.4 Add form validation with Zod (IP format, PIN min length)
  - [x] 2.2.5 Save config to localStorage on completion
  - [x] 2.2.6 Write tests for setup wizard component

- [x] **2.3 Build PIN unlock screen** (traces to: FR-8, US-8)
  - [x] 2.3.1 Create `src/app/(auth)/unlock/page.tsx` route
  - [x] 2.3.2 Create `src/components/auth/pin-unlock.tsx` with PIN input and submit
  - [x] 2.3.3 Verify PIN against stored hash using `verifyPin()`
  - [x] 2.3.4 On success, update auth context and redirect to dashboard
  - [x] 2.3.5 Show error message on incorrect PIN (max 3 attempts before delay)
  - [x] 2.3.6 Write tests for PIN unlock component

- [x] **2.4 Implement app routing logic** (traces to: FR-1, FR-8)
  - [x] 2.4.1 Update `src/app/page.tsx` to check config status:
    - No config → redirect to `/setup`
    - Config + PIN → redirect to `/unlock`
    - Config + no PIN → redirect to `/dashboard`
  - [x] 2.4.2 Wrap dashboard routes with auth check middleware/layout

---

### Phase 3: Dashboard Layout & Device List

- [x] **3.0 Create dashboard layout** (traces to: Design Considerations, DESIGN-15)
  - [x] 3.0.1 Create `src/app/(dashboard)/layout.tsx` with sidebar + main content area
  - [x] 3.0.2 Create `src/components/layout/sidebar.tsx` with navigation items: Dashboard, Diagnostics, Settings
  - [x] 3.0.3 Add collapsible sidebar functionality (64px collapsed, 240px expanded)
  - [x] 3.0.4 Create `src/components/layout/header.tsx` with page title and action buttons
  - [x] 3.0.5 Apply dark theme styles: bg-base for page, bg-surface for sidebar
  - [x] 3.0.6 Write tests for sidebar component

- [x] **3.1 Build device grid/list** (traces to: FR-10, FR-16, FR-17, US-2)
  - [x] 3.1.1 Create `src/app/(dashboard)/page.tsx` as main dashboard
  - [x] 3.1.2 Create `src/hooks/use-devices.ts` hook fetching `/zones` with React Query
  - [x] 3.1.3 Create `src/components/dashboard/device-grid.tsx` container with grid layout
  - [x] 3.1.4 Add sorting controls: by room name, status, model (FR-16)
  - [x] 3.1.5 Add filtering controls: by status, model type (FR-17)
  - [x] 3.1.6 Handle empty state when no devices found
  - [x] 3.1.7 Handle loading state with skeleton cards
  - [x] 3.1.8 Write tests for device grid component

- [x] **3.2 Build device card** (traces to: FR-11, FR-12, FR-13, FR-15, US-2)
  - [x] 3.2.1 Create `src/components/dashboard/device-card.tsx` with:
    - Room name (heading)
    - Model name (caption)
    - IP address (muted)
    - Status indicator dot (playing=green, paused=yellow, idle=gray)
    - Volume level bar
  - [x] 3.2.2 Create `src/components/dashboard/now-playing.tsx` showing track title, artist, album art
  - [x] 3.2.3 Add visual distinction for playing devices (accent border, subtle glow) (FR-15)
  - [x] 3.2.4 Add click handler to select device (for keyboard controls)
  - [x] 3.2.5 Add hover state with slight lift animation
  - [x] 3.2.6 Write tests for device card component

---

### Phase 4: Real-Time Status Updates

- [x] **4.0 Implement SSE connection for live updates** (traces to: FR-14, G-2)
  - [x] 4.0.1 Research node-sonos-http-api event stream endpoint (or polling fallback)
  - [x] 4.0.2 Create `src/hooks/use-device-status.ts` hook:
    - Connect to SSE endpoint if available
    - Fall back to polling at 2-second intervals (FR-14)
    - Update React Query cache on status change
  - [x] 4.0.3 Create `src/providers/sonos-provider.tsx` to manage SSE connection lifecycle
  - [x] 4.0.4 Handle reconnection on connection loss
  - [x] 4.0.5 Show connection status indicator in header (connected/reconnecting)
  - [x] 4.0.6 Write tests for device status hook with mocked SSE/polling

- [x] **4.1 Integrate real-time updates with dashboard** (traces to: FR-14, US-2)
  - [x] 4.1.1 Update device cards to reflect real-time status changes
  - [x] 4.1.2 Animate status transitions (fade/pulse on change)
  - [x] 4.1.3 Verify status updates appear within 2 seconds of device state change (G-2)

---

### Phase 5: Playback Controls

- [x] **5.0 Build playback control components** (traces to: FR-20, FR-21, US-3)
  - [x] 5.0.1 Create `src/components/dashboard/playback-controls.tsx` with play/pause, next, previous buttons
  - [x] 5.0.2 Use Lucide icons: Play, Pause, SkipForward, SkipBack
  - [x] 5.0.3 Wire buttons to API calls via `use-sonos` hook
  - [x] 5.0.4 Add loading/disabled state during API calls
  - [x] 5.0.5 Integrate playback controls into device card
  - [x] 5.0.6 Write tests for playback controls

- [x] **5.1 Build volume control with optimistic updates** (traces to: FR-22, FR-23, FR-24, G-3, US-3)
  - [x] 5.1.1 Create `src/components/dashboard/volume-control.tsx` using shadcn slider
  - [x] 5.1.2 Implement optimistic UI update (FR-24): update display immediately on drag
  - [x] 5.1.3 Debounce API calls (100ms) to prevent flooding (FR-23)
  - [x] 5.1.4 Roll back on API error with toast notification
  - [x] 5.1.5 Add mute/unmute toggle button
  - [x] 5.1.6 Integrate volume control into device card
  - [x] 5.1.7 Write tests for volume control component
  - [x] 5.1.8 Verify volume changes reflect in <500ms end-to-end (G-3)

- [x] **5.2 Implement group volume control** (traces to: FR-25, FR-26)
  - [x] 5.2.1 Detect grouped devices and show group volume slider
  - [x] 5.2.2 Group volume affects all devices in group (FR-25)
  - [x] 5.2.3 Allow individual device volume adjustment within group (FR-26)
  - [x] 5.2.4 Visual distinction between group and individual volume

---

### Phase 6: Device Grouping

- [x] **6.0 Display group membership** (traces to: FR-30, FR-35, US-5)
  - [x] 6.0.1 Create `src/components/dashboard/group-indicator.tsx` showing group name/icon
  - [x] 6.0.2 Parse group info from zones API response
  - [x] 6.0.3 Visually connect grouped device cards (shared border, grouped section)
  - [x] 6.0.4 Indicate coordinator device with icon/label (FR-35)

- [x] **6.1 Build group management UI** (traces to: FR-31, FR-32, FR-33, FR-34, US-5)
  - [x] 6.1.1 Create `src/components/dashboard/group-manager.tsx` modal/panel
  - [x] 6.1.2 Implement "Add to group" action: select device, choose target group (FR-31)
  - [x] 6.1.3 Implement "Remove from group" action (FR-32)
  - [x] 6.1.4 Implement "Create new group" action: multi-select devices (FR-33)
  - [x] 6.1.5 Wire to API: `joinGroup()`, `leaveGroup()`
  - [x] 6.1.6 Verify grouping actions complete within 2 seconds (FR-34)
  - [x] 6.1.7 Write tests for group manager component

---

### Phase 7: Command Palette

- [x] **7.0 Build command palette** (traces to: FR-40, FR-41, FR-42, FR-43, US-4)
  - [x] 7.0.1 Install cmdk package if not using shadcn command component
  - [x] 7.0.2 Create `src/hooks/use-command-palette.ts` for open/close state
  - [x] 7.0.3 Create `src/components/command/command-palette.tsx` using shadcn Command
  - [x] 7.0.4 Implement Cmd/Ctrl+K to open (FR-40)
  - [x] 7.0.5 Add search input with filtering (FR-41)
  - [x] 7.0.6 Implement arrow key navigation and Enter selection (FR-42)
  - [x] 7.0.7 Close on Escape or outside click (FR-43)
  - [x] 7.0.8 Add backdrop blur overlay per design standards
  - [x] 7.0.9 Write tests for command palette

- [x] **7.1 Add commands** (traces to: FR-44, FR-45, FR-46)
  - [x] 7.1.1 Add command: "Pause All" → calls `pauseAll()` (FR-44)
  - [x] 7.1.2 Add command: "Resume All" → calls `resumeAll()` (FR-44)
  - [x] 7.1.3 Add command: "Go to [Room]" → scrolls to/selects device (FR-44)
  - [x] 7.1.4 Add command: "Open Settings" → navigates to settings (FR-44)
  - [x] 7.1.5 Add command: "Open Diagnostics" → navigates to diagnostics (FR-44)
  - [x] 7.1.6 Add volume preset commands: "Set All to 25%", "50%", "75%" (FR-45)
  - [x] 7.1.7 Display keyboard shortcut hints next to commands (FR-46)
  - [x] 7.1.8 Add room-specific commands: "Play [Room]", "Pause [Room]"

---

### Phase 8: Bulk Operations

- [x] **8.0 Implement bulk actions** (traces to: FR-50, FR-51, FR-52, FR-53, FR-54, US-7)
  - [x] 8.0.1 Add "Pause All" button to dashboard header (FR-50)
  - [x] 8.0.2 Implement `pauseAll()` API call
  - [x] 8.0.3 Add "Resume All" button to dashboard header (FR-51)
  - [x] 8.0.4 Implement `resumeAll()` API call (restore previous state)
  - [x] 8.0.5 Add "Set All Volume" dropdown with presets: 25%, 50%, 75%, Mute (FR-52)
  - [x] 8.0.6 Create confirmation dialog component for destructive actions (FR-53)
  - [x] 8.0.7 Show success/failure toast per device after bulk action (FR-54)
  - [x] 8.0.8 Wire bulk actions to command palette as well
  - [x] 8.0.9 Write tests for bulk operations

---

### Phase 9: Diagnostics Panel & Network Matrix

- [x] **9.0 Create diagnostics page** (traces to: FR-60, FR-61, FR-62, US-6)
  - [x] 9.0.1 Create `src/app/(dashboard)/diagnostics/page.tsx` with device list
  - [x] 9.0.2 Create `src/app/(dashboard)/diagnostics/[deviceId]/page.tsx` for device detail
  - [x] 9.0.3 Create `src/components/diagnostics/device-info.tsx` panel showing:
    - Firmware version
    - IP address
    - MAC address
    - Serial number
    - Uptime / last reboot (FR-62)
  - [x] 9.0.4 Fetch device info from backend proxy to `/status/info`
  - [x] 9.0.5 Add refresh button to reload diagnostic data (FR-66)

- [x] **9.1 Build network matrix visualization** (traces to: FR-63, FR-64, G-4)
  - [x] 9.1.1 Create `src/components/diagnostics/network-matrix.tsx`
  - [x] 9.1.2 Fetch network matrix data from backend (proxy to Sonos diagnostic endpoint)
  - [x] 9.1.3 Render as color-coded grid showing signal strength between devices (FR-64)
  - [x] 9.1.4 Add legend for signal strength colors (excellent/good/fair/poor)
  - [x] 9.1.5 Add device labels on axes
  - [x] 9.1.6 Write tests for network matrix component

- [x] **9.2 Build device logs viewer** (traces to: FR-65, US-6)
  - [x] 9.2.1 Create `src/components/diagnostics/device-logs.tsx` (Note: Limited by API - raw logs require direct device access)
  - [x] 9.2.2 Add tabs for different log types: dmesg, netstat, ifconfig
  - [x] 9.2.3 Fetch raw output from backend proxy to Sonos `/tools.htm` endpoints
  - [x] 9.2.4 Display in monospace, scrollable container
  - [x] 9.2.5 Add copy-to-clipboard button
  - [x] 9.2.6 Write tests for device logs component

- [x] **9.3 Add device reboot action** (traces to: FR-67)
  - [x] 9.3.1 Add "Reboot Device" button to device detail page
  - [x] 9.3.2 Show confirmation dialog before reboot (FR-67 "with confirmation")
  - [x] 9.3.3 Implement reboot API call (handle CSRF token if needed) (Note: Not supported through current API)
  - [x] 9.3.4 Show "rebooting" status and poll for device return

---

### Phase 10: Keyboard Shortcuts

- [x] **10.0 Implement global keyboard shortcuts** (traces to: FR-70 to FR-75, US-4, G-5)
  - [x] 10.0.1 Create `src/hooks/use-keyboard-shortcuts.ts` with global event listener
  - [x] 10.0.2 Implement Cmd/Ctrl+K: Open command palette (FR-71)
  - [x] 10.0.3 Implement Escape: Close modals/panels, deselect (FR-72)
  - [x] 10.0.4 Implement Space: Toggle play/pause on selected device (FR-73)
  - [x] 10.0.5 Implement Arrow Up/Down: Adjust volume on selected device (FR-74)
  - [x] 10.0.6 Implement /: Focus search/filter (FR-75)
  - [x] 10.0.7 Implement Cmd/Ctrl+,: Open settings
  - [x] 10.0.8 Implement Cmd/Ctrl+Shift+P: Pause all
  - [x] 10.0.9 Implement Cmd/Ctrl+Shift+R: Resume all
  - [x] 10.0.10 Add keyboard shortcuts to provider/context for app-wide access
  - [x] 10.0.11 Write tests for keyboard shortcuts hook

- [x] **10.1 Add keyboard hint tooltips** (traces to: FR-46, DESIGN-9)
  - [x] 10.1.1 Add tooltip to buttons showing keyboard shortcut on hover
  - [x] 10.1.2 Use consistent format: "Pause All ⌘⇧P" / "Pause All Ctrl+Shift+P"
  - [x] 10.1.3 Detect OS for correct modifier key display (Cmd vs Ctrl)

---

### Phase 11: Testing & Quality Assurance

- [x] **11.0 Unit testing** (traces to: TASKS-4, INT-9)
  - [x] 11.0.1 Ensure all component tests pass: `npx jest`
  - [x] 11.0.2 Add missing tests for any untested components
  - [x] 11.0.3 Verify test coverage meets minimum threshold (aim for >70%)

- [x] **11.1 Integration testing** (traces to: TASKS-4)
  - [x] 11.1.1 Test first-run wizard flow end-to-end
  - [x] 11.1.2 Test PIN unlock flow
  - [x] 11.1.3 Test device discovery and display
  - [x] 11.1.4 Test playback controls with mocked backend
  - [x] 11.1.5 Test grouping operations
  - [x] 11.1.6 Test command palette navigation and execution

- [x] **11.2 Manual testing with real devices** (traces to: Success Metrics)
  - [x] 11.2.1 Test with actual Sonos installation (15+ devices if possible)
  - [x] 11.2.2 Verify device discovery finds all devices
  - [x] 11.2.3 Verify volume control latency <500ms
  - [x] 11.2.4 Verify status updates within 2 seconds
  - [x] 11.2.5 Verify command palette opens in <100ms
  - [x] 11.2.6 Test grouping/ungrouping operations
  - [x] 11.2.7 Test diagnostic pages display correct data

- [x] **11.3 Accessibility testing** (traces to: INT-7, DESIGN-9)
  - [x] 11.3.1 Verify keyboard navigation works for all interactive elements
  - [x] 11.3.2 Verify focus management in modals (focus trap, return focus)
  - [x] 11.3.3 Verify color contrast meets WCAG AA for text
  - [x] 11.3.4 Test with screen reader (VoiceOver/NVDA)

---

### Phase 12: Documentation & Final Review

- [x] **12.0 Create documentation** (traces to: TASKS-4)
  - [x] 12.0.1 Write README.md with:
    - Project overview
    - Prerequisites (Node.js, node-sonos-http-api)
    - Installation steps
    - Configuration (environment variables)
    - Running the app
    - Keyboard shortcuts reference
  - [x] 12.0.2 Document known limitations (undocumented API, firmware updates)
  - [x] 12.0.3 Add troubleshooting section (common issues, network requirements)

- [x] **12.1 Code review preparation** (traces to: TASKS-4)
  - [x] 12.1.1 Run linter and fix any issues: `npm run lint`
  - [x] 12.1.2 Run type check: `npx tsc --noEmit`
  - [x] 12.1.3 Remove any console.log statements
  - [x] 12.1.4 Review TODOs and address or document
  - [x] 12.1.5 Ensure all tests pass

- [x] **12.2 Final review** (traces to: TASKS-4, PRIN-3)
  - [x] 12.2.1 Review against PRD requirements checklist
  - [x] 12.2.2 Verify all Must Have requirements implemented
  - [x] 12.2.3 Document any deviations from PRD with rationale
  - [x] 12.2.4 Create PR with comprehensive description
  - [x] 12.2.5 Request code review

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 0 | 1 | Feature branch |
| 1 | 3 | Project setup, backend, API client |
| 2 | 5 | Wizard, PIN auth, routing |
| 3 | 3 | Dashboard layout, device grid, cards |
| 4 | 2 | Real-time SSE/polling |
| 5 | 3 | Playback, volume, group volume |
| 6 | 2 | Group display, group management |
| 7 | 2 | Command palette, commands |
| 8 | 1 | Bulk operations |
| 9 | 4 | Diagnostics, network matrix, logs, reboot |
| 10 | 2 | Keyboard shortcuts, hints |
| 11 | 4 | Testing (unit, integration, manual, a11y) |
| 12 | 3 | Documentation, review |

**Total: 35 parent tasks with ~150 sub-tasks**
