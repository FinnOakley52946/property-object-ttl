import { z } from "zod";
import { infrai } from "./infrai-client.ts";

export const propertyObjectSchema = z.object({
  kind: z.enum(["maintenance-request", "tenant-document", "inspection-reminder"]),
  objectKey: z.string().min(1),
  createdAt: z.coerce.date(),
  ttlDays: z.number().int().positive(),
});
export type PropertyObject = z.infer<typeof propertyObjectSchema>;

export function shouldExpire(item: PropertyObject, now: Date): boolean {
  const expiresAt = item.createdAt.getTime() + item.ttlDays * 86_400_000;
  return now.getTime() >= expiresAt;
}

const BUCKET = "property-throwaways";
const SWEEP_URL = "https://example.invalid/property-ttl/sweep";

export async function configurePropertyTtl(): Promise<void> {
  await infrai.storage.bucket.create({ name: BUCKET });
  await infrai.storage.bucket.set_lifecycle(BUCKET, {
    rules: [
      { prefix: "maintenance/", expire_days: 30 },
      { prefix: "tenant-documents/", expire_days: 365 },
      { prefix: "inspection-reminders/", expire_days: 14 },
    ],
  });
  await infrai.cron.create({ cron_expr: "0 3 * * *", task: SWEEP_URL });
}

export function parsePropertyObject(input: unknown): PropertyObject {
  return propertyObjectSchema.parse(input);
}

if (process.argv[1]?.endsWith("property-lifecycle.ts")) {
  const sample = parsePropertyObject({ kind: "inspection-reminder", objectKey: "inspection-reminders/unit-12", createdAt: "2026-10-01", ttlDays: 14 });
  console.log({ objectKey: sample.objectKey, expired: shouldExpire(sample, new Date("2026-10-15T00:00:00Z")) });
  await configurePropertyTtl();
}
