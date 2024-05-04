import { tryCatch } from "fp-ts/TaskEither";
import pmap from "p-map";

import { PackageType } from "@/schemas";

export async function getPackages({
  names,
  concurrency = 5,
  fn,
}: {
  names: string[];
  concurrency?: number;
  fn: (name: string) => Promise<PackageType>;
}) {
  const tasks = names.map((name) =>
    tryCatch(
      () => fn(name),
      (e: unknown) => e,
    ),
  );
  return await pmap(tasks, (t) => t(), { concurrency });
}
