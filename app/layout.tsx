import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EasyButton — Chief of Staff in a Box",
  description: "Stop doing the stuff you hate.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
