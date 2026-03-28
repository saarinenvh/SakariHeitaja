const HEADERS = { "User-Agent": "SakariHeitajaBot/1.0 (disc golf commentary bot)" };

export async function getData<T = any>(url: string): Promise<T | undefined> {
  try {
    const response = await fetch(url, { headers: HEADERS });
    return response.json() as Promise<T>;
  } catch (error) {
    console.error(error);
  }
}

export async function getGiphy(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    return response.text();
  } catch (error) {
    console.error(error);
  }
}
