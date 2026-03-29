function toLocalISOString(date: Date): string {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(offset / 60)}:${pad(offset % 60)}`
  );
}

export const loggerSettings = {
  formatter: function (messages: any[], context: any) {
    const timestamp = toLocalISOString(new Date());
    const level = context.level.name.toUpperCase().padEnd(5);
    messages.unshift(`${timestamp} [${level}]`);
  },
};
