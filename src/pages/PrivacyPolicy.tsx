import React from 'react';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, Users, Database, Heart, AlertTriangle } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <>
      <SEO 
        title="Privacy Policy - LoveAI Companion"
        description="Privacy Policy for LoveAI Companion - How we protect your data and privacy"
        keywords="privacy policy, LoveAI, data protection, privacy, AI companion"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-xl text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            <Badge className="mt-4 bg-pink-500 text-white">
              <Shield className="w-4 h-4 mr-2" />
              Your Privacy Matters
            </Badge>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Heart className="w-6 h-6" />
                LoveAI Companion Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-pink-500" />
                  1. Introduction
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    At LoveAI, Inc. ("we," "our," or "us"), we are committed to protecting your privacy 
                    and personal information. This Privacy Policy explains how we collect, use, disclose, 
                    and safeguard your information when you use our AI-powered entertainment platform 
                    at <strong>www.loveaicompanion.com</strong>.
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-4">
                    Our contact email is <strong>support@loveaicompanion.com</strong>. If you have any 
                    questions about this Privacy Policy, please contact us.
                  </p>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
                    <div className="flex">
                      <Shield className="w-5 h-5 text-green-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-green-800 font-semibold">Privacy Commitment</p>
                        <p className="text-green-700 text-sm mt-1">
                          We do not share your personal conversations with third parties. Your privacy is our priority.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="w-6 h-6 text-pink-500" />
                  2. Information We Collect
                </h2>
                <div className="prose prose-lg max-w-none">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">We collect the following personal information:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li><strong>Account Information:</strong> Email address, password, and profile details</li>
                    <li><strong>Payment Information:</strong> Billing address and payment method details (processed securely by third-party providers)</li>
                    <li><strong>Profile Information:</strong> Name, age, preferences, and custom AI companion settings</li>
                    <li><strong>Communication Data:</strong> Messages and conversations with AI companions</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Usage Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">We automatically collect certain information about your use of our service:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
                    <li><strong>Usage Analytics:</strong> Pages visited, features used, time spent, and interaction patterns</li>
                    <li><strong>Technical Data:</strong> Log files, error reports, and performance metrics</li>
                    <li><strong>Location Data:</strong> General geographic location (country/region level only)</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3 Demographic Information</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We collect general demographic information for advertising and service improvement purposes, including:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-4 space-y-2">
                    <li>Age range and gender (optional)</li>
                    <li>General interests and preferences</li>
                    <li>Usage patterns and feature preferences</li>
                    <li>Subscription tier and usage statistics</li>
                  </ul>
                </div>
              </section>

              {/* How We Use Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-pink-500" />
                  3. How We Use Your Information
                </h2>
                <div className="prose prose-lg max-w-none">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Service Provision</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">We use your information to:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Provide and maintain our AI companion service</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Personalize your AI companion interactions</li>
                    <li>Improve and optimize our AI models and responses</li>
                    <li>Provide customer support and respond to inquiries</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 Advertising and Marketing</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">We use demographic and usage data to:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Display relevant advertisements and promotions</li>
                    <li>Send marketing communications (with your consent)</li>
                    <li>Analyze user preferences and behavior patterns</li>
                    <li>Develop new features and services</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.3 Legal and Safety</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">We may use your information to:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Comply with legal obligations and court orders</li>
                    <li>Protect our rights and prevent fraud</li>
                    <li>Ensure platform safety and security</li>
                    <li>Investigate and prevent abuse or violations</li>
                  </ul>
                </div>
              </section>

              {/* Information Sharing */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-pink-500" />
                  4. Information Sharing and Disclosure
                </h2>
                <div className="prose prose-lg max-w-none">
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                    <p className="text-green-800 font-semibold">Privacy Protection</p>
                    <p className="text-green-700 text-sm mt-1">
                      We do not share your personal conversations or private data with third parties.
                    </p>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 What We Do NOT Share</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">We do not share:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Your personal conversations with AI companions</li>
                    <li>Private messages or chat history</li>
                    <li>Personal profile details or preferences</li>
                    <li>Account passwords or authentication data</li>
                    <li>Any personally identifiable information without consent</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2 What We May Share</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">We may share limited information with:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li><strong>Service Providers:</strong> Third-party vendors who help us operate our service (payment processors, cloud hosting, analytics)</li>
                    <li><strong>Legal Authorities:</strong> When required by law, court order, or to protect our rights</li>
                    <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
                    <li><strong>Aggregated Data:</strong> Anonymous, non-personal statistics for research and improvement</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.3 Third-Party Services</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We use third-party services for payment processing, analytics, and hosting. These services 
                    have their own privacy policies and may collect information according to their terms.
                  </p>
                </div>
              </section>

              {/* Data Security */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-pink-500" />
                  5. Data Security and Protection
                </h2>
                <div className="prose prose-lg max-w-none">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Security Measures</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">We implement various security measures to protect your data:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>End-to-end encryption for sensitive data transmission</li>
                    <li>Secure data storage with industry-standard encryption</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Access controls and authentication systems</li>
                    <li>Employee training on data protection practices</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.2 Data Retention</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We retain your personal information for as long as necessary to provide our services 
                    and comply with legal obligations. Conversation data is retained for service improvement 
                    but is anonymized and aggregated.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.3 Data Breach Notification</h3>
                  <p className="text-gray-700 leading-relaxed">
                    In the event of a data breach that may affect your personal information, we will notify 
                    you and relevant authorities as required by applicable law.
                  </p>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-pink-500" />
                  6. Your Privacy Rights
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You have certain rights regarding your personal information:
                  </p>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Access and Portability</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Request access to your personal information</li>
                    <li>Download a copy of your data in a portable format</li>
                    <li>View your account information and preferences</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.2 Correction and Updates</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Update or correct your personal information</li>
                    <li>Modify your privacy preferences</li>
                    <li>Change your communication settings</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.3 Deletion and Restriction</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Request deletion of your personal information</li>
                    <li>Restrict processing of your data</li>
                    <li>Object to certain uses of your information</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">6.4 Communication Preferences</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Opt out of marketing communications</li>
                    <li>Manage notification settings</li>
                    <li>Control data sharing preferences</li>
                  </ul>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
                    <p className="text-blue-800 font-semibold">Exercise Your Rights</p>
                    <p className="text-blue-700 text-sm mt-1">
                      To exercise any of these rights, contact us at support@loveaicompanion.com
                    </p>
                  </div>
                </div>
              </section>

              {/* Cookies and Tracking */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-pink-500" />
                  7. Cookies and Tracking Technologies
                </h2>
                <div className="prose prose-lg max-w-none">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Types of Cookies</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">We use various types of cookies and tracking technologies:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our service</li>
                    <li><strong>Advertising Cookies:</strong> Used to display relevant advertisements</li>
                    <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">7.2 Cookie Management</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You can control cookies through your browser settings. However, disabling certain 
                    cookies may affect the functionality of our service.
                  </p>
                </div>
              </section>

              {/* International Transfers */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Database className="w-6 h-6 text-pink-500" />
                  8. International Data Transfers
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    Your information may be transferred to and processed in countries other than your 
                    country of residence. We ensure appropriate safeguards are in place to protect your 
                    data in accordance with applicable privacy laws.
                  </p>
                </div>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-pink-500" />
                  9. Children's Privacy
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    Our service is not intended for children under 18 years of age. We do not knowingly 
                    collect personal information from children under 18. If we become aware that we have 
                    collected personal information from a child under 18, we will take steps to delete 
                    such information.
                  </p>
                </div>
              </section>

              {/* Changes to Privacy Policy */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-pink-500" />
                  10. Changes to This Privacy Policy
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    We may update this Privacy Policy from time to time. We will notify you of any 
                    material changes by posting the new Privacy Policy on our website and updating 
                    the "Last updated" date. We encourage you to review this Privacy Policy periodically.
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-pink-500" />
                  11. Contact Us
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mt-4">
                    <p className="text-gray-700">
                      <strong>Email:</strong> support@loveaicompanion.com<br/>
                      <strong>Website:</strong> www.loveaicompanion.com<br/>
                      <strong>Company:</strong> LoveAI, Inc.
                    </p>
                  </div>
                </div>
              </section>

              <div className="border-t pt-8 mt-8">
                <p className="text-sm text-gray-500 text-center">
                  This Privacy Policy is effective as of the date listed above and will remain in effect 
                  except with respect to any changes in its provisions in the future.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
