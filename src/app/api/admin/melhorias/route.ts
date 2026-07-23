import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("admin_improvements")
      .orderBy("proposedAt", "desc")
      .get();
      
    const improvements = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        proposedAt: data.proposedAt?.toDate()?.toISOString(),
        executedAt: data.executedAt?.toDate()?.toISOString(),
      };
    });
    return NextResponse.json({ improvements });
  } catch (error) {
    console.error("Error fetching improvements:", error);
    return NextResponse.json({ error: "Failed to fetch improvements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, proposedBy } = body;
    
    if (!title || !description || !proposedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = await adminDb.collection("admin_improvements").add({
      title,
      description,
      proposedBy,
      status: "pending",
      proposedAt: new Date(),
    });

    return NextResponse.json({ id: docRef.id, success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating improvement:", error);
    return NextResponse.json({ error: "Failed to create improvement" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, description, status, executedBy, executedAt } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (executedBy !== undefined) updateData.executedBy = executedBy;
    if (executedAt !== undefined) updateData.executedAt = new Date(executedAt);

    await adminDb.collection("admin_improvements").doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating improvement:", error);
    return NextResponse.json({ error: "Failed to update improvement" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await adminDb.collection("admin_improvements").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting improvement:", error);
    return NextResponse.json({ error: "Failed to delete improvement" }, { status: 500 });
  }
}
