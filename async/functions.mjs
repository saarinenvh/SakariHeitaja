import fetch from "node-fetch";

const HEADERS = { "User-Agent": "SakariHeitajaBot/1.0 (disc golf commentary bot)" };

export const getData = async url => {
  try {
    const response = await fetch(url, { headers: HEADERS });
    return response.json();
  } catch (error) {
    console.log(error);
  }
};

export const getGiphy = async url => {
  try {
    const response = await fetch(url);
    return response.text();
  } catch (error) {
    console.log(error);
  }
};
