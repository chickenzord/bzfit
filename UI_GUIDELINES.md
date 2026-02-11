# UI Guidelines

This document defines the technical implementation standards for BzFit's frontend.

## Core Requirements

### CSS Framework
- **TailwindCSS** (REQUIRED) - All styling must use Tailwind utility classes
- **Shadcn/UI** (Recommended) - Copy-paste component library built on Radix UI primitives
  - Pre-configured for Tailwind and dark mode
  - Accessible by default (ARIA compliant)
  - Fully customizable (you own the code)

### Icons
- **Lucide React** - Clean, consistent icon set
  - Easy to replace if needed (just swap imports)
  - Tree-shakeable (only bundle icons you use)
  - Usage: `import { Icon } from 'lucide-react'`
  - **Do NOT** embed SVG directly in markup

### Design Principles
- **Mobile-first responsive** - Design for small screens first, scale up
- **Simple & minimalist** - Clean layouts, generous whitespace
- **Vibrant accents** - Use bold accent colors sparingly for CTAs and highlights
- **Dark mode from day 1** - Use Tailwind's `dark:` prefix for all color utilities

## Setup Instructions

### 1. Install Dependencies

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

npm install lucide-react
npm install class-variance-authority clsx tailwind-merge
```

### 2. Configure Tailwind (tailwind.config.js)

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode via class
  content: [
    "./src/client/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Colors will be defined later
      // For now, use Tailwind's default palette
    },
  },
  plugins: [],
}
```

### 3. Add Tailwind Directives (src/client/src/index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Install Shadcn/UI (Optional but Recommended)

```bash
npx shadcn@latest init
```

Follow the prompts:
- TypeScript: Yes
- Style: Default
- Base color: Defer (choose later)
- CSS variables: Yes (better for theming)
- React Server Components: No (we use Vite)
- Import alias: `@/components`

Add components as needed:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
```

## Component Architecture

### Layout Components

#### DashboardLayout
- **Purpose**: Wrapper for all authenticated pages
- **Structure**:
  - Header with logo, navigation, user menu
  - Main content area (scrollable)
  - Optional footer
- **Responsive**: Hamburger menu on mobile, sidebar on desktop
- **Dark mode**: Toggle in user menu

#### AuthLayout
- **Purpose**: Wrapper for login/register pages
- **Structure**:
  - Centered card (max-w-md)
  - Logo at top
  - Form container
  - Footer with links
- **Responsive**: Full-width on mobile with padding, centered card on desktop

### Reusable Components

Use Shadcn/UI components where applicable:
- **Button**: Primary, secondary, outline, ghost variants
- **Input**: Text, email, password with proper labels
- **Card**: Container for grouped content
- **Badge**: For status indicators (⚠️ needs review)
- **Dialog**: Modals for confirmations
- **Dropdown Menu**: User menu, action menus

### Icon Usage

```tsx
import { Search, Plus, AlertTriangle } from 'lucide-react'

// Good: Component usage
<Search className="w-5 h-5" />
<Plus className="w-4 h-4 mr-2" />

// Bad: Don't do this
<svg>...</svg>
```

**Common icons to use:**
- `Search` - Food search
- `Plus` - Add items
- `AlertTriangle` - Needs review warning
- `CheckCircle` - Verified items
- `Edit` - Edit buttons
- `Trash` - Delete actions
- `User` - User menu
- `LogOut` - Logout
- `Moon` / `Sun` - Dark mode toggle

## Responsive Design

### Breakpoints (Tailwind defaults)
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (laptops)
- `xl`: 1280px (desktops)
- `2xl`: 1536px (large desktops)

### Mobile-First Approach

```tsx
// Good: Mobile-first (no prefix = mobile, add breakpoints for larger)
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>
</div>

// Bad: Desktop-first
<div className="p-8 lg:p-6 md:p-4">
```

### Common Patterns

**Navigation:**
- Mobile: Hamburger menu (full-screen drawer)
- Desktop: Horizontal nav or sidebar

**Cards:**
- Mobile: Full-width with padding
- Desktop: Fixed max-width, centered or grid layout

**Forms:**
- Mobile: Single column, full-width inputs
- Desktop: Multi-column where appropriate

## Dark Mode

### Implementation

Use Tailwind's `dark:` variant for all color utilities:

```tsx
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-gray-100">Title</h1>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
</div>
```

### Theme Toggle

Store preference in localStorage and apply to `<html>` element:

```tsx
// Check system preference on load
const isDark = localStorage.theme === 'dark' ||
  (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)

if (isDark) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}
```

### Color Guidelines (Temporary)

Until we define a custom palette:
- **Backgrounds**: white/gray-50 (light), gray-900/gray-950 (dark)
- **Text**: gray-900 (light), gray-100 (dark)
- **Muted text**: gray-600 (light), gray-400 (dark)
- **Borders**: gray-200 (light), gray-800 (dark)
- **Primary CTA**: Use Tailwind's blue or green for now
- **Danger**: red-600 (light), red-500 (dark)
- **Warning**: amber-500 (both)

## Typography

### Defaults (Defer Custom Fonts)

Use Tailwind's default font stack for now:
- **Sans**: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto...
- **Mono**: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas...

### Text Sizing

```tsx
// Headings
<h1 className="text-3xl font-bold">Page Title</h1>
<h2 className="text-2xl font-semibold">Section</h2>
<h3 className="text-xl font-medium">Subsection</h3>

// Body
<p className="text-base">Normal text</p>
<p className="text-sm text-gray-600">Muted text</p>
<p className="text-xs text-gray-500">Helper text</p>
```

## Accessibility

- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<header>`)
- Include proper ARIA labels for icon-only buttons
- Ensure sufficient color contrast (Tailwind defaults are good)
- Support keyboard navigation
- Shadcn/UI components are accessible by default

```tsx
// Good: Accessible button
<button aria-label="Search foods">
  <Search className="w-5 h-5" />
</button>

// Better: Use Shadcn Button with icon
<Button variant="ghost" size="icon" aria-label="Search foods">
  <Search className="w-5 h-5" />
</Button>
```

## File Structure

```
src/client/src/
├── components/
│   ├── ui/              # Shadcn components (generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── layout/          # Layout components
│   │   ├── DashboardLayout.tsx
│   │   └── AuthLayout.tsx
│   └── shared/          # Shared components
│       ├── SearchBar.tsx
│       └── MealCard.tsx
├── pages/               # Route components
├── lib/                 # Utilities
│   └── utils.ts         # cn() helper for class merging
└── index.css            # Tailwind imports
```

## Utility Helper

Create `src/client/src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Use for conditional classes:

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "rounded-lg p-4",
  isActive && "bg-blue-50 dark:bg-blue-950",
  isError && "border-red-500"
)} />
```

## Status Indicators

For `isEstimated` and `status=NEEDS_REVIEW` flags:

```tsx
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Needs review
<Badge variant="warning" className="gap-1">
  <AlertTriangle className="w-3 h-3" />
  Needs Review
</Badge>

// Verified
<Badge variant="success" className="gap-1">
  <CheckCircle className="w-3 h-3" />
  Verified
</Badge>
```

## Next Steps

1. Install dependencies
2. Set up Tailwind and Shadcn/UI
3. Create DashboardLayout and AuthLayout
4. Define color palette (defer to design phase)
5. Choose custom fonts (defer to design phase)

## References

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn/UI Docs](https://ui.shadcn.com)
- [Lucide React Icons](https://lucide.dev/guide/packages/lucide-react)
- [Radix UI Primitives](https://www.radix-ui.com/primitives) (Shadcn's foundation)
