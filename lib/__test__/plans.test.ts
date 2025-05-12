import { expect } from "@jest/globals";
import { calculateRemainingPages, Plans } from "../Plans";


describe('calculateRemainingPages', () => {
  const makeConns = (conns: { id: string, files?: { totalPages?: number }[] }[]) => conns;

  it('calculates remaining pages correctly (excluding currentConnectionId)', () => {
    const conns = makeConns([
      { id: 'a', files: [{ totalPages: 5 }] },
      { id: 'b', files: [{ totalPages: 3 }] },
    ]);
    const result = calculateRemainingPages(Plans.FREE, conns, 'a');
    // Only 'b' is counted: 10 - 3 = 7
    expect(result).toBe(7);
  });

  it('throws if all pages are already used', () => {
    const conns = makeConns([
      { id: 'x', files: [{ totalPages: 5 }] },
      { id: 'y', files: [{ totalPages: 5 }] },
    ]);
    expect(() => calculateRemainingPages(Plans.FREE, conns)).toThrow(/reached your processing limits/);
  });

  it('throws if requested pageLimit exceeds remaining pages', () => {
    const conns = makeConns([
      { id: 'c', files: [{ totalPages: 2 }] }
    ]);
    expect(() => calculateRemainingPages(Plans.FREE, conns, undefined, '9')).toThrow(/only allows 8 more pages/);
  });

  it('returns pageLimit if within remainingPages', () => {
    const conns = makeConns([
      { id: 'c', files: [{ totalPages: 2 }] }
    ]);
    const result = calculateRemainingPages(Plans.FREE, conns, undefined, '5');
    expect(result).toBe(5);
  });

  it('returns remainingPages if pageLimit not given', () => {
    const conns = makeConns([
      { id: 'c', files: [{ totalPages: 7 }] }
    ]);
    const result = calculateRemainingPages(Plans.FREE, conns);
    expect(result).toBe(3);
  });

  it('treats undefined or empty file arrays as 0', () => {
    const conns = makeConns([
      { id: 'a', files: undefined },
      { id: 'b' }
    ]);
    const result = calculateRemainingPages(Plans.BASIC, conns);
    expect(result).toBe(50);
  });

  it('includes all connections if currentConnectionId not provided', () => {
    const conns = makeConns([
      { id: 'x', files: [{ totalPages: 20 }] },
      { id: 'y', files: [{ totalPages: 10 }] }
    ]);
    const result = calculateRemainingPages(Plans.BASIC, conns);
    expect(result).toBe(20); // 50 - (20 + 10)
  });

  it('works correctly when currentConnectionId matches no one (no exclusion)', () => {
    const conns = makeConns([
      { id: '1', files: [{ totalPages: 10 }] }
    ]);
    const result = calculateRemainingPages(Plans.BASIC, conns, 'nonexistent');
    expect(result).toBe(40);
  });

  it('works with large/infinite plans like PRO or OS', () => {
    const conns = makeConns([
      { id: 'pro1', files: [{ totalPages: 999 }] },
      { id: 'pro2', files: [{ totalPages: 500 }] }
    ]);
    // OS plan has infinite pages
    const result = calculateRemainingPages(Plans.OS, conns);
    expect(result).toBe(Infinity);
  });

  it('allows full usage of page budget with exact match', () => {
    const conns = makeConns([
      { id: 'a', files: [{ totalPages: 5 }] }
    ]);
    // With 5 pages already used, 5 remaining. Ask for 5:
    const result = calculateRemainingPages(Plans.FREE, conns, undefined, '5');
    expect(result).toBe(5);
  });
});

