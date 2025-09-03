import { ActionFSM, ActionStateUtils, type ActionStatus } from '../fsm'

describe('ActionFSM', () => {
  describe('Valid Transitions', () => {
    it('should allow queued -> running transition', () => {
      expect(ActionFSM.isValidTransition('queued', 'running')).toBe(true)
      expect(() => ActionFSM.guard('queued', 'running')).not.toThrow()
    })

    it('should allow running -> succeeded transition', () => {
      expect(ActionFSM.isValidTransition('running', 'succeeded')).toBe(true)
      expect(() => ActionFSM.guard('running', 'succeeded')).not.toThrow()
    })

    it('should allow running -> failed transition', () => {
      expect(ActionFSM.isValidTransition('running', 'failed')).toBe(true)
      expect(() => ActionFSM.guard('running', 'failed')).not.toThrow()
    })
  })

  describe('Invalid Transitions', () => {
    it('should reject queued -> succeeded transition', () => {
      expect(ActionFSM.isValidTransition('queued', 'succeeded')).toBe(false)
      expect(() => ActionFSM.guard('queued', 'succeeded')).toThrow(
        'Invalid state transition: queued -> succeeded. Valid transitions from \'queued\': running'
      )
    })

    it('should reject queued -> failed transition', () => {
      expect(ActionFSM.isValidTransition('queued', 'failed')).toBe(false)
      expect(() => ActionFSM.guard('queued', 'failed')).toThrow(
        'Invalid state transition: queued -> failed. Valid transitions from \'queued\': running'
      )
    })

    it('should reject running -> queued transition', () => {
      expect(ActionFSM.isValidTransition('running', 'queued')).toBe(false)
      expect(() => ActionFSM.guard('running', 'queued')).toThrow(
        'Invalid state transition: running -> queued. Valid transitions from \'running\': succeeded, failed'
      )
    })

    it('should reject succeeded -> running transition', () => {
      expect(ActionFSM.isValidTransition('succeeded', 'running')).toBe(false)
      expect(() => ActionFSM.guard('succeeded', 'running')).toThrow(
        'Invalid state transition: succeeded -> running. Valid transitions from \'succeeded\': '
      )
    })

    it('should reject failed -> running transition', () => {
      expect(ActionFSM.isValidTransition('failed', 'running')).toBe(false)
      expect(() => ActionFSM.guard('failed', 'running')).toThrow(
        'Invalid state transition: failed -> running. Valid transitions from \'failed\': '
      )
    })
  })

  describe('State Utilities', () => {
    it('should identify terminal states correctly', () => {
      expect(ActionFSM.isTerminal('queued')).toBe(false)
      expect(ActionFSM.isTerminal('running')).toBe(false)
      expect(ActionFSM.isTerminal('succeeded')).toBe(true)
      expect(ActionFSM.isTerminal('failed')).toBe(true)
    })

    it('should return correct initial state', () => {
      expect(ActionFSM.getInitialState()).toBe('queued')
    })

    it('should return valid target states', () => {
      expect(ActionFSM.getValidTargets('queued')).toEqual(['running'])
      expect(ActionFSM.getValidTargets('running')).toEqual(['succeeded', 'failed'])
      expect(ActionFSM.getValidTargets('succeeded')).toEqual([])
      expect(ActionFSM.getValidTargets('failed')).toEqual([])
    })

    it('should return all valid transitions', () => {
      const transitions = ActionFSM.getAllTransitions()
      expect(transitions).toHaveLength(3)
      expect(transitions).toEqual([
        { from: 'queued', to: 'running', description: 'Action started execution' },
        { from: 'running', to: 'succeeded', description: 'Action completed successfully' },
        { from: 'running', to: 'failed', description: 'Action failed during execution' }
      ])
    })
  })

  describe('Sequence Validation', () => {
    it('should validate valid sequences', () => {
      expect(ActionFSM.validateSequence(['queued', 'running', 'succeeded'])).toBe(true)
      expect(ActionFSM.validateSequence(['queued', 'running', 'failed'])).toBe(true)
      expect(ActionFSM.validateSequence(['queued', 'running'])).toBe(true)
    })

    it('should reject invalid sequences', () => {
      expect(ActionFSM.validateSequence(['queued', 'succeeded'])).toBe(false)
      expect(ActionFSM.validateSequence(['running', 'queued'])).toBe(false)
      expect(ActionFSM.validateSequence(['queued', 'running', 'queued'])).toBe(false)
    })

    it('should handle single state sequences', () => {
      expect(ActionFSM.validateSequence(['queued'])).toBe(true)
      expect(ActionFSM.validateSequence(['running'])).toBe(true)
      expect(ActionFSM.validateSequence(['succeeded'])).toBe(true)
      expect(ActionFSM.validateSequence(['failed'])).toBe(true)
    })

    it('should handle empty sequences', () => {
      expect(ActionFSM.validateSequence([])).toBe(true)
    })
  })

  describe('Transition Descriptions', () => {
    it('should return correct descriptions for valid transitions', () => {
      expect(ActionFSM.getTransitionDescription('queued', 'running')).toBe('Action started execution')
      expect(ActionFSM.getTransitionDescription('running', 'succeeded')).toBe('Action completed successfully')
      expect(ActionFSM.getTransitionDescription('running', 'failed')).toBe('Action failed during execution')
    })

    it('should return null for invalid transitions', () => {
      expect(ActionFSM.getTransitionDescription('queued', 'succeeded')).toBeNull()
      expect(ActionFSM.getTransitionDescription('succeeded', 'running')).toBeNull()
      expect(ActionFSM.getTransitionDescription('invalid', 'running')).toBeNull()
    })
  })
})

