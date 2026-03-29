export function getRandom(i: number): number {
  return Math.floor(Math.random() * i);
}

export function createDate(unix_timestamp: number): string {
  const date = new Date(unix_timestamp * 1000);
  const hours = date.getHours();
  const minutes = "0" + date.getMinutes();
  return hours + ":" + minutes.slice(-2);
}

export function formatDate(date: Date): string {
  const hours = date.getHours();
  const minutes = "0" + date.getMinutes();
  return hours + ":" + minutes.slice(-2);
}
