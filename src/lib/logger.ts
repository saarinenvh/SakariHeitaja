export const loggerSettings = {
  formatter: function (messages: any[], context: any) {
    const timestamp = new Date().toISOString();
    const level = context.level.name.toUpperCase().padEnd(5);
    messages.unshift(`${timestamp} [${level}]`);
  },
};
