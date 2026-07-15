import { expect, test } from '@playwright/test'

test('renders the cyber map command interface', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Watch the signal move/i })).toBeVisible()
  await expect(page.locator('.simulation-badge')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause simulation' })).toBeVisible()
  await page.getByRole('button', { name: 'Pause simulation' }).click()
  await expect(page.getByRole('button', { name: 'Resume simulation' })).toBeVisible()
  const pausedAt = await page.locator('main').getAttribute('data-simulation-time')
  await page.waitForTimeout(350)
  await expect(page.locator('main')).toHaveAttribute('data-simulation-time', pausedAt!)
})

test('filters and opens event details', async ({ page }) => {
  await page.goto('/')
  const ddos = page.getByRole('button', { name: 'DDoS', exact: true })
  await expect(ddos).toHaveAttribute('aria-pressed', 'true')
  await ddos.click()
  await expect(ddos).toHaveAttribute('aria-pressed', 'false')
  const rows = page.locator('.event-row')
  const rowCount = await rows.count()
  if (rowCount > 0 && await rows.first().isVisible()) {
    await rows.first().click()
    await expect(page.getByText('Synthetic event')).toBeVisible()
  }
})

test('speed controls change telemetry throughput without changing visual density one-for-one', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('globe')).toBeVisible()
  await page.waitForTimeout(600)
  const highSpeed = page.getByRole('button', { name: '2 times simulation speed' })
  await highSpeed.click()
  await expect(highSpeed).toHaveAttribute('aria-pressed', 'true')
  await page.waitForTimeout(1200)
  const generatedRate = Number(await page.locator('main').getAttribute('data-generated-rate'))
  const visualizedRate = Number(await page.locator('main').getAttribute('data-visualized-rate'))
  expect(generatedRate).toBeGreaterThan(0)
  expect(visualizedRate).toBeLessThan(generatedRate)
})

test('selecting an unsampled feed event pins its route on the globe', async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), 'desktop feed interaction')
  await page.goto('/')
  await page.getByRole('button', { name: 'Pause simulation' }).click()
  const visualIds = new Set((await page.getByTestId('globe').getAttribute('data-visual-event-ids') ?? '').split(','))
  const rows = page.locator('.event-row')
  const count = await rows.count()
  let candidate = null as null | ReturnType<typeof rows.nth>
  let candidateId = ''
  for (let index = 0; index < count; index += 1) {
    const row = rows.nth(index)
    const eventId = await row.getAttribute('data-event-id') ?? ''
    if (!visualIds.has(eventId)) {
      candidate = row
      candidateId = eventId
      break
    }
  }
  expect(candidate).not.toBeNull()
  await candidate!.click()
  await expect(page.getByTestId('globe')).toHaveAttribute('data-focus', candidateId)
  await expect(page.getByText('Synthetic event')).toBeVisible()
})

test('mobile event sheet exposes inspectable events', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, 'mobile-only interaction')
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Toggle mobile event stream' })
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  const rows = page.locator('.mobile-sheet-row')
  const count = await rows.count()
  expect(count).toBeGreaterThan(0)
  await rows.first().click()
  await expect(page.getByText('Synthetic event')).toBeVisible()
  await expect(page.getByTestId('globe')).not.toHaveAttribute('data-focus', '')
})
