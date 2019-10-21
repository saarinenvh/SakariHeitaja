import fetch from 'node-fetch'

export const getData = async url => {
  try {
    console.log(url)
    const response = await fetch(url);
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
}
