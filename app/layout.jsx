import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "ZipJeweler — Dashboard",
  description: "Custom jewelry management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
          type="module"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
