# Kazm Plugin System Documentation

## Overview
The Kazm Plugin System allows developers and designers to extend the functionality of the workspace using JavaScript. Plugins run directly within the application context, allowing them to manipulate the canvas, read the design system, and generate complex layouts programmatically.

## Architecture
Plugins are executed using a sandboxed-like approach (via `new Function`) where the application injects two specific objects into the plugin's scope:
1. **`kazm`**: The Action API (Write access). Used to modify state, create elements, and interact with the UI.
2. **`context`**: The State Store (Read access). Used to read the current grid configuration, element list, selection, and design system.

---

## The `kazm` API (Write Operations)

The `kazm` object is your primary way to change the application state.

### `kazm.create(element)`
Creates a new element on the canvas.
*   **Parameters:**
    *   `element` (Partial<DesignElement>): The element properties.
*   **Behavior:** Automatically generates a unique ID if not provided. Supports all element types (`box`, `text`, `image`, `group`).
*   **Example:**
    ```javascript
    kazm.create({
        type: 'box',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        style: { backgroundColor: '#FF0000' }
    });
    ```

### `kazm.update(id, updates)`
Updates properties of an existing element.
*   **Parameters:**
    *   `id` (string): The ID of the element to update.
    *   `updates` (Object): Partial object containing fields to change.
*   **Example:**
    ```javascript
    kazm.update('box-123', {
        x: 500,
        style: { opacity: 0.5 }
    });
    ```

### `kazm.delete(id)`
Removes an element from the canvas.
*   **Parameters:**
    *   `id` (string): The ID of the element to remove.

### `kazm.getSelection()`
Returns an array of the currently selected element objects.
*   **Returns:** `DesignElement[]`
*   **Example:**
    ```javascript
    const selected = kazm.getSelection();
    if(selected.length > 0) {
        kazm.notify("You selected " + selected.length + " items.");
    }
    ```

### `kazm.selectAll()`
Selects every element on the canvas.

### `kazm.deselectAll()`
Clears the current selection.

### `kazm.notify(message)`
Displays a toast notification in the UI (useful for debugging or confirmation).
*   **Parameters:**
    *   `message` (string): The text to display.

---

## The `context` Object (Read Operations)

The `context` object provides a snapshot of the current application state.

### `context.grid`
Contains the current grid configuration.
*   `width` (number): Total canvas width.
*   `height` (number): Total canvas height.
*   `columns` (number): Number of columns.
*   `gutter` (number): Gap between columns.
*   `margin` (number): Page margin.
*   `baseline` (number): Baseline grid step (e.g., 18px).

### `context.system`
Contains the Design System configuration.
*   `colors`: Array of `{ name, value }` objects.
*   `typography`: Array of type definitions.

### `context.elements`
An array of all `DesignElement` objects currently on the canvas.

### `context.selection`
An array of strings (IDs) representing the currently selected elements.

---

## Tutorial: Writing Your First Plugin

1.  Click the **Plugins** icon (Puzzle piece) in the Toolbar.
2.  Switch to the **Code Editor** tab.
3.  Paste the following code to create a "Golden Ratio" spiral generator:

```javascript
// Golden Ratio Spiral Generator
const PHI = 1.618;
let size = 50;
let x = context.grid.width / 2;
let y = context.grid.height / 2;

// Create 8 squares following the golden ratio
for (let i = 0; i < 8; i++) {
    kazm.create({
        type: 'box',
        x: x,
        y: y,
        width: size,
        height: size,
        style: {
            backgroundColor: 'transparent',
            borderColor: '#fff',
            borderWidth: 1,
            opacity: 1 - (i * 0.1)
        }
    });

    // Move to next position (simplified spiral logic)
    x += size / 2;
    y += size / 2;
    size = size * PHI;
}

kazm.notify("Golden Ratio Generated");
```

4.  Click **Run Script**.

---

## Common Patterns

### Pattern 1: Modifying Selection
Apply a change only to what the user has selected.

```javascript
const selection = kazm.getSelection();
if (selection.length === 0) {
    kazm.notify("Please select an element.");
} else {
    selection.forEach(el => {
        // Double the width
        kazm.update(el.id, { width: el.width * 2 });
    });
}
```

### Pattern 2: Using the Design System
Create elements using only approved colors.

```javascript
const primaryColor = context.system.colors.find(c => c.name.includes('Primary'))?.value || '#000';

kazm.create({
    type: 'box',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    style: { backgroundColor: primaryColor }
});
```

### Pattern 3: Grid Awareness
Align elements to the grid columns.

```javascript
const colCount = context.grid.columns;
const gutter = context.grid.gutter;
const margin = context.grid.margin;
const totalW = context.grid.width - (margin * 2);
const colWidth = (totalW - ((colCount - 1) * gutter)) / colCount;

// Create a box spanning the first 2 columns
kazm.create({
    type: 'box',
    x: margin,
    y: margin,
    width: (colWidth * 2) + gutter, // Span 2 cols + 1 gutter
    height: 200,
    style: { backgroundColor: '#333' }
});
```

---

## Limitations

1.  **Synchronous Execution:** Plugins currently run synchronously. Heavy calculations (e.g., generating 10,000 items) may freeze the UI briefly.
2.  **No Event Listeners:** Plugins run once and finish. They cannot currently attach event listeners to canvas elements (e.g., "onClick").
3.  **No UI:** Plugins cannot currently render their own React UI (buttons/sliders) inside the modal. They are code-only execution blocks.
