import { MobileRunnerConfig } from '../../types'
import { UIAutomatorDriver } from './drivers/uiautomator-driver'
import { XCUITestDriver } from './drivers/xcuitest-driver'
import { BaseMobileDriver } from './drivers/base-driver'

export interface MobileElement {
  id: string
  type: string
  text?: string
  enabled: boolean
  visible: boolean
}

export class MobileDriver {
  private config: MobileRunnerConfig
  private driver: BaseMobileDriver

  constructor(config: MobileRunnerConfig) {
    this.config = config
    
    if (config.platform === 'android') {
      this.driver = new UIAutomatorDriver(config)
    } else {
      this.driver = new XCUITestDriver(config)
    }
  }

  async init(): Promise<void> {
    await this.driver.init()
  }

  async findElement(selector: string): Promise<MobileElement | null> {
    return await this.driver.findElement(selector)
  }

  async tap(element: MobileElement): Promise<void> {
    await this.driver.tap(element)
  }

  async type(element: MobileElement, text: string): Promise<void> {
    await this.driver.type(element, text)
  }

  async scroll(direction: 'up' | 'down', amount: number): Promise<void> {
    await this.driver.scroll(direction, amount)
  }

  async quit(): Promise<void> {
    await this.driver.quit()
  }
} 