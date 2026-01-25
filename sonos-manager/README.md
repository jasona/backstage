# Sonos Manager

A modern web application for managing and monitoring large Sonos speaker installations. Built with Next.js 14+, TypeScript, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Features

### Dashboard
- **Real-time device status** - See all your Sonos devices at a glance with 2-second polling updates
- **Device cards** - View now playing info, volume levels, and playback status
- **Search & filter** - Quickly find devices by name, model, or currently playing content
- **Sort options** - Organize by room name, status, or model

### Playback Controls
- **Play/Pause/Skip** - Control individual devices directly from the dashboard
- **Volume control** - Smooth slider with debounced updates for responsive feedback
- **Mute toggle** - Quickly mute/unmute any device

### Device Grouping
- **Visual group indicators** - See which devices are grouped together
- **Group management** - Join devices to groups or remove them
- **Coordinator badges** - Identify group leaders at a glance

### Bulk Operations
- **Pause All** - Stop playback on all devices instantly
- **Resume All** - Resume previously playing devices
- **Volume presets** - Set all devices to 25%, 50%, 75%, or mute

### Command Palette
- **Quick access** - Press `Cmd/Ctrl + K` to open
- **Fuzzy search** - Find any command or device quickly
- **Keyboard navigation** - Full keyboard support for power users

### Diagnostics
- **Network overview** - Visual matrix of device status
- **Device details** - Model info, group membership, playback state
- **Refresh controls** - Manually refresh diagnostic data

### Security
- **Optional PIN protection** - Secure your dashboard with a PIN code
- **Local storage** - All settings stored locally, no external servers

## Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom dark theme
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [React Query](https://tanstack.com/query) (TanStack Query)
- **Validation**: [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend**: [node-sonos-http-api](https://github.com/jishi/node-sonos-http-api)

## Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn**
- **node-sonos-http-api** running on your network
- **Sonos speakers** on the same network

## Installation

### 1. Set up the Backend (node-sonos-http-api)

This application requires [node-sonos-http-api](https://github.com/jishi/node-sonos-http-api) as a backend.

```bash
# Clone the backend
git clone https://github.com/jishi/node-sonos-http-api.git
cd node-sonos-http-api
npm install

# Start the backend
npm start
```

Verify it's running by opening [http://localhost:5005/zones](http://localhost:5005/zones) in your browser.

### 2. Set up Sonos Manager

```bash
# Clone this repository
git clone https://github.com/yourusername/sonos-manager.git
cd sonos-manager

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

Edit `.env.local` and set your Sonos API URL:
```env
NEXT_PUBLIC_SONOS_API_URL=http://localhost:5005
```

### 3. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SONOS_API_URL` | URL of node-sonos-http-api | `http://localhost:5005` |

### First-Run Setup

On first launch, the setup wizard will guide you through:

1. **Welcome** - Introduction to Sonos Manager
2. **Backend URL** - Verify connection to node-sonos-http-api
3. **Device Discovery** - Confirm your Sonos devices are found
4. **PIN Setup** (optional) - Set a PIN to protect the dashboard

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + ,` | Open settings |
| `Cmd/Ctrl + Shift + P` | Pause all devices |
| `Cmd/Ctrl + Shift + R` | Resume all devices |
| `Escape` | Close modal / Clear selection |
| `/` | Focus search input |
| `Arrow Up/Down` | Adjust volume (when device selected) |
| `Space` | Toggle play/pause (when device selected) |

## Project Structure

```
sonos-manager/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard routes
│   │   │   ├── diagnostics/    # Diagnostics pages
│   │   │   └── page.tsx        # Main dashboard
│   │   ├── setup/              # Setup wizard
│   │   ├── unlock/             # PIN unlock
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── command/            # Command palette
│   │   ├── dashboard/          # Dashboard components
│   │   ├── diagnostics/        # Diagnostics components
│   │   ├── layout/             # Layout components
│   │   ├── setup/              # Setup wizard components
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and API client
│   ├── providers/              # React context providers
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── .env.example                # Environment variables template
├── tailwind.config.ts          # Tailwind configuration
└── tsconfig.json               # TypeScript configuration
```

## API Reference

This application uses [node-sonos-http-api](https://github.com/jishi/node-sonos-http-api) as its backend. Key endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /zones` | Get all zones and devices |
| `GET /{room}/state` | Get room state |
| `GET /{room}/play` | Start playback |
| `GET /{room}/pause` | Pause playback |
| `GET /{room}/playpause` | Toggle playback |
| `GET /{room}/volume/{level}` | Set volume (0-100) |
| `GET /{room}/mute` | Mute room |
| `GET /{room}/unmute` | Unmute room |
| `GET /{room}/next` | Skip to next track |
| `GET /{room}/previous` | Go to previous track |
| `GET /{room}/join/{target}` | Join room to group |
| `GET /{room}/leave` | Leave current group |
| `GET /pauseall` | Pause all zones |
| `GET /resumeall` | Resume all zones |

## Known Limitations

- **Signal strength data** - Network matrix shows device status, not actual signal strength (requires direct device access)
- **Device reboot** - Not supported through node-sonos-http-api
- **Raw device logs** - Requires direct access to device web interface
- **Firmware updates** - Not managed through this application
- **Remote access** - Local network only in v1

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

## Troubleshooting

### Devices not appearing

1. Ensure node-sonos-http-api is running
2. Verify all devices are on the same network
3. Check the API URL in `.env.local`
4. Try accessing `http://localhost:5005/zones` directly
5. Try refreshing the page

### Volume control feels laggy

Volume changes are debounced at 100ms to prevent overwhelming the Sonos system. This is by design for large installations.

### PIN not working

1. Clear browser local storage
2. Re-run the setup wizard
3. Set a new PIN

### Connection status shows "Disconnected"

1. Check if node-sonos-http-api is running
2. Verify network connectivity
3. Check browser console for errors

### Backend won't start

1. Make sure no other service is using port 5005
2. Check that your network supports multicast (required for Sonos discovery)
3. Ensure no firewall is blocking port 1400 (Sonos control port)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [node-sonos-http-api](https://github.com/jishi/node-sonos-http-api) for the excellent Sonos API wrapper
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Linear](https://linear.app/) for design inspiration

---

Made with Claude Code
