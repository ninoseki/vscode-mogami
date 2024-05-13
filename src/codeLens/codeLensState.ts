import {
  ProviderActiveStateKey,
  ProviderBusyStateKey,
  ShowStateKey,
} from "@/constants";
import { ContextState } from "@/contextState";

export class CodeLensState {
  show: ContextState<boolean>;
  providerActive: ContextState<string | undefined>;
  providerBusy: ContextState<boolean>;

  constructor() {
    this.show = new ContextState(ShowStateKey);
    this.providerActive = new ContextState(ProviderActiveStateKey);
    this.providerBusy = new ContextState(ProviderBusyStateKey);
  }

  async applyDefaults(): Promise<void> {
    await this.show.change(true);
    await this.providerActive.change(undefined);
    await this.providerBusy.change(false);
  }

  async disableShow() {
    await this.show.change(false);
  }

  async enableShow() {
    await this.show.change(true);
  }

  async setProviderBusy() {
    await this.providerBusy.change(true);
  }

  async clearProviderBusy() {
    await this.providerBusy.change(false);
  }

  async setProviderActive(v?: string) {
    await this.providerActive.change(v);
  }

  async clearProviderActive() {
    await this.providerActive.change(undefined);
  }
}
