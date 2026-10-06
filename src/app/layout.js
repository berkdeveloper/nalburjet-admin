import { Inter } from "next/font/google";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata = {
    title: "NalburJet Admin",
    description: "NalburJet yönetim paneli",
};

export default function RootLayout({ children }) {
    return (
        <html lang="tr">
            <body className={inter.variable}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}