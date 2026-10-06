// Post code formats by country (FS-HR-9, HR-009). The form required 5 digits, so a Swiss address
// (8001 Zürich) couldn't be entered. Countries not listed take any short code of letters and digits.

type PostCodeFormat = { pattern: RegExp; example: string };

const FORMATS: Record<string, PostCodeFormat> = {
  CH: { pattern: /^\d{4}$/, example: "8001" },
  LI: { pattern: /^\d{4}$/, example: "9490" },
  AT: { pattern: /^\d{4}$/, example: "1010" },
  DE: { pattern: /^\d{5}$/, example: "10115" },
  FR: { pattern: /^\d{5}$/, example: "75001" },
  IT: { pattern: /^\d{5}$/, example: "00118" },
  ES: { pattern: /^\d{5}$/, example: "28001" },
  EG: { pattern: /^\d{5}$/, example: "11511" },
  SA: { pattern: /^\d{5}(-\d{4})?$/, example: "11564" },
  AE: { pattern: /^\d{0,6}$/, example: "00000" },
  NL: { pattern: /^\d{4}\s?[A-Z]{2}$/i, example: "1011 AB" },
  BE: { pattern: /^\d{4}$/, example: "1000" },
  GB: { pattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, example: "SW1A 1AA" },
  US: { pattern: /^\d{5}(-\d{4})?$/, example: "94103" },
};

const ANY: PostCodeFormat = { pattern: /^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/, example: "" };

/** The format for a country code ("CH"); a general one when the country isn't listed. */
export function postCodeFormat(country?: string | null): PostCodeFormat {
  return (country && FORMATS[country.toUpperCase()]) || ANY;
}

export function isValidPostCode(code: string, country?: string | null): boolean {
  return postCodeFormat(country).pattern.test(code.trim());
}
