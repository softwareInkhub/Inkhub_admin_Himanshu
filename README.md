# INKHUB Admin Panel

INKHUB Admin is a high‑performance Next.js App Router admin suite for Shopify and Pinterest data at scale. It provides a unified UX, reusable shared components, advanced filtering/search, fast client caching, and export/print tooling while keeping the UI responsive for 100K+ items.

## 🚀 Highlights

- **Unified Shared Components**: One consistent design system with shared `KPIGrid`, `SearchControls`, `GridCardFilterHeader`, `Pagination`, `ExportModal`, `EnhancedDetailModal`, `Table/Grid/Card` views, etc.
- **Large Dataset Ready**: Chunk-aware data loading, instant in‑memory session cache, and localStorage warm cache for fast “instant loads”.
- **Advanced Filters + Search**: Column filters, advanced filters (date/price/status/tags/vendor/channel), and debounced cross‑chunk text search with Algolia‑style behavior.
- **State Persistence**: URL param syncing for sharable views, Zustand stores for persistent page state, saved views stored locally.
- **Exports**: CSV/JSON/PDF export with field selection and optional images; export modal can run standalone via shared utils.
- **Print**: Configurable print dialog per page.
- **Responsive UI**: Grid and card views with adjustable cards‑per‑row, sticky headers/footers, full‑screen mode.
- **Tabs**: App‑level tabbing with session persistence and pinning.

### Navigation Structure
- Dashboard
- Apps
  - Shopify
    - Orders (high‑volume, chunked loading, advanced filters, export)
    - Products (grid/table/card, advanced filters, export, images)
  - Pinterest
    - Dashboard, Pins, Boards (shared components foundation)
- Design Library
- Settings (General, Health, Caching/Indexing)
- User Management (RBAC‑ready)

### Performance Optimizations
- Chunk‑wise data fetching with background refresh
- In‑memory session cache (`window.__*Cache`) for instant tab switches
- localStorage TTL caches for instant first paint and background revalidation
- Debounced/cancellable search over all chunks
- Shared hooks/utilities to avoid duplicate work and re-renders

## 🛠️ Tech Stack

- Framework: Next.js 14+ (App Router)
- UI: React 18, Tailwind CSS
- State: Zustand (page stores + persistence)
- Tables: TanStack Table v8 (plus custom shared table/grid/card)
- Icons: Lucide React
- Forms: React Hook Form + Zod (where needed)
- Build: SWC, modern bundling

## 📦 Setup & Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inkhub-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to http://localhost:3000

## 🏗️ Project Structure (key folders)

```
inkhub-admin/
├── app/                          # Next.js App Router
│   ├── (admin)/                  # Admin layout group
│   │   ├── dashboard/            # Dashboard pages
│   │   ├── apps/                 # App integrations
│   │   │   ├── shopify/          # Shopify integration
│   │   │   └── pinterest/        # Pinterest integration
│   │   ├── content-library/      # Content library (schemas, types, API, page)
│   │   ├── design-library/       # Design management
│   │   ├── settings/             # System settings
│   │   └── user-management/      # User management
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
├── components/                   # Reusable components
│   ├── shared/                   # Unified shared building blocks
│   │   ├── SearchControls.tsx
│   │   ├── GridCardFilterHeader.tsx
│   │   ├── KPIGrid.tsx
│   │   ├── Pagination.tsx
│   │   ├── ExportModal.tsx       # default export logic via shared utils
│   │   ├── EnhancedDetailModal.tsx
│   │   ├── product/              # Product table/card wrappers
│   │   ├── orders/               # Orders shared UI (table/grid/card)
│   │   └── utils/exportUtils.ts  # CSV/JSON/PDF for any dataset
│   ├── navbar.tsx
│   ├── sidebar.tsx
│   └── tabbar.tsx
├── lib/                         # Utilities and stores
│   ├── store.ts                 # Zustand store
│   └── utils.ts                 # Utility functions
├── public/                      # Static assets
└── styles/                      # Additional styles
```

## 🎨 Design System

### Color Palette
- **Primary**: Indigo/Blue shades for main actions
- **Secondary**: Slate/Neutral for backgrounds and text
- **Semantic Colors**: Green (success), Red (error), Yellow (warning)

### Typography
- **Font Sizes**: 12px, 14px, 16px, 20px
- **Font Weights**: Regular (400), Semibold (600)
- **Line Heights**: Optimized for readability

