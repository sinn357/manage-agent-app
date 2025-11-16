import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 각 테스트 후 자동으로 cleanup
afterEach(() => {
  cleanup();
});
