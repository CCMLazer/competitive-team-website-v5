import "./globals.css";
import Presence from "@/components/Presence";

export const metadata = {
  title: "Competitive Team",
  description: "Competitive Gorilla Tag and Orion Drift team.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Presence />
        {children}
      </body>
    </html>
  );
}