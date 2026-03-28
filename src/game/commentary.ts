import { getRandom } from "../lib/utils";
import { Change, MetrixHoleResult } from "../types/metrix";

const narratives = [
  "Ihmiset ovat suorittaneet firsbeegolf heittoja!",
  "Jahas ja tilannekatsauksen aika!",
  "HOI! Nyt taas tapahtuu!",
  "HUOMIO!",
  "Ja taas mennään!",
  "HEIHEIHEI, joku teki jotain!",
  "Tulostaulussa liikehdintää!",
  "Ja taas on väyliä saatettu loppuun.",
];

type ScoreType = "ace" | "albatross" | "eagle" | "birdie" | "par" | "bogey" | "doubleBogey" | "worse";

const scoreTexts: Record<Exclude<ScoreType, "worse">, string[]> = {
  ace:         ["ÄSSÄN!"],
  eagle:       ["eaglen?? SIIS EAGLEN! En usko", "KOTKAN", "EAGLEN"],
  albatross:   ["ALBATROSSIN?? Salee merkkausvirhe"],
  birdie:      ["birdien", "lintusen", "tirpan", "vitunmoisen tuuripörön", "pörön", "hemmetin kauniin pirkon", "pirkon"],
  par:         ["parin", "PROFESSIONAL AVERAGEN", "ihannetuloksen", "hemmetin tylsän paarin", "tuuripaarin", "scramblepaarin", "tsägällä paarin", "taitopaarin"],
  bogey:       ["bogin", "boggelin", "turhan bogin", "ruskean boggelin"],
  doubleBogey: ["ruman tuplabogin", "tsägällä tuplan", "kaks päälle", "DOUBLE BOGEYN"],
};

const startTexts = {
  good: [
    "MAHTAVA SUORITUS!", "USKOMATON TEKO!", "ENNENÄKEMÄTÖNTÄ TOIMINTAA!",
    "Wouuuuu, kyllä nyt kelpaa!", "Mahtavaa peliä, ei voi muuta sanoa.",
    "Siis huhu, aika huikeeta!", "Tää dude on iha samaa tasoo ku pauli tai riki!",
    "Kyllä nyt ollaan sankareita!", "WOUUUUU!",
    "Hellurei hellurei vääntö on hurjaa!", "No nyt taas! Näin sen kuuluukin mennä!",
    "Olikohan vahinko, ei tämmöstä yleensä nähä!",
    "JUMALISTE! Oiskohan sittenki vielä sauma mitaleille!",
    "Tämmöstä! Tämmöstä sen olla pitää!", "Nyt ollaa jo lähellä tonninmiehen tasoa!",
    "JA MAALILAITE RÄJÄHTÄÄ!!", "Täällä taas nostellaan häränsilmästä limppuja!",
  ],
  bad: [
    "Voi surkujen surku!", "Voi kyynelten kyynel!", "No ohan tää vähän vaikee laji!",
    "Saatana vois tää spede vaik denffata.", "Kannattiko ees tulla näihin kisoihin??",
    "Säälittävää tekemistä taas...", "Naurettavaa toimintaa!", "Miten voi taas pelata näin?",
    "En voi uskoa silmiäni!", "Miten on mahdollista taas?", "Näkivätkö silmäni oikein?",
    "HAHAHAHAHAHA!", "😃😃😃😃😃",
    "Ei vittu, jopa mä oisin pöröttänu ton mut ei... Ei ei ei.", "Ei jumalauta!",
    "Vittu mitä paskaa, ei kiinnosta ees seurata tätä pelii jos taso on tää!!",
    "Siis mee roskii!", "Noh, toivottavasti ens kerralla käy parempi tuuri.",
    "Voi harmi, hyvä yritys oli mutta nyt kävi näin.",
    "Punasta korttiin ja matka kohti uusia pettymyksiä!",
    "PERSE! Tsemppiä nyt saatana!", "HYVÄ VADEE!", "Taso täällä taas ku MA6.",
    "NYT JUMALAUTA, VÄHÄN EES TSEMPPIÄ!", "Haha, emmä tienny et tää on näin paska!",
    "No nyt oli kyllä paskaa tuuria!",
    "Kävipä hyvä tuuri, ois voinu olla nimittäi VIELÄ PASKEMPAA!!",
    "Nyt on kyl taas TUOMIOPÄIVÄ,  ON TUOMIOPÄIVÄ, on KEINOSEN NIMIPÄIVÄ!",
  ],
  neutral: [
    "Onpahan tylsää...", "Nyt kun olisi aika hyökätä, niin mitä hän tekee?",
    "Ei tälläsellä pelillä kyllä mitaleille mennä :X", "Noniin, lisää harmaataa korttiin!",
    "On se ihannetuloskin tulos, kun", "buuuu!", "Ja ei taaskaa mitään yritystä.",
    "Parasta annettiin ja paskaa tehtiin.",
    "Jahas, yhtä surullista tekemistä ku asuminen Vantaalla.",
    "Hienosti! Vaikea väylä, mutta kyllä kelpaa.", "Mitähän tähän sit taas sanois?",
    "Ei huono!", "Joopajoooooo...", "Yrittäisit edes.",
    "Ei tällä paljoa fieldille hävitä!",
    "Noh aika harvat tällä väylällä paremmin heittää.",
    "Tämmösellä väylällä näin paskaa, on kyl surullista.",
    "Melkeen ymmärtäisin, jos ois ees vaikee väylä.",
    "Noh, ehkä seuraavalla väylällä sitten paremmin...",
  ],
};

