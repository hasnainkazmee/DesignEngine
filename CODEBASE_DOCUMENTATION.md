# Kazm Design Engine - Technical Documentation

**Version:** 1.0  
**Stack:** React 18+, TypeScript, Tailwind CSS, Lucide React  
**Philosophy:** Constraint-Based Systemic Design

---

## 1. Executive Summary

**Kazm** is a web-based design tool built for professional systemic graphic design. Unlike freeform tools (Figma, Canva), Kazm enforces **constraints** (Grids, Baselines, Type Scales) and uses an active **Validation Oracle** to monitor the "health" of a design in real-time.

### Key Differentiators
*   **The Oracle:** A background process that scores designs based on "Vital Signs" (Heartbeat, Breathing, Integrity).
*   **Recursive Rendering:** Supports deep nesting (Groups/Masks) using standard DOM hierarchy.
*   **Plugin System:** Allows runtime extension of the editor using a sandboxed JS API.
*   **Smart Layouts:** "Auto-Layout Variation" that intelligently reflows content based on semantic roles.

---

## 2. Architecture Overview

### State Management (`App.tsx`)
The application uses a **Centralized State** pattern. The `App` component acts as the single source of truth.
*   **Projects:** Stored in `localStorage`.
*   **Active Session:** State variables (`elements`, `gridConfig`, `designSystem`) live in `App.tsx` to allow the Validation Oracle instant access to all data.
*   **Routing:** Simple state-based view switching (`currentView`: 'dashboard' | 'editor').

### The Rendering Engine (`components/Canvas.tsx`)
Kazm uses a **Recursive DOM Renderer**.
*   **Scene Graph:** The `renderElement` function calls itself recursively to render children inside their parents.
*   **Coordinate System:**
    *   **Root Elements:** Absolute positioned relative to the Canvas origin.
    *   **Children:** Absolute positioned relative to their *Parent*. `left: child.x - parent.x`.
    *   **Selection Overlay:** A separate, flat layer (`renderSelectionOverlay`) rendered on top of the scene graph. This ensures selection handles are never clipped by masks and always face the user.

### The Validation Oracle
Located in `App.tsx` (inside `useEffect`), the Oracle analyzes the scene graph 60fps (or on change).
*   **Heartbeat:** Checks if elements align to the grid/baseline.
*   **Integrity:** Checks if colors/fonts match the active `DesignSystem`.
*   **Breathing:** Calculates whitespace ratio.
*   **Intention:** Adjusts scoring weights based on mode (e.g., 'Luxury' penalizes clutter, 'Punk' rewards grid-breaking).

---

## 3. Data Structures (`types.ts`)

### `DesignElement` (The Atom)
```typescript
interface DesignElement {
  id: string;
  type: 'box' | 'text' | 'image' | 'group';
  parentId?: string;      // Defines hierarchy
  clip?: boolean;         // If true, acts as a clipping mask
  role?: 'headline' | 'background' | ...; // For smart layouts
  x, y, width, height: number;
  style: CSSProperties & AdvancedStyles; // Filters, Blend Modes, etc.
  constraints: ConstraintType[];
}
```

### `DesignSystem`
```typescript
interface DesignSystem {
  colors: { name: string, value: string }[];
  typography: { name: string, family: string, size: number, ... }[];
}
```

---

## 4. Feature Implementations

### Grouping & Hierarchy
*   **Creation:** `handleGroup` calculates the bounding box of selected items, creates a new `group` element, and assigns the `parentId` of the items to this new group.
*   **Interaction:** Clicking a child selects the **Group Parent** by default. Double-clicking drills down to the child (edit mode).
*   **Movement:** Moving a group updates the parent's `x/y`. Children are rendered relative to this, so they move visually without changing their state coordinates (unless flattened).

### Clipping Masks
*   **Logic:** Any element can be a mask.
*   **Implementation:** The parent element gets `overflow: visible` (by default) or `clipPath: inset(...)` (if masking).
*   **Renderer:** Children are DOM nodes inside the parent. `handleMask` sets `clip: true` on the parent.

### Image Engine
*   **Upload:** Uses `FileReader` to convert images to Base64 Data URLs.
*   **Drop:** `handleDrop` in Canvas detects `e.dataTransfer.files`.
*   **Processing:** Automatically resizes images to fit within a sane max-width (600px) upon import to preserve performance.

### Plugin System (`components/PluginModal.tsx`)
*   **Sandboxing:** Uses `new Function()` to execute code.
*   **Injection:** Provides a `kazm` object (write) and `context` object (read) to the script.
*   **Capabilities:** Can create elements, update styles, read the grid, and trigger notifications.

---

## 5. File Map

| File | Purpose |
| :--- | :--- |
| `App.tsx` | Main Controller, State, Oracle, Keyboard Shortcuts. |
| `types.ts` | Type definitions (Single Source of Truth). |
| `components/Canvas.tsx` | Recursive Renderer, Mouse/Drag Logic, Visual Feedback. |
| `components/Toolbar.tsx` | Top bar (Zoom, Export, Plugins, System). |
| `components/Sidebar.tsx` | Left toolstrip (Select, Shape, Brush, etc.). |
| `components/PropertiesPanel.tsx` | Right sidebar. Context-aware property editing. |
| `components/Dashboard.tsx` | Project management, Templates, Component Library. |
| `components/PluginModal.tsx` | IDE for writing/running plugins. |
| `components/ValidationPanel.tsx` | Displays Oracle scores and fixes. |

---

## 6. Contribution Guide

1.  **Strict Typing:** Never use `any`. Define new types in `types.ts`.
2.  **Immutability:** React state must be updated immutably (e.g., `setElements(prev => [...prev])`).
3.  **Coordinate Space:** Always convert `e.clientX` to Canvas Space using `(x - pan.x) / zoom` before applying logic.
4.  **Z-Index:** Handled by the order in the `elements` array. Use `handleReorder` in `App.tsx` to manipulate.

---

## 7. Future Roadmap (Summary)

1.  **Performance:** Implement Quadtree for spatial indexing if element count > 500.
2.  **AI Integration:** Connect "Text AI" to the "Type" tool for auto-copywriting.
3.  **Vector Tools:** Add Pen tool for SVG path editing.
4.  **Collaboration:** Add WebSocket layer for multiplayer editing.
