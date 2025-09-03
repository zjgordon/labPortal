import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(...classNames: string[]): R;
      toBeDisabled(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
    }
  }
}

// Extend Jest mock types
declare module '@jest/globals' {
  interface Mock<T = any, Y extends any[] = any> {
    mockResolvedValue: (value: T) => Mock<T, Y>;
    mockRejectedValue: (value: any) => Mock<T, Y>;
    mock: {
      calls: Y[];
      instances: T[];
      contexts: any[];
      results: Array<{ type: 'return' | 'throw'; value: any }>;
    };
  }
}

// Extend Jest function mock types
declare global {
  interface Function {
    mock?: {
      calls: any[][];
      instances: any[];
      contexts: any[];
      results: Array<{ type: 'return' | 'throw'; value: any }>;
    };
    mockResolvedValue?: (value: any) => any;
    mockRejectedValue?: (value: any) => any;
    mockImplementation?: (fn: (...args: any[]) => any) => any;
  }
}

export {};
