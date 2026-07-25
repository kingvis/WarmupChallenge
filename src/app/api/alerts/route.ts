import { NextResponse } from "next/server";

// Static global array in Node process to simulate a real-time database table
let alerts: any[] = [
  {
    id: "alert_1",
    userId: "user_3Gz5rbgru2ATqR9jp1owVFtAcny",
    userName: "Nikhil Sharma",
    severity: "high",
    triggers: ["Repeated negative mood check-in", "Speech distress phrase match"],
    status: "active",
    clinicianNotes: "",
    timestamp: new Date(Date.now() - 30 * 60000).toISOString() // 30 mins ago
  },
  {
    id: "alert_2",
    userId: "user_3Gz6Oercpa4YHoMoWB1YO7fmZTl",
    userName: "Aditya Roy",
    severity: "critical",
    triggers: ["Manual SOS Trigger"],
    status: "escalated",
    clinicianNotes: "Assigned doctor notified. Operations backup SLA timer started.",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString() // 5 mins ago
  }
];

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

    alerts.unshift(newAlert); // add to top of lists
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
