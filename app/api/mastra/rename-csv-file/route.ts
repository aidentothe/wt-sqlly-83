import { NextResponse } from 'next/server'
import { renameCsvFile } from '@/lib/supabase-server-actions'

export async function POST(request: Request) {
  try {
    const { fileId, newOriginalFilename } = await request.json()

    if (!fileId || typeof fileId !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing fileId' }, { status: 400 })
    }
    if (!newOriginalFilename || typeof newOriginalFilename !== 'string' || newOriginalFilename.trim() === '') {
      return NextResponse.json({ error: 'Invalid or missing newOriginalFilename' }, { status: 400 })
    }

    // Optional: Re-check if the new name is already taken by another file before attempting rename.
    // The supabase function `renameCsvFile` also does this, but an early check here can be good.
    // However, to avoid redundant calls, we rely on the check within `renameCsvFile` for atomicity.

    const result = await renameCsvFile(fileId, newOriginalFilename.trim())

    if (result.success) {
      return NextResponse.json({ message: 'File renamed successfully', updatedFile: result.updatedFile })
    } else {
      // This case should ideally not be reached if renameCsvFile throws errors as expected
      return NextResponse.json({ error: 'Failed to rename file for an unknown reason' }, { status: 500 })
    }

  } catch (error) {
    console.error('[API_RENAME_CSV_FILE] Error:', error)
    let errorMessage = 'Failed to rename file.'
    if (error instanceof Error) {
      errorMessage = error.message // Use specific error message from supabase function
    }
    // Determine status code based on error message (e.g., 409 for conflict)
    if (errorMessage.includes('already exists')) {
        return NextResponse.json({ error: errorMessage }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 