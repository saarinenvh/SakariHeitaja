export function getRandom(i) {
  return Math.floor(Math.random() * i);
}

export function createDate(unix_timestamp) {
  let date = new Date(unix_timestamp * 1000);
  let hours = date.getHours();
  let minutes = "0" + date.getMinutes();
  return hours + ":" + minutes.substr(-2);
}

export function formatDate(date) {
  let hours = date.getHours();
  let minutes = "0" + date.getMinutes();
  return hours + ":" + minutes.substr(-2);
}
