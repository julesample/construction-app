import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "Key parameter required" }, { status: 400 })
    }

    const result = await sql`
      SELECT setting_value as value FROM admin_settings 
      WHERE setting_key = ${key}
    `

    if (result.length === 0) {
      return NextResponse.json({ value: null })
    }

    return NextResponse.json({ value: result[0].value })
  } catch (error) {
    console.error("Error fetching admin setting:", error)
    return NextResponse.json({ error: "Failed to fetch admin setting" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, value } = await request.json()

    await sql`
      INSERT INTO admin_settings (setting_key, setting_value)
      VALUES (${key}, ${value})
      ON CONFLICT (setting_key)
      DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        updated_at = CURRENT_TIMESTAMP
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating admin setting:", error)
    return NextResponse.json({ error: "Failed to update admin setting" }, { status: 500 })
  }
}
