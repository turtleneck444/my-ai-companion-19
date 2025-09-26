import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">LoveAI Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-p:leading-relaxed prose-headings:scroll-mt-20 max-w-none">
            <p><strong>Effective date:</strong> {new Date().toLocaleDateString()}</p>

            <h2>1. What we do</h2>
            <p>
              LoveAI provides AI companion experiences. We care deeply about your privacy. This policy explains
              what we collect, how we use it, and the strict controls we apply to protect your data.
            </p>

            <h2>2. Your conversations</h2>
            <ul>
              <li><strong>No human reads your chats.</strong> We do not view, monitor, or manually review your conversations.</li>
              <li>Conversations are processed by our AI providers solely to generate responses and to provide essential features like message history.</li>
              <li>We may store message metadata (timestamps, character, usage counters) to enforce plan limits and improve service reliability.</li>
            </ul>

            <h2>3. Data we collect</h2>
            <ul>
              <li>Account data: email, preferred name, plan, subscription status.</li>
              <li>Usage data: message counts, voice-call counts, device/browser info for security and fraud prevention.</li>
              <li>Payment data: handled by our payment processor (e.g., Square). We do not store full card numbers.</li>
            </ul>

            <h2>4. How we use data</h2>
            <ul>
              <li>To operate LoveAI (authentication, chat generation, plan enforcement).</li>
              <li>To secure the platform (abuse detection, rate limiting, fraud prevention).</li>
              <li>To comply with legal obligations (tax, accounting, requests from authorities where required by law).</li>
            </ul>

            <h2>5. Sharing</h2>
            <ul>
              <li>Service providers: cloud hosting, AI model providers, analytics strictly necessary to run LoveAI.</li>
              <li>Payments: your card details are processed by Square (or other processor you select); we never store full card PANs.</li>
              <li>Legal: we may disclose data when required by applicable law or to protect users and the platform.</li>
            </ul>

            <h2>6. Security</h2>
            <p>
              We use industry-standard security controls (encryption in transit, access controls, audit logging). No system is 100% secure,
              but we continuously improve our defenses.
            </p>

            <h2>7. Data retention</h2>
            <p>
              Account and usage data are retained for as long as your account remains active and as required for legal/accounting purposes.
              You may request deletion of your account, subject to obligations we have under law.
            </p>

            <h2>8. Your rights</h2>
            <p>
              Depending on your location, you may have rights to access, rectify, or delete your data. Contact us and we will assist.
            </p>

            <h2>9. Children</h2>
            <p>
              LoveAI is for adults. You must be at least 18 (or the age of majority in your jurisdiction) to use the service.
            </p>

            <h2>10. Changes</h2>
            <p>
              We may update this policy to reflect product, legal, or regulatory changes. Material updates will be posted on this page.
            </p>

            <h2>11. Contact</h2>
            <p>
              Questions or requests? Contact our support via the help link in the app.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
