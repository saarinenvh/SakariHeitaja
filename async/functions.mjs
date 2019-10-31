import fetch from "node-fetch";
import https from "https";

const agent = new https.Agent({
  host: "www.discgolfmetrix.com",
  port: "443",
  path: "/",
  rejectUnauthorized: false
});

export const getData = async url => {
  try {
    const response = await fetch(url, { agent });
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
