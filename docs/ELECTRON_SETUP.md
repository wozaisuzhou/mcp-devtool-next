# Electron App Setup

This guide explains how to build and run the MCP DevTool as a native desktop application using Electron.

## Development Mode

Run the Electron app in development mode with hot-reloading:

```bash
npm run electron-dev
```

This will:
1. Start the Next.js development server on `http://localhost:3000`
2. Wait for the server to be ready
3. Launch the Electron app
4. Open DevTools for debugging

## Building for Production

### Build for Current Platform

```bash
npm run electron-build
```

This will:
1. Build the Next.js application for production
2. Package it with Electron
3. Create installers in the `dist/` directory

### Platform-Specific Builds

**Mac (DMG and ZIP):**
```bash
npm run electron-build:mac
```

**Windows (NSIS installer and portable):**
```bash
npm run electron-build:win
```

**Linux (AppImage and DEB):**
```bash
npm run electron-build:linux
```

## Project Structure

```
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Preload script for security
├── src/                # Next.js application
├── assets/              # Build resources (icons, etc.)
└── dist/               # Electron build output
```

## Electron Configuration

### Main Process (`electron/main.js`)
- Creates the Electron window
- Starts local Next.js server in production mode
- Handles security settings and certificates
- Manages external link navigation

### Security Features
- **Context Isolation**: Enabled for secure communication
- **Node Integration**: Disabled for security
- **CORS**: Disabled for local development
- **Certificate Errors**: Handled for self-signed HTTPS in development

### Platform-Specific Settings
- **mac**: Developer Tools category, disable security for local connections
- **windows**: NSIS installer and portable executable
- **linux**: AppImage and DEB packages

## Installation

### Mac
After building, you'll find:
- `dist/MCP DevTool-0.1.0.dmg` - Disk image for installation
- `dist/MCP DevTool-0.1.0-mac.zip` - Zip archive

### Windows
After building, you'll find:
- `dist/MCP DevTool Setup 0.1.0.exe` - NSIS installer
- `dist/MCP DevTool 0.1.0.exe` - Portable executable

### Linux
After building, you'll find:
- `dist/MCP DevTool-0.1.0.AppImage` - Universal Linux package
- `dist/mcp-devtool_0.1.0_amd64.deb` - Debian package

## Troubleshooting

### Development Mode Issues

**Electron window doesn't open:**
- Ensure Next.js dev server is running on port 3000
- Check that `wait-on` can reach the server
- Look at the terminal for error messages

**Connection issues in Electron:**
- Check that webSecurity is disabled in webPreferences
- Verify CORS settings in Next.js
- Check that API routes work in browser first

### Production Build Issues

**Build fails:**
- Ensure `npm run build` succeeds first
- Check that all dependencies are installed
- Look at the electron-builder output for specific errors

**App won't start after installation:**
- Check that the built Next.js app starts correctly: `npm start`
- Verify file paths in electron/main.js
- Check Electron logs in the console

### Common Issues

**"Module not found" errors:**
- Ensure `electron-builder` includes all necessary files
- Check the `files` array in package.json build config
- Verify node_modules are included in the build

**Performance issues:**
- The app includes all of node_modules, which can be large
- Consider using `asar: true` for smaller builds
- Remove unused dependencies before building

**API routes not working in Electron:**
- The Electron app runs a local Next.js server
- API routes should work the same as in browser
- Check that the local server starts successfully

## Customization

### Change Window Size

Edit `electron/main.js`:

```javascript
mainWindow = new BrowserWindow({
  width: 1600,          // Your preferred width
  height: 1000,         // Your preferred height
  // ... other settings
})
```

### Add App Icon

Place your icon in `assets/` directory:
- `icon.png` for Linux/Windows
- `icon.icns` for Mac

Then update the `icon` property in `electron/main.js`.

### Remove DevTools in Production

Edit `electron/main.js` and comment out the devTools line:

```javascript
// mainWindow.webContents.openDevTools()  // Comment this out
```

## Distribution

The built applications can be distributed via:
- Direct download from your website
- GitHub Releases
- Software distribution platforms
- Internal company distribution

## License

Make sure to comply with the licenses of all dependencies included in the Electron app.
