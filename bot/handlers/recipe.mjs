import { getData } from "../../lib/http.mjs";
import { getRandom } from "../../lib/utils.mjs";

export function register(bot) {
  bot.onText(/\/mitatanaansyotaisiin/, async (msg) => {
    const chatId = msg.chat.id;
    const url = "https://api.s-cloud.fi/sok/aws/recipes-delivery/recipes-delivery/v1/recipes?fields=name%2Cdescription%2Cmedia%2Ccategories%2CusageRights%2Cpublisher%2CcookTime%2Cingredients%2Csteps&channel=yhteishyva&client_id=444c050f-ac71-43f9-9f37-c5cbda4c1cbb&environment=master&language=fi&limit=100";
    const data = await getData(url);
    const dish = data.results[getRandom(data.results.length)];

    let message = `${dish.name} ${dish.cookTime}min\n\n`;
    message += dish.description + "\n\n";
    dish.ingredients.forEach(n => {
      if (Object.keys(n).includes("ingredientTitle")) {
        message += n["ingredientTitle"] + "\n";
      } else {
        message += n.name + "\n";
        n.ingredients.forEach(i => (message += i["ingredientTitle"] + "\n"));
      }
    });
    message += "\n";
    dish.steps.forEach((n, i) => {
      message += `${i + 1}. ${n.body} \n`;
    });

    bot.sendMessage(chatId, message);
    bot.sendPhoto(chatId, dish.media[0].file.url.substring(2));
  });
}
