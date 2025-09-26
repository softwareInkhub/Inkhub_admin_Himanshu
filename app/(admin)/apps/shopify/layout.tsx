"use client";

export default function ShopifyLayout({ children }: { children: React.ReactNode }) {
  // This layout provides a persistent shell for Shopify pages without duplicating the main sidebar.
  // The main AdminLayout already includes the sidebar, so we just need to provide
  // a container for the Shopify-specific content.
  return (
    <div className="h-full">
      {children}
    </div>
  );
}
