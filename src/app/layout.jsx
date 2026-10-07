import "./globals.css";
export const metadata = { title: "CampusOS | City University", description: "One Campus. Everything You Need." };
export default function RootLayout({ children }) {
    return <html lang="en"><body>{children}</body></html>;
}
