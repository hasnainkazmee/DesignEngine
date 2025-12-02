# Design Engine: Future Enhancements Roadmap

This roadmap focuses on core functionality and professional features to create a robust, stable, and powerful design tool.

---

## Phase 1: Core Editor Functionality
This phase addresses fundamental features that are essential for a fluid and intuitive design workflow.

*   [ ] **Undo/Redo History:** Implement a command pattern or state snapshot stack to enable `Ctrl+Z` / `Ctrl+Y` functionality. This is the highest priority feature.
*   [ ] **Z-Index Management:** Add controls to "Bring to Front," "Send to Back," "Bring Forward," and "Send Backward." This is critical for managing overlapping elements.
*   [ ] **Improved Text Editing:** Replace the basic `contentEditable` implementation with a more robust rich-text editing library (e.g., TipTap, Slate.js) to handle complex formatting and prevent common content-editing bugs.
*   [ ] **Zoom to Cursor:** Modify the zoom logic to use the mouse cursor's position as the focal point, rather than the center of the viewport.

---

## Phase 2: Professional Layout & Design Tools
This phase introduces features that enable more precise and sophisticated design work.

*   [ ] **Rulers & Draggable Guides:** Add rulers to the top and left of the canvas. Allow users to click and drag guides from the rulers that elements can snap to.
*   [ ] **Vector Pen Tool:** Implement SVG path creation and editing, including support for Bezier curves, anchor points, and handles. This is a major step towards professional vector graphics capabilities.
*   [ ] **Advanced Typography:**
    *   Integrate with the Google Fonts API to allow dynamic loading and use of a wide range of fonts.
    *   Add support for OpenType features like ligatures, stylistic alternates, and tabular figures.
*   [ ] **Color Harmony Generator:** In the color panel, when a user selects a primary color, automatically suggest secondary and tertiary colors based on established color theory models (e.g., Complementary, Triadic, Analogous).

---

## Phase 3: Workflow & Performance Enhancements
This phase focuses on improving the user's workflow and ensuring the application remains fast and responsive.

*   [ ] **Multi-Artboard Support:** Allow the canvas to contain multiple named "Frames" or "Artboards." Each artboard could have its own dimensions and grid configuration, enabling side-by-side design for different screen sizes (e.g., Mobile vs. Desktop).
*   [ ] **Performance Optimization:** For canvases with a large number of elements (>100), implement a spatial index (like a Quadtree) to optimize rendering, selection, and collision detection, improving overall performance.
*   [ ] **Accessibility Simulator:** Add a canvas-wide toggle that applies filters to simulate various forms of color blindness (Protanopia, Deuteranopia) and other visual impairments, allowing designers to check the accessibility of their work.

---

## Phase 4: Collaboration & Export
This phase focuses on sharing work and integrating with other workflows.

*   [ ] **Code Export:** Add a "Copy as..." feature to the properties panel that can generate CSS, Tailwind CSS, or inline style attributes for a selected element.
*   [ ] **Improved PDF Export:** Enhance the `jspdf` integration to export text as vector paths instead of rasterizing it via `html2canvas`, resulting in higher quality, searchable PDFs.
*   [ ] **Real-time Multiplayer (Long-term goal):** Investigate and implement a CRDT-based solution (e.g., Yjs) to enable real-time collaboration with multiple users, including shared cursors and live edits.
