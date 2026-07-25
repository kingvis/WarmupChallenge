import { NextResponse } from "next/server";

// Static global array in Node process. Starts empty. No assumed alerts are pre-loaded.
let alerts: any[] = [];

export async function GET() {
  return NextResponse.json({ alerts });
}

export async function POST(req: Request) {
  try {
    const { userId, userName, severity, triggers, status, clinicianNotes } = await req.json();

    const newAlert = {
      id: `alert_${Date.now()}`,
      userId: userId || "anonymous",
      userName: userName || "Patient User",
      severity: severity || "moderate",
      triggers: triggers || [],
      status: status || "active",
      clinicianNotes: clinicianNotes || "",
      timestamp: new Date().toISOString()
    };

    alerts.unshift(newAlert);
    return NextResponse.json({ success: true, alert: newAlert });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status, clinicianNotes } = await req.json();

    const alertIdx = alerts.findIndex((a) => a.id === id);
    if (alertIdx !== -1) {
      alerts[alertIdx] = {
        ...alerts[alertIdx],
        status: status || alerts[alertIdx].status,
        clinicianNotes: clinicianNotes ?? alerts[alertIdx].clinicianNotes
      };
      return NextResponse.json({ success: true, alert: alerts[alertIdx] });
    }

    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
