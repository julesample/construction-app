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

    // Check if the barangay already exists
    const existing = await sql`SELECT 1 FROM barangay_pricing WHERE barangay = ${barangay}`
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "Barangay already exists." }, { status: 400 })
    }

    // Add a dummy pricing entry to create the barangay.
    await sql`
      INSERT INTO barangay_pricing (barangay, material_id, unit_value, multiplier)
      VALUES (${barangay}, 'dummy', 'dummy', 1.0)
    `

    return NextResponse.json({ success: true, message: "Barangay added." })

  } catch (error) {
    console.error("Error adding barangay:", error)
    return NextResponse.json({ error: "Failed to add barangay" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { oldBarangay, newBarangay } = await request.json()

    // Check if the new barangay name already exists
    const existing = await sql`SELECT 1 FROM barangay_pricing WHERE barangay = ${newBarangay}`
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "Barangay already exists." }, { status: 400 })
    }

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

    // also delete the dummy entry if it exists
    await sql`
      DELETE FROM barangay_pricing
      WHERE barangay = ${barangay} AND material_id = 'dummy'
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting barangay:", error)
    return NextResponse.json({ error: "Failed to delete barangay" }, { status: 500 })
  }
}
