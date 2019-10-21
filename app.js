const express = require("express"); // eslint-disable-line
const fetch = require("node-fetch"); // eslint-disable-line
const TelegramBot = require("node-telegram-bot-api"); // eslint-disable-line
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const giphyId = "2_arxUyj"
const giphySecret = "mIilkLkwhESM_mGWHshoZdcZrbotv5dZAuHwT7lkiI1iG7hJrV01C6vmF16TRNKO"
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
const token = process.env.TOKEN
const bot = new TelegramBot(token, { polling: true });


bot.onText(/\/lopeta/, msg => {
  const chatId = msg.chat.id;
  if (following) {
    following = false;
    bot.sendMessage(chatId, "No olihan se kivaa taas, jatketaan ens kerralla.");
  } else {
    bot.sendMessage(chatId, "Ehämmä seuraa täs mitää saatana.");
  }
});

const sakariNames = ["Sakari", "Sakke"]
const sakariResponses = ["Pää kii aki!", "Turhaa mua syytät, salee topin vika.", "Hyvä vadee!", "Mä oon aina oikeessa!",
                  "NO MITÄ???", "Mitä sä mua huutelet??", "Huoh....", "Hiljaa saatana!", "Eiku C-Line!"]

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
  console.log(hole)
  let score = player.PlayerResults[hole].Result;
  let obj = undefined;
  console.log(hole)
  console.log(score)
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

const narratives = [
  { firstPart: "Ihmiset ovat suorittaneet firsbeegolf heittoja!" },
  { firstPart: "Jahas ja tilannekatsauksen aika!",},
  { firstPart: "HOI! Nyt taas tapahtuu!"},
  { firstPart: "HUOMIO!" },
  { firstPart: "Ja taas mennään!"},
  { firstPart: "HEIHEIHEI, joku teki jotain!"},
  { firstPart: "Tulostaulussa liikehdintää!"},
  { firstPart: "Ja taas on väyliä saatettu loppuun."}
];

const scores = [
  {
    score: 2,
    text: ["ruman tuplabogin", "tsägällä tuplan", "kaks päälle", "DOUBLE BOGEYN"]
  },
  {
    score: 1,
    text: [
      "bogin",
      "boggelin",
      "turhan bogin",
      "bogin",
      "ruskean boggelin",
    ]
  },
  {
    score: 0,
    text: [
      "parin",
      "PROFESSIONAL AVERAGEN",
      "ihannetuloksen",
      "hemmetin tylsän paarin",
      "tuuripaarin",
      "scramblepaarin",
      "tsägällä paarin",
      "taitopaarin",
    ]
  },
  {
    score: -1,
    text: [
      "birdien",
      "lintusen",
      "tirpan",
      "vitunmoisen tuuripörön",
      "pörön",
      "hemmetin kauniin pirkon",
      "pirkon"
    ]
  },
  { score: -2, text: ["eaglen?? SIIS EAGLEN! En usko", "KOTKAN"] },
  { score: -3, text: ["ALBATROSSIN?? Salee merkkausvirhe"] }
];

