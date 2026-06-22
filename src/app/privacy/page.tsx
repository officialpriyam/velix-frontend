import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-3xl mx-auto px-6 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors mb-8">
                    <ArrowLeft className="w-3 h-3" /> Back to Home
                </Link>

                <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-xs text-muted mb-8">Last updated: June 21, 2026</p>

                <div className="space-y-6 text-sm leading-relaxed text-foreground/80">
                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">1. Data We Collect</h2>
                        <p>We collect the following information when you use the Service:</p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li><strong>Account Information:</strong> Email address, display name, and authentication tokens (if using OAuth).</li>
                            <li><strong>Usage Data:</strong> Prompts submitted, code generated, build history, project metadata, and feature usage patterns.</li>
                            <li><strong>Technical Data:</strong> IP address, browser type, operating system, and device identifiers.</li>
                            <li><strong>Credits and Transactions:</strong> Credit balance, purchase history, and usage records.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">2. How We Use Your Data</h2>
                        <p>We use collected data to:</p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li>Provide, maintain, and improve the Service.</li>
                            <li>Process AI generation requests and deliver results.</li>
                            <li>Track credit usage and enforce usage limits.</li>
                            <li>Send service-related communications (e.g., security alerts, policy changes).</li>
                            <li>Detect and prevent abuse, fraud, or unauthorized access.</li>
                            <li>Generate anonymized analytics and usage statistics.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">3. Data Sharing</h2>
                        <p><strong>We do not sell your personal data.</strong> We may share data only in the following circumstances:</p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li><strong>Third-Party Service Providers:</strong> Data is transmitted to third-party APIs (NVIDIA, OpenRouter, Supabase) as necessary to fulfill your requests. Their use of data is subject to their respective privacy policies.</li>
                            <li><strong>Legal Requirements:</strong> If required by law, subpoena, or court order.</li>
                            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users).</li>
                            <li><strong>With Your Consent:</strong> When you explicitly authorize data sharing.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">4. Data Storage and Security</h2>
                        <p>Data is stored on secure cloud infrastructure. We implement industry-standard security measures including encryption in transit (TLS) and at rest. However, <strong>no method of transmission or storage is 100% secure</strong>. We disclaim liability for unauthorized access resulting from security vulnerabilities beyond our reasonable control.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">5. Data Retention</h2>
                        <p>We retain your data for as long as your account is active or as needed to provide the Service. We may retain certain data after account deletion as required by law or for legitimate business purposes (e.g., fraud prevention, record keeping). We are not obligated to delete data upon request if retention is legally required.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">6. Your Rights</h2>
                        <p>Depending on your jurisdiction, you may have rights to:</p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                            <li>Access the personal data we hold about you.</li>
                            <li>Request correction of inaccurate data.</li>
                            <li>Request deletion of your data (subject to legal exceptions).</li>
                            <li>Export your data in a portable format.</li>
                            <li>Opt out of non-essential data processing.</li>
                        </ul>
                        <p className="mt-2">To exercise these rights, contact us via Discord. We reserve the right to verify your identity before processing requests.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">7. Cookies</h2>
                        <p>We use cookies and similar technologies for authentication, session management, and preferences. See our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link> for details.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">8. Children&apos;s Privacy</h2>
                        <p>The Service is not intended for users under 13 (or the applicable age of consent in your jurisdiction). We do not knowingly collect data from children. If we learn we have collected data from a minor, we will delete it promptly.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">9. Changes to This Policy</h2>
                        <p>We may update this Privacy Policy at any time. Material changes will be communicated via the Service or email. Continued use after changes constitutes acceptance. We are not responsible for users who fail to review updated policies.</p>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-2 text-foreground">10. Contact</h2>
                        <p>For privacy-related inquiries, join our Discord: <a href="https://discord.gg/FD6QrzeATb" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">discord.gg/FD6QrzeATb</a></p>
                    </section>
                </div>
            </div>
        </div>
    );
}
