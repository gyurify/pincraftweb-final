# pincraft web guide

## overview

this project is a frontend website for pincraft. it includes:

- a landing page with sections like home, features, preview, about, faq, and download
- a browser demo where users can move text and photo layers inside a button layout
- dark mode and light mode switching
- preview cards with hover video behavior
- a download modal used by the demo print action

## project structure

- `frontend/index.html` contains the page structure and all main sections
- `frontend/style.css` contains the full visual design, responsive layout, and hover effects
- `frontend/script.js` contains the interactive behavior such as theme switching, menu behavior, preview hover logic, reveal animations, and the demo editor

## how the main parts work

### layout

the html is divided into sections so each part of the site is easy to find and edit. if your group wants to update text or reorder sections, start in `index.html`.

### styling

the css uses custom properties near the top of the file for colors, spacing, radius sizes, and shadows. if your group wants to change the theme or spacing globally, update those values first before editing individual selectors.

### javascript

the javascript is split into a few big parts:

- theme logic for dark mode and light mode
- navigation and active link behavior
- preview hover behavior for playing small videos
- reveal animations while scrolling
- the full demo editor logic for layers, dragging, saving, loading, and printing

## important syntax notes

### html

- `id="home"` gives an element a unique name so links like `href="#home"` can jump to it
- `class="preview-card"` is used for styling and javascript selection
- `data-reveal` and `data-demo-action="save"` are custom data attributes that javascript can read through `dataset`
- `aria-label`, `aria-modal`, and `aria-labelledby` improve accessibility for buttons and modals
- `hidden` keeps an element out of normal view, like the file input used by the upload button

### css

- `:root` stores shared custom properties like `--accent` and `--space-4`
- `html[data-theme="dark"]` is an attribute selector that applies dark-mode values
- `var(--accent)` reads a custom property
- `calc(...)` combines values in one rule, such as header height plus spacing
- `min(...)` and `clamp(...)` help make sizing responsive without hardcoding one value
- `::before` and `::after` create visual elements without extra html
- `@media (...)` changes styles only when a condition is true, such as screen width or hover support

### javascript

- `document.querySelector(".navbar")` finds the first element matching a css selector
- `document.querySelectorAll(...)` returns many matches, and `array.from(...)` turns that result into a real array
- `const name = () => {}` is an arrow function, which is a shorter way to write a function
- `` `switch to ${nextTheme} mode` `` is a template literal, which lets javascript insert variables into text
- `root.dataset.theme = theme` writes to `data-theme` in the html
- `menuToggle?.getAttribute(...)` uses optional chaining so code does not fail if the element is missing
- `value ?? "preview"` gives a fallback only when the left side is `null` or `undefined`
- `target.closest(...)` searches upward through parent elements until it finds a match
- `window.addEventListener(...)` listens for browser events like clicks, scroll, resize, and key presses
- `new intersectionobserver(...)` watches when elements enter or leave the screen

## editing tips for the group

- change text content in `index.html`
- change colors, spacing, hover scale, and responsive rules in `style.css`
- change interactive behavior in `script.js`
- when editing the demo, test drag, save, load, and print after every big change
- when editing preview behavior, test both hover and resize behavior

## note for future cleanup

some features are prepared for more than one interaction style. for example, the preview modal code is still present even though the preview section is currently focused on hover behavior. if your group wants to simplify the project later, that is one place you can review together.
