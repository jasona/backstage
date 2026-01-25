# Research Summary Document (RSD): Sonos Device Manager v1

## 1. Project Overview

- **User brief:** Build a web-based application to oversee and manage a large Sonos installation (15-30+ devices) using the hidden/undocumented local web server functionality. Enable device discovery from a single known IP address, with a modern Linear-style UI.
- **Project type(s):** Product + Design
- **Research depth:** Quick scan
- **Primary research focus:** External (Sonos APIs, discovery protocols, competitor tools)

---

## 2. Existing Context & Assets (Internal)

### 2.1 Related Requirements & Docs
- No existing Sonos-related documents in `/tasks`
- This is an entirely new project

### 2.2 Codebase / System Context
- New project - no existing codebase
- Stack will follow corporate standards: Next.js, TypeScript, Tailwind CSS, shadcn/ui

---

## 3. User & Business Context

- **Target user(s):** Power users managing large Sonos installations (15-30+ devices across multiple zones/rooms)
- **User goals:**
  - Centralized visibility across all devices from a single dashboard
  - Access diagnostic and control features hidden from the official Sonos app
  - Discover all devices automatically from one known IP
  - Manage device grouping, playback, and system health
- **Success signals:**
  - All devices discoverable and visible from a single entry point
  - Real-time status updates with low latency
  - Faster access to diagnostic/control functions than official app
  - Clean, efficient UI requiring minimal clicks

---

## 4. External Research: Best Practices & References

### 4.1 Sonos Local API Architecture

Sonos devices expose an undocumented but functional local API via HTTP on **port 1400**. Key communication methods:

| Port | Protocol | Purpose |
|------|----------|---------|
| 1400 | HTTP/SOAP | Services, status endpoints, device description |
| 1443 | HTTPS | Secure REST API (less documented) |
| 1900 | UDP/SSDP | Device discovery via multicast |

#### Key HTTP Endpoints (Port 1400)

| Endpoint | Returns | Use Case |
|----------|---------|----------|
| `/status/info` | JSON | Player ID, serial, group ID, household ID, capabilities |
| `/status` | HTML | Overall status menu with links to diagnostic pages |
| `/status/topology` | XML | Zone topology (may require parsing ZoneGroupTopology SOAP) |
| `/status/zp` | Text | Household ID for multi-account networks |
| `/status/batterystatus` | JSON | Battery status (Move, Roam devices) |
| `/support/review` | HTML | **Consolidated diagnostics for ALL devices** - key for discovery |
| `/xml/device_description.xml` | XML | UPnP service descriptions, device capabilities |
| `/tools.htm` | HTML | Unix-style diagnostic tools (dmesg, netstat, etc.) |
| `/region.htm` | HTML | WiFi region configuration |
| `/reboot` | Form | Device reboot (requires CSRF token handling) |
| `/wifictrl?wifi=off` | - | Disable WiFi temporarily |

**Critical Discovery Endpoint:** `/support/review` provides a browsable view of diagnostics across ALL devices on the network - this is the key to discovering other devices from a single known IP.

#### SOAP Services (16 documented)

Core services available at `/MediaRenderer/` or `/MediaServer/` paths:

- **AVTransport** - Playback control (play, pause, seek, queue)
- **RenderingControl** - Volume, mute, EQ, loudness
- **ZoneGroupTopology** - Zone grouping, coordinator info
- **AlarmClock** - Alarm management
- **DeviceProperties** - Device info, LED state, button lock
- **ContentDirectory** - Browse music library
- **Queue** - Queue management
- **MusicServices** - Streaming service integration
- **GroupRenderingControl** - Group volume control
- **HTControl** - Home theater settings (night mode, speech enhancement)

### 4.2 Device Discovery Methods

#### SSDP Discovery (Recommended for Initial Scan)

Send UDP multicast to discover all Sonos devices:

```
M-SEARCH * HTTP/1.1
HOST: 239.255.255.250:1900
MAN: "ssdp:discover"
MX: 1
ST: urn:schemas-upnp-org:device:ZonePlayer:1
```

