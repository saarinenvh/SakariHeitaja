// Node Modules
import express from 'express'
import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
dotenv.config()

// Import all the quotes, future these will be in DB
import {sakariNames, sakariResponses, randomQuote} from './responses/default.mjs'
import {narratives, scores, goodStart, badStart, neutralStart, verbs, throws, players} from './responses/game.mjs'

// Custom Modules
import HandicappedScores from './handicap/calc.mjs'
import {getData, getGiphy} from './async/functions.mjs'

// Defined on .env file
const giphyId = process.env.GIPHYID
const giphySecret = process.env.GIPHYSERCRET
const token = process.env.TOKEN

let score = {};
let data = undefined;
let newRound = undefined;
let playersToFollow = [];
let baseUrl = `https://discgolfmetrix.com/api.php?content=result&id=`;
let following = false;
let competitionId;
let playersAnnounced = false;
let games = {};
let date = new Date().toLocaleDateString();

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/tasoitus (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  let text = undefined
  let overallText = undefined
  switch(match[1]) {
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

  if (text) {
    bot.sendMessage(chatId, text, {parse_mode: 'HTML'})
  } else {
    bot.sendMessage(chatId, overallText, {parse_mode: 'HTML'})
  }
});

bot.onText(/\/lopeta/, msg => {
  const chatId = msg.chat.id;
  if (following) {
    following = false;
    bot.sendMessage(chatId, "No olihan se kivaa taas, jatketaan ens kerralla.");
  } else {
    bot.sendMessage(chatId, "Ehämmä seuraa täs mitää saatana.");
  }
});

bot.on("text", msg => {
  let said = false
  const chatId = msg.chat.id;
  if (sakariNames.find(n => msg.text.toLowerCase().includes(n.toLowerCase()))) {
    if (getRandom(3) == 1) {
    bot.sendMessage(chatId, sakariResponses[getRandom(sakariResponses.length)])
    said = true
    }
  }

  const rand = getRandom(50)
  if ( rand === 1 && said == false) {
    bot.sendMessage(chatId, randomQuote[getRandom(randomQuote.length)]);
  }
})

bot.onText(/\/apuva/, msg => {
  const chatId = msg.chat.id;
  const helpText =  `Meikää saa käskyttää seuraavin ja vain seuraavin komennoin!\n
Kilpailua seurailen seuraavasti:
/follow [metrixId] - Alan seuraamaan kyseistä kisaa ja kommentoin kisan tapahtumia.
/top5 - Kerron seurattavan kisan top-5 tilastot sarjoittain.
/score [Pelaajan nimi metrixissä] - Kerron kyseisen pelaajan tuloksen ja sijoituksen.
/lisaa [Pelaajan nimi metrixissä] - Lisään kyseisen pelaajan seurattaviin pelaajiin.
/lopeta - Lopetan kyseisen kisan seuraamisen.\n
Ja muuta hauskaa mitä hommailen:\n
/kukakirjaa [Pelaajien nimet välimerkein eroteltuna] - Arvon kirjaajan annetuista vaihtoehdoista
/hyva - Kyl te tiiätte! XD
/hep [Vapaa muotoinen teksti] - Tähän voi ilmottaa jos on menossa pelaamaan samana päivänä
/pelei - Listaa kaikki hep huudot`
  bot.sendMessage(chatId, helpText);
});

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

bot.onText(/\/hep (.+)/, (msg, match) => {
  date = new Date().toLocaleDateString();
  const chatId = msg.chat.id;
  games[msg.from.username] = match[1];
  bot.sendMessage(chatId, todaysGames());
});

bot.onText(/\/lisaa (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  players.push(match[1])
  bot.sendMessage(chatId, `Pelaaja ${match[1]} lisätty seurattaviin pelaajiin.`);
});

