import { NextResponse } from "next/server";
import { getDirections } from "@/lib/geo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromLat = Number(searchParams.get("fromLat"));
  const fromLng = Number(searchParams.get("fromLng"));
  const toLat = Number(searchParams.get("toLat"));
  const toLng = Number(searchParams.get("toLng"));
  if ([fromLat, fromLng, toLat, toLng].some((v) => Number.isNaN(v))) {
    return NextResponse.json({ route: null }, { status: 400 });
  }
  const route = await getDirections({ lat: fromLat, lng: fromLng }, { lat: toLat, lng: toLng });
  return NextResponse.json({ route });
}
