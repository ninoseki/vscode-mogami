import { tryCatch } from "fp-ts/TaskEither";
import pmap from "p-map";

import { GetPackageFnType } from "@/types";

export async function getPackages({
  names,
  concurrency = 5,
  getPackage,
}: {
  names: string[];
  concurrency?: number;
  getPackage: GetPackageFnType;
}) {
  const tasks = names.map((name) =>
    tryCatch(
      () => getPackage(name),
      (e: unknown) => e,
    ),
  );
  return await pmap(tasks, (t) => t(), { concurrency });
}