const goodStart = [
  "MAHTAVA SUORITUS!",
  "USKOMATON TEKO!",
  "ENNENÄKEMÄTÖNTÄ TOIMINTAA!",
  "Wouuuuu, kyllä nyt kelpaa!",
  "Mahtavaa peliä, ei voi muuta sanoa.",
  "Siis huhu, aika huikeeta!",
  "Tää dude on iha samaa tasoo ku pauli tai riki!",
  "Kyllä nyt ollaan sankareita!",
  "WOUUUUU!",
  "Hellurei hellurei vääntö on hurjaa!",
  "No nyt taas! Näin sen kuuluukin mennä!",
  "Olikohan vahinko, ei tämmöstä yleensä nähä!",
  "JUMALISTE! Oiskohan sittenki vielä sauma mitaleille!",
  "Tämmöstä! Tämmöstä sen olla pitää!",
  "Nyt ollaa jo lähellä tonninmiehen tasoa!",
  "JA MAALILAITE RÄJÄHTÄÄ!!",
  "Täällä taas nostellaan häränsilmästä limppuja!"
];
const badStart = [
  "Voi surkujen surku!",
  "Voi kyynelten kyynel!",
  "No ohan tää vähän vaikee laji!",
  "Saatana vois tää spede vaik denffata.",
  "Kannattiko ees tulla näihin kisoihin??",
  "Säälittävää tekemistä taas...",
  "Naurettavaa toimintaa!",
  "Miten voi taas pelata näin?",
  "En voi uskoa silmiäni!",
  "Miten on mahdollista taas?",
  "Näkivätkö silmäni oikein?",
  "HAHAHAHAHAHA!",
  "\u{1F603}\u{1F603}\u{1F603}\u{1F603}\u{1F603}",
  "Ei vittu, jopa mä oisin pöröttäny ton mut ei... Ei ei ei.",
  "Ei jumalauta!",
  "Vittu mitä paskaa, ei kiinnosta ees seurata tätä pelii jos taso on tää!!",
  "Siis mee roskii!",
  "Noh, toivottavasti ens kerralla käy parempi tuuri.",
  "Voi harmi, hyvä yritys oli mutta nyt kävi näin.",
  "Punasta korttiin ja matka kohti uusia pettymyksiä!",
  "PERSE! Tsemppiä nyt saatana!",
  "HYVÄ VADEE!",
  "Taso täällä taas ku MA6.",
  "NYT JUMALAUTA, VÄHÄN EES TSEMPPIÄ!",
  "Haha, emmä tienny et tää on näin paska!",
  "No nyt oli kyllä paskaa tuuria!",
  "Kävipä hyvä tuuri, ois voinu olla nimittäi VIELÄ PASKEMPAA!!",
  "Nyt on kyl taas TUOMIOPÄIVÄ,  ON TUOMIOPÄIVÄ, on KEINOSEN NIMIPÄIVÄ!"
];
const neutralStart = [
  "Onpahan tylsää...",
  "Nyt kun olisi aika hyökätä, niin mitä hän tekee?",
  "Ei tälläsellä pelillä kyllä mitaleille mennä :X",
  "Noniin, lisää harmaataa korttiin!",
  "On se ihannetuloskin tulos, kun",
  "buuuu!",
  "Ja ei taaskaa mitään yritystä.",
  "Parasta annettiin ja paskaa tehtiin.",
  "Jahas, yhtä surullista tekemistä ku asuminen Vantaalla.",
  "Hienosti! Vaikea väylä, mutta kyllä kelpaa.",
  "Mitähän tähän sit taas sanois?",
  "Ei huono!",
  "Joopajoooooo...",
  "Yrittäisit edes.",
  "Ei tällä paljoa fieldille hävitä!",
  "Noh aika harvat tällä väylällä paremmin heittää.",
  "Tämmösellä väylällä näin paskaa, on kyl surullista.",
  "Melkeen ymmärtäisin, jos ois ees vaikee väylä.",
  "Noh, ehkä seuraavalla väylällä sitten paremmin..."
];
const verbs = [
  "otti",
  "sai",
  "suoritti",
  "taisteli",
  "möyri",
  "heitti",
  "viskoi",
  "rämisteli",
  "scrambläsi",
  "liidätteli",
  "paiskasi",
  "nakkeli",
  "sinkosi",
  "nosti",
  "lapioi"
];
const throws = [
  "fisbeegolfheitolla",
  "heitolla",
  "roiskasulla",
  "hyppyputilla"
];
const players = ["Jenni Grönvall", "Ville Saarinen", "Topi Stenman", "Valtteri Varmola", "Jon Grönvall",
"Nestori Vainio", "Klaus Väisälä", "Wilhelm Takala", "Antti Räisänen", "Aki Laaksonen", "Nitta Stenman",
"Lauri Saarinen", "Pekka Vajanto", "Ilmari Korpela", "Hanna Väisälä", "Jori Nurminen", "Aki Tiittanen", "jeee", "asdfasdf",
"Topi Stenman, Aki Laaksonen"];

const randomQuote = ["Paska puhetta...", "Antsaa hyssessä!", "Voimaa ja kulmaa \u{1F4AA}", "No en tosta kyllä tiiä, mut on ne prodigyn lätyt kyllä paskoja.",
"No niinpä.", "Pakko muuten todeta, et on se Pauli vaa maailman paras frisbeegolffari!", "EIHÄN??", "HYVÄ VADEE!", "Tilanteesta oltais selvitty satasen roci heitolla...",
"Aijaaok", "Tiiä sitte siitäkää", "\u{1F603}\u{1F603}\u{1F603}\u{1F603}\u{1F603}", "Ennenkaikkea joukkue!", "Ennenkaikkea layuppi!", "Nukuttii ja mentii eteenpäin!",
"Nämä on ny näitä", "Oispa kaljaa...", "Eiku C-Line!!"]

