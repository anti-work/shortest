import React from 'react'
import { render, screen } from '@testing-library/react'
import { LogView } from './log-view'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockParsedLogs = [
  {
    id: 'group-0',
    name: 'test',
    logs: [
      '1 | Line 1 of file 1',
      '2 | Line 2 of file 1'
    ]
  },
  {
    id: 'group-1',
    name: 'test',
    logs: [
      '1 | Line 1 of file 2',
      '2 | Line 2 of file 2'
    ]
  },
  {
    id: 'group-2',
    name: 'Other',
    logs: [
      '1 | Some other log'
    ]
  }
]

describe('LogView', () => {
  const defaultProps = {
    parsedLogs: mockParsedLogs,
    error: undefined,
    isLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    render(<LogView {...defaultProps} isLoading={true} />)
    expect(screen.getByText('Loading logs...')).toBeInTheDocument()
  })

  it('renders error state', () => {
    render(<LogView {...defaultProps} error={new Error('Test error')} />)
    expect(screen.getByText('Error loading logs: Test error')).toBeInTheDocument()
  })

  it('renders logs and groups correctly', () => {
    render(<LogView {...defaultProps} />)

    expect(screen.getAllByText('test').length).toBe(2)
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('renders empty state when no logs are provided', () => {
    render(<LogView parsedLogs={[]} error={undefined} isLoading={false} />)
    expect(screen.getByText(/No logs available/i)).toBeInTheDocument()
  })
})
