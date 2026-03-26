# Frontend Developer Guide

This frontend is a **React 19** application built with **Vite** and **Tailwind CSS 4**. It serves as the interactive visualizer for the skip list data structure, consuming animation steps from the NestJS backend.

## What This Project Does

- **Interactive Visualization:** Renders the skip list layers, nodes, and edges in a grid-like structure.
- **Operation Control:** Provides a UI for users to trigger `find`, `insert`, `delete`, and `reset` operations.
- **Animation Playback:** Replays step-by-step events (e.g., `add_level`, `split_arrow`) received from the backend.

## Project Structure
```
frontend/
├── public/                # Static assets (favicons, background images)
├── src/
│   ├── assets/            # Project-specific images and SVG vectors
│   ├── components/        # React components
│   │   ├── SkipListGrid.tsx       # Layout and grid for the skip list nodes
│   │   └── SkipListVisualizer.tsx # Core visualization logic and animations
│   ├── data/
│   │   └── data.ts        # Mock data or initial state constants
│   ├── types/
│   │   └── types.ts       # Shared TypeScript interfaces and enums
│   ├── App.jsx            
│   ├── App.css            
│   ├── index.css          
│   └── main.jsx           
├── eslint.config.js       
├── index.html             
├── package.json           
├── vite.config.js         
└── .prettierrc            
```
## Local Development

Install dependencies

```bash
pnpm install
```

Run the frontend in development mode:

```bash
pnpm dev
```

The application will be available at `http://127.0.0.1:5173`.


### Useful Commands
```bash
pnpm build      # Production build
pnpm lint       # Run ESLint check
pnpm format     # Run Prettier (auto-sorts Tailwind classes)
pnpm preview    # Locally preview production build
```