import { commands } from "vscode";

import {
  ProviderActiveStateKey,
  ProviderBusyStateKey,
  ShowStateKey,
} from "@/constants";

export class ContextState<T> {
  private _value?: T;
  private key: string;

  constructor(key: string, defaults?: T) {
    this.key = key;
    this._value = defaults;
  }

  get value() {
    return this._value;
  }

  async change(newValue?: T): Promise<T | undefined> {
    this._value = newValue;
    return await commands.executeCommand("setContext", this.key, newValue);
  }
}

export class CodeLensState {
  show: ContextState<boolean>;
  providerActive: ContextState<string | undefined>;
  providerBusy: ContextState<boolean>;

  constructor() {
    this.show = new ContextState(ShowStateKey, true);
    this.providerActive = new ContextState(ProviderActiveStateKey, undefined);
    this.providerBusy = new ContextState(ProviderBusyStateKey, false);
  }

  async toggleShow() {
    await this.show.change(!this.show.value);
  }

  async clearProviderBusy() {
    await this.providerBusy.change(false);
  }

  async setProviderBusy() {
    await this.providerBusy.change(true);
  }

  async setProviderActive(v?: string) {
    await this.providerActive.change(v);
  }

  async clearProviderActive() {
    await this.providerActive.change(undefined);
  }
}
