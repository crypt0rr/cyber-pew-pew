# Cyber Pew Pew

An interactive 3D visualization of synthetic cyber traffic, built with React, TypeScript, Three.js, and React Three Fiber.

All displayed events are generated locally for demonstration. The project does not use or claim to show live threat telemetry.

The v1.2 experience includes pause-aware event lifecycles, adaptive rendering quality, smooth camera focus, a mobile event sheet, and separate telemetry and visual streams so high-volume counters stay accurate without overwhelming the globe.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run build
npm run test:e2e
```
