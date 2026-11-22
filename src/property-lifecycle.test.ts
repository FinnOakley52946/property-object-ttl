import assert from "node:assert/strict";
import { parsePropertyObject, shouldExpire } from "./property-lifecycle.ts";

const now = new Date("2026-10-15T00:00:00Z");
const reminder = parsePropertyObject({ kind: "inspection-reminder", objectKey: "inspection-reminders/unit-12", createdAt: "2026-10-01", ttlDays: 14 });
const document = parsePropertyObject({ kind: "tenant-document", objectKey: "tenant-documents/unit-12/lease.pdf", createdAt: "2025-10-14", ttlDays: 365 });

assert.equal(shouldExpire(reminder, now), true);
assert.equal(shouldExpire(document, now), true);
assert.equal(shouldExpire({ ...reminder, createdAt: new Date("2026-10-02") }, now), false);
console.log("TTL decisions match the property retention policy.");