- Multicast addresses: `239.255.255.250:1900` and `255.255.255.255:1900`
- Response includes device IP, USN, and description URL
- **Limitation:** Requires browser/app to have UDP capability (not available in browser JS)

#### HTTP-Based Discovery (Browser-Compatible)

From a single known device IP:
1. Fetch `/support/review` - lists all devices in the household
2. Parse `/status/topology` or call `ZoneGroupTopology.GetZoneGroupState` SOAP action
3. Each device's `/xml/device_description.xml` contains room name, model, capabilities

**Recommended approach for browser:** Use the known device to fetch topology, then HTTP requests to discovered IPs.

### 4.3 Reference Implementations

#### node-sonos-http-api (jishi/node-sonos-http-api)

A mature Node.js HTTP bridge providing:
- Automatic device discovery
- REST endpoints: `/zones`, `/{room}/{action}`, `/pauseall`, `/resumeall`
- Playback control, volume, grouping, favorites, playlists
- TTS integration (Google, AWS Polly, ElevenLabs)
- Preset system for multi-room orchestration
- WebSocket events for state changes

**Relevance:** Could serve as backend/reference architecture, or inspiration for endpoint design.

#### svrooij/sonos-api-docs

Comprehensive documentation of local UPnP API:
- All 16 SOAP services documented
- Device discovery file examples for all models
- TypeScript generator for creating API clients
- Related tools: sonos2mqtt, sonos-cli

### 4.4 Competitor Analysis: SonoPad & SonoPhone

| Feature | SonoPad/SonoPhone | Official App |
|---------|-------------------|--------------|
| Volume latency | Near-zero | Noticeable lag |
| Device discovery | Automatic, works with S1 | Requires account |
| Music library search | Fast, keyword-based | Limited |
| Zone management | Drag-and-drop grouping | Multi-step |
| Keyboard shortcuts | N/A (iOS) | N/A |
| Admin features | None (no setup/removal) | Full |
| Platform | iOS only | iOS, Android, desktop |
| Price | $3.99 | Free |

**Key takeaways:**
- Volume control latency is a major pain point with official app
- Third-party apps succeed by being faster and more focused
- Admin/setup features not needed - users handle that in official app
- Focus on control, monitoring, and diagnostics

**Android alternative:** Andronos (themes, zone linking visibility)

### 4.5 Real-Time Update Patterns

For a dashboard with 15-30+ devices, real-time status is critical.

| Pattern | Latency | Direction | Complexity | Best For |
|---------|---------|-----------|------------|----------|
| Polling | High (5s avg) | Pull | Low | Fallback only |
| SSE | Low | Server→Client | Medium | Status updates, events |
| WebSocket | Very low (95ms) | Bidirectional | Higher | Chat, control feedback |

**Recommendation for this project:**

1. **SSE (Server-Sent Events)** for device status streams - one-way, auto-reconnect, firewall-friendly
2. **Polling fallback** with React Query for initial load and reconnection
3. **Optional WebSocket** for immediate control feedback if needed

Sonos devices emit UPnP events for state changes - a backend service can subscribe and relay via SSE.

---

## 5. Constraints, Risks, and Dependencies

### 5.1 Constraints

| Type | Constraint |
|------|------------|
| **Technical** | Browser JS cannot do UDP multicast - discovery needs server component or known IP starting point |
| **Technical** | CORS restrictions - browsers can't directly call Sonos devices; need proxy/backend |
| **Technical** | Some endpoints (like `/reboot`) require CSRF token handling |
| **Security** | DNS rebinding protection - must use numeric IPs, not hostnames |
| **API Stability** | All local APIs are undocumented and may change with firmware updates |
| **Network** | All devices must be on same subnet/broadcast domain |

