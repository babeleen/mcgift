import "./globals.css";
export const metadata = { title: "McGift", description: "Family group gift organiser" };
export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
