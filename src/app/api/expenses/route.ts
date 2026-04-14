import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(
      expenses.map((e) => ({ ...e, date: e.date.toISOString() }))
    );
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title || !body?.category || !body?.amount || !body?.date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const expense = await prisma.expense.create({
      data: {
        title: body.title,
        category: body.category,
        amount: Number(body.amount),
        date: new Date(body.date),
        description: body.description || null,
      },
    });
    return NextResponse.json({ ...expense, date: expense.date.toISOString() }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
