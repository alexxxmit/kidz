import type { Metadata } from "next";

import "./styles.css";

export const metadata: Metadata = {
  title: "Kidz Studio",
  description: "Internal style and wardrobe operations",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
