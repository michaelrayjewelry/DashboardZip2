import "./globals.css";

export const metadata = {
  title: "ZipJeweler — Dashboard",
  description: "Custom jewelry management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="module"
          src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
          async
        />
      </body>
    </html>
  );
}
