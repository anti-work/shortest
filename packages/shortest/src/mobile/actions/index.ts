import { MobileElement } from '../core'
import { MobileDriver } from '../core'

export async function tap(driver: MobileDriver, element: MobileElement): Promise<void> {
  await driver.tap(element)
}

export async function type(driver: MobileDriver, element: MobileElement, text: string): Promise<void> {
  await driver.type(element, text)
}

export async function scroll(
  driver: MobileDriver,
  direction: 'up' | 'down',
  amount: number = 0.5
): Promise<void> {
  await driver.scroll(direction, amount)
}

export async function swipe(
  driver: MobileDriver,
  direction: 'left' | 'right' | 'up' | 'down',
  element?: MobileElement
): Promise<void> {
  // Implementation coming soon
}

export async function longPress(
  driver: MobileDriver,
  element: MobileElement,
  duration: number = 1000
): Promise<void> {
  // Implementation coming soon
} 