### 5.2 Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Sonos firmware update breaks endpoints | High | Medium | Version detection, graceful degradation, community monitoring |
| CORS blocking direct browser requests | High | Certain | Implement backend proxy layer |
| Large device count causes performance issues | Medium | Medium | Pagination, virtualized lists, batched polling |
| Multicast discovery fails on some networks | Medium | Medium | Fallback to topology-based discovery from known IP |

### 5.3 Dependencies

- **Network:** Devices must be reachable on local network
- **Single Known IP:** User must provide at least one device IP to bootstrap discovery
- **Backend Service:** Required for CORS proxy and SSDP discovery (if used)

---

## 6. Opportunities & Ideas

### 6.1 Reuse Opportunities

- **node-sonos-http-api** - Could run as backend service, already handles discovery and provides clean REST API
- **svrooij/sonos-api-docs** - TypeScript generator could create type-safe client
- **shadcn/ui** - Command palette (Cmd+K), tables, cards align with Linear-style design

### 6.2 Quick Wins

- `/support/review` endpoint provides instant all-device discovery from single IP
- `/status/info` gives rich JSON data with minimal parsing
- Device icons/models can be derived from `device_description.xml`

### 6.3 Differentiation Ideas

- **Network Matrix Visualization** - Show inter-device signal strength (data available in diagnostics)
- **Command Palette** - Quick actions via keyboard (Cmd+K to pause all, search rooms)
- **Bulk Operations** - Reboot all, pause all, volume presets across zones
- **Diagnostic Dashboard** - Surface Unix tools output in readable format

### 6.4 Future Extensions (Out of MVP Scope)

- TTS announcements via ElevenLabs/Google
- Preset/scene management
- Alarm scheduling
- Music service integration
- Mobile-responsive PWA

---

## 7. Key Findings by Track

### 7.1 Product / Feature Findings

1. **Discovery is solvable:** `/support/review` or topology SOAP calls reveal all devices from one known IP
2. **Backend required:** CORS restrictions and UDP discovery necessitate a server component
3. **API is rich but unstable:** 16 SOAP services + HTTP endpoints provide extensive control, but are undocumented
4. **Real-time is achievable:** UPnP events + SSE can provide low-latency updates

### 7.2 Design Findings

1. **Linear-style works well:** Dark theme, command palette, sidebar navigation fit this use case
2. **Competitor pain points:** Official app has volume latency and cluttered UI - opportunity to excel
3. **Device cards:** Status, room name, now playing, volume - keep information density high but clean
4. **Keyboard-first:** Power users managing 30 devices need shortcuts for bulk operations

---

## 8. Recommendations for the Create Phase

### 8.1 Recommended Requirements Document(s)

- **Create next:** PRD (Product Requirements Document)
- **Suggested filename:** `prd-sonos-manager-v1.md`
- Design can be addressed within PRD or as separate `drd-sonos-manager-v1.md` if UI complexity warrants

### 8.2 Scope Recommendations

**MVP Scope (Must Have):**
- Device discovery from single known IP (via topology endpoint)
- Device list dashboard with status, room name, model, IP
- Real-time status updates (playing/paused, current track, volume)
- Basic playback controls (play, pause, next, previous)
- Volume control per device and group
- Device grouping/ungrouping
- Command palette for quick actions (Cmd+K)

**Stretch / Deferred:**
- SSDP auto-discovery (requires backend UDP)
- Diagnostic tools interface (dmesg, netstat output)
- Network matrix visualization
- Bulk reboot functionality
- TTS announcements
- Preset/scene management
- Mobile PWA

### 8.3 Key Questions the Requirements Doc Should Answer

1. **Architecture:** Use node-sonos-http-api as backend, or build custom proxy?
2. **Discovery UX:** How does user provide initial device IP? (settings page, first-run wizard, auto-detect?)
3. **Update frequency:** How often to poll status? Subscribe to UPnP events?
4. **Error handling:** What happens when a device goes offline mid-session?
5. **Authentication:** Any need to protect the dashboard (since it controls home devices)?