const verbs = [
  "otti", "sai", "suoritti", "taisteli", "möyri", "heitti", "viskoi",
  "rämisteli", "scrambläsi", "liidätteli", "paiskasi", "nakkeli",
  "sinkosi", "nosti", "lapioi", "viimeisteli",
];

const obPhrases = [
  ", oli muuten myös <b>OBOBOB</b>",
  ", eikä pysyny ees väylällä <b>(ob)</b>",
  ", kaiken lisäks <b>OUT OF BOUNDS</b>",
  ", oli muute viel <b>OB</b> HÄHÄHÄHÄHÄ",
];

function pick<T>(arr: T[]): T {
  return arr[getRandom(arr.length)];
}

function addPlusSign(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

function getScoreType(holeResult: MetrixHoleResult): ScoreType {
  const { Result, Diff } = holeResult;
  if (parseInt(Result) === 1) return "ace";
  if (Diff <= -3) return "albatross";
  if (Diff === -2) return "eagle";
  if (Diff === -1) return "birdie";
  if (Diff === 0)  return "par";
  if (Diff === 1)  return "bogey";
  if (Diff === 2)  return "doubleBogey";
  return "worse";
}

function getScoreText(type: ScoreType, holeResult: MetrixHoleResult): string {
  if (type === "worse") return `niin ison scoren, että ei mahdu edes näytölle (${holeResult.Result})`;
  return pick(scoreTexts[type]);
}

function getStartText(type: ScoreType): string {
  if (["ace", "eagle", "albatross", "birdie"].includes(type)) return pick(startTexts.good);
  if (type === "par") return pick(startTexts.neutral);
  return pick(startTexts.bad);
}

export function generateComment(change: Change): string {
  const { newPlayer, holeResult } = change;
  const type      = getScoreType(holeResult);
  const startText = getStartText(type);
  const scoreText = getScoreText(type, holeResult);
  const verb      = pick(verbs);
  const ob        = holeResult.PEN > 0 ? pick(obPhrases) : "";

  return (
    `${startText} <b>${newPlayer.Name}</b> ${verb} ${scoreText}${ob}, ` +
    `tällä hetkellä tuloksessa <b>${addPlusSign(newPlayer.Diff)}</b> ` +
    `ja sijalla <b>${newPlayer.OrderNumber}</b>`
  );
}

export function generateHeader(): string {
  return pick(narratives);
}
