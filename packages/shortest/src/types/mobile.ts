import { MobileDriver } from '../mobile/core/mobile-driver'
import { MobileTool } from '../mobile/core/mobile-tool'
import { BaseConfig } from './config'

export interface MobileToolConfig {
  platform: 'ios' | 'android'
  appPackage?: string
  appActivity?: string
  bundleId?: string
  deviceName?: string
  platformVersion?: string
  automationName?: 'XCUITest' | 'UiAutomator2'
  noReset?: boolean
}

export interface MobileContext {
  driver: MobileDriver
  platform: 'ios' | 'android'
  tool: MobileTool
}

export interface MobileRunnerConfig extends BaseConfig {
  platform: 'ios' | 'android'
  selectorStrategy?: 'testID' | 'accessibilityLabel' | 'text'
  capabilities?: {
    platformName: 'iOS' | 'Android'
    platformVersion: string
    deviceName: string
    app?: string
    automationName?: string
    noReset?: boolean
    fullReset?: boolean
    [key: string]: any
  }
} 