bot.onText(/\/kukakirjaa (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const players = match[1].split(" ")
  const winner = players[getRandom(players.length)]
  bot.sendMessage(chatId, ` \u{1F3B5} On arvontalaulun aika! \u{1F3B5}`);

  setTimeout( n => {
    bot.sendMessage(chatId, `3`);
  }, 1000)

  setTimeout( n => {
    bot.sendMessage(chatId, `2`);
  }, 2000)

  setTimeout( n => {
    bot.sendMessage(chatId, `1`);
  }, 3000)

  setTimeout( n => {
    bot.sendMessage(chatId, `\u{1F386}\u{1F386}\u{1F386}   Ja voittaja on ${winner.toUpperCase()}!!! ONNEKSI OLKOON!   \u{1F386}\u{1F386}\u{1F386}`);
  }, 4000)
});

bot.onText(/\/pelei/, (msg, match) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, todaysGames());
});

bot.onText(/\/score (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  const player = data ? getScoreByPlayerName(match[1]) : null;
  const message =
    player != null
      ? `${player.Name} on tuloksessa ${player.Diff} ja sijalla ${
          player.OrderNumber
        }! Hienosti`
      : "Eihän tommone äijä oo ees jäällä, urpo";
  bot.sendMessage(chatId, message);
});

bot.onText(/\/hyva/, (msg, match) => {
  let amount = getRandom(100);
  let str = "Hyvä Vade";
  for (let i = 0; i < amount; i++) {
    str = str.concat("e");
  }
  amount = getRandom(100);
  for (let i = 0; i < amount; i++) {
    str = str.concat("!");
  }
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, str);
});

