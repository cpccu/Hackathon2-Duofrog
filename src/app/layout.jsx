import "./globals.css";
export const metadata = { title: "CampusOS | City University", description: "One Campus. Everything You Need." };
export default function RootLayout({ children }) {
    return <html lang="en" data-scroll-behavior="smooth"><body><a href="#main-content" className="skip-link">Skip to main content</a>{children}</body></html>;
}