const getData = async url => {
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    console.log(error);
  }
};

const getGiphy = async url => {
  try {
    const response = await fetch(url);
    return response.text();
  } catch (error) {
    console.log(error);
  }
}

bot.onText(/\/gifplz (.+)/, (msg, match) => {
  console.log(match)
  if (match[1] == "") {
    const chatId = msg.chat.id;
    getGiphy("https://api.gfycat.com/v1/gfycats/search?search_text=discgolf").then( n => {
      const response = JSON.parse(n)
      const images = response.gfycats.map( n => n.mp4Url)
      const test = bot.sendVideo(chatId, images[getRandom(images.length)]);
    })
  }

});

bot.onText(/\/gifplz (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const url = `https://api.gfycat.com/v1/gfycats/search?search_text=${match[1]}`
  getGiphy(url).then( n => {
    const response = JSON.parse(n)
    const images = response.gfycats.map( n => n.mp4Url)
    const test = bot.sendVideo(chatId, images[getRandom(images.length)]);
  })
});

const harkalinna = {
  competitionName: "Harkalinna",
  competitionIds: [],
  players: []
}

const kisis = {
  competitionName: "Kisis",
  competitionIds: [930448, 930458],
  players: [
  {name: "Aki Laaksonen", rating: 900, score: 0, handicappedScore: 0},
  {name: "Antti Räisänen", rating: 841,score: 0, handicappedScore: 0},
  {name: "Jon Grönvall", rating: 821, score: 0, handicappedScore: 0},
  {name: "Klaus Väisälä", rating: 854, score: 0, handicappedScore: 0},
  {name: "Lauri Saarinen", rating: 871, score: 0, handicappedScore: 0},
  {name: "Valtteri Varmola", rating: 890, score: 0, handicappedScore: 0},
  {name: "Ville Saarinen", rating: 907, score: 0, handicappedScore: 0},
  {name: "Hanna Väisälä", rating: 0, score: 0, handicappedScore: 0},
  {name: "Topi Stenman", rating: 954, score: 0, handicappedScore: 0},
  ]
};

const karkkila = {
  competitionName: "Karkkila",
  competitionIds: [1001090, 1001094],
  players: [
  {name: "Aki Laaksonen", rating: 872, score: 0, handicappedScore: 0},
  {name: "Antti Räisänen", rating: 841,score: 0, handicappedScore: 0},
  {name: "Jenni Grönvall", rating: 797, score: 0, handicappedScore: 0},
  {name: "Jon Grönvall", rating: 834, score: 0, handicappedScore: 0},
  {name: "Klaus Väisälä", rating: 866, score: 0, handicappedScore: 0},
  {name: "Lauri Saarinen", rating: 872, score: 0, handicappedScore: 0},
  {name: "Nestori Vainio", rating: 0, score: 0, handicappedScore: 0},
  {name: "Valtteri Varmola", rating: 885, score: 0, handicappedScore: 0},
  {name: "Ville Saarinen", rating: 921, score: 0, handicappedScore: 0},
  {name: "Wilhelm Takala", rating: 795, score: 0, handicappedScore: 0},
  {name: "Nitta Stenman", rating: 705, score: 0, handicappedScore: 0},
  {name: "Pekka Vajanto", rating: 0, score: 0, handicappedScore: 0},
  {name: "Ilmari Korpela", rating: 0, score: 0, handicappedScore: 0},
  {name: "Topi Stenman", rating: 941, score: 0, handicappedScore: 0},
  {name: "Jori Nurminen", rating: 883, score: 0, handicappedScore: 0},
  {name: "Hanna Väisälä", rating: 0, score: 0, handicappedScore: 0},
  ]
};

