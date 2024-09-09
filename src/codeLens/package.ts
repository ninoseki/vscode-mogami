import { tryCatch } from "fp-ts/TaskEither";
import pmap from "p-map";

import { getConcurrency } from "@/configuration";
import { PackageClientType } from "@/schemas";

export async function getPackages({
  names,
  client,
}: {
  names: string[];
  client: PackageClientType;
}) {
  const concurrency = getConcurrency();
  const tasks = names.map((name) =>
    tryCatch(
      () => client.get(name),
      (e: unknown) => e,
    ),
  );
  return await pmap(tasks, (t) => t(), { concurrency });
}
