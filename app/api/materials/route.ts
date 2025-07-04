import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const materials = await sql`
      SELECT 
        m.id,
        m.name,
        m.category,
        m.description,
        m.available,
        json_agg(
          json_build_object(
            'value', mu.value,
            'label', mu.label,
            'price', mu.price,
            'available', mu.available
          ) ORDER BY mu.label
        ) FILTER (WHERE mu.value IS NOT NULL) as units
      FROM materials m
      LEFT JOIN material_units mu ON m.id = mu.material_id
      GROUP BY m.id, m.name, m.category, m.description, m.available
      ORDER BY m.category, m.name
    `

    return NextResponse.json(
      materials.map((material) => ({
        ...material,
        units: material.units || [],
      })),
    )
  } catch (error) {
    console.error("Error fetching materials:", error)
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, name, category, description } = await request.json()

    await sql`
      INSERT INTO materials (id, name, category, description)
      VALUES (${id}, ${name}, ${category}, ${description})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating material:", error)
    return NextResponse.json({ error: "Failed to create material" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, category, description, available } = await request.json()

    if (available !== undefined) {
      await sql`
        UPDATE materials 
        SET available = ${available}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE materials 
        SET name = ${name}, category = ${category}, description = ${description}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating material:", error)
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    await sql`DELETE FROM materials WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting material:", error)
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 })
  }
}