const kaatis = {
  competitionName: "Kaatis",
  competitionIds: [1047644, 1047645],
  players: [
  {name: "Aki Laaksonen", rating: 898, score: 0, handicappedScore: 0},
  {name: "Antti Räisänen", rating: 824,score: 0, handicappedScore: 0},
  {name: "Jenni Grönvall", rating: 805, score: 0, handicappedScore: 0},
  {name: "Jon Grönvall", rating: 836, score: 0, handicappedScore: 0},
  {name: "Karo Kreander", rating: 0, score: 0, handicappedScore: 0},
  {name: "Klaus Väisälä", rating: 863, score: 0, handicappedScore: 0},
  {name: "Lauri Saarinen", rating: 873, score: 0, handicappedScore: 0},
  {name: "Nestori Vainio", rating: 0, score: 0, handicappedScore: 0},
  {name: "Valtteri Varmola", rating: 872, score: 0, handicappedScore: 0},
  {name: "Ville Saarinen", rating: 924, score: 0, handicappedScore: 0},
  {name: "Wilhelm Takala", rating: 800, score: 0, handicappedScore: 0}
  ]
};

const hamis = {
  competitionName: "Härkälinna",
  competitionIds: [1094930, 1094932],
  players: [
  {name: "Aki Laaksonen", rating: 897, score: 0, handicappedScore: 0},
  {name: "Antti Räisänen", rating: 824,score: 0, handicappedScore: 0},
  {name: "Jon Grönvall", rating: 834, score: 0, handicappedScore: 0},
  {name: "Klaus Väisälä", rating: 868, score: 0, handicappedScore: 0},
  {name: "Lauri Saarinen", rating: 858, score: 0, handicappedScore: 0},
  {name: "Valtteri Varmola", rating: 874, score: 0, handicappedScore: 0},
  {name: "Ville Saarinen", rating: 925, score: 0, handicappedScore: 0},
  {name: "Topi Stenman", rating: 946, score: 0, handicappedScore: 0},
  {name: "Jenni Grönvall", rating: 798, score: 0, handicappedScore: 0},
  {name: "Jori Nurminen", rating: 883, score: 0, handicappedScore: 0},
  {name: "Hanna Väisälä", rating: 0, score: 0, handicappedScore: 0},
  {name: "Wilhelm Takala", rating: 797, score: 0, handicappedScore: 0}
  ]
};

let counted = false
const competitions = [karkkila, kaatis, kisis, hamis];
const points = [100,90,83,75,70,65,60,55,53,50,48,45,43,40,38,35,33,30,28,25,23,20];

async function countScores() {
  countHandicaps()
  for (competition of competitions) {
    if (!counted) {
    for (competitionId of competition.competitionIds) {

    const changes = await getData(`${baseUrl}${competitionId}`).then(newData => {
      try {
        if (newData.Competition != null) {
            for (player of competition.players) {
                playerData = newData.Competition.Results.find(n => n.Name == player.name);
                player["score"] = player["score"] + playerData.Sum
                player["handicappedScore"] = player["handicappedScore"] + playerData.Sum + player.handicap
          }
        }
      } catch(e) {
        console.log(e)
        return "Virhe laskiessa tasoituksia"
      }
    })
    }
    }

    competition.players = [...competition.players].sort((first, second) => first.handicappedScore - second.handicappedScore)
    rankPlayers(competition)
    }
  counted = true
};

function getHandicappedResults(args, chatId) {
  let text = undefined
  let overallText = undefined

  switch(args) {
    case "kaatis":
      text = createCompetitionMessage(competitions.find(n => n.competitionName == "Kaatis"))
      break;
    case "karkkila":
      text = createCompetitionMessage(competitions.find(n => n.competitionName == "Karkkila"))
      break;
    case "kisis":
      text = createCompetitionMessage(competitions.find(n => n.competitionName == "Kisis"))
      break;
    case "all":
      text = "";
      for ( competition of competitions) {
        text += createCompetitionMessage(competition) + "\n"
      }
      text += createOverallMessage()
      break;
    case "overall":
      overallText = createOverallMessage()
      break;
    default:
      break;
  }

  if (text) {
    bot.sendMessage(chatId, text, {parse_mode: 'HTML'})
  } else {
    bot.sendMessage(chatId, overallText, {parse_mode: 'HTML'})
  }
}

function createCompetitionMessage(competition) {
  let text = `***** ${competition.competitionName} ***** \n\n`
  text += `<code>${fillString("Sija, Nimi", 22)} ${fillString("Tulos", 5)} ${fillString("Pisteet", 7)}</code>\n`
  competition.players.forEach(n => text += `<code>${fillString(n.rank + ". " + n.name, 22)} ${fillString(n.handicappedScore.toString(), 5)} ${fillString(n.points.toString() + "pst", 7)} </code>\n`)
  return text;
}

