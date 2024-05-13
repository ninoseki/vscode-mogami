import { commands } from "vscode";

export class ContextState<T> {
  private _value!: T;
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  get value() {
    return this._value;
  }

  async change(newValue: T): Promise<T> {
    this._value = newValue;
    return await commands.executeCommand("setContext", this.key, newValue);
  }
}
