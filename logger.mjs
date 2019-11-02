import Logger from "js-logger";

export const loggerSettings = {
    formatter: function (messages, context) {
        messages.unshift(new Date().toUTCString())
    }
  }
