import { Building2, Phone, Mail, MapPin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-6 w-6" />
              <h3 className="text-xl font-bold">LOZADACONSTRUCTION</h3>
            </div>
            <p className="text-gray-300 mb-4">Your trusted partner for quality construction materials in Samar.</p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-gray-300">09816406490</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-gray-300">lozadaconst@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-gray-300">Brgy. Canlapwas Pagsanghan, Samar</span>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Business Hours</h4>
            <div className="space-y-1 text-gray-300">
              <p>Mon-Fri: 7:00 AM - 6:00 PM</p>
              <p>Saturday: 7:00 AM - 5:00 PM</p>
              <p>Sunday: 8:00 AM - 4:00 PM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">© 2025 Lozada Construction Aggregates Trading. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
