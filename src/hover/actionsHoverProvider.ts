import { TextDocument } from "vscode";

import { createProject } from "@/project/actions";

import { AbstractHoverProvider } from "./abstractHoverProvider";

export class ActionsProvider extends AbstractHoverProvider {
  constructor() {
    super(
      ["**/.github/workflows/*.{yml,yaml}"].map((pattern) => {
        return { pattern, scheme: "file" };
      }),
    );
  }

  public createProject(document: TextDocument) {
    return createProject(document);
  }
}