function createOverallMessage() {
  let overallText = ""
  let overall = countOverall(competitions)
  overall = [...overall].sort((first, second) => second.points - first.points)
  overallText = "**** FGS Sankaritour 2019 - Kokonaistilanne **** \n\n"
  overallText += `<code>${fillString("Sija, Nimi", 22)} ${fillString("Pisteet", 7)}</code>\n`
  overall.forEach((n, index) => overallText += `<code>${fillString( (index + 1).toString() + ". " + n.name, 22)} ${fillString(n.points + "pst", 7)}\n</code>`)
  return overallText
}


function fillString(s, n) {
  const diff = n - s.length
  return `${s + createEmptySpace(diff)}`
}

function createEmptySpace(n) {
  let text = ""
  for (let i = 0; i < n; i++) {
    text += "\t"
  }
  return text
}

function rankPlayers(competition) {
  // Check same scores
  for (let i = 0; i < competition.players.length; i++) {
    if (i - 1 > 0 &&competition.players[i - 1].handicappedScore == competition.players[i].handicappedScore ) {
      competition.players[i]["rank"] = competition.players[i - 1].rank
      // countSharedPoints()
    } else {
      competition.players[i]["rank"] = i + 1
    }
    competition.players[i]["points"] = points[i]
  }
  findSameRanksAndSharePoints(competition)
}

function findSameRanksAndSharePoints(competition) {
  let rankObj = {}

  // groups players by rank
  for (let i = 0; i < competition.players.length; i++) {
    rankObj[i + 1] = competition.players.filter(n => n.rank == i + 1)
  }

  // finds all groups that are larger than 1 and calculates the shared score
  for (key of Object.keys(rankObj)) {
    if (rankObj[key].length > 1) {
      const totalScore = rankObj[key].reduce((sum, obj) => sum + obj.points, 0)
      const points = Math.floor(totalScore / rankObj[key].length)
      for (player of rankObj[key]) {
        competition.players.find(n => n.name == player.name).points = points
      }
    }
  }
}

function countHandicaps() {
  for (competition of competitions) {
    for (player of competition.players) {
      player["rating"] = Math.floor(player["rating"] / 10) * 10
      if (player["rating"] >= 900) {
        player["handicap"] = 0
      } else if (player["rating"] < 720) {
        player["handicap"] = -18
      } else {
        player["handicap"] = handicaps.find(n => n.score == player.rating).handicap
      }
      }
  }
};

function countOverall(competitions) {
  let text = ""
  let rankObj = {}
  for (competition of competitions) {
    for (player of competition.players) {
      if (!Object.keys(rankObj).includes(player.name)) {
        rankObj[player.name] = {name: player.name, points: []}
      }
      rankObj[player.name]["points"].push(player.points)
    }
  }
  return Object.entries(filterBestScoresAndSum(rankObj)).map(n => n[1])
}

function filterBestScoresAndSum(obj) {
  for (key of Object.keys(obj)) {
      if (obj[key].points.length > 3) {
        let min = Math.min(...obj[key].points);
        obj[key].points = obj[key].points.filter(e => e != min);
      }
      obj[key].points = obj[key].points.reduce( (sum, obj) => sum + obj, 0)
  }
  return obj
}

bot.onText(/\/tasoitus (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  switch(match[1]) {
    case "Kaatis":
      getHandicappedResults("kaatis", chatId);
      break;
    case "Kisis":
      getHandicappedResults("kisis", chatId);
      break;
    case "Karkkila":
      getHandicappedResults("karkkila", chatId);
      break;
    case "overall":
      getHandicappedResults("overall", chatId);
      break;
    case "all":
      getHandicappedResults("all", chatId);
      break;
    default:
      break;
  }
});

const handicaps = [
  {score: 890, handicap: -1},
  {score: 880, handicap: -2},
  {score: 870, handicap: -3},
  {score: 860, handicap: -4},
  {score: 850, handicap: -5},
  {score: 840, handicap: -6},
  {score: 830, handicap: -7},
  {score: 820, handicap: -8},
  {score: 810, handicap: -9},
  {score: 800, handicap: -10},
  {score: 790, handicap: -11},
  {score: 780, handicap: -12},
  {score: 770, handicap: -13},
  {score: 760, handicap: -14},
  {score: 750, handicap: -15},
  {score: 740, handicap: -16},
  {score: 730, handicap: -17},
  {score: 720, handicap: -18}
]


app.listen(5000, "127.0.0.1", function() {
  console.log(token)

  countScores()
});
