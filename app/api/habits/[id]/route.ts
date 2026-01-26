import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PATCH: 습관 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates = { ...body };

    if (!id) {
      return NextResponse.json({ success: false, error: 'Habit ID is required' }, { status: 400 });
    }

    const existing = await prisma.habit.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Habit not found' }, { status: 404 });
    }

    if (updates.recurrenceDays && Array.isArray(updates.recurrenceDays)) {
      updates.recurrenceDays = JSON.stringify(updates.recurrenceDays);
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, habit });
  } catch (error) {
    console.error('Update habit error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update habit' },
      { status: 500 }
    );
  }
}

// DELETE: 습관 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Habit ID is required' }, { status: 400 });
    }

    const existing = await prisma.habit.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Habit not found' }, { status: 404 });
    }

    await prisma.habit.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete habit error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}