describe('ActionStateUtils', () => {
  describe('State Checks', () => {
    it('should check if action can start', () => {
      expect(ActionStateUtils.canStart('queued')).toBe(true)
      expect(ActionStateUtils.canStart('running')).toBe(false)
      expect(ActionStateUtils.canStart('succeeded')).toBe(false)
      expect(ActionStateUtils.canStart('failed')).toBe(false)
    })

    it('should check if action can complete', () => {
      expect(ActionStateUtils.canComplete('queued')).toBe(false)
      expect(ActionStateUtils.canComplete('running')).toBe(true)
      expect(ActionStateUtils.canComplete('succeeded')).toBe(false)
      expect(ActionStateUtils.canComplete('failed')).toBe(false)
    })

    it('should check if state is final', () => {
      expect(ActionStateUtils.isFinal('queued')).toBe(false)
      expect(ActionStateUtils.isFinal('running')).toBe(false)
      expect(ActionStateUtils.isFinal('succeeded')).toBe(true)
      expect(ActionStateUtils.isFinal('failed')).toBe(true)
    })

    it('should check if state is active', () => {
      expect(ActionStateUtils.isActive('queued')).toBe(true)
      expect(ActionStateUtils.isActive('running')).toBe(true)
      expect(ActionStateUtils.isActive('succeeded')).toBe(false)
      expect(ActionStateUtils.isActive('failed')).toBe(false)
    })
  })

  describe('Next States', () => {
    it('should return next possible states', () => {
      expect(ActionStateUtils.getNextStates('queued')).toEqual(['running'])
      expect(ActionStateUtils.getNextStates('running')).toEqual(['succeeded', 'failed'])
      expect(ActionStateUtils.getNextStates('succeeded')).toEqual([])
      expect(ActionStateUtils.getNextStates('failed')).toEqual([])
    })
  })
})

describe('Edge Cases', () => {
  it('should handle unknown status values gracefully', () => {
    const unknownStatus = 'unknown' as ActionStatus
    expect(ActionFSM.isValidTransition(unknownStatus, 'running')).toBe(false)
    expect(ActionFSM.getValidTargets(unknownStatus)).toEqual([])
    expect(ActionFSM.isTerminal(unknownStatus)).toBe(true)
  })

  it('should provide clear error messages', () => {
    try {
      ActionFSM.guard('queued', 'succeeded')
      fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      if (error instanceof Error) {
        expect(error.message).toContain('Invalid state transition: queued -> succeeded')
        expect(error.message).toContain('Valid transitions from \'queued\': running')
      }
    }
  })
})