bot.onText(/\/top5/, msg => {
  const chatId = msg.chat.id;
  if (following) {
    bot.sendMessage(chatId, createTopList().replace(/['"]+/g, ""));
  } else {
    bot.sendMessage(chatId, "Pitäis varmaa tietää, et mitä kisaa me seurataan");
  }
});

bot.onText(/\/sankarit/, msg => {
  const chatId = msg.chat.id;
  let message = "Sankareiden tilastotietoa! \n"
  playersToFollow.forEach(n => {
    message = message + `${n.Name} on tuloksessa ${n.Diff} ja sijalla ${
        n.OrderNumber
      } \n`
  })
    bot.sendMessage(chatId, message);
});

bot.onText(/\/follow (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  if (!following) {
    competitionId = match[1].split("/"); // the captured "whatever"
    competitionId = competitionId[competitionId.length - 1]
    console.log(competitionId)
    bot.sendMessage(
      chatId,
      "Okei, aletaan kattoo vähä kiekkogolffii (c) Ian Andersson"
    );
    data = undefined;
    newRound = undefined;
    playersToFollow = [];
    playersAnnounced = false;
    following = true;
    startFollowing(competitionId, chatId);
  } else {
    bot.sendMessage(
      chatId,
      `URPO! Seurataan jo täl hetkel kisaa: ${data.Competition.Name}`
    );
  }
});

function startFollowing(id, chatId) {

  // Condition for following the contest
  if (following) {
    competitionId = id;

    // Async func to fetch data from metrix
    getData(`${baseUrl}${id}`).then(newData => {
      try {

        // Init the first data and find players to follow
        if (!data && Object.keys(newData).includes("Competition") && newData.Competition != null) {
          data = newData;
          findPlayersToFollow(chatId);
        }

        // Check if data exists and there are changes
        if (data && data != newData) {
          newRound = newData;
          const combinedComments = {}

          // Create comments for changed happened in this interval
          playersToFollow.forEach(n => {
            const comment = checkChangesAndComment(n.Name);
            if (comment && !Object.keys(combinedComments).includes(comment.hole.toString())) {
              combinedComments[comment.hole] = [];
            }
            if (comment) {
              combinedComments[comment.hole].push(comment.text)
            }
          });

          // Create message from comments created
          let str = `${getStartText()} \n`
          Object.keys(combinedComments).forEach(n => {
            str = str.concat(`*********** Väylä numero ${parseInt(n) + 1} ***********\n\n`)
            combinedComments[n].forEach(i => {
              str = str.concat(`${i} \n\n`)
            })
          })
          if (Object.keys(combinedComments).length > 0) {
          bot.sendMessage(chatId, str, {parse_mode: 'HTML'});
          }

          // Update the "new data" as old
          data = newRound;
          findPlayersToFollow(chatId);
        }

        // Check if competition has ended
        if (hasCompetitionEnded()) {
          following = false
          setTimeout( n => {
            bot.sendMessage(chatId, "Dodii, ne kisat oli sit siinä, tässä olis sit vielä lopputulokset!");
          }, 1000)
          setTimeout( n => {
            bot.sendMessage(chatId, createTopList().replace(/['"]+/g, ""));
          }, 2000)
        } else {
          console.log("Pelaamattomia väyliä jäljellä!")
        }
      } catch(e) {
        console.log(e)
      }
    });

    // Competition continues, keep fetching
    setTimeout(n => {
      startFollowing(competitionId, chatId);
    }, 5000);
  }
}

function hasCompetitionEnded() {
  let bool = playersToFollow.map(n => n.PlayerResults.every(hole => !Array.isArray(hole)))
  return bool[0]
}

function findPlayersToFollow(chatId) {
  playersToFollow = [];

  // Check matching players
  data.Competition.Results.forEach(n => {
    if (players.includes(n.Name)) {
      playersToFollow.push(n);
    }
  });

  // Create announce messasge
  if (playersToFollow.length > 0 && !playersAnnounced) {
    let str = "Ja tällä kertaa kisassa on mukana:\n";
    for (let i = 0; i < playersToFollow.length; i++) {
      str = str.concat(`${playersToFollow[i].Name}\n`);
    }
    bot.sendMessage(chatId, str);
    playersAnnounced = true;
  }
}

function getScoreByPlayerName(name) {
  return data.Competition.Results.find(n => n.Name == name);
}

function getDivisions() {
  let divisions = [];
  data.Competition.Results.forEach(n => {
    if (!divisions.includes(n.ClassName)) {
      divisions.push(n.ClassName);
    }
  });
  return divisions;
}

function createTopList() {
  const divisions = getDivisions();
  const rankings = {};
  divisions.forEach(n => {
    rankings[n] = getTopFive(n);
  });
  let othersToFollow = getPlayerToFollowThatArentInTopFive();
  let str = `${data.Competition.Name} TOP-5 "\n""\n"`;
  Object.keys(rankings).forEach(n => {
    str = str.concat(`Sarja ${n}"\n"`);
    rankings[n].forEach(r => {
      str = str.concat(
        `${r.OrderNumber}. ${r.Name} "\t""\t""\t""\t"${r.Diff}'\n'`
      );
    });
    str = str.concat("'\n'");
  });
  return str;
}

function getTopFive(division) {
  let result = [];
  data.Competition.Results.forEach(n => {
    if (n.OrderNumber < 5 && n.ClassName == division) result.push(n);
  });
  return result.sort((a, b) => (a.OrderNumber > b.OrderNumber ? 1 : -1));
}

function getPlayerToFollowThatArentInTopFive() {
  let othersToFollow = [];
  for (let i in playersToFollow) {
    if (getTopFive().forEach(n => n.Name !== i.Name)) {
      othersToFollow.push(i);
    }
  }
  return othersToFollow.sort((a, b) =>
    a.OrderNumber > b.OrderNumber ? 1 : -1
  );
}

// Helper function for checking changes
function checkChangesAndComment(playerName) {
  const prevScore = playersToFollow.find(n => n.Name == playerName);
  const newScore = newRound.Competition.Results.find(n => n.Name == playerName);
  if (Object.keys(prevScore).includes("Sum") && prevScore.Sum != newScore.Sum) {
    return createPhrase(newScore);
  }
}

// Returns the hole where new results came from from a certain player
function getHole(playerName) {
  const datalistOld = data.Competition.Results.find(n => n.Name == playerName).PlayerResults;
  const datalistNew = newRound.Competition.Results.find(n => n.Name == playerName).PlayerResults;

  //If player has results
  if (datalistOld && datalistNew) {

    // Modify the scorelist, because the metrixapi sux
    const holeMapOld = datalistOld.map( (item, index) => {
      if (Array.isArray(item)) {
        return {Result: "", Diff: "", OB: "", Played: false, Index: index}
      } else {
        item["Played"] = true
        item["Index"] = index
        return item
      }
    })

    const holeMapNew = datalistNew.map( (item, index) => {
      if (Array.isArray(item)) {
        return {Result: "", Diff: "", OB: "", Played: false, Index: index}
      } else {
        item["Played"] = true
        item["Index"] = index
        return item
      }
    })

    for (let i = 0; i < holeMapNew.length; i++) {
      if (holeMapNew[i].Result !== holeMapOld[i].Result) {
        return i
      }
    }

    return -1
  }

}

function getRandom(i) {
  return Math.floor(Math.random() * i);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function checkScoreAndCreatePhrase(prevDiff, newDiff) {
  if (getHole(newDiff) !== -1) {
    getPhraseForScore(newDiff.Name, getHole(newDiff));
  }
}

function createPhrase(player) {
  if (getHole(player.Name) !== -1) {
  const obj = getPhraseForScore(player, getHole(player.Name));
  const randomVerb = verbs[getRandom(verbs.length)];
  return {hole: getHole(player.Name), text:`${obj.startText} <b>${
    player.Name
  }</b> ${randomVerb} ${
    obj.scoreText
  }, tällä hetkellä tuloksessa <b>${addPlusSignToScore(player.Diff)}</b> ja sijalla <b>${
    player.OrderNumber
  }</b>`};
  }
}

function addPlusSignToScore(score) {
  return score > 0 ? `+${score}` : `${score}`;
}

function getPhraseForScore(player, hole) {
  let score = player.PlayerResults[hole].Result;
  let obj = undefined;
  if (score == 1)
    obj = {
      score: 1,
      startText: goodStart[getRandom(goodStart.length)],
      scoreText: "ÄSSÄN!"
    };
  else if (player.PlayerResults[hole].Diff > 2)
    obj = {
      score: score,
      startText: badStart[getRandom(badStart.length)],
      scoreText: `niin ison scoren, että ei mahdu edes näytölle (${score})`
    };
  else if (player.PlayerResults[hole].Diff > 0)
    obj = {
      score: score,
      startText: badStart[getRandom(badStart.length)],
      scoreText: scores.find(n => n.score == player.PlayerResults[hole].Diff)
        .text[
        getRandom(
          scores.find(n => n.score == player.PlayerResults[hole].Diff).text
            .length
        )
      ]
    };
  else if (player.PlayerResults[hole].Diff == 0) {
    obj = {
      score: score,
      startText: neutralStart[getRandom(neutralStart.length)],
      scoreText: scores.find(n => n.score == 0).text[
        getRandom(scores.find(n => n.score == 0).text.length)
      ]
    };
  } else {
    obj = {
      score: score,
      startText: goodStart[getRandom(goodStart.length)],
      scoreText: scores.find(n => n.score == player.PlayerResults[hole].Diff)
        .text[
        getRandom(
          scores.find(n => n.score == player.PlayerResults[hole].Diff).text
            .length
        )
      ]
    };
  }
  return obj;
}

function getStartText() {
  const obj = narratives[getRandom(narratives.length)];
  return `${obj.firstPart}\n`;
}

bot.onText(/\/gifplz (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const url = `https://api.gfycat.com/v1/gfycats/search?search_text=${match[1]}`
  getGiphy(url).then( n => {
    const response = JSON.parse(n)
    const images = response.gfycats.map( n => n.mp4Url)
    const test = bot.sendVideo(chatId, images[getRandom(images.length)]);
  })
});

const app = express();
app.listen(5000, "127.0.0.1", function() {
  HandicappedScores.countScores()
});
