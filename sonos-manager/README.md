# Sonos Manager

A modern, Linear-style web application for managing and monitoring large Sonos installations. Built with Next.js, TypeScript, and shadcn/ui.

## Features

- Device discovery from a single known IP address
- Real-time status monitoring for all devices
- Low-latency volume and playback controls
- Device grouping management
- Command palette (Cmd/Ctrl+K) for quick actions
- Network diagnostics and signal matrix
- Dark mode by default

## Prerequisites

- Node.js 18+
- npm or yarn
- A Sonos system on your local network
- [node-sonos-http-api](https://github.com/jishi/node-sonos-http-api) (backend)

## Backend Setup (node-sonos-http-api)

This application requires [node-sonos-http-api](https://github.com/jishi/node-sonos-http-api) as a backend to communicate with your Sonos devices.

### Installation

1. Clone the node-sonos-http-api repository:
   ```bash
   git clone https://github.com/jishi/node-sonos-http-api.git
   cd node-sonos-http-api
   npm install
   ```

2. Start the backend:
   ```bash
   npm start
   ```

3. Verify it's running by opening [http://localhost:5005/zones](http://localhost:5005/zones) in your browser. You should see a JSON response with your Sonos devices.

### Configuration

The backend runs on port 5005 by default. If you need to change this, update `NEXT_PUBLIC_SONOS_API_URL` in your `.env.local` file.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

5. On first run, you'll be guided through a setup wizard to configure your Sonos connection.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SONOS_API_URL` | URL for the node-sonos-http-api backend | `http://localhost:5005` |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Escape` | Close modal/panel |
| `Space` | Toggle play/pause (selected device) |
| `Arrow Up/Down` | Adjust volume (selected device) |
| `/` | Focus search |
| `Cmd/Ctrl + Shift + P` | Pause all devices |
| `Cmd/Ctrl + Shift + R` | Resume all devices |

## Tech Stack

- [Next.js 14+](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [React Query](https://tanstack.com/query) - Data fetching
- [Zod](https://zod.dev/) - Schema validation

## Known Limitations

- Requires node-sonos-http-api backend running locally
- Uses undocumented Sonos local APIs that may change with firmware updates
- Local network access only (no remote access in v1)
- Devices must be on the same subnet as the backend

## Troubleshooting

### Devices not discovered
- Ensure node-sonos-http-api is running and accessible
- Check that your Sonos devices are on the same network
- Try accessing `http://localhost:5005/zones` directly to verify backend connectivity

### Volume control lag
- Check network connectivity between the backend and Sonos devices
- Ensure no firewall is blocking port 1400 (Sonos control port)

### Backend won't start
- Make sure no other service is using port 5005
- Check that your network supports multicast (required for Sonos discovery)

## License

MIT
