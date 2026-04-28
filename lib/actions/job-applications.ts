"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "../auth/auth";
import connectDB from "../db";
import { Board, Column, JobApplication } from "../models";

interface JobApplicationData {
  company: string;
  position: string;
  location?: string;
  notes?: string;
  salary?: string;
  jobUrl?: string;
  columnId: string;
  boardId: string;
  tags?: string[];
  description?: string;
}

export async function createJobApplication(data: JobApplicationData) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  await connectDB();

  let {
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    columnId,
    boardId,
    tags,
    description,
  } = data;

  // Trim values
  company = company?.trim();
  position = position?.trim();
  location = location?.trim() || "";
  notes = notes?.trim() || "";
  salary = salary?.trim() || "";
  jobUrl = jobUrl?.trim() || "";
  description = description?.trim() || "";

  if (!company || !position || !columnId || !boardId) {
    return { error: "Missing required fields" };
  }

  // Minimum length validation
  if (company.length < 2) {
    return { error: "Company name must be at least 2 characters" };
  }

  if (position.length < 2) {
    return { error: "Position must be at least 2 characters" };
  }

  // Salary validation (numeric only)
  if (salary && (!/^\d+$/.test(salary) || Number(salary) <= 0)) {
    return { error: "Salary must be a valid number greater than 0" };
  }

  // URL validation
  if (jobUrl) {
    const urlPattern = /^(https?:\/\/)/i;

    if (!urlPattern.test(jobUrl)) {
      return {
        error: "Job URL must start with http:// or https://",
      };
    }
  }

  // Description validation
  if (description.length > 500) {
    return { error: "Description cannot exceed 500 characters" };
  }

  // Notes validation
  if (notes.length > 1000) {
    return { error: "Notes cannot exceed 1000 characters" };
  }

  // Duplicate prevention
  const existingJob = await JobApplication.findOne({
    userId: session.user.id,
    company,
    position,
  });

  if (existingJob) {
    return {
      error: "This job application already exists",
    };
  }

  // Verify board ownership
  const board = await Board.findOne({
    _id: boardId,
    userId: session.user.id,
  });

  if (!board) {
    return { error: "Board not found" };
  }

  // Verify column belongs to board
  const column = await Column.findOne({
    _id: columnId,
    boardId: boardId,
  });

  if (!column) {
    return { error: "Column not found" };
  }

  const maxOrder = (await JobApplication.findOne({ columnId })
    .sort({ order: -1 })
    .select("order")
    .lean()) as { order: number } | null;

  const jobApplication = await JobApplication.create({
    company,
    position,
    location,
    notes,
    salary,
    jobUrl,
    columnId,
    boardId,
    userId: session.user.id,
    tags: tags || [],
    description,
    status: "applied",
    order: maxOrder ? maxOrder.order + 1 : 0,
  });

  await Column.findByIdAndUpdate(columnId, {
    $push: { jobApplications: jobApplication._id },
  });

  revalidatePath("/dashboard");

  return { data: JSON.parse(JSON.stringify(jobApplication)) };
}

