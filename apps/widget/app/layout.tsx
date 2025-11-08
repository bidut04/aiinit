import { Geist, Geist_Mono } from "next/font/google";
import { SessionProviders } from "@/lib/sessionProvider";
import "@workspace/ui/globals.css";
import { Providers } from "@/components/providers";
import { RestaurantProvider } from "@/app/restaurant/context/restaurant-context";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <SessionProviders>
          <Providers>
            <RestaurantProvider>
              {children}
            </RestaurantProvider>
          </Providers>
        </SessionProviders>
      </body>
    </html>
  );
}