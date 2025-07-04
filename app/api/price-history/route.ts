import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const history = await sql`
      SELECT * FROM price_history 
      ORDER BY timestamp DESC 
      LIMIT 100
    `

    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching price history:", error)
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { material, unit, oldPrice, newPrice, action, barangay } = await request.json()

    await sql`
      INSERT INTO price_history (material, unit, old_price, new_price, action, barangay)
      VALUES (${material}, ${unit}, ${oldPrice}, ${newPrice}, ${action}, ${barangay})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding price history:", error)
    return NextResponse.json({ error: "Failed to add price history" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get("days") || "30"
    const days = Math.max(0, Number.parseInt(daysParam, 10) || 30) // ensure a safe positive integer

    /* -----------------------------------------------------------
       Postgres cannot parameter-substitute inside an INTERVAL
       literal, so we pass the integer as a parameter and multiply
       it by INTERVAL '1 day'.  We also use RETURNING to get the
       number of rows deleted so the client can show a toast.
    ----------------------------------------------------------- */
    const deletedRows = await sql<{ id: number }[]>`DELETE FROM price_history 
       WHERE timestamp < NOW() - ${days} * INTERVAL '1 day'
       RETURNING id`

    const deletedCount = deletedRows.length

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} record${deletedCount === 1 ? "" : "s"} older than ${days} day(s)`,
    })
  } catch (error) {
    console.error("Error deleting price history:", error)
    return NextResponse.json({ error: "Failed to delete price history" }, { status: 500 })
  }
}
