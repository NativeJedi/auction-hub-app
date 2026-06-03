import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBidDto } from './bid.dto';

describe('CreateBidDto', () => {
  const validPayload = { amount: 100, lotId: 'lot-abc' };

  async function validatePayload(data: Record<string, unknown>) {
    const instance = plainToInstance(CreateBidDto, data);
    return validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  }

  it('accepts a valid positive number amount and a non-empty lotId', async () => {
    const errors = await validatePayload(validPayload);

    expect(errors).toHaveLength(0);
  });

  it('rejects amount = 0', async () => {
    const errors = await validatePayload({ ...validPayload, amount: 0 });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('amount');
  });

  it('rejects a negative amount', async () => {
    const errors = await validatePayload({ ...validPayload, amount: -50 });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('amount');
  });

  it('rejects a non-numeric amount (string)', async () => {
    const errors = await validatePayload({
      ...validPayload,
      amount: 'one hundred',
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('amount');
  });

  it('rejects a missing amount', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { amount: _a, ...withoutAmount } = validPayload;
    const errors = await validatePayload(
      withoutAmount as Record<string, unknown>,
    );

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'amount')).toBe(true);
  });

  it('rejects a missing lotId', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lotId: _l, ...withoutLotId } = validPayload;
    const errors = await validatePayload(
      withoutLotId as Record<string, unknown>,
    );

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'lotId')).toBe(true);
  });

  it('rejects an empty-string lotId', async () => {
    const errors = await validatePayload({ ...validPayload, lotId: '' });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('lotId');
  });

  it('rejects unknown extra fields (forbidNonWhitelisted behaviour)', async () => {
    const errors = await validatePayload({ ...validPayload, hackerField: 'x' });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'hackerField')).toBe(true);
  });
});
