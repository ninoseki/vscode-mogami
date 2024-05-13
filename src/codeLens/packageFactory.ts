import { tryCatch } from "fp-ts/TaskEither";
import pmap from "p-map";

import { PackageClientType } from "@/schemas";

export async function getPackages({
  names,
  concurrency = 5,
  client,
}: {
  names: string[];
  concurrency?: number;
  client: PackageClientType;
}) {
  const tasks = names.map((name) =>
    tryCatch(
      () => client.get(name),
      (e: unknown) => e,
    ),
  );
  return await pmap(tasks, (t) => t(), { concurrency });
}
