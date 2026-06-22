import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-3xl mx-auto px-6 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors mb-8">
                    <ArrowLeft className="w-3 h-3" /> Back to Home
                </Link>

                <h1 className="text-2xl font-bold mb-2">Cookie Policy</h1>
                <p className="text-xs text-muted mb-8">Last updated: June 21, 2026</p>

                <div className="space-y-6 text-sm leading-relaxed text-foreground/80">
                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">1. What Are Cookies</h2>
                        <p>Cookies are small text files placed on your device when you visit a website. They help us recognize your browser, maintain your session, and remember your preferences.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">2. Cookies We Use</h2>
                        <p>We use the following types of cookies:</p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li><strong>Essential Cookies (Required):</strong> Authentication session cookies, CSRF protection, and load balancing. These are necessary for the Service to function and <strong>cannot be disabled</strong>.</li>
                            <li><strong>Functional Cookies:</strong> Theme preferences (dark/light mode), language settings, and UI state (e.g., sidebar collapse). Disabling these may reduce functionality.</li>
                            <li><strong>Analytics Cookies:</strong> Anonymized usage statistics to help us understand how the Service is used. These do not identify you personally.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">3. Third-Party Cookies</h2>
                        <p>Third-party services we integrate with may set their own cookies:</p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li><strong>Supabase:</strong> Authentication and session management cookies.</li>
                            <li><strong>OAuth Providers (GitHub, Google, etc.):</strong> Login authentication cookies set during the OAuth flow.</li>
                        </ul>
                        <p className="mt-2">We do not control third-party cookies. Refer to their respective privacy policies for details.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">4. Cookie Duration</h2>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li><strong>Session Cookies:</strong> Deleted when you close your browser.</li>
                            <li><strong>Persistent Cookies:</strong> Remain for up to 30 days or until you manually clear them.</li>
                            <li><strong>Authentication Cookies:</strong> Expire after 7 days of inactivity.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">5. Managing Cookies</h2>
                        <p>You can control cookies through your browser settings. However:</p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li>Disabling essential cookies will prevent you from using the Service.</li>
                            <li>We are not responsible for functionality issues resulting from cookie restrictions you impose.</li>
                            <li>Clearing cookies will log you out and reset your preferences.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">6. Do Not Track</h2>
                        <p>We honor &quot;Do Not Track&quot; signals where technically feasible. However, essential cookies required for authentication and security will still be set regardless of DNT preferences, as they are necessary for the Service to operate.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">7. Changes to This Policy</h2>
                        <p>We may update this Cookie Policy at any time. Changes will be posted on this page with an updated revision date. Continued use of the Service constitutes acceptance of the updated policy.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">8. Contact</h2>
                        <p>For questions about our cookie practices, join our Discord: <a href="https://discord.gg/FD6QrzeATb" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">discord.gg/FD6QrzeATb</a></p>
                    </section>
                </div>
            </div>
        </div>
    );
}
