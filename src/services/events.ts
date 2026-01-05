/**
 * Event-driven automation system
 * Triggers automation actions based on user actions
 */

import { Responsibility } from '@/types';
import { automationService } from './automation';
import { analyzeResponsibilities } from './aiAnalysis';
import { dynamicAssistantService } from './dynamicAssistant';

export type ResponsibilityEvent =
  | { type: 'created'; responsibility: Responsibility }
  | { type: 'updated'; responsibility: Responsibility; previous: Responsibility }
  | { type: 'completed'; responsibility: Responsibility }
  | { type: 'missed'; responsibility: Responsibility }
  | { type: 'snoozed'; responsibility: Responsibility }
  | { type: 'deleted'; responsibilityId: string };

type EventHandler = (event: ResponsibilityEvent) => Promise<void> | void;

class EventSystem {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register an event handler
   */
  on(eventType: ResponsibilityEvent['type'], handler: EventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Emit an event
   */
  async emit(event: ResponsibilityEvent) {
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }

  /**
   * Remove an event handler
   */
  off(eventType: ResponsibilityEvent['type'], handler: EventHandler) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

export const eventSystem = new EventSystem();

// Register default automation handlers
eventSystem.on('created', async (event) => {
  if (event.type === 'created') {
    // Auto-categorize new responsibility
    await automationService.autoCategorize(event.responsibility);
    
    // Check for conflicts immediately
    await automationService.checkConflicts();
    
    // Suggest optimal scheduling (non-blocking)
    automationService.suggestOptimalTime(event.responsibility).catch(console.error);
  }
});

eventSystem.on('updated', async (event) => {
  if (event.type === 'updated') {
    // Re-check conflicts when schedule changes
    if (event.responsibility.schedule?.datetime && event.previous.schedule?.datetime &&
        event.responsibility.schedule.datetime.getTime() !== event.previous.schedule.datetime.getTime()) {
      await automationService.checkConflicts();
    }
    
    // Re-analyze if energy or priority changed
    if (
      event.responsibility.energyRequired !== event.previous.energyRequired ||
      event.responsibility.reminderStyle !== event.previous.reminderStyle
    ) {
      await automationService.runAnalysisPublic();
    }

    // Trigger dynamic assistant analysis for real-time updates
    await dynamicAssistantService.analyzeAndUpdate();
  }
});

eventSystem.on('completed', async (event) => {
  if (event.type === 'completed') {
    // Learn from completion patterns
    await automationService.learnFromCompletion(event.responsibility);
    
    // Suggest next steps
    await automationService.suggestNextSteps();
    
    // Run analysis to update insights
    await automationService.runAnalysisPublic();
    
    // Trigger dynamic assistant analysis
    await dynamicAssistantService.analyzeAndUpdate();
  }
});

eventSystem.on('missed', async (event) => {
  if (event.type === 'missed') {
    // Learn from missed patterns
    await automationService.learnFromMissed(event.responsibility);
    
    // Suggest rescheduling
    await automationService.suggestRescheduleForMissed(event.responsibility);
    
    // Run analysis
    await automationService.runAnalysisPublic();
  }
});

eventSystem.on('snoozed', async (event) => {
  if (event.type === 'snoozed') {
    // Check if snooze time conflicts with other tasks
    await automationService.checkConflicts();
  }
});

