export interface ParsedCoordinates {
  lat: number
  lng: number
}

function isValidRange(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

function toNumber(value: string): number {
  return Number(value.replace(",", "."))
}

function parseDmsToDecimal(degrees: string, minutes: string | undefined, seconds: string | undefined): number {
  const deg = toNumber(degrees)
  const min = minutes ? toNumber(minutes) : 0
  const sec = seconds ? toNumber(seconds) : 0
  return deg + min / 60 + sec / 3600
}

function parseDmsPair(input: string): ParsedCoordinates | null {
  const pattern = /(\d+(?:[.,]\d+)?)\s*°\s*(\d+(?:[.,]\d+)?)?\s*['’′]?\s*(\d+(?:[.,]\d+)?)?\s*(?:["”″])?\s*([NSEW])/gi
  const matches = Array.from(input.matchAll(pattern))
  if (matches.length < 2) {
    return null
  }

  let lat: number | null = null
  let lng: number | null = null

  for (const match of matches) {
    const decimal = parseDmsToDecimal(match[1], match[2], match[3])
    const direction = match[4].toUpperCase()

    if (direction === "N" || direction === "S") {
      lat = direction === "S" ? -decimal : decimal
    }
    if (direction === "E" || direction === "W") {
      lng = direction === "W" ? -decimal : decimal
    }
  }

  if (lat === null || lng === null || !isValidRange(lat, lng)) {
    return null
  }

  return { lat, lng }
}

function parseDecimalPair(input: string): ParsedCoordinates | null {
  const normalized = input.replace(/;/g, ",")
  const numberMatches = normalized.match(/-?\d+(?:[.,]\d+)?/g)
  if (!numberMatches || numberMatches.length < 2) {
    return null
  }

  const lat = toNumber(numberMatches[0])
  const lng = toNumber(numberMatches[1])
  if (Number.isNaN(lat) || Number.isNaN(lng) || !isValidRange(lat, lng)) {
    return null
  }

  return { lat, lng }
}

export function parseFlexibleCoordinates(input: string): ParsedCoordinates | null {
  const raw = input.trim()
  if (!raw) {
    return null
  }

  const dmsResult = parseDmsPair(raw)
  if (dmsResult) {
    return dmsResult
  }

  return parseDecimalPair(raw)
}

