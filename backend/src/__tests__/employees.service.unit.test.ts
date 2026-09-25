import { clampPageSize, DEFAULT_PAGE_SIZE } from '../services/employees.service.js';
describe('clampPageSize', () => { it('keeps valid page size', () => expect(clampPageSize(25)).toBe(25)); it('caps a large size at 100', () => expect(clampPageSize(10_000)).toBe(100)); it.each([0, -5, NaN])('defaults invalid size %s', (value) => expect(clampPageSize(value)).toBe(DEFAULT_PAGE_SIZE)); });
