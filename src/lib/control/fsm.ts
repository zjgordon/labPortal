/**
 * Finite State Machine for Action State Transitions
 * 
 * Ensures safe and consistent state transitions for actions:
 * queued -> running -> succeeded|failed
 * 
 * Guards prevent invalid state transitions and maintain data integrity.
 */

export type ActionStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface StateTransition {
  from: ActionStatus
  to: ActionStatus
  description: string
}

export class ActionFSM {
  private static readonly VALID_TRANSITIONS: StateTransition[] = [
    { from: 'queued', to: 'running', description: 'Action started execution' },
    { from: 'running', to: 'succeeded', description: 'Action completed successfully' },
    { from: 'running', to: 'failed', description: 'Action failed during execution' }
  ]

  private static readonly TRANSITION_MAP = new Map<string, ActionStatus[]>(
    ActionFSM.VALID_TRANSITIONS.reduce((map, transition) => {
      const existing = map.get(transition.from) || []
      existing.push(transition.to)
      map.set(transition.from, existing)
      return map
    }, new Map<string, ActionStatus[]>())
  )

  /**
   * Check if a state transition is valid
   * @param from Current state
   * @param to Target state
   * @returns true if transition is valid, false otherwise
   */
  static isValidTransition(from: ActionStatus, to: ActionStatus): boolean {
    const validTargets = this.TRANSITION_MAP.get(from)
    return validTargets ? validTargets.includes(to) : false
  }

  /**
   * Guard function to validate state transitions
   * @param from Current state
   * @param to Target state
   * @throws Error if transition is invalid
   */
  static guard(from: ActionStatus, to: ActionStatus): void {
    if (!this.isValidTransition(from, to)) {
      const validTargets = this.TRANSITION_MAP.get(from) || []
      throw new Error(
        `Invalid state transition: ${from} -> ${to}. ` +
        `Valid transitions from '${from}': ${validTargets.join(', ')}`
      )
    }
  }

  /**
   * Get all valid target states for a given source state
   * @param from Source state
   * @returns Array of valid target states
   */
  static getValidTargets(from: ActionStatus): ActionStatus[] {
    return this.TRANSITION_MAP.get(from) || []
  }

  /**
   * Get all valid transitions
   * @returns Array of all valid state transitions
   */
  static getAllTransitions(): StateTransition[] {
    return [...this.VALID_TRANSITIONS]
  }

  /**
   * Check if a state is terminal (no further transitions possible)
   * @param state Current state
   * @returns true if state is terminal
   */
  static isTerminal(state: ActionStatus): boolean {
    return !this.TRANSITION_MAP.has(state)
  }

  /**
   * Get the initial state
   * @returns The initial state for actions
   */
  static getInitialState(): ActionStatus {
    return 'queued'
  }

  /**
   * Validate a complete state sequence
   * @param states Array of states to validate
   * @returns true if sequence is valid, false otherwise
   */
  static validateSequence(states: ActionStatus[]): boolean {
    if (states.length < 2) return true

    for (let i = 0; i < states.length - 1; i++) {
      if (!this.isValidTransition(states[i], states[i + 1])) {
        return false
      }
    }
    return true
  }

  /**
   * Get a human-readable description of a transition
   * @param from Source state
   * @param to Target state
   * @returns Description of the transition or null if invalid
   */
  static getTransitionDescription(from: ActionStatus, to: ActionStatus): string | null {
    const transition = this.VALID_TRANSITIONS.find(t => t.from === from && t.to === to)
    return transition ? transition.description : null
  }
}

/**
 * Utility functions for common state operations
 */
export const ActionStateUtils = {
  /**
   * Check if an action can be started (transition from queued to running)
   */
  canStart: (currentStatus: ActionStatus): boolean => 
    ActionFSM.isValidTransition(currentStatus, 'running'),

  /**
   * Check if an action can be completed (transition from running to succeeded/failed)
   */
  canComplete: (currentStatus: ActionStatus): boolean => 
    currentStatus === 'running',

  /**
   * Check if an action is in a final state
   */
  isFinal: (status: ActionStatus): boolean => 
    ActionFSM.isTerminal(status),

  /**
   * Check if an action is active (can still transition)
   */
  isActive: (status: ActionStatus): boolean => 
    !ActionFSM.isTerminal(status),

  /**
   * Get the next possible states for an action
   */
  getNextStates: (currentStatus: ActionStatus): ActionStatus[] => 
    ActionFSM.getValidTargets(currentStatus)
}
