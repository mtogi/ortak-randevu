"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  civilDateToUtcDate,
  clockToMinutes,
  createService,
  parseIsoDate,
  regenerateAllActiveServices,
  replaceWeeklyHours,
  upsertException,
  ValidationError,
} from "@/lib/availability";
import { prisma } from "@/lib/db/client";
import { getActiveProviderById } from "@/lib/identity";

async function providerIdOrLogin(): Promise<string> {
  const session = await auth();
  if (!session?.providerId) redirect("/login");
  const provider = await getActiveProviderById(prisma, session.providerId);
  if (!provider) redirect("/login");
  return provider.id;
}

function fail(code: string): never {
  redirect(`/me/availability?error=${encodeURIComponent(code)}`);
}

export async function saveWeeklyHoursAction(formData: FormData) {
  const providerId = await providerIdOrLogin();
  const windows: { weekday: number; startMinute: number; endMinute: number }[] = [];
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const start = String(formData.get(`start-${weekday}`) ?? "").trim();
    const end = String(formData.get(`end-${weekday}`) ?? "").trim();
    if (!start && !end) continue;
    const startMinute = clockToMinutes(start);
    const endMinute = clockToMinutes(end);
    if (startMinute == null || endMinute == null) fail("WINDOW_NOT_GRID");
    windows.push({ weekday, startMinute, endMinute });
  }
  try {
    await replaceWeeklyHours(prisma, providerId, windows);
    await regenerateAllActiveServices(prisma, providerId);
  } catch (error) {
    if (error instanceof ValidationError) fail(error.code);
    throw error;
  }
  redirect("/me/availability?saved=hours");
}

export async function createServiceAction(formData: FormData) {
  const providerId = await providerIdOrLogin();
  try {
    await createService(prisma, providerId, {
      title: String(formData.get("title") ?? ""),
      durationMinutes: Number(formData.get("durationMinutes")),
    });
    await regenerateAllActiveServices(prisma, providerId);
  } catch (error) {
    if (error instanceof ValidationError) fail(error.code);
    throw error;
  }
  redirect("/me/availability?saved=service");
}

export async function addClosedDayAction(formData: FormData) {
  const providerId = await providerIdOrLogin();
  const civil = parseIsoDate(String(formData.get("date") ?? ""));
  if (!civil) fail("DATE_INVALID");
  try {
    await upsertException(prisma, providerId, {
      date: civilDateToUtcDate(civil),
      isClosed: true,
      startMinute: null,
      endMinute: null,
    });
    await regenerateAllActiveServices(prisma, providerId);
  } catch (error) {
    if (error instanceof ValidationError) fail(error.code);
    throw error;
  }
  redirect("/me/availability?saved=exception");
}
