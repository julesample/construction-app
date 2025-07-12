"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Trash2,
  Plus,
  Calculator,
  FileText,
  CalendarIcon,
  Phone,
  User,
  MapPin,
  DollarSign,
  Package,
  TrendingUp,
  Settings,
  RotateCcw,
  Download,
  Shield,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
  Key,
  Percent,
  Database,
  Loader2,
  Edit,
  Save,
  X,
  Info,
  Building2,
  Menu,
  Home,
  Mail,
  Clock,
} from "lucide-react"
import { format } from "date-fns"
import { cn, debounce } from "@/lib/utils"
import { useCallback } from "react"

interface MaterialUnit {
  value: string
  label: string
  price: number
  available: boolean
}

interface Material {
  id: string
  name: string
  category: string
  units: MaterialUnit[]
  description: string
  available: boolean
}

interface OrderItem {
  id: string
  materialId: string
  materialName: string
  unit: string
  unitLabel: string
  quantity: number
  pricePerUnit: number
  total: number
}

interface CustomerInfo {
  name: string
  contactNumber: string
  deliveryDate: Date | undefined
  barangay: string
  deliveryLocation: string
}

interface PriceChange {
  timestamp: string
  material: string
  unit: string
  old_price: number
  new_price: number
  action: "price_update" | "availability_toggle" | "reset" | "login" | "password_change" | "barangay_pricing"
  barangay?: string
}

interface AdminSession {
  isActive: boolean
  loginTime: number
  lastActivity: number
  sessionId: string
}

interface BarangayPricing {
  [barangay: string]: {
    [materialId: string]: {
      [unitValue: string]: {
        multiplier: number
        fixedPrice?: number
      }
    }
  }
}

const categories = ["Masonry", "Aggregates", "Binding Materials"]

// Security utilities
const generateSessionId = () =>
  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
