export const loggerSettings = {
  formatter: function (messages: any[], _context: any) {
    messages.unshift(new Date().toUTCString());
  },
};
