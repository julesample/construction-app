import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { materialId, value, label, price } = await request.json()

    await sql`
      INSERT INTO material_units (material_id, value, label, price)
      VALUES (${materialId}, ${value}, ${label}, ${price})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating material unit:", error)
    return NextResponse.json({ error: "Failed to create material unit" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { materialId, value, price, available } = await request.json()

    if (price !== undefined) {
      await sql`
        UPDATE material_units 
        SET price = ${price}, updated_at = CURRENT_TIMESTAMP
        WHERE material_id = ${materialId} AND value = ${value}
      `
    }

    if (available !== undefined) {
      await sql`
        UPDATE material_units 
        SET available = ${available}, updated_at = CURRENT_TIMESTAMP
        WHERE material_id = ${materialId} AND value = ${value}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating material unit:", error)
    return NextResponse.json({ error: "Failed to update material unit" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { materialId, value } = await request.json()

    await sql`
      DELETE FROM material_units 
      WHERE material_id = ${materialId} AND value = ${value}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting material unit:", error)
    return NextResponse.json({ error: "Failed to delete material unit" }, { status: 500 })
  }
}
