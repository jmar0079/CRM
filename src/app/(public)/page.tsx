import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, Clock, MapPin, Star, Building2, TrendingUp, Shield } from "lucide-react";

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-xl font-bold text-white">S</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">ServiceFinder</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/inquire" className="text-gray-600 hover:text-gray-900 font-medium">
                Find Services
              </Link>
              <Link href="/book" className="text-gray-600 hover:text-gray-900 font-medium">
                Book Appointment
              </Link>
              <Link href="/auth/register" className="text-green-600 hover:text-green-800 font-medium">
                For Businesses
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Find the Perfect
            <span className="text-blue-600 block">Service Provider</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with qualified professionals for all your service needs.
            From home repairs to business services, find trusted providers in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-3">
              <Link href="/inquire">
                <Search className="mr-2 h-5 w-5" />
                Request a Service
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
              <Link href="/book">
                Book with Provider
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose ServiceFinder?
            </h2>
            <p className="text-lg text-gray-600">
              We make it easy to find and connect with service providers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Search className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Smart Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our algorithm matches your needs with qualified providers based on services, location, and reviews.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Multiple Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get matched with multiple providers. Compare options and choose the best fit for your needs.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Quick Response</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Providers typically respond within hours. Set urgency levels for faster service.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Local Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Find providers in your area. Location-based matching ensures convenient service delivery.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Get connected with service providers in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Submit Your Request</h3>
              <p className="text-gray-600">
                Tell us what service you need, when you need it, and where you're located.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Matched</h3>
              <p className="text-gray-600">
                Our system matches your request with qualified providers who offer your needed service.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect & Book</h3>
              <p className="text-gray-600">
                Providers contact you directly. Compare options and book the service that fits your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Organizations Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Grow Your Business with ServiceFinder
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join our platform to connect with customers actively seeking your services.
              Get new leads, manage your business, and grow your revenue.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center">
              <CardHeader>
                <Building2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Get New Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Customers searching for your services will be automatically matched and notified.
                  No more waiting for leads to come to you.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Increase Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Expand your customer base and fill your schedule with qualified leads
                  that match your expertise and location.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-lg">Professional Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Access powerful CRM tools, customer management, invoicing, and scheduling
                  to run your business more efficiently.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="text-lg px-8 py-3 bg-green-600 hover:bg-green-700">
              <Link href="/auth/register">
                <Building2 className="mr-2 h-5 w-5" />
                Start Your Free Organization Account
              </Link>
            </Button>
            <p className="mt-4 text-sm text-gray-600">
              Join thousands of service providers already growing their business with ServiceFinder
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Service Provider?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of customers who have found reliable service providers through our platform.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8 py-3">
            <Link href="/inquire">
              <Search className="mr-2 h-5 w-5" />
              Start Your Search
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <span className="ml-2 text-lg font-bold">ServiceFinder</span>
              </div>
              <p className="text-gray-400">
                Connecting customers with qualified service providers nationwide.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/inquire" className="hover:text-white">Find Services</Link></li>
                <li><Link href="/book" className="hover:text-white">Book Appointment</Link></li>
                <li><Link href="/portal" className="hover:text-white">Customer Portal</Link></li>
                <li><Link href="/auth/register" className="hover:text-green-400">For Businesses</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ServiceFinder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}