export async function updateJobApplication(
  id: string,
  updates: {
    company?: string;
    position?: string;
    location?: string;
    notes?: string;
    salary?: string;
    jobUrl?: string;
    columnId?: string;
    order?: number;
    tags?: string[];
    description?: string;
  }
) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  await connectDB();

  const jobApplication = await JobApplication.findById(id);

  if (!jobApplication) {
    return { error: "Job application not found" };
  }

  if (jobApplication.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  // Trim update values
  if (updates.company) updates.company = updates.company.trim();
  if (updates.position) updates.position = updates.position.trim();
  if (updates.location) updates.location = updates.location.trim();
  if (updates.notes) updates.notes = updates.notes.trim();
  if (updates.salary) updates.salary = updates.salary.trim();
  if (updates.jobUrl) updates.jobUrl = updates.jobUrl.trim();
  if (updates.description) updates.description = updates.description.trim();

  // Company validation
  if (updates.company && updates.company.length < 2) {
    return { error: "Company name must be at least 2 characters" };
  }

  // Position validation
  if (updates.position && updates.position.length < 2) {
    return { error: "Position must be at least 2 characters" };
  }

  // Salary validation
  if (
    updates.salary &&
    (!/^\d+$/.test(updates.salary) || Number(updates.salary) <= 0)
  ) {
    return { error: "Salary must be a valid number greater than 0" };
  }

  // URL validation
  if (updates.jobUrl) {
    const urlPattern = /^(https?:\/\/)/i;

    if (!urlPattern.test(updates.jobUrl)) {
      return {
        error: "Job URL must start with http:// or https://",
      };
    }
  }

  // Description validation
  if (updates.description && updates.description.length > 500) {
    return { error: "Description cannot exceed 500 characters" };
  }

  // Notes validation
  if (updates.notes && updates.notes.length > 1000) {
    return { error: "Notes cannot exceed 1000 characters" };
  }

  // Duplicate prevention during update
  const duplicateCheck = await JobApplication.findOne({
    _id: { $ne: id },
    userId: session.user.id,
    company: updates.company || jobApplication.company,
    position: updates.position || jobApplication.position,
  });

  if (duplicateCheck) {
    return {
      error: "This job application already exists",
    };
  }

  const { columnId, order, ...otherUpdates } = updates;

  const updatesToApply: Partial<{
    company: string;
    position: string;
    location: string;
    notes: string;
    salary: string;
    jobUrl: string;
    columnId: string;
    order: number;
    tags: string[];
    description: string;
  }> = otherUpdates;

  const currentColumnId = jobApplication.columnId.toString();
  const newColumnId = columnId?.toString();

  const isMovingToDifferentColumn =
    newColumnId && newColumnId !== currentColumnId;

  if (isMovingToDifferentColumn) {
    await Column.findByIdAndUpdate(currentColumnId, {
      $pull: { jobApplications: id },
    });

    const jobsInTargetColumn = await JobApplication.find({
      columnId: newColumnId,
      _id: { $ne: id },
    })
      .sort({ order: 1 })
      .lean();

    let newOrderValue: number;

    if (order !== undefined && order !== null) {
      newOrderValue = order * 100;

      const jobsThatNeedToShift = jobsInTargetColumn.slice(order);

      for (const job of jobsThatNeedToShift) {
        await JobApplication.findByIdAndUpdate(job._id, {
          $set: { order: job.order + 100 },
        });
      }
    } else {
      if (jobsInTargetColumn.length > 0) {
        const lastJobOrder =
          jobsInTargetColumn[jobsInTargetColumn.length - 1].order || 0;
        newOrderValue = lastJobOrder + 100;
      } else {
        newOrderValue = 0;
      }
    }

    updatesToApply.columnId = newColumnId;
    updatesToApply.order = newOrderValue;

    await Column.findByIdAndUpdate(newColumnId, {
      $push: { jobApplications: id },
    });
  } else if (order !== undefined && order !== null) {
    const otherJobsInColumn = await JobApplication.find({
      columnId: currentColumnId,
      _id: { $ne: id },
    })
      .sort({ order: 1 })
      .lean();

    const currentJobOrder = jobApplication.order || 0;
    const currentPositionIndex = otherJobsInColumn.findIndex(
      (job) => job.order > currentJobOrder
    );

    const oldPositionindex =
      currentPositionIndex === -1
        ? otherJobsInColumn.length
        : currentPositionIndex;

    const newOrderValue = order * 100;

    if (order < oldPositionindex) {
      const jobsToShiftDown = otherJobsInColumn.slice(
        order,
        oldPositionindex
      );

      for (const job of jobsToShiftDown) {
        await JobApplication.findByIdAndUpdate(job._id, {
          $set: { order: job.order + 100 },
        });
      }
    } else if (order > oldPositionindex) {
      const jobsToShiftUp = otherJobsInColumn.slice(
        oldPositionindex,
        order
      );

      for (const job of jobsToShiftUp) {
        const newOrder = Math.max(0, job.order - 100);

        await JobApplication.findByIdAndUpdate(job._id, {
          $set: { order: newOrder },
        });
      }
    }

    updatesToApply.order = newOrderValue;
  }

  const updated = await JobApplication.findByIdAndUpdate(
    id,
    updatesToApply,
    {
      new: true,
    }
  );

  revalidatePath("/dashboard");

  return { data: JSON.parse(JSON.stringify(updated)) };
}

export async function deleteJobApplication(id: string) {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const jobApplication = await JobApplication.findById(id);

  if (!jobApplication) {
    return { error: "Job application not found" };
  }

  if (jobApplication.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  await Column.findByIdAndUpdate(jobApplication.columnId, {
    $pull: { jobApplications: id },
  });

  await JobApplication.deleteOne({ _id: id });

  revalidatePath("/dashboard");

  return { success: true };
}