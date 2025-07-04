import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Phone, Mail, MapPin, Clock, Users, Award, Truck } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LOZADA CONSTRUCTION</h1>
                <p className="text-sm text-gray-600">Aggregates Trading</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Order</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Hero Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">About Lozada Construction Aggregates Trading</h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Your trusted partner for quality construction materials in Samar. We provide reliable supply of
                aggregates, cement, steel, and other construction essentials for projects of all sizes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Company Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Years of Experience</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-blue-600">5+</p>
              <p className="text-gray-600">Serving the construction industry</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Happy Customers</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-green-600">100+</p>
              <p className="text-gray-600">Satisfied clients across Samar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Award className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Quality Assured</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-yellow-600">100%</p>
              <p className="text-gray-600">Premium quality materials</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Truck className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Delivery Service</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-purple-600">24/7</p>
              <p className="text-gray-600">Reliable delivery service</p>
            </CardContent>
          </Card>
        </div>

        {/* Services Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Our Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Construction Materials Supply</h3>
                <p className="text-gray-600">
                  Complete range of construction materials including cement, steel bars, hollow blocks, and aggregates.
                </p>
              </div>
              <div className="text-center">
                <Truck className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Delivery Services</h3>
                <p className="text-gray-600">
                  Fast and reliable delivery to all barangays in Samar with our fleet of trucks and equipment.
                </p>
              </div>
              <div className="text-center">
                <Users className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Project Consultation</h3>
                <p className="text-gray-600">
                  Expert advice on material requirements and quantities for your construction projects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold">Address</p>
                    <p className="text-gray-600">Brgy. Canlapwas Pagsanghan, Samar</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-gray-600">09816406490</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-gray-600">lozadaconst@gmail.com</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Business Hours</h3>
                <div className="space-y-2 text-gray-600">
                  <p>
                    <span className="font-medium">Monday - Friday:</span> 7:00 AM - 6:00 PM
                  </p>
                  <p>
                    <span className="font-medium">Saturday:</span> 7:00 AM - 5:00 PM
                  </p>
                  <p>
                    <span className="font-medium">Sunday:</span> 8:00 AM - 4:00 PM
                  </p>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-green-600">Emergency Orders</h4>
                  <p className="text-gray-600">Available 24/7 for urgent construction needs</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center text-blue-600">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                To provide high-quality construction materials and exceptional service to builders, contractors, and
                homeowners across Samar, supporting the growth and development of our community.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center text-green-600">Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                To be the leading supplier of construction materials in Samar, known for reliability, quality, and
                innovation in serving the construction industry.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