const hashPassword = (password: string) => btoa(password + "construction_salt_2024")
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export default function ConstructionOrderUI() {
  const { toast } = useToast()
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string>("")
  const [selectedUnit, setSelectedUnit] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [showReceipt, setShowReceipt] = useState<boolean>(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("order")
  const [adminActiveTab, setAdminActiveTab] = useState<string>("inventory")
  const [adminSession, setAdminSession] = useState<AdminSession>({
    isActive: false,
    loginTime: 0,
    lastActivity: 0,
    sessionId: "",
  })
  const [priceHistory, setPriceHistory] = useState<PriceChange[]>([])
  const [adminPassword, setAdminPassword] = useState<string>("")
  const [showAdminDialog, setShowAdminDialog] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loginAttempts, setLoginAttempts] = useState<number>(0)
  const [isLocked, setIsLocked] = useState<boolean>(false)
  const [pendingChanges, setPendingChanges] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false)

  // Barangay states
  const [barangays, setBarangays] = useState<string[]>([])
  const [barangayPricing, setBarangayPricing] = useState<BarangayPricing>({})
  const [selectedBarangayForPricing, setSelectedBarangayForPricing] = useState<string>("")
  const [editingBarangay, setEditingBarangay] = useState<string | null>(null)
  const [newBarangayName, setNewBarangayName] = useState("")

  // Password management
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false)
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>("")
  const [newPassword, setNewPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")

  // Customer information state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    contactNumber: "",
    deliveryDate: undefined,
    barangay: "",
    deliveryLocation: "",
  })

  // New states for material management
  const [newMaterialName, setNewMaterialName] = useState<string>("")
  const [newMaterialCategory, setNewMaterialCategory] = useState<string>("")
  const [newMaterialDescription, setNewMaterialDescription] = useState<string>("")
  const [newUnitLabel, setNewUnitLabel] = useState<string>("")
  const [newUnitPrice, setNewUnitPrice] = useState<number>(0)
  const [selectedMaterialForUnit, setSelectedMaterialForUnit] = useState<string>("")

  // Edit states
  const [editingMaterial, setEditingMaterial] = useState<string>("")
  const [editingDescription, setEditingDescription] = useState<string>("")

  // Database functions
  const loadMaterials = async () => {
    try {
      const response = await fetch("/api/materials")
      if (response.ok) {
        const data = await response.json()
        setMaterials(
          data.map((item: any) => ({
            ...item,
            units: item.units.filter((unit: any) => unit.value !== null),
          })),
        )
      }
    } catch (error) {
      console.error("Error loading materials:", error)
      toast({
        title: "Error",
        description: "Failed to load materials. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddBarangay = async () => {
    if (!newBarangayName.trim()) {
      toast({ title: "Error", description: "Barangay name cannot be empty.", variant: "destructive" })
      return
    }
    try {
      await fetch("/api/barangays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barangay: newBarangayName }),
      })
      setNewBarangayName("")
      await loadBarangays()
      toast({ title: "Success", description: "Barangay added." })
    } catch (error) {
      console.error("Error adding barangay:", error)
      toast({ title: "Error", description: "Failed to add barangay.", variant: "destructive" })
    }
  }

  const handleUpdateBarangay = async (oldBarangay: string) => {
    if (!newBarangayName.trim()) {
      toast({ title: "Error", description: "Barangay name cannot be empty.", variant: "destructive" })
      return
    }
    try {
      await fetch("/api/barangays", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldBarangay, newBarangay: newBarangayName }),
      })
      setEditingBarangay(null)
      setNewBarangayName("")
      await loadBarangays()
      await loadBarangayPricing()
      toast({ title: "Success", description: "Barangay updated." })
    } catch (error) {
      console.error("Error updating barangay:", error)
      toast({ title: "Error", description: "Failed to update barangay.", variant: "destructive" })
    }
  }

  const handleDeleteBarangay = async (barangay: string) => {
    if (confirm(`Are you sure you want to delete ${barangay}? This will remove all its pricing data.`)) {
      try {
        await fetch("/api/barangays", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barangay }),
        })
        await loadBarangays()
        await loadBarangayPricing()
        toast({ title: "Success", description: "Barangay deleted." })
      } catch (error) {
        console.error("Error deleting barangay:", error)
        toast({ title: "Error", description: "Failed to delete barangay.", variant: "destructive" })
      }
    }
  }

  const loadBarangayPricing = async () => {
    try {
      const response = await fetch("/api/barangay-pricing")
      if (response.ok) {
        const data = await response.json()
        setBarangayPricing(data)
      }
    } catch (error) {
      console.error("Error loading barangay pricing:", error)
      toast({
        title: "Error",
        description: "Failed to load barangay pricing. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadBarangays = async () => {
    try {
      const response = await fetch("/api/barangays")
      if (response.ok) {
        const data = await response.json()
        setBarangays(data)
      }
    } catch (error) {
      console.error("Error loading barangays:", error)
      toast({
        title: "Error",
        description: "Failed to load barangays. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadPriceHistory = async () => {
    try {
      const response = await fetch("/api/price-history")
      if (response.ok) {
        const data = await response.json()
        setPriceHistory(
          data.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp).toLocaleString(),
            oldPrice: Number.parseFloat(item.old_price),
            newPrice: Number.parseFloat(item.new_price),
          })),
        )
      }
    } catch (error) {
      console.error("Error loading price history:", error)
    }
  }

  const addPriceHistory = async (change: Omit<PriceChange, "timestamp">) => {
    try {
      await fetch("/api/price-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material: change.material,
          unit: change.unit,
          oldPrice: change.old_price,
          newPrice: change.new_price,
          action: change.action,
          barangay: change.barangay,
        }),
      })
      loadPriceHistory()
    } catch (error) {
      console.error("Error adding price history:", error)
    }
  }

  const deletePriceHistory = async (days = 30) => {
    try {
      const response = await fetch(`/api/price-history?days=${days}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "History Cleaned",
          description: `${result.deletedCount} old records deleted to save storage.`,
        })
        loadPriceHistory()
      }
    } catch (error) {
      console.error("Error deleting price history:", error)
      toast({
        title: "Error",
        description: "Failed to clean history. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([loadMaterials(), loadBarangayPricing(), loadPriceHistory(), loadBarangays()])
      setIsLoading(false)
    }
    loadData()

    // Load session from localStorage (sessions are still stored locally for security)
    const savedSession = localStorage.getItem("adminSession")
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        if (Date.now() - session.lastActivity < SESSION_TIMEOUT) {
          setAdminSession({ ...session, isActive: true })
        } else {
          localStorage.removeItem("adminSession")
        }
      } catch (error) {
        localStorage.removeItem("adminSession")
      }
    }
  }, [])

  // Auto-logout timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (adminSession.isActive) {
      timer = setInterval(() => {
        if (Date.now() - adminSession.lastActivity > SESSION_TIMEOUT) {
          handleAdminLogout()
        }
      }, 60000) // Check every minute
    }
    return () => clearInterval(timer)
  }, [adminSession])

  // Update last activity
  useEffect(() => {
    if (adminSession.isActive) {
      const updatedSession = { ...adminSession, lastActivity: Date.now() }
      setAdminSession(updatedSession)
      localStorage.setItem("adminSession", JSON.stringify(updatedSession))
    }
  }, [materials, activeTab, barangayPricing])

  // Get price for specific barangay
  const getPriceForBarangay = (materialId: string, unitValue: string, basePrice: number, barangay: string): number => {
    if (!barangay || !barangayPricing[barangay]) return basePrice

    const barangayData = barangayPricing[barangay]
    if (!barangayData[materialId] || !barangayData[materialId][unitValue]) return basePrice

    const pricingData = barangayData[materialId][unitValue]

    // Use fixed price if set, otherwise apply multiplier
    if (pricingData.fixedPrice !== undefined) {
      return pricingData.fixedPrice
    }

    return Math.round(basePrice * pricingData.multiplier)
  }

  // Update price when material or unit changes
  useEffect(() => {
    if (selectedMaterial && selectedUnit) {
      const material = materials.find((m) => m.id === selectedMaterial && m.available)
      const unit = material?.units.find((u) => u.value === selectedUnit && u.available)
      if (unit) {
        const finalPrice = getPriceForBarangay(selectedMaterial, selectedUnit, unit.price, customerInfo.barangay)
        setCurrentPrice(finalPrice)
      }
    }
  }, [selectedMaterial, selectedUnit, materials, customerInfo.barangay, barangayPricing])

  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterial(materialId)
    setSelectedUnit("")
    setCurrentPrice(0)
  }

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string | Date | undefined) => {
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addToOrder = () => {
    if (!selectedMaterial || !selectedUnit || quantity <= 0) return

    const material = materials.find((m) => m.id === selectedMaterial && m.available)
    const unit = material?.units.find((u) => u.value === selectedUnit && u.available)

    if (!material || !unit) return

    const finalPrice = getPriceForBarangay(selectedMaterial, selectedUnit, unit.price, customerInfo.barangay)

    const newItem: OrderItem = {
      id: Date.now().toString(),
      materialId: selectedMaterial,
      materialName: material.name,
      unit: selectedUnit,
      unitLabel: unit.label,
      quantity,
      pricePerUnit: finalPrice,
      total: quantity * finalPrice,
    }

    setOrderItems([...orderItems, newItem])

    toast({
      title: "Item Added",
      description: `${material.name} (${unit.label}) added to order`,
    })

    // Reset form
    setSelectedMaterial("")
    setSelectedUnit("")
    setQuantity(1)
    setCurrentPrice(0)
  }

  const removeItem = (itemId: string) => {
    const item = orderItems.find((item) => item.id === itemId)
    setOrderItems(orderItems.filter((item) => item.id !== itemId))

    if (item) {
      toast({
        title: "Item Removed",
        description: `${item.materialName} removed from order`,
      })
    }
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return

    setOrderItems(
      orderItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity, total: newQuantity * item.pricePerUnit } : item,
      ),
    )
  }

  const isCustomerInfoComplete = () => {
    return (
      customerInfo.name.trim() !== "" &&
      customerInfo.contactNumber.trim() !== "" &&
      customerInfo.deliveryDate !== undefined &&
      customerInfo.barangay !== "" &&
      customerInfo.deliveryLocation.trim() !== ""
    )
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0)
  const grandTotal = subtotal

  const generateReceipt = () => {
    if (!isCustomerInfoComplete()) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all customer information fields before proceeding to checkout.",
        variant: "destructive",
      })
      return
    }

    const receiptInfo = {
      date: new Date().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      customerInfo,
      items: orderItems,
      totalItems: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      grandTotal,
      companyInfo: {
        name: "Lozada Construction Aggregates Trading",
        address: "Brgy. Canlapwas Pagsanghan, Samar",
        phone: "09816406490",
        email: "lozadaconst@gmail.com",
      },
    }

    setReceiptData(receiptInfo)
    setShowReceipt(true)

    toast({
      title: "Receipt Generated",
      description: "Your order receipt has been generated successfully!",
    })
  }

  const printReceipt = () => {
    window.print()
  }

  const closeReceipt = () => {
    setShowReceipt(false)
    setReceiptData(null)
  }

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)

  // Filter available materials and units
  const availableMaterials = materials.filter((m) => m.available)
  const selectedMaterialData = availableMaterials.find((m) => m.id === selectedMaterial)
  const availableUnits = selectedMaterialData?.units.filter((u) => u.available) || []

  // Group materials by category for price list (only available ones)
  const materialsByCategory = availableMaterials.reduce(
    (acc, material) => {
      if (!acc[material.category]) {
        acc[material.category] = []
      }
      acc[material.category].push(material)
      return acc
    },
    {} as Record<string, Material[]>,
  )

  // Edit material description
  const handleEditDescription = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId)
    if (material) {
      setEditingMaterial(materialId)
      setEditingDescription(material.description)
    }
  }

  const handleSaveDescription = async (materialId: string) => {
    try {
      const material = materials.find((m) => m.id === materialId)
      if (!material) return

      await fetch("/api/materials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: materialId,
          name: material.name,
          category: material.category,
          description: editingDescription,
        }),
      })

      await loadMaterials()
      setEditingMaterial("")
      setEditingDescription("")

      toast({
        title: "Description Updated",
        description: "Material description has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating material description:", error)
      toast({
        title: "Error",
        description: "Failed to update description. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingMaterial("")
    setEditingDescription("")
  }

  const debouncedUpdateMaterialPrice = useCallback(
    debounce(async (materialId: string, unitValue: string, newPrice: number) => {
      updateMaterialPrice(materialId, unitValue, newPrice)
    }, 500),
    [materials],
  )

  const debouncedUpdateBarangayPricing = useCallback(
    debounce(
      async (barangay: string, materialId: string, unitValue: string, multiplier: number, fixedPrice?: number) => {
        updateBarangayPricing(barangay, materialId, unitValue, multiplier, fixedPrice)
      },
      500,
    ),
    [materials, barangayPricing],
  )

  // Admin functions
  const handleAdminLogin = async () => {
    if (isLocked) {
      toast({
        title: "Account Locked",
        description: "Too many failed attempts. Please wait before trying again.",
        variant: "destructive",
      })
      return
    }

    const hashedInput = hashPassword(adminPassword)

    try {
      const response = await fetch("/api/admin-settings?key=admin_password_hash")

      // Ensure we actually received a successful JSON response
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      let data: { value: string | null }
      try {
        data = await response.json()
      } catch (err) {
        console.error("Invalid JSON returned from /api/admin-settings", err)
        toast({
          title: "Server Error",
          description: "Unexpected response from the server. Please try again later.",
          variant: "destructive",
        })
        return
      }

      const savedPasswordHash = data.value || btoa("LozadaAdmin2024!" + "construction_salt_2024")

      if (hashedInput === savedPasswordHash) {
        const sessionId = generateSessionId()
        const newSession: AdminSession = {
          isActive: true,
          loginTime: Date.now(),
          lastActivity: Date.now(),
          sessionId,
        }

        setAdminSession(newSession)
        localStorage.setItem("adminSession", JSON.stringify(newSession))
        setShowAdminDialog(false)
        setAdminPassword("")
        setLoginAttempts(0)

        toast({
          title: "Admin Login Successful",
          description: "Welcome to admin mode. You can now manage materials and pricing.",
        })

        // Log admin login
        await addPriceHistory({
          material: "System",
          unit: "Admin Login",
          old_price: 0,
          new_price: 0,
          action: "login",
        })
      } else {
        const newAttempts = loginAttempts + 1
        setLoginAttempts(newAttempts)

        if (newAttempts >= 3) {
          setIsLocked(true)
          setTimeout(() => {
            setIsLocked(false)
            setLoginAttempts(0)
          }, 300000) // 5 minutes lockout

          toast({
            title: "Account Locked",
            description: "Too many failed attempts. Access locked for 5 minutes.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Login Failed",
            description: `Incorrect password! ${3 - newAttempts} attempts remaining.`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error during login:", error)
      toast({
        title: "Login Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      })
    }
    setAdminPassword("")
  }

  const handleAdminLogout = () => {
    setAdminSession({
      isActive: false,
      loginTime: 0,
      lastActivity: 0,
      sessionId: "",
    })
    localStorage.removeItem("adminSession")

    toast({
      title: "Admin Logout",
      description: "You have been logged out of admin mode.",
    })

    if (pendingChanges) {
      if (confirm("You have unsaved changes. They will be lost if you logout.")) {
        setPendingChanges(false)
      }
    }
  }

  const handleChangePassword = async () => {
    try {
      const response = await fetch("/api/admin-settings?key=admin_password_hash")
      const data = await response.json()
      const currentHash = data.value || btoa("LozadaAdmin2024!" + "construction_salt_2024")

      if (hashPassword(currentPasswordInput) !== currentHash) {
        toast({
          title: "Invalid Password",
          description: "Current password is incorrect!",
          variant: "destructive",
        })
        return
      }

      if (newPassword.length < 8) {
        toast({
          title: "Password Too Short",
          description: "New password must be at least 8 characters long!",
          variant: "destructive",
        })
        return
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "New passwords do not match!",
          variant: "destructive",
        })
        return
      }

      const newHash = hashPassword(newPassword)
      await fetch("/api/admin-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "admin_password_hash", value: newHash }),
      })

      // Log password change
      await addPriceHistory({
        material: "System",
        unit: "Password Changed",
        old_price: 0,
        new_price: 0,
        action: "password_change",
      })

      toast({
        title: "Password Changed",
        description: "Password changed successfully!",
      })

      setShowChangePassword(false)
      setCurrentPasswordInput("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateMaterialPrice = async (materialId: string, unitValue: string, newPrice: number) => {
    if (!adminSession.isActive) return

    // Validate price
    if (newPrice < 0 || newPrice > 1000000) {
      toast({
        title: "Invalid Price",
        description: "Price must be between 0 and 1,000,000",
        variant: "destructive",
      })
      return
    }

    try {
      const material = materials.find((m) => m.id === materialId)
      const unit = material?.units.find((u) => u.value === unitValue)
      const oldPrice = unit?.price || 0

      await fetch("/api/material-units", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, value: unitValue, price: newPrice }),
      })

      // Add to price history
      await addPriceHistory({
        material: material?.name || "Unknown",
        unit: unit?.label || "Unknown",
        old_price: oldPrice,
        new_price: newPrice,
        action: "price_update",
      })

      await loadMaterials()

      toast({
        title: "Price Updated",
        description: `${material?.name} ${unit?.label} price updated to ₱${newPrice.toLocaleString()}`,
      })
    } catch (error) {
      console.error("Error updating material price:", error)
      toast({
        title: "Error",
        description: "Failed to update price. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateBarangayPricing = async (
    barangay: string,
    materialId: string,
    unitValue: string,
    multiplier: number,
    fixedPrice?: number,
  ) => {
    if (!adminSession.isActive) return

    try {
      const response = await fetch("/api/barangay-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barangay, materialId, unitValue, multiplier, fixedPrice }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update: ${response.status}`)
      }

      // Log barangay pricing change
      const material = materials.find((m) => m.id === materialId)
      const unit = material?.units.find((u) => u.value === unitValue)

      await addPriceHistory({
        material: material?.name || "Unknown",
        unit: unit?.label || "Unknown",
        old_price: 0,
        new_price: fixedPrice || (unit?.price || 0) * multiplier,
        action: "barangay_pricing",
        barangay,
      })

      await loadBarangayPricing()

      toast({
        title: "Barangay Pricing Updated",
        description: `${barangay} pricing updated for ${material?.name}`,
      })
    } catch (error) {
      console.error("Error updating barangay pricing:", error)
      toast({
        title: "Error",
        description: "Failed to update barangay pricing. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getBarangayPricing = (barangay: string, materialId: string, unitValue: string) => {
    if (
      !barangayPricing[barangay] ||
      !barangayPricing[barangay][materialId] ||
      !barangayPricing[barangay][materialId][unitValue]
    ) {
      return { multiplier: 1.0, fixedPrice: undefined }
    }
    return barangayPricing[barangay][materialId][unitValue]
  }

  const toggleMaterialAvailability = async (materialId: string) => {
    if (!adminSession.isActive) return

    try {
      const material = materials.find((m) => m.id === materialId)
      const newAvailability = !material?.available

      await fetch("/api/materials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: materialId, available: newAvailability }),
      })

      await addPriceHistory({
        material: material?.name || "Unknown",
        unit: "Material Availability",
        old_price: material?.available ? 1 : 0,
        new_price: newAvailability ? 1 : 0,
        action: "availability_toggle",
      })

      await loadMaterials()

      toast({
        title: "Availability Updated",
        description: `${material?.name} is now ${newAvailability ? "available" : "unavailable"}`,
      })
    } catch (error) {
      console.error("Error toggling material availability:", error)
      toast({
        title: "Error",
        description: "Failed to update material availability. Please try again.",
        variant: "destructive",
      })
    }
  }

  const toggleUnitAvailability = async (materialId: string, unitValue: string) => {
    if (!adminSession.isActive) return

    try {
      const material = materials.find((m) => m.id === materialId)
      const unit = material?.units.find((u) => u.value === unitValue)
      const newAvailability = !unit?.available

      await fetch("/api/material-units", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, value: unitValue, available: newAvailability }),
      })

      await addPriceHistory({
        material: material?.name || "Unknown",
        unit: `${unit?.label || "Unknown"} Availability`,
        old_price: unit?.available ? 1 : 0,
        new_price: newAvailability ? 1 : 0,
        action: "availability_toggle",
      })

      await loadMaterials()

      toast({
        title: "Unit Availability Updated",
        description: `${material?.name} ${unit?.label} is now ${newAvailability ? "available" : "unavailable"}`,
      })
    } catch (error) {
      console.error("Error toggling unit availability:", error)
      toast({
        title: "Error",
        description: "Failed to update unit availability. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetPrices = async () => {
    if (!adminSession.isActive) return

    if (
      confirm(
        "Are you sure you want to reset all prices and availability to default values? This will reload the page.",
      )
    ) {
      try {
        // This would require a special API endpoint to reset to defaults
        // For now, we'll just reload the page and let the user know
        await addPriceHistory({
          material: "All Materials",
          unit: "Reset to Default",
          old_price: 0,
          new_price: 0,
          action: "reset",
        })

        toast({
          title: "Reset Requested",
          description: "Please run the database seed script to reset to default values.",
        })
      } catch (error) {
        console.error("Error resetting prices:", error)
        toast({
          title: "Error",
          description: "Failed to reset prices. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const exportPrices = () => {
    let csv = "Material,Category,Unit,Base Price,Available"

    // Add barangay columns
    barangays.forEach((barangay) => {
      csv += `,${barangay} Price`
    })
    csv += "\n"

    materials.forEach((material) => {
      material.units.forEach((unit) => {
        csv += `"${material.name}","${material.category}","${unit.label}",${unit.price},${
          unit.available ? "Yes" : "No"
        }`

        // Add barangay prices
        barangays.forEach((barangay) => {
          const finalPrice = getPriceForBarangay(material.id, unit.value, unit.price, barangay)
          csv += `,${finalPrice}`
        })
        csv += "\n"
      })
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `construction_prices_with_barangay_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Price list has been exported successfully.",
    })
  }

  const handleCreateMaterial = async () => {
    if (!newMaterialName || !newMaterialCategory || !newMaterialDescription) {
      toast({
        title: "Missing Information",
        description: "Please fill in all material details.",
        variant: "destructive",
      })
      return
    }

    try {
      const materialId = newMaterialName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")

      await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: materialId,
          name: newMaterialName,
          category: newMaterialCategory,
          description: newMaterialDescription,
        }),
      })

      setNewMaterialName("")
      setNewMaterialCategory("")
      setNewMaterialDescription("")
      await loadMaterials()

      toast({
        title: "Material Created",
        description: `${newMaterialName} has been created successfully.`,
      })
    } catch (error) {
      console.error("Error creating material:", error)
      toast({
        title: "Error",
        description: "Failed to create material. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    const material = materials.find((m) => m.id === materialId)

    if (confirm("Are you sure you want to delete this material? This will also delete all its units.")) {
      try {
        await fetch("/api/materials", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: materialId }),
        })

        await loadMaterials()

        toast({
          title: "Material Deleted",
          description: `${material?.name} has been deleted successfully.`,
        })
      } catch (error) {
        console.error("Error deleting material:", error)
        toast({
          title: "Error",
          description: "Failed to delete material. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleCreateUnit = async () => {
    if (!selectedMaterialForUnit || !newUnitLabel || !newUnitPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill in all unit details.",
        variant: "destructive",
      })
      return
    }

    if (newUnitPrice < 0 || newUnitPrice > 1000000) {
      toast({
        title: "Invalid Price",
        description: "Price must be between 0 and 1,000,000",
        variant: "destructive",
      })
      return
    }

    // Auto-generate unit value from label
    const unitValue = newUnitLabel
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

    try {
      await fetch("/api/material-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: selectedMaterialForUnit,
          value: unitValue,
          label: newUnitLabel,
          price: newUnitPrice,
        }),
      })

      const material = materials.find((m) => m.id === selectedMaterialForUnit)

      setSelectedMaterialForUnit("")
      setNewUnitLabel("")
      setNewUnitPrice(0)
      await loadMaterials()

      toast({
        title: "Unit Created",
        description: `${newUnitLabel} unit created for ${material?.name}.`,
      })
    } catch (error) {
      console.error("Error creating unit:", error)
      toast({
        title: "Error",
        description: "Failed to create unit. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUnit = async (materialId: string, unitValue: string) => {
    const material = materials.find((m) => m.id === materialId)
    const unit = material?.units.find((u) => u.value === unitValue)

    if (confirm("Are you sure you want to delete this unit?")) {
      try {
        await fetch("/api/material-units", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId, value: unitValue }),
        })

        await loadMaterials()

        toast({
          title: "Unit Deleted",
          description: `${unit?.label} unit deleted from ${material?.name}.`,
        })
      } catch (error) {
        console.error("Error deleting unit:", error)
        toast({
          title: "Error",
          description: "Failed to delete unit. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading construction materials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">LOZADACONSTRUCTION</h1>
              <p className="text-xs text-gray-600">Aggregates Trading</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/about">
              <Button variant="ghost" size="sm">
                <Info className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="border-t bg-white p-4 space-y-2">
            <Link href="/" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
            <Link href="/about" className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
              <Info className="h-4 w-4" />
              <span className="text-sm">About Us</span>
            </Link>
            <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-100">
              <Phone className="h-4 w-4" />
              <span className="text-sm">09816406490</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin Toggle Button */}
      <div className="fixed top-4 right-4 z-40 lg:block hidden">
        {!adminSession.isActive ? (
          <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700" disabled={isLocked}>
                <Settings className="h-4 w-4 mr-2" />
                {isLocked ? "Locked" : "Admin Mode"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Secure Admin Login
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {loginAttempts > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {loginAttempts} failed attempt(s). {3 - loginAttempts} remaining.
                    </AlertDescription>
                  </Alert>
                )}
                <div>
                  <Label htmlFor="adminPassword">Admin Password</Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                      disabled={isLocked}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button onClick={handleAdminLogin} className="w-full" disabled={isLocked}>
                  <Shield className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="flex gap-2">
            <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Change Admin Password
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>
                  <div>
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button onClick={handleChangePassword} className="w-full">
                    Change Password
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="bg-red-600 text-white hover:bg-red-700" onClick={handleAdminLogout}>
              <Shield className="h-4 w-4 mr-2" />
              Exit Admin
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Admin Buttons */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        {!adminSession.isActive ? (
          <Button
            variant="outline"
            className="bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
            disabled={isLocked}
            onClick={() => setShowAdminDialog(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
              onClick={() => setShowChangePassword(true)}
            >
              <Key className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="bg-red-600 text-white hover:bg-red-700 shadow-lg"
              onClick={handleAdminLogout}
            >
              <Shield className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Desktop Header */}
        <div className="mb-8 hidden lg:block">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                LOZADACONSTRUCTION
                <Database className="h-6 w-6 text-green-600" />
                {adminSession.isActive && (
                  <Badge variant="destructive" className="ml-3">
                    ADMIN MODE
                  </Badge>
                )}
              </h1>
              <p className="text-gray-600">Brgy. Canlapwas Pagsanghan, Samar</p>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Connected to database - All changes are automatically saved
                </p>
                <Link href="/about">
                  <Button variant="outline" size="sm">
                    <Info className="h-4 w-4 mr-2" />
                    About Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Notice */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Pricing Information:</strong> All prices displayed are based on our Local barangay address. Prices
            may vary for other locations. Select your barangay to see location-specific pricing.
          </AlertDescription>
        </Alert>

        {/* Admin Panel */}
        {adminSession.isActive && (
          <Card className="mb-8 border-2 border-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Admin Panel - Database Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={adminActiveTab} onValueChange={setAdminActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
                  <TabsTrigger value="inventory" className="text-xs lg:text-sm">
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger value="materials" className="text-xs lg:text-sm">
                    Materials
                  </TabsTrigger>
                  <TabsTrigger value="barangay" className="text-xs lg:text-sm">
                    Barangay
                  </TabsTrigger>
                  <TabsTrigger value="barangay-pricing" className="text-xs lg:text-sm">
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs lg:text-sm">
                    Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="inventory" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Material & Price Management</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {materials.map((material) => (
                        <div key={material.id} className="border rounded-lg p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-2 gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold">{material.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {editingMaterial === material.id ? (
                                  <div className="flex items-center gap-2 flex-1">
                                    <Textarea
                                      value={editingDescription}
                                      onChange={(e) => setEditingDescription(e.target.value)}
                                      className="text-sm min-h-[60px]"
                                      placeholder="Enter description..."
                                    />
                                    <div className="flex flex-col gap-1">
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveDescription(material.id)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        className="h-8 w-8 p-0 bg-transparent"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start gap-2 flex-1">
                                    <p className="text-sm text-gray-600 flex-1">{material.description}</p>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditDescription(material.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Available:</Label>
                              <Switch
                                checked={material.available}
                                onCheckedChange={() => toggleMaterialAvailability(material.id)}
                              />
                              {material.available ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-red-600" />
                              )}
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(material.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {material.units.map((unit) => (
                              <div
                                key={unit.value}
                                className="flex flex-col lg:flex-row lg:items-center gap-2 p-2 bg-gray-50 rounded"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <Switch
                                    checked={unit.available}
                                    onCheckedChange={() => toggleUnitAvailability(material.id, unit.value)}
                                    size="sm"
                                  />
                                  <Label className="w-20 lg:w-24 text-sm">{unit.label}:</Label>
                                  <Input
                                    type="number"
                                    defaultValue={unit.price}
                                    onChange={(e) =>
                                      debouncedUpdateMaterialPrice(material.id, unit.value, Number(e.target.value))
                                    }
                                    className="w-24 lg:w-32"
                                    min="0"
                                    max="1000000"
                                    step="0.01"
                                    disabled={!unit.available}
                                  />
                                  <span className="text-sm text-gray-500">₱</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {unit.available ? (
                                    <Eye className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-red-600" />
                                  )}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteUnit(material.id, unit.value)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col lg:flex-row gap-2">
                      <Button onClick={resetPrices} variant="outline">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset to Default
                      </Button>
                      <Button onClick={exportPrices} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="materials" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Create New Material</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newMaterialName">Material Name</Label>
                        <Input
                          type="text"
                          id="newMaterialName"
                          value={newMaterialName}
                          onChange={(e) => setNewMaterialName(e.target.value)}
                          placeholder="Enter material name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newMaterialCategory">Material Category</Label>
                        <Select value={newMaterialCategory} onValueChange={setNewMaterialCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="newMaterialDescription">Material Description</Label>
                      <Textarea
                        id="newMaterialDescription"
                        value={newMaterialDescription}
                        onChange={(e) => setNewMaterialDescription(e.target.value)}
                        placeholder="Enter material description"
                      />
                    </div>
                    <Button onClick={handleCreateMaterial}>Create Material</Button>

                    <Separator className="my-4" />

                    <h3 className="font-semibold text-lg">Create New Unit for Material</h3>
                    <Select value={selectedMaterialForUnit} onValueChange={setSelectedMaterialForUnit}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedMaterialForUnit && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="newUnitLabel">Unit Label</Label>
                          <Input
                            type="text"
                            id="newUnitLabel"
                            value={newUnitLabel}
                            onChange={(e) => setNewUnitLabel(e.target.value)}
                            placeholder="Enter unit label (e.g., Pieces)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newUnitPrice">Unit Price</Label>
                          <Input
                            type="number"
                            id="newUnitPrice"
                            value={newUnitPrice}
                            onChange={(e) => setNewUnitPrice(Number(e.target.value))}
                            placeholder="Enter unit price"
                          />
                        </div>
                        <Button onClick={handleCreateUnit}>Create Unit</Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="barangay" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Manage Barangays</h3>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="New barangay name"
                        value={newBarangayName}
                        onChange={(e) => setNewBarangayName(e.target.value)}
                      />
                      <Button onClick={handleAddBarangay}>Add</Button>
                    </div>
                    <div className="space-y-2">
                      {barangays.map((barangay) => (
                        <div key={barangay} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          {editingBarangay === barangay ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                defaultValue={barangay}
                                onChange={(e) => setNewBarangayName(e.target.value)}
                                autoFocus
                              />
                              <Button size="sm" onClick={() => handleUpdateBarangay(barangay)}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingBarangay(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span>{barangay}</span>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => setEditingBarangay(barangay)}>
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteBarangay(barangay)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="barangay-pricing" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <h3 className="font-semibold text-lg">Barangay-Specific Pricing</h3>
                      <Select value={selectedBarangayForPricing} onValueChange={setSelectedBarangayForPricing}>
                        <SelectTrigger className="w-full lg:w-48">
                          <SelectValue placeholder="Select Barangay" />
                        </SelectTrigger>
                        <SelectContent>
                          {barangays.map((barangay) => (
                            <SelectItem key={barangay} value={barangay}>
                              {barangay}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedBarangayForPricing && (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        <Alert>
                          <Percent className="h-4 w-4" />
                          <AlertDescription>
                            Set multipliers (1.0 = base price, 1.1 = 10% increase, 0.9 = 10% discount) or fixed prices
                            for {selectedBarangayForPricing}.
                          </AlertDescription>
                        </Alert>

                        {materials
                          .filter((m) => m.available)
                          .map((material) => (
                            <div key={material.id} className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-2">{material.name}</h4>
                              <div className="space-y-2">
                                {material.units
                                  .filter((u) => u.available)
                                  .map((unit) => {
                                    const pricing = getBarangayPricing(
                                      selectedBarangayForPricing,
                                      material.id,
                                      unit.value,
                                    )
                                    const finalPrice = getPriceForBarangay(
                                      material.id,
                                      unit.value,
                                      unit.price,
                                      selectedBarangayForPricing,
                                    )

                                    return (
                                      <div
                                        key={unit.value}
                                        className="grid grid-cols-1 lg:grid-cols-5 gap-2 items-center p-2 bg-gray-50 rounded"
                                      >
                                        <Label className="text-sm">{unit.label}</Label>
                                        <div className="text-sm text-gray-600">
                                          Base: ₱{unit.price.toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            defaultValue={pricing.multiplier}
                                            onChange={(e) =>
                                              debouncedUpdateBarangayPricing(
                                                selectedBarangayForPricing,
                                                material.id,
                                                unit.value,
                                                Number(e.target.value),
                                                pricing.fixedPrice,
                                              )
                                            }
                                            className="w-20"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                          />
                                          <span className="text-xs">×</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            defaultValue={pricing.fixedPrice || ""}
                                            onChange={(e) =>
                                              debouncedUpdateBarangayPricing(
                                                selectedBarangayForPricing,
                                                material.id,
                                                unit.value,
                                                pricing.multiplier,
                                                e.target.value ? Number(e.target.value) : undefined,
                                              )
                                            }
                                            className="w-24"
                                            placeholder="Fixed ₱"
                                            min="0"
                                          />
                                        </div>
                                        <div className="text-sm font-semibold text-green-600">
                                          Final: ₱{finalPrice.toLocaleString()}
                                        </div>
                                      </div>
                                    )
                                  })}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Activity Log</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePriceHistory(30)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Clean 30+ days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePriceHistory(7)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clean 7+ days
                        </Button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {priceHistory.length === 0 ? (
                        <p className="text-gray-500 text-sm">No activities recorded yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {priceHistory.slice(0, 20).map((change, index) => (
                            <div key={index} className="border-b border-gray-200 pb-2">
                              <div className="text-xs text-gray-500">{change.timestamp}</div>
                              <div className="text-sm">
                                <strong>{change.material}</strong> - {change.unit}:
                                {change.action === "login" && (
                                  <span className="text-blue-600 ml-1">Admin logged in</span>
                                )}
                                {change.action === "password_change" && (
                                  <span className="text-purple-600 ml-1">Password changed</span>
                                )}
                                {change.action === "reset" && (
                                  <span className="text-purple-600 ml-1">Reset to default</span>
                                )}
                                {change.action === "availability_toggle" && (
                                  <span className="text-orange-600 ml-1">
                                    {change.new_price === 1 ? "Made available" : "Made unavailable"}
                                  </span>
                                )}
                                {change.action === "price_update" && (
                                  <>
                                    <span className="text-red-600 ml-1">₱{change.old_price.toLocaleString()}</span>
                                    <span className="mx-1">→</span>
                                    <span className="text-green-600">₱{change.new_price.toLocaleString()}</span>
                                  </>
                                )}
                                {change.action === "barangay_pricing" && (
                                  <>
                                    <span className="text-blue-600 ml-1">
                                      {change.barangay} pricing: ₱{change.new_price.toLocaleString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Session: {adminSession.sessionId.substring(0, 8)}... | Active:{" "}
                      {Math.floor((Date.now() - adminSession.loginTime) / 60000)}m
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content Area with Tabs */}
          <div className="xl:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="order" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Order Materials</span>
                  <span className="sm:hidden">Order</span>
                </TabsTrigger>
                <TabsTrigger value="prices" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden sm:inline">Price List</span>
                  <span className="sm:hidden">Prices</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="order" className="space-y-6 mt-6">
                {/* Customer Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">Full Name *</Label>
                        <Input
                          id="customerName"
                          type="text"
                          placeholder="Enter your full name"
                          value={customerInfo.name}
                          onChange={(e) => handleCustomerInfoChange("name", e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactNumber">Contact Number *</Label>
                        <Input
                          id="contactNumber"
                          type="tel"
                          placeholder="+63 9XX XXX XXXX"
                          value={customerInfo.contactNumber}
                          onChange={(e) => handleCustomerInfoChange("contactNumber", e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Delivery Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !customerInfo.deliveryDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customerInfo.deliveryDate ? (
                              format(customerInfo.deliveryDate, "PPP")
                            ) : (
                              <span>Pick a delivery date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
  <PopoverContent className="w-auto" align="start">
                          <Calendar
                            mode="single"
                            selected={customerInfo.deliveryDate}
                            onSelect={(date) => handleCustomerInfoChange("deliveryDate", date)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barangay">Barangay *</Label>
                      <Select
                        value={customerInfo.barangay}
                        onValueChange={(value) => handleCustomerInfoChange("barangay", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Barangay" />
                        </SelectTrigger>
                        <SelectContent>
                          {barangays.map((barangay) => (
                            <SelectItem key={barangay} value={barangay}>
                              {barangay}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryLocation">Complete Address *</Label>
                      <Textarea
                        id="deliveryLocation"
                        placeholder="Enter complete delivery address including street, landmarks, etc."
                        value={customerInfo.deliveryLocation}
                        onChange={(e) => handleCustomerInfoChange("deliveryLocation", e.target.value)}
                        className="w-full min-h-[80px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Materials Selection Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add Materials
                      {customerInfo.barangay && (
                        <Badge variant="outline" className="text-xs">
                          Prices for {customerInfo.barangay}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Material Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="material">Select Material</Label>
                      <Select value={selectedMaterial} onValueChange={handleMaterialChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a construction material" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMaterials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{material.name}</span>
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {material.category}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Unit Selection */}
                    {selectedMaterialData && availableUnits.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="unit">Select Unit</Label>
                        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose unit of measurement" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUnits.map((unit) => {
                              const finalPrice = getPriceForBarangay(
                                selectedMaterial,
                                unit.value,
                                unit.price,
                                customerInfo.barangay,
                              )
                              return (
                                <SelectItem key={unit.value} value={unit.value}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{unit.label}</span>
                                    <span className="ml-2">₱{finalPrice.toLocaleString()}</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedMaterialData && availableUnits.length === 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          No units available for this material. Please contact us for availability.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Quantity Input */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                        className="w-full"
                      />
                    </div>

                    {/* Price Preview */}
                    {currentPrice > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Price per unit:</span>
                          <span className="font-semibold">₱{currentPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600">Subtotal ({quantity} units):</span>
                          <span className="font-bold text-lg text-blue-600">
                            ₱{(currentPrice * quantity).toLocaleString()}
                          </span>
                        </div>
                        {customerInfo.barangay && selectedMaterialData && selectedUnit && (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <div className="flex justify-between items-center text-xs text-gray-600">
                              <span>Base price:</span>
                              <span>
                                ₱
                                {selectedMaterialData.units
                                  .find((u) => u.value === selectedUnit)
                                  ?.price.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-blue-600">
                              <span>{customerInfo.barangay} price:</span>
                              <span>₱{currentPrice.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={addToOrder}
                      className="w-full"
                      disabled={!selectedMaterial || !selectedUnit || quantity <= 0 || availableUnits.length === 0}
                    >
                      Add to Order
                    </Button>
                  </CardContent>
                </Card>

                {/* Order Items List */}
                {orderItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orderItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
                          >
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.materialName}</h4>
                              <p className="text-sm text-gray-600">{item.unitLabel}</p>
                              <p className="text-sm text-gray-500">₱{item.pricePerUnit.toLocaleString()} per unit</p>
                            </div>
                            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`qty-${item.id}`} className="text-sm">
                                  Qty:
                                </Label>
                                <Input
                                  id={`qty-${item.id}`}
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                              </div>
                              <div className="text-right min-w-[100px]">
                                <p className="font-bold">₱{item.total.toLocaleString()}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="prices" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Current Price List
                      {customerInfo.barangay && (
                        <Badge variant="outline" className="text-xs">
                          Showing prices for {customerInfo.barangay}
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600">All prices are in Philippine Peso (₱) and subject to change</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(materialsByCategory).map(([category, categoryMaterials]) => (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="outline" className="text-sm font-semibold">
                              {category}
                            </Badge>
                            <Separator className="flex-1" />
                          </div>
                          <div className="grid gap-4">
                            {categoryMaterials.map((material) => (
                              <div
                                key={material.id}
                                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-semibold text-lg">{material.name}</h4>
                                    <p className="text-sm text-gray-600">{material.description}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-3">
                                  {material.units
                                    .filter((unit) => unit.available)
                                    .map((unit) => {
                                      const finalPrice = getPriceForBarangay(
                                        material.id,
                                        unit.value,
                                        unit.price,
                                        customerInfo.barangay,
                                      )
                                      const isDiscounted = finalPrice < unit.price
                                      const isIncreased = finalPrice > unit.price

                                      return (
                                        <div
                                          key={unit.value}
                                          className="flex justify-between items-center p-2 bg-white rounded border"
                                        >
                                          <span className="text-sm font-medium">{unit.label}</span>
                                          <div className="flex items-center gap-2">
                                            {customerInfo.barangay && finalPrice !== unit.price && (
                                              <span className="text-xs text-gray-400 line-through">
                                                ₱{unit.price.toLocaleString()}
                                              </span>
                                            )}
                                            <span
                                              className={`font-bold ${
                                                isDiscounted
                                                  ? "text-green-600"
                                                  : isIncreased
                                                    ? "text-orange-600"
                                                    : "text-green-600"
                                              }`}
                                            >
                                              ₱{finalPrice.toLocaleString()}
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    })}
                                </div>
                                {material.units.filter((unit) => unit.available).length === 0 && (
                                  <div className="text-center py-4 text-gray-500">
                                    <p className="text-sm">Currently unavailable</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Prices may vary based on location and market conditions.
                        {customerInfo.barangay && " Current prices shown are specific to your selected barangay."}{" "}
                        Contact us for special pricing on large quantities.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Auto-Computation Panel */}
          <div className="xl:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Customer Info Summary */}
                  {(customerInfo.name ||
                    customerInfo.contactNumber ||
                    customerInfo.deliveryDate ||
                    customerInfo.barangay ||
                    customerInfo.deliveryLocation) && (
                    <>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Customer Details:</h4>
                        {customerInfo.name && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600 truncate">{customerInfo.name}</span>
                          </div>
                        )}
                        {customerInfo.contactNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">{customerInfo.contactNumber}</span>
                          </div>
                        )}
                        {customerInfo.deliveryDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">{format(customerInfo.deliveryDate, "PPP")}</span>
                          </div>
                        )}
                        {customerInfo.barangay && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">{customerInfo.barangay}</span>
                          </div>
                        )}
                        {customerInfo.deliveryLocation && (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-3 w-3 text-gray-500 mt-0.5" />
                            <span className="text-gray-600 text-xs leading-relaxed">
                              {customerInfo.deliveryLocation.length > 50
                                ? `${customerInfo.deliveryLocation.substring(0, 50)}...`
                                : customerInfo.deliveryLocation}
                            </span>
                          </div>
                        )}
                      </div>
                      <Separator />
                    </>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Items:</span>
                    <span className="font-semibold">{totalItems}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Number of Types:</span>
                    <span className="font-semibold">{orderItems.length}</span>
                  </div>

                  <Separator />

                  {/* Itemized breakdown */}
                  {orderItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Breakdown:</h4>
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate">
                            {item.materialName} ({item.quantity})
                          </span>
                          <span>₱{item.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Grand Total:</span>
                    <span className="font-bold text-xl text-green-600">₱{grandTotal.toLocaleString()}</span>
                  </div>

                  <Button
                    className="w-full mt-4"
                    size="lg"
                    onClick={generateReceipt}
                    disabled={orderItems.length === 0 || !isCustomerInfoComplete()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>

                  {orderItems.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No items added yet</p>
                      <p className="text-gray-400 text-xs mt-1">Add materials to see calculations</p>
                    </div>
                  )}

                  {orderItems.length > 0 && !isCustomerInfoComplete() && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Please fill in all customer information fields before proceeding.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Receipt Modal */}
        {showReceipt && receiptData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
              {/* Print Styles */}
              <style jsx>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .receipt-content, .receipt-content * {
                    visibility: visible;
                  }
                  .receipt-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}</style>

              {/* Receipt Header - No Print */}
              <div className="no-print flex justify-between items-center p-4 border-b bg-white">
                <h2 className="text-xl font-bold">Order Receipt</h2>
                <div className="flex gap-2">
                  <Button onClick={printReceipt} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Print Receipt
                  </Button>
                  <Button onClick={closeReceipt} variant="outline">
                    Close
                  </Button>
                </div>
              </div>

              {/* Receipt Content - Scrollable */}
              <div className="receipt-content flex-1 overflow-y-auto p-8">
                {/* Company Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">{receiptData.companyInfo.name}</h1>
                  <p className="text-gray-600 mt-1">{receiptData.companyInfo.address}</p>
                  <div className="flex justify-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {receiptData.companyInfo.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {receiptData.companyInfo.email}
                    </span>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Date Info */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      Date & Time:
                    </p>
                    <p className="font-semibold">{receiptData.date}</p>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Customer Information */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Customer Name:
                        </p>
                        <p className="font-semibold">{receiptData.customerInfo.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Contact Number:
                        </p>
                        <p className="font-semibold">{receiptData.customerInfo.contactNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          Delivery Date:
                        </p>
                        <p className="font-semibold">
                          {receiptData.customerInfo.deliveryDate
                            ? format(receiptData.customerInfo.deliveryDate, "PPP")
                            : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Barangay:
                        </p>
                        <p className="font-semibold">{receiptData.customerInfo.barangay}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Complete Address:
                      </p>
                      <p className="font-semibold">{receiptData.customerInfo.deliveryLocation}</p>
                    </div>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Items Table */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Details
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold">Item</th>
                          <th className="text-left p-3 text-sm font-semibold">Unit</th>
                          <th className="text-right p-3 text-sm font-semibold">Qty</th>
                          <th className="text-right p-3 text-sm font-semibold">Unit Price</th>
                          <th className="text-right p-3 text-sm font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receiptData.items.map((item: OrderItem, index: number) => (
                          <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-25"}>
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{item.materialName}</p>
                              </div>
                            </td>
                            <td className="p-3 text-sm text-gray-600">{item.unitLabel}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right">₱{item.pricePerUnit.toLocaleString()}</td>
                            <td className="p-3 text-right font-semibold">₱{item.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-semibold">₱{receiptData.subtotal.toLocaleString()}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between py-2">
                        <span className="text-lg font-semibold">Grand Total:</span>
                        <span className="text-xl font-bold text-green-600">
                          ₱{receiptData.grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
                  <p className="mb-2">Thank you for your order, {receiptData.customerInfo.name}!</p>
                  <p>
                    We will deliver your materials to {receiptData.customerInfo.barangay} on{" "}
                    {receiptData.customerInfo.deliveryDate
                      ? format(receiptData.customerInfo.deliveryDate, "PPP")
                      : "the specified date"}
                  </p>
                  <p className="mt-2">For inquiries, please contact us at {receiptData.companyInfo.phone}</p>
                  <p className="mt-4 text-xs">This is a computer-generated receipt.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
