# Design Engine

A professional design tool built with React and TypeScript, featuring vector path editing, design validation, and an intelligent design system.

<div align="center">
<img width="1200" height="475" alt="Design Engine" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Features

### 🎨 Core Design Tools

- **Vector Pen Tool** - Professional Bezier curve editing with Photoshop-style controls
  - Click to place corner points
  - Click and drag to create curved segments
  - Handles follow your drag direction exactly (no constraints or mirroring)
  - Undo last point with `Ctrl+Z` / `Cmd+Z`
  - Delete incomplete paths with `Delete` / `Backspace`
  - Automatic curve rendering based on handle direction

- **Type Tool** - Add and edit text elements with rich typography controls
- **Shape Tool** - Create rectangles and circles
- **Image Tool** - Import and place images
- **Select Tool** - Multi-select, group, and manipulate elements
- **Hand Tool** - Pan around the canvas (Spacebar shortcut)

### 🎯 Design Intelligence

- **Design Validation** - Real-time analysis of typography, layout, color, and production readiness
- **Vital Signs** - Monitor design health with heartbeat, breathing, temperature, integrity, and intention match scores
- **Auto-Fix Suggestions** - One-click fixes for common design issues
- **Design Intention System** - Match designs to Corporate, Luxury, Punk, Minimalist, or Editorial styles

### 📐 Layout & Grid System

- **Customizable Grid** - Adjustable columns, gutters, margins, and baseline
- **Grid Snapping** - Precise alignment with visual grid overlay
- **Baseline Grid** - Typography alignment support

### 🎨 Design System

- **Color Palette** - Define and manage color systems
- **Typography Styles** - Create reusable text styles
- **Component Library** - Save and reuse design elements

### 💾 Export & Import

- **Export to PNG/JPEG** - High-quality image export
- **Component Export** - Save elements as reusable components
- **Image Import** - Drag and drop or import images

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hasnainkazmee/DesignEngine.git
   cd DesignEngine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select Tool |
| `P` | Pen Tool |
| `T` | Type Tool |
| `R` | Shape Tool |
| `M` | Image Tool |
| `H` | Hand Tool (Pan) |
| `Space` | Temporary Hand Tool |
| `Ctrl+Z` / `Cmd+Z` | Undo last point (Pen Tool) |
| `Delete` / `Backspace` | Delete selected / Delete incomplete path (Pen Tool) |
| `Enter` / `Esc` | Finish path (Pen Tool) |

## Pen Tool Usage

The Pen Tool works like Adobe Photoshop's pen tool:

1. **Click** to place a corner point (straight segment)
2. **Click and drag** to place a point with a curve handle
   - The handle defines the curve direction for the next segment
   - Drag direction determines curve direction
   - No constraints - handles follow your exact drag position
3. **Click near the start point** to close the path
4. **Press Enter or Esc** to finish an open path
5. **Ctrl+Z** to undo the last point
6. **Delete/Backspace** to delete an incomplete path

### Curve Behavior

- When you drag from a point, it sets up the curve for the **next** segment
- The curve automatically renders based on the handle direction
- No automatic mirroring - curves follow your handle direction exactly
- Each segment is independent - drag to create curves where you want them

## Project Structure

```
design-engine/
├── components/          # React components
│   ├── Canvas.tsx      # Main canvas with drawing logic
│   ├── Sidebar.tsx     # Tool sidebar
│   ├── Toolbar.tsx     # Top toolbar
│   ├── PropertiesPanel.tsx  # Element properties
│   └── ...
├── hooks/
│   └── useDesignEngine.ts  # Main application logic
├── utils/
│   └── fonts.ts        # Font loading utilities
├── types.ts            # TypeScript type definitions
└── App.tsx             # Main application component
```

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **html-to-image** - Export functionality

## Design Philosophy

Design Engine follows professional design tool principles:

- **Precision** - Grid-based snapping and exact measurements
- **Intelligence** - AI-powered validation and suggestions
- **Flexibility** - Customizable design systems and components
- **Professional Workflow** - Keyboard shortcuts and efficient tools

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

Built with modern web technologies and inspired by professional design tools like Adobe Photoshop, Figma, and Sketch.
