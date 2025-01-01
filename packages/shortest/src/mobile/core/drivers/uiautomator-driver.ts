import { remote, Browser } from 'webdriverio'
import { AbstractMobileDriver } from './base-driver'
import { MobileElement } from '../mobile-driver'
import { MobileRunnerConfig } from '../../../types'

export class UIAutomatorDriver extends AbstractMobileDriver {
  private driver: Browser | null = null

  constructor(config: MobileRunnerConfig) {
    super(config)
  }

  async init(): Promise<void> {
    const capabilities = {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': this.config.capabilities?.deviceName || 'Android Emulator',
      'appium:platformVersion': this.config.capabilities?.platformVersion || '11.0',
      'appium:app': this.config.capabilities?.app,
      'appium:noReset': this.config.capabilities?.noReset ?? false,
      'appium:fullReset': this.config.capabilities?.fullReset ?? false,
      ...this.config.capabilities
    }

    try {
      this.driver = await remote({
        path: '/wd/hub',
        port: 4723,
        capabilities,
        logLevel: 'error'
      })
    } catch (error) {
      throw new Error(`Failed to initialize UIAutomator driver: ${error}`)
    }
  }

  async findElement(selector: string): Promise<MobileElement | null> {
    try {
      const strategy = this.config.selectorStrategy || 'testID'
      let element: Awaited<ReturnType<Browser['$']>> // TODO: WebdriverIO.Element ??? let's see

      switch (strategy) {
        case 'testID':
          element = await this.driver!.$(`*[@resource-id="${selector}"]`)
          break
        case 'accessibilityLabel':
          element = await this.driver!.$(`*[@content-desc="${selector}"]`)
          break
        case 'text':
          element = await this.driver!.$(`*[@text="${selector}"]`)
          break
        default:
          element = await this.driver!.$(`*[@resource-id="${selector}"]`)
      }

      const isDisplayed = await element.isDisplayed()
      const isEnabled = await element.isEnabled()

      if (!isDisplayed) return null

      return {
        id: await element.elementId,
        type: await element.getTagName(),
        text: await element.getText(),
        enabled: isEnabled,
        visible: isDisplayed
      }
    } catch (error) {
      return null
    }
  }

  async tap(element: MobileElement): Promise<void> {
    try {
      const el = await this.driver!.$(`element=${element.id}`)
      await el.click()
    } catch (error) {
      throw new Error(`Failed to tap element: ${error}`)
    }
  }

  async type(element: MobileElement, text: string): Promise<void> {
    try {
      const el = await this.driver!.$(`element=${element.id}`)
      await el.setValue(text)
    } catch (error) {
      throw new Error(`Failed to type text: ${error}`)
    }
  }

  async scroll(direction: 'up' | 'down', amount: number): Promise<void> {
    try {
      const { width, height } = await this.driver!.getWindowSize()
      const startX = width / 2
      const endX = startX
      
      let startY: number
      let endY: number
      
      if (direction === 'up') {
        startY = height * 0.8
        endY = height * (0.8 - amount)
      } else {
        startY = height * 0.2
        endY = height * (0.2 + amount)
      }

      await this.driver!.touchAction([
        { action: 'press', x: startX, y: startY },
        { action: 'wait', ms: 100 },
        { action: 'moveTo', x: endX, y: endY },
        { action: 'release' }
      ])
    } catch (error) {
      throw new Error(`Failed to scroll: ${error}`)
    }
  }

  async quit(): Promise<void> {
    if (this.driver) {
      await this.driver.deleteSession()
      this.driver = null
    }
  }
} 