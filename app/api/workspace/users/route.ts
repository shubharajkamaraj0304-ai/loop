import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {
  UserRole,
} from "@/app/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/auth/auth-options";
import { isAdmin } from "@/app/lib/auth/permissions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const workspaceId = session.user.workspaceId;

    const users = await prisma.user.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("GET /api/workspace/users failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch workspace users",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const currentUserRole = session.user.role as UserRole;

    // Only ADMIN can manage member roles.
    if (!isAdmin(currentUserRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only administrators can change member roles",
        },
        { status: 403 }
      );
    }

    const workspaceId = session.user.workspaceId;
    const body = await request.json();

    const userId = Number(body.userId);
    const role = body.role;

    if (!Number.isInteger(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID",
        },
        { status: 400 }
      );
    }

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user role",
        },
        { status: 400 }
      );
    }

    // Find the target user inside the current workspace only.
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        workspaceId,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found in your workspace",
        },
        { status: 404 }
      );
    }

    // Prevent the admin from accidentally removing their own admin access.
    if (
      targetUser.id === Number(session.user.id) &&
      role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot remove your own administrator role",
        },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: targetUser.id,
      },
      data: {
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("PATCH /api/workspace/users failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user role",
      },
      { status: 500 }
    );
  }
}