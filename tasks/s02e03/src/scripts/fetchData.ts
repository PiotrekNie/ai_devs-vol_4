import { hubApiKey } from "../../config.js";

const fetchData = async () => {
  const response = await fetch(
    `https://hub.ag3nts.org/data/${hubApiKey()}/failure.log`,
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  } else {
    const data = await response.text();
    return data;
  }
};

export default fetchData;
