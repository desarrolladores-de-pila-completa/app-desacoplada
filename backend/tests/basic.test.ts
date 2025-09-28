describe('Backend Tests', () => {
  test('should be able to run basic test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle strings', () => {
    const message = 'Hello World';
    expect(message).toBe('Hello World');
    expect(message).toHaveLength(11);
  });

  test('should handle arrays', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toHaveLength(3);
    expect(fruits).toContain('banana');
  });
});