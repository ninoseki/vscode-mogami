import { ProviderActiveStateKey, ProviderBusyStateKey, ShowStateKey } from '@/constants'
import { ContextState } from '@/contextState'

export class CodeLensState {
  show: ContextState<boolean>
  providerActive: ContextState<string | undefined>
  providerBusy: ContextState<boolean>

  private busyCount = 0

  constructor() {
    this.show = new ContextState(ShowStateKey)
    this.providerActive = new ContextState(ProviderActiveStateKey)
    this.providerBusy = new ContextState(ProviderBusyStateKey)
  }

  async applyDefaults(): Promise<void> {
    this.busyCount = 0
    await this.show.change(true)
    await this.providerActive.change(undefined)
    await this.providerBusy.change(false)
  }

  async disableShow() {
    await this.show.change(false)
  }

  async enableShow() {
    await this.show.change(true)
  }

  async setProviderBusy() {
    this.busyCount += 1
    if (this.busyCount === 1) {
      await this.providerBusy.change(true)
    }
  }

  async clearProviderBusy() {
    this.busyCount = Math.max(this.busyCount - 1, 0)
    if (this.busyCount === 0) {
      await this.providerBusy.change(false)
    }
  }

  async setProviderActive(v?: string) {
    await this.providerActive.change(v)
  }

  async clearProviderActive() {
    await this.providerActive.change(undefined)
  }
}
