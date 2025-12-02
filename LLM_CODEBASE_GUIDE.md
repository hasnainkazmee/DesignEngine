# Design Engine: Codebase & Contribution Guide

## 1. Project Philosophy
**Design Engine** is a **Constraint-Based Design Workspace**. It is not a generic drawing tool.
*   **Core Principle:** "The computer handles the math/constraints; the human handles the creative intent."
*   **The "Oracle":** A continuous validation loop that acts as a "Design God," checking for errors, "Soul," "Breathing Room," and "Intention."
*   **Aesthetic:** The UI must feel like a precision instrument (Braun/Leica). Dark mode, mono fonts for data, high contrast, minimalist.

---

## 2. Tech Stack & Environment
*   **Framework:** React 19 (Functional Components + Hooks).
*   **Language:** TypeScript (Strict typing required).
*   **Styling:** Tailwind CSS (Utility-first).
*   **Icons:** Lucide React.
*   **Build Tool:** Vite.
*   **Persistence:** `localStorage` (Key: `design-engine-state`).

---

## 3. Architecture Overview

The application uses a **centralized state management** pattern via a custom hook, avoiding complex external state libraries in favor of a unified "brain."

### A. The `useDesignEngine` Hook (`hooks/useDesignEngine.ts`)
This hook is the **single source of truth**. It manages:
*   **State:** `elements`, `gridConfig`, `designSystem`, `activeTool`, `canvasPan`, `canvasZoom`, `selectedElementIds`.
*   **Persistence:** Automatically syncs state to `localStorage` on changes.
*   **The Oracle:** A `useEffect` loop that analyzes the state and populates `issues` and `vitalSigns`.

### B. The Oracle (Validation Engine)
Located inside `useDesignEngine.ts`.
1.  **Triggers:** Runs on every change to `elements`, `gridConfig`, or `designIntention`.
2.  **Analysis:**
    *   **Heartbeat:** Checks grid alignment (baseline/column snapping).
    *   **Breathing:** Calculates whitespace ratio.
    *   **Integrity:** Checks adherence to the `DesignSystem` (colors/fonts).
    *   **Intention:** Applies rules based on the selected mode (e.g., 'Luxury' requires high whitespace and serif fonts; 'Corporate' forbids margin bleeding).
3.  **Output:** Updates `issues` (list of specific problems) and `vitalSigns` (0-100 scores).

### C. Component Hierarchy
*   **`App.tsx`**: The root orchestrator. It calls `useDesignEngine` and passes state/handlers down to all children. It manages the layout of the workspace.
*   **`components/Canvas.tsx`**: The interactive workspace.
    *   **Rendering:** Maps `elements` to absolute `divs`.
    *   **Interaction:** Handles all mouse events for selection (marquee), dragging, resizing, and panning.
    *   **Coordinate System:** Converts Screen Coords (`e.clientX`) to Canvas Coords (`(ScreenX - pan.x) / zoom`).
*   **`components/PropertiesPanel.tsx`**: Edits the currently selected element(s). Supports multi-edit and grouping.
*   **`components/SidePanels.tsx`**: Tabbed interface for Layers, Colors (Design System), and Component Library.
*   **`components/ValidationPanel.tsx`**: Displays the Oracle's output (`vitalSigns` and `issues`) and provides "Auto-Fix" buttons.

### D. Data Models (`types.ts`)
*   `DesignElement`: The fundamental building block.
    *   `type`: 'text' | 'image' | 'box' | 'group'
    *   `role`: 'logo' | 'headline' | 'body' | 'decoration' (used for auto-layout)
    *   `constraints`: Array of active rules (e.g., `['grid-snap', 'baseline-snap']`)
*   `DesignIntention`: Enum ('Corporate' | 'Luxury' | 'Punk' | 'Minimalist' | 'Editorial').
*   `DesignSystem`: Global configuration for `colors` and `typography`.

---

## 4. Key Logic Flows

### 1. Canvas Interaction (`Canvas.tsx`)
*   **Selection:**
    *   Clicking an element selects it. `Shift+Click` toggles selection.
    *   Clicking the background clears selection.
    *   Dragging on the background creates a **Marquee Selection** (calculated in `handleMouseUp`).
*   **Manipulation:**
    *   **Dragging:** Updates `x/y`. Applies `snapToGrid` if constraints are active.
    *   **Resizing:** Uses 8 handle points. Calculates new dimensions based on the handle direction.
    *   **Panning:** Active when `activeTool === 'hand'` or `Space` is held. Updates `canvasPan`.

### 2. Component System
1.  **Creation:** User selects elements -> clicks "Componentize" in `PropertiesPanel`.
2.  **Storage:** Saved to `components` state array.
3.  **Instantiation:**
    *   User drags item from `SidePanels` (Library tab).
    *   `SidePanels` sets `e.dataTransfer`.
    *   `Canvas` handles `onDrop`, parses JSON, and creates a new `DesignElement` at the drop coordinates.

### 3. Design System & Global Updates
*   **DesignSystemModal:** Allows adding/removing global colors and type styles.
*   **Live Updates:** Changing the system immediately triggers the Oracle to flag elements that no longer match the system (e.g., "Color #123 is not in design system").

---

## 5. Contribution Rules

1.  **Centralize Logic:** All business logic (state updates, complex calculations, validation) belongs in `hooks/useDesignEngine.ts`. Keep components presentational.
2.  **Event Propagation:** In `Canvas.tsx`, use `e.stopPropagation()` carefully. Element clicks must not trigger background clicks (which clear selection).
3.  **Strict Typing:** No `any`. Update `types.ts` when adding new properties.
4.  **Performance:** The Oracle runs frequently. Avoid heavy computations in the render loop.
5.  **Aesthetics:** Maintain the "Braun/Leica" dark mode aesthetic. Use `zinc-900` range for backgrounds and `zinc-500` for secondary text.

---

## 6. Directory Map

```text
/
├── index.html              # Entry Point
├── App.tsx                 # Layout & State Injection
├── types.ts                # Type Definitions (Source of Truth)
├── hooks/
│   └── useDesignEngine.ts  # CENTRAL BRAIN: State, Logic, Oracle
└── components/
    ├── Canvas.tsx          # Interaction Layer (Drag/Drop/Resize)
    ├── Toolbar.tsx         # Global Actions (Zoom, Export)
    ├── Sidebar.tsx         # Tool Selection
    ├── SidePanels.tsx      # Layers, Colors, Library
    ├── PropertiesPanel.tsx # Inspector & Edit
    ├── ValidationPanel.tsx # Oracle Feedback
    ├── DesignSystemModal.tsx # Global Config
    └── ExportModal.tsx     # Image Generation
```
