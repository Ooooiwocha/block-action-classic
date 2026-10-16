/** Flash displays these strings directly. Stored timestamps remain UTC ISO. */
export function formatGameDate(value: string): string {
  // Earlier records contain only a date: preserve that day; time was not recorded.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.replaceAll('-', '/') + ' 00:00';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`;
}
