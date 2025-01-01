import { MobileRunnerConfig } from '../../types'
import { MobileDriver } from '../core'

export class MobileManager {
  private driver: MobileDriver | null = null
  private config: MobileRunnerConfig

  constructor(config: MobileRunnerConfig) {
    this.config = config
  }

  async launch(): Promise<MobileDriver> {
    if (!this.driver) {
      this.driver = new MobileDriver(this.config)
      await this.driver.init()
    }
    return this.driver
  }

  async quit(): Promise<void> {
    if (this.driver) {
      await this.driver.quit()
      this.driver = null
    }
  }

  getDriver(): MobileDriver | null {
    return this.driver
  }
} 