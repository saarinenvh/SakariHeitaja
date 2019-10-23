// Node Modules
import express from "express";
import dotenv from "dotenv";
dotenv.config();

// Import all the quotes, future these will be in DB
import {
  sakariNames,
  sakariResponses,
  randomQuote
} from "./responses/default.mjs";
import { players } from "./responses/game.mjs";
import {
  weatherEmojis,
  randomGoodMorning,
  giphySearchWords
} from "./responses/default.mjs";

// Custom Modules & Functions
import * as Helpers from "./helpers/helpers.mjs";
import HandicappedScores from "./handicap/calc.mjs";
import Game from "./game/game.mjs";
import { getData, getGiphy } from "./async/functions.mjs";
import { bot } from "./bot.mjs";
import {
  gifplz,
  sendGifphy,
  vade,
  kukakirjaa,
  helpText,
  sendWeatherMessage,
  createAndSendRecipeMessage
} from "./stupidfeatures/collection.mjs";

let competitionsToFollow = {};
let games = {};
let date = new Date().toLocaleDateString();

bot.onText(/\/mitatanaansyotaisiin/, (msg, match) => {
  createAndSendRecipeMessage(msg.chat.id);
});

bot.onText(/\/tasoitus (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  let text = undefined;
  switch (match[1]) {
    case "Kaatis":
      text = HandicappedScores.getHandicappedResults("kaatis", chatId);
      break;
    case "Kisis":
      text = HandicappedScores.getHandicappedResults("kisis", chatId);
      break;
    case "Karkkila":
      text = HandicappedScores.getHandicappedResults("karkkila", chatId);
      break;
    case "overall":
      text = HandicappedScores.getHandicappedResults("overall", chatId);
      break;
    case "hamis":
      text = HandicappedScores.getHandicappedResults("hamis", chatId);
      break;
    case "all":
      text = HandicappedScores.getHandicappedResults("all", chatId);
      break;
    default:
      break;
  }

  bot.sendMessage(chatId, text ? text : "häh?", { parse_mode: "HTML" });
});

// Listens the channel, small probability to answer something random
bot.on("text", msg => {
  let said = false;
  const chatId = msg.chat.id;

  if (sakariNames.find(n => msg.text.toLowerCase().includes(n.toLowerCase()))) {
    if (Helpers.getRandom(3) == 1) {
      bot.sendMessage(
        chatId,
        sakariResponses[Helpers.getRandom(sakariResponses.length)]
      );
      said = true;
    }
  }

  if (
    msg.text.toLowerCase().includes("jallu") &&
    Helpers.getRandom(2) === 1 &&
    !said
  ) {
    bot.sendMessage(chatId, "JALLU!");
  }

  const rand = Helpers.getRandom(50);
  if (rand === 1 && !said) {
    bot.sendMessage(chatId, randomQuote[Helpers.getRandom(randomQuote.length)]);
  }
});

// Stupid feature FIX!!
function todaysGames() {
  if (!new Date().toLocaleDateString() == date) {
    games = {};
  }
  let str = "";
  if (Object.keys(games).length > 0) {
    str = "Tän päivän gamepläännis ois seuraavanlaisia \n";
    for (const key in games) {
      str = str.concat(`${key}: ${games[key]} \n`);
    }
    str = str.concat("Supereit heittoi kaikille!!");
  } else {
    str = `Kukaan ei oo pelaamas tänään??? :'(`;
  }

  return str;
}

// Stupid feature FIX!!
bot.onText(/\/hep (.+)/, (msg, match) => {
  date = new Date().toLocaleDateString();
  const chatId = msg.chat.id;
  games[msg.from.username] = match[1];
  bot.sendMessage(chatId, todaysGames());
});

bot.onText(/\/pelei/, (msg, match) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, todaysGames());
});

// Starts following game with given id
bot.onText(/\/follow (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const idFromUrl = match[1].split("/"); // the captured "whatever"
  const competitionId = idFromUrl[idFromUrl.length - 1];

  bot.sendMessage(
    chatId,
    "Okei, aletaan kattoo vähä kiekkogolffii (c) Ian Andersson"
  );
  competitionsToFollow[chatId] = new Game(competitionId, chatId);
  competitionsToFollow[chatId].startFollowing();
});

// Stops following game
bot.onText(/\/lopeta/, msg => {
  const chatId = msg.chat.id;
  if (competitionsToFollow[chatId]) {
    competitionsToFollow[chatId].stopFollowing();
    bot.sendMessage(chatId, "No olihan se kivaa taas, jatketaan ens kerralla.");
  } else {
    bot.sendMessage(chatId, "Ehämmä seuraa täs mitää saatana.");
  }
});

// Returns top5 list for game
bot.onText(/\/top5/, msg => {
  const chatId = msg.chat.id;
  if (competitionsToFollow[chatId]) {
    competitionsToFollow[chatId].createTopList();
  } else {
    bot.sendMessage(chatId, "Varmaa pitäis jotai kisaa seuratakki.");
  }
});

// BROKEN FIX!!
bot.onText(/\/score (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  let message = "";

  if (Object.keys(competitionsToFollow).includes(chatId)) {
    const player = competitionsToFollow[chatId].data
      ? competitionsToFollow[chatId].getScoreByPlayerName(match[1])
      : null;
    message =
      player != null
        ? `${player.Name} on tuloksessa ${player.Diff} ja sijalla ${player.OrderNumber}! Hienosti`
        : "Eihän tommone äijä oo ees jäällä, urpo";
  }

  bot.sendMessage(chatId, message);
});

// Adds a player to the list for following players
bot.onText(/\/lisaa (.+)/, (msg, match) => {
  try {
    const chatId = msg.chat.id;
    players.push(match[1]);
    bot.sendMessage(
      chatId,
      `Pelaaja ${match[1]} lisätty seurattaviin pelaajiin.`
    );
  } catch (e) {
    console.log(e);
  }
});

bot.onText(/\/saa (.+)/, (msg, match) => {
  try {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Oiskohan nyt hyvä hetki puhua säästä?");
    sendWeatherMessage(match[1], chatId);
  } catch (e) {
    console.log(e);
  }
});

function startTimer() {
  const chatId = -1001107508068; // SANKARIID
  // const chatId = 69194391; // OMA ID
  let now = new Date();
  let millisTill09 =
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 7, 40, 0) -
    now;
  if (millisTill09 < 0) {
    millisTill09 += 86400000; // it's after 10am, try 10am tomorrow.
  }

  console.log(`MS to next morning ${millisTill09}`);
  setTimeout(async function() {
    let message = `${
      randomGoodMorning[Helpers.getRandom(randomGoodMorning.length)]
    }Kello on <b>${Helpers.formatDate(
      new Date()
    )}</b> & tämmöstä keliä ois sit tänää taas luvassa.`;
    bot.sendMessage(chatId, message, { parse_mode: "html" });
    await sendWeatherMessage("espoo", chatId);
    bot.sendMessage(chatId, "Ja tästä päivä käyntiin!");
    await sendGifphy(
      giphySearchWords[Helpers.getRandom(giphySearchWords.length)],
      chatId
    );
    startTimer();
  }, millisTill09);
}

// START SERVER
const app = express();
app.listen(5000, "127.0.0.1", function() {
  startTimer();
  HandicappedScores.countScores();
});