### 8.4 Suggested Decisions to Lock In Now

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| Backend approach | Use node-sonos-http-api as initial backend | Mature, handles discovery, provides REST endpoints |
| Real-time pattern | SSE with polling fallback | One-way updates, browser-native, simpler than WebSocket |
| Device discovery | Start with HTTP topology parsing | Works in browser via backend proxy, no UDP needed |
| UI framework | Next.js + shadcn/ui | Matches corporate standards, built-in dark mode |

---

## 9. Open Questions & Gaps

- **Firmware variability:** Do all Sonos models/firmware versions expose the same endpoints?
- **Event subscription:** How reliable are UPnP event subscriptions for 30+ devices?
- **Rate limiting:** Does Sonos throttle requests from aggressive polling?
- **S1 vs S2:** Do older S1 devices have different API surfaces?
- **Household spanning:** Can this work across multiple Sonos households on same network?

---

## 10. Standards Compliance

| Standard | Version | Status |
|----------|---------|--------|
| PRINCIPLES | 1.0.0 | Compliant - user-first focus, maintainability priority |
| SECURITY | 1.0.0 | Compliant - no secrets in code, local network only |
| CODE-INTERNAL | 1.0.0 | Will apply - Next.js, TypeScript, shadcn/ui stack |
| DESIGN | 1.0.0 | Will apply - Linear-style, dark-first, keyboard-first |
| PHASE-RESEARCH | 1.0.0 | Compliant - sources cited, uncertainties flagged |

---

## 11. Sources & References

### Sonos Local API
- [The Hidden Sonos Web Interface](https://bsteiner.info/articles/hidden-sonos-interface) - Comprehensive hidden endpoints guide
- [Sonos API Documentation (svrooij)](https://sonos.svrooij.io/) - Unofficial UPnP API docs
- [Sonos Communication Methods](https://sonos.svrooij.io/sonos-communication) - Ports, protocols, discovery
- [svrooij/sonos-api-docs (GitHub)](https://github.com/svrooij/sonos-api-docs) - API docs and TypeScript generator
- [jishi/node-sonos-http-api (GitHub)](https://github.com/jishi/node-sonos-http-api) - HTTP API bridge reference
- [Sonos Diagnostics Secret Menu](https://doitforme.solutions/blog/sonos-diagnostics-secret-web-menu/) - Diagnostic page guide
- [Hidden Pages at 1400 (Sonos Community)](https://en.community.sonos.com/troubleshooting-228999/hidden-pages-at-1400-21361) - Community endpoint discovery
- [Discovering Sonos Devices with UPnP (GitHub Gist)](https://gist.github.com/3861159) - SSDP discovery example

### Competitor Tools
- [SonoPad Official Site](https://sonopad.de/) - iOS alternative controller
- [SonoPhone & SonoPad Review](https://www.cultivatingmentalsilence.com/blog/sonophone-and-sonopad-amazing-third-party-alternatives-to-the-sonos-app) - Feature comparison
- [Alternative Controllers Discussion (Sonos Community)](https://en.community.sonos.com/owners-cafe-228997/can-i-get-everyone-s-opinion-on-alternative-controllers-for-sonos-hardware-6191441)

### Real-Time Patterns
- [SSE in Next.js (Pedro Alonso)](https://www.pedroalonso.net/blog/sse-nextjs-real-time-notifications/) - Server-Sent Events implementation
- [SSE vs WebSockets in 2025 (DEV.to)](https://dev.to/haraf/server-sent-events-sse-vs-websockets-vs-long-polling-whats-best-in-2025-5ep8) - Pattern comparison
- [Streaming in Next.js 15 (HackerNoon)](https://hackernoon.com/streaming-in-nextjs-15-websockets-vs-server-sent-events) - Framework-specific guidance
- [Next.js WebSocket Discussion (GitHub)](https://github.com/vercel/next.js/discussions/14950) - Community patterns

### Official Sonos (Limited)
- [Sonos Control API Docs](https://docs.sonos.com/docs/control) - Official cloud API (not local)
- [Sonos Developer Blog](https://developer.sonos.com/blog/) - API updates
