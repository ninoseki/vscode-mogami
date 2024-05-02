import { ResultAsync } from "neverthrow";
import pLimit from "p-limit";

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
  const limit = pLimit(concurrency);
  const input = names.map((name) =>
    limit(() => {
      return ResultAsync.fromPromise(fn(name), (e: unknown) => e);
    }),
  );
  return await Promise.all(input);
}
