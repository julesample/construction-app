import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const pricing = await sql`
      SELECT barangay, material_id, unit_value, multiplier, fixed_price
      FROM barangay_pricing
      ORDER BY barangay, material_id, unit_value
    `

    // Group by barangay -> material_id -> unit_value
    const groupedPricing: any = {}

    pricing.forEach((row: any) => {
      if (!groupedPricing[row.barangay]) {
        groupedPricing[row.barangay] = {}
      }
      if (!groupedPricing[row.barangay][row.material_id]) {
        groupedPricing[row.barangay][row.material_id] = {}
      }
      groupedPricing[row.barangay][row.material_id][row.unit_value] = {
        multiplier: Number.parseFloat(row.multiplier),
        fixedPrice: row.fixed_price ? Number.parseFloat(row.fixed_price) : undefined,
      }
    })

    return NextResponse.json(groupedPricing)
  } catch (error) {
    console.error("Error fetching barangay pricing:", error)
    return NextResponse.json({ error: "Failed to fetch barangay pricing" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { barangay, materialId, unitValue, multiplier, fixedPrice } = await request.json()

    // Use PostgreSQL UPSERT syntax
    await sql`
      INSERT INTO barangay_pricing (barangay, material_id, unit_value, multiplier, fixed_price)
      VALUES (${barangay}, ${materialId}, ${unitValue}, ${multiplier}, ${fixedPrice})
      ON CONFLICT (barangay, material_id, unit_value)
      DO UPDATE SET 
        multiplier = EXCLUDED.multiplier,
        fixed_price = EXCLUDED.fixed_price,
        updated_at = CURRENT_TIMESTAMP
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating barangay pricing:", error)
    return NextResponse.json({ error: "Failed to update barangay pricing" }, { status: 500 })
  }
}
