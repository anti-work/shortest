import { MobileDriver, MobileElement } from './mobile-driver'
import { MobileManager } from '../manager'
import { MobileToolConfig } from '../../types'
import * as actions from '../actions'

export class MobileTool {
  private driver: MobileDriver
  private manager: MobileManager

  constructor(driver: MobileDriver, manager: MobileManager, config: MobileToolConfig) {
    this.driver = driver
    this.manager = manager
  }

  async findElement(selector: string): Promise<MobileElement | null> {
    return await this.driver.findElement(selector)
  }

  async tap(element: MobileElement): Promise<void> {
    await actions.tap(this.driver, element)
  }

  async type(element: MobileElement, text: string): Promise<void> {
    await actions.type(this.driver, element, text)
  }

  async scroll(direction: 'up' | 'down', amount?: number): Promise<void> {
    await actions.scroll(this.driver, direction, amount)
  }

  async swipe(direction: 'left' | 'right' | 'up' | 'down', element?: MobileElement): Promise<void> {
    await actions.swipe(this.driver, direction, element)
  }

  async longPress(element: MobileElement, duration?: number): Promise<void> {
    await actions.longPress(this.driver, element, duration)
  }

  getDriver(): MobileDriver {
    return this.driver
  }
} 