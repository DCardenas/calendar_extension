# Dropply 📅

**Dropply** is a premium Chrome Extension that streamlines your Google Calendar workflow by allowing you to **drag and drop `.ics` files** directly into the calendar interface. No more manual imports, no more navigating through nested menus—just drop and sync.

![Dropply Preview](https://via.placeholder.com/1280x800?text=Dropply+Preview+Coming+Soon)

---

## ✨ Features

- **Seamless Drag-and-Drop**: Drag one or more `.ics` files from your desktop directly onto `calendar.google.com`.
- **Batch Processing & Queue View**: Drop multiple files at once and track their progress in real-time with a sleek, glassmorphic side panel.
- **Premium Interface**: Enjoy a modern, non-intrusive UI with smooth animations, Gaussian blurs, and responsive feedback.
- **Industry-Standard Parsing**: Powered by `ical.js` (used by Mozilla) for high-reliability parsing of timezones, recurrence rules, and multi-day events.
- **Local-First Privacy**: Your calendar data and files never leave your browser. All processing happens locally before securely syncing with Google's official API.

---

## 🚀 Installation (Developer Mode)

To use Dropply while it's in development:

1. **Clone or Download** this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the root directory of this project.
5. Open [Google Calendar](https://calendar.google.com) and start dropping!

> [!IMPORTANT]
> **OAuth Setup Required**: For the extension to authentically synchronize with your calendar, you must provide a valid **OAuth 2.0 Client ID** in the `manifest.json`. See the [internal documentation](file:///C:/Users/carde/.gemini/antigravity/brain/11d3e6ac-f433-4453-a404-b0974b934a3d/walkthrough.md) for a step-by-step setup guide.

---

## 🛠️ Development

Dropply is built with **TypeScript** for maximum reliability and type safety.

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [npm](https://www.npmjs.com/)

### Build Instructions
```bash
# Install dependencies
npm install

# Compile TypeScript to the /dist folder
npm run build
```

### GitHub Actions
Every push to the `main` branch triggers a GitHub Action that automatically compiles the source and generates a ready-to-upload `.zip` artifact for the Chrome Web Store.

---

## 🔒 Privacy

Dropply is committed to user privacy. We do not have servers, and we do not collect your data. 

- **Processing**: All `.ics` parsing is done using client-side JavaScript.
- **Authentication**: Uses Chrome's specialized Identity API (OAuth 2.0). We never see or store your Google password.
- **Data Usage**: Your data is used exclusively to facilitate the creation of calendar events at your request.

[Read the full Privacy Policy here](./PRIVACY.md)

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

Created with ❤️ by Daniel Cardenas | [DCardenas.github.io](https://DCardenas.github.io/calendar_extension/)
