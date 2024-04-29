import { zipWith } from "fp-ts/Array";
import { err } from "neverthrow";
import pLimit from "p-limit";
import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractCodeLensProvider } from "@/codeLens/abstractCodeLensProvider";
import { DependencyPosType } from "@/schemas";
import { satisfies } from "@/versioning/gem";

import { createCodeLens } from "../codeLensFactory";
import { createDepsPosLines } from "../depsPosLineFactory";

export class BaseGemCodeLensProvider extends AbstractCodeLensProvider {
  private parseFn: (line: string) => DependencyPosType | undefined;

  constructor(
    documentSelector: vscode.DocumentSelector,
    {
      parseFn,
    }: {
      parseFn: (line: string) => DependencyPosType | undefined;
    },
  ) {
    super(documentSelector);
    this.parseFn = parseFn;
  }

  public async provideCodeLenses(document: vscode.TextDocument) {
    const depsPosLines = createDepsPosLines({
      document,
      parseFn: this.parseFn,
    });
    const names = depsPosLines.map((x) => x.name);

    const limit = pLimit(5);
    const input = names.map((name) =>
      limit(() => {
        return API.safeGetGem(name);
      }),
    );
    const results = await Promise.all(input);

    return zipWith(depsPosLines, results, (depPosLine, result) => {
      return { depPosLine, result };
    })
      .map((item) => {
        if (item.result.isErr()) {
          return err("Package not found");
        }
        const { line, pos, name, specifier } = item.depPosLine;
        const pkg = item.result.value;
        return createCodeLens({
          document,
          pkg,
          deps: { name, specifier },
          pos,
          line,
          satisfies,
        });
      })
      .map((result) => {
        return result.unwrapOr(undefined);
      })
      .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
  }
}
