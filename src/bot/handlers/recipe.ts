import { Composer } from "grammy";
import { getData } from "../../lib/http";
import { getRandom } from "../../lib/utils";
import { recipe as MSG } from "../../config/messages";

interface RecipeIngredient {
  ingredientTitle?: string;
  name?: string;
  ingredients?: { ingredientTitle: string }[];
}

interface Recipe {
  name: string;
  cookTime: number;
  description: string;
  ingredients: RecipeIngredient[];
  steps: { body: string }[];
  media: { file: { url: string } }[];
}

interface RecipeResponse {
  results: Recipe[];
}

export const recipe = new Composer();

// /mitatanaansyotaisiin
// Fetches a random Finnish recipe from the S-cloud recipe API and sends the
// name, cook time, description, ingredient list, step-by-step instructions,
// and a photo of the dish.
recipe.command("mitatanaansyotaisiin", async ctx => {
  const url = "https://api.s-cloud.fi/sok/aws/recipes-delivery/recipes-delivery/v1/recipes?fields=name%2Cdescription%2Cmedia%2Ccategories%2CusageRights%2Cpublisher%2CcookTime%2Cingredients%2Csteps&channel=yhteishyva&client_id=444c050f-ac71-43f9-9f37-c5cbda4c1cbb&environment=master&language=fi&limit=100";
  const data = await getData<RecipeResponse>(url);
  if (!data) return ctx.reply(MSG.notFound);
  const dish = data.results[getRandom(data.results.length)];

  let message = `${dish.name} ${dish.cookTime}min\n\n${dish.description}\n\n`;
  dish.ingredients.forEach(n => {
    if (n.ingredientTitle) {
      message += n.ingredientTitle + "\n";
    } else {
      message += (n.name ?? "") + "\n";
      n.ingredients?.forEach(i => (message += i.ingredientTitle + "\n"));
    }
  });
  message += "\n";
  dish.steps.forEach((n, i) => (message += `${i + 1}. ${n.body} \n`));

  await ctx.reply(message);
  await ctx.replyWithPhoto(dish.media[0].file.url.substring(2));
});
