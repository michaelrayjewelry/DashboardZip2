import "./globals.css";

export const metadata = {
  title: "ZipJeweler — Dashboard",
  description: "Custom jewelry management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
