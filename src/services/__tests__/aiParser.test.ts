import { parseCommand } from '../aiParser';

describe('AI Parser', () => {
  it('should parse "remind me to call dentist tomorrow at 2 PM"', async () => {
    const result = await parseCommand('remind me to call dentist tomorrow at 2 PM', 'text');
    expect(result.title).toContain('call dentist');
    expect(result.schedule).toBeDefined();
    expect(result.schedule?.datetime.getHours()).toBe(14); // 2 PM
  });

  it('should parse "buy groceries every Monday"', async () => {
    const result = await parseCommand('buy groceries every Monday', 'text');
    expect(result.title).toContain('buy groceries');
    expect(result.recurring).toBeDefined();
  });

  it('should extract energy level from "low energy quick task"', async () => {
    const result = await parseCommand('low energy quick task', 'text');
    expect(result.energyRequired).toBe('low');
  });

  it('should extract critical reminder style', async () => {
    const result = await parseCommand('critical urgent meeting tomorrow', 'text');
    expect(result.reminderStyle).toBe('critical');
  });

  it('should default to tomorrow 10 AM if no time specified', async () => {
    const result = await parseCommand('water the plants', 'text');
    expect(result.schedule).toBeDefined();
    expect(result.schedule?.datetime.getHours()).toBe(10);
  });
});

