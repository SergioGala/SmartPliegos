import { InMemoryMailProvider } from "./providers/in-memory-mail.provider";

describe('InMemoryMailProvider', () => {
  let provider: InMemoryMailProvider;

  beforeEach(() => {
    provider = new InMemoryMailProvider();
  });

  it('captures one email at a time', async () => {
    const result = await provider.sendEmail({
      to: 'a@test.dev',
      subject: 's',
      html: 'h',
    });
    expect(result.provider).toBe('in-memory');
    expect(result.messageId).toMatch(/^inmem-/);
    expect(provider.getSentEmails()).toHaveLength(1);
  });

  it('keeps history across multiple sends', async () => {
    await provider.sendEmail({ to: 'a@test', subject: '1', html: '' });
    await provider.sendEmail({ to: 'b@test', subject: '2', html: '' });
    await provider.sendEmail({ to: 'c@test', subject: '3', html: '' });
    expect(provider.getSentEmails().map((e) => e.subject)).toEqual(['1', '2', '3']);
  });

  it('clear() empties history and resets counter', async () => {
    await provider.sendEmail({ to: 'a@test', subject: '1', html: '' });
    provider.clear();
    expect(provider.getSentEmails()).toEqual([]);
    const second = await provider.sendEmail({ to: 'b@test', subject: '2', html: '' });
    expect(second.messageId).toMatch(/^inmem-\d+-1$/);
  });
});