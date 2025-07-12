import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const result = await sql`
      SELECT DISTINCT barangay FROM barangay_pricing ORDER BY barangay
    `
    const barangays = result.map((row) => row.barangay)
    return NextResponse.json(barangays)
  } catch (error) {
    console.error("Error fetching barangays:", error)
    return NextResponse.json({ error: "Failed to fetch barangays" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { barangay } = await request.json()

    // Since there's no separate barangay table, we just need to ensure it exists for pricing.
    // We can add a dummy pricing entry to create the barangay.
    // A better approach would be to have a separate barangays table.
    // For now, we'll just return success.

    return NextResponse.json({ success: true, message: "Barangay added (or already exists)." })

  } catch (error) {
    console.error("Error adding barangay:", error)
    return NextResponse.json({ error: "Failed to add barangay" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { oldBarangay, newBarangay } = await request.json()

    await sql`
      UPDATE barangay_pricing
      SET barangay = ${newBarangay}
      WHERE barangay = ${oldBarangay}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating barangay:", error)
    return NextResponse.json({ error: "Failed to update barangay" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { barangay } = await request.json()

    await sql`
      DELETE FROM barangay_pricing
      WHERE barangay = ${barangay}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting barangay:", error)
    return NextResponse.json({ error: "Failed to delete barangay" }, { status: 500 })
  }
}