### Spacing
- **8-Point Grid**: All spacing divisible by 8 or 4
- **Consistent Gutters**: Maintained throughout the interface

## 🔐 Access Control

The admin panel includes a comprehensive RBAC system with:

### User Roles
- **Admin**: Full access to all features
- **Editor**: View, create, and edit (no delete)
- **Viewer**: Read-only access
- **Marketing**: Pinterest and design access
- **Operations**: Shopify order management

### Permission Matrix (suggested)
- Shopify: Orders/Products (View/Create/Edit/Delete)
- Pinterest: Pins/Boards (View/Create/Edit/Delete)
- Design Library: Designs (View/Create/Edit/Delete)

## 📊 Data & Performance Features

### Data Handling
- Chunked loading per page (with discovery of remote cache keys)
- Items per page configurable
- Debounced real‑time search (cross‑chunk) with highlight support
- Column filters (multi‑select, numeric comparisons, date) mapped to advanced filters
- “Advanced Filters” panel for combined server‑style filtering
- Sorting and custom column visibility (JSON column manager for Orders)

### Optimization Techniques
- In‑memory session cache for instant navigation
- LocalStorage TTL caches for instant first paint and background refresh
- Debounced search with cancellation
- Dynamic imports where beneficial
- Tree shaking and minification by default

## 🧰 Exports & Print

- Shared `ExportModal` supports CSV/JSON/PDF:
  - Field inference and selection
  - Include images toggle (products/images fields)
  - Works out of the box via `components/shared/utils/exportUtils.ts`
- Products also include enhanced PDF layout with image embedding and text wrapping.
- Print dialogs provide layout (table/grid/list) and page options.

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Environment Variables
Create a `.env.local` file for environment-specific configuration. Key examples:

```env
# Backend API/caching service base URL
NEXT_PUBLIC_BACKEND_URL=https://brmh.in

# Optional: App name
NEXT_PUBLIC_APP_NAME=INKHUB Admin
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style
- TypeScript strict mode
- ESLint (Next.js config)
- Prettier
- Tailwind CSS utility‑first

## 📱 Responsive Design

The admin panel is fully responsive with:
- **Mobile**: Optimized for small screens
- **Tablet**: Enhanced layout for medium screens
- **Desktop**: Full-featured interface
- **Touch Support**: Optimized for touch interactions

## 🎯 Key UX Features

### Tab Management
- Pin/Unpin tabs with persistence
- Quick navigation and closing

### Sidebar Navigation
- Collapsible with active states and sections

### Data Visualization
- KPI cards with refresh and configuration hooks
- Optional charts and real‑time updates (extensible)

## 🧩 Shopify Pages Overview

### Orders
- Shared component composition (KPI, SearchControls, GridHeader, Table/Grid/Card, Export, Pagination, Settings)
- Advanced filters mapped from column filters; cross‑chunk debounced search
- Column customization via JSON column manager; saved views (localStorage)
- Chunk‑aware caching, instant loads, and background refresh

### Products
- Table/Grid/Card with adjustable cards‑per‑row and inline images
- Advanced filters (status, price range, date range, tags, vendors), column filters, debounced search
- Exports via shared `ExportModal` + products export utils (CSV/JSON/enhanced PDF with images)
- Instant cache on load and background refresh

## 🔄 Reuse Strategy

- Prefer shared components in `components/shared/*`.
- If page logic grows, extract behavior into small hooks under `components/shared/<domain>/hooks/`:
  - `use<Data>Data` (fetch/cache/pagination/dedupe)
  - `use<Data>Filters` (column/advanced filters, search, derived props)
  - `use<Data>UIState` (selection, view, modals, settings, URL/scroll)
  - `use<Data>KPIs` (metrics compute/refresh)
- Keep `page.tsx` as a light composition while preserving existing classNames for consistent CSS.

## 🧪 Testing Notes

- Build quickly with `npm run build`; fix lints via `npm run lint`.
- For export features, verify CSV/JSON/PDF downloads in the browser.
- For caching, test cold vs warm loads and background refresh.

## 🆘 Support

Create issues with steps to reproduce and screenshots/logs where possible. Check the docs and code examples in `components/shared` and the `app/(admin)/apps/shopify/*` pages.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

---

**INKHUB Admin Panel** - Built with ❤️ using Next.js, React, and Tailwind CSS 