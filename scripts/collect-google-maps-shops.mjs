#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
const CATEGORY_PRIORITY = [
  "ốc",
  "hải sản",
  "thịt nướng",
  "phở (bún)",
  "cơm",
  "lẩu",
  "nước giải khát",
];

const CATEGORY_QUERY_CONFIG = [
  { category: "ốc", terms: ["quán ốc", "ốc đêm"] },
  { category: "hải sản", terms: ["quán hải sản", "nhà hàng hải sản"] },
  { category: "thịt nướng", terms: ["quán thịt nướng", "quán nướng bbq"] },
  { category: "phở (bún)", terms: ["quán phở", "quán bún"] },
  { category: "cơm", terms: ["quán cơm", "cơm tấm"] },
  { category: "lẩu", terms: ["quán lẩu", "lẩu ngon"] },
  { category: "nước giải khát", terms: ["trà sữa", "quán cà phê"] },
];

const CATEGORY_KEYWORDS = {
  "ốc": ["quan oc", "oc", "snail"],
  "hải sản": ["hai san", "seafood"],
  "thịt nướng": ["thit nuong", "nuong", "bbq", "grill"],
  "phở (bún)": ["pho", "bun", "hu tieu", "mi", "noodle"],
  "cơm": ["com tam", "com ga", "quan com", "rice"],
  "lẩu": ["lau", "hotpot"],
  "nước giải khát": [
    "tra sua",
    "ca phe",
    "cafe",
    "coffee",
    "juice",
    "nuoc ep",
    "sinh to",
    "milk tea",
    "beverage",
  ],
};

const DEFAULTS = {
  area: "Vĩnh Khánh, Quận 4, TP.HCM",
  lat: 10.7612,
  lng: 106.7033,
  radius: 2500,
  maxPerQuery: 20,
  languageCode: "vi",
  regionCode: "VN",
  outJson: "database/seeds/generated/google-maps-shops.json",
  outCsv: "database/seeds/generated/google-maps-shops.csv",
  enrichPhone: true,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(input) {
  return ` ${String(input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()} `;
}

function toNumber(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Giá trị số không hợp lệ: ${value}`);
  }
  return parsed;
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    if (key === "help") {
      result.help = true;
      continue;
    }
    if (key === "skip-phone-enrich") {
      result.enrichPhone = false;
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Thiếu giá trị cho tham số --${key}`);
    }
    result[key] = next;
    i += 1;
  }
  return result;
}

function printHelp() {
  const help = `
Thu thập dữ liệu quán từ Google Places API (Google Maps).

Yêu cầu:
  - Set biến môi trường GOOGLE_MAPS_API_KEY

Cách chạy:
  npm run collect:shops:google

Tùy chọn:
  --area <text>               Mô tả khu vực tìm kiếm (mặc định: "${DEFAULTS.area}")
  --lat <number>              Vĩ độ tâm tìm kiếm (mặc định: ${DEFAULTS.lat})
  --lng <number>              Kinh độ tâm tìm kiếm (mặc định: ${DEFAULTS.lng})
  --radius <meters>           Bán kính tìm kiếm mét (mặc định: ${DEFAULTS.radius})
  --max-per-query <number>    Số kết quả tối đa cho mỗi truy vấn (mặc định: ${DEFAULTS.maxPerQuery})
  --language-code <code>      Ngôn ngữ kết quả (mặc định: ${DEFAULTS.languageCode})
  --region-code <code>        Mã vùng kết quả (mặc định: ${DEFAULTS.regionCode})
  --out-json <path>           Đường dẫn file JSON output
  --out-csv <path>            Đường dẫn file CSV output
  --skip-phone-enrich         Không gọi place detail để bổ sung số điện thoại
  --help                      Hiển thị trợ giúp

Ví dụ:
  npm run collect:shops:google -- --area "Quận 4, TP.HCM" --lat 10.759 --lng 106.704 --radius 3000
`;
  console.log(help.trim());
}

function buildQueryList(area) {
  const list = [];
  for (const config of CATEGORY_QUERY_CONFIG) {
    for (const term of config.terms) {
      list.push({
        category: config.category,
        textQuery: `${term} ${area}`.trim(),
      });
    }
  }
  return list;
}

async function searchPlaces({
  apiKey,
  textQuery,
  lat,
  lng,
  radius,
  maxPerQuery,
  languageCode,
  regionCode,
}) {
  const places = [];
  let pageToken = null;

  while (places.length < maxPerQuery) {
    const payload = {
      textQuery,
      languageCode,
      regionCode,
      pageSize: Math.min(20, maxPerQuery - places.length),
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius,
        },
      },
    };
    if (pageToken) {
      payload.pageToken = pageToken;
    }

    const response = await fetch(SEARCH_TEXT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.name,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.types,places.googleMapsUri,nextPageToken",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const reason = await response.text();
      throw new Error(`Google Places API lỗi (${response.status}): ${reason}`);
    }

    const data = await response.json();
    if (Array.isArray(data.places)) {
      places.push(...data.places);
    }

    pageToken = data.nextPageToken ?? null;
    if (!pageToken || places.length >= maxPerQuery) {
      break;
    }

    // nextPageToken needs a short delay before it becomes valid.
    await sleep(2200);
  }

  return places.slice(0, maxPerQuery);
}

async function enrichPhoneByPlaceDetail({
  apiKey,
  resourceName,
  languageCode,
  regionCode,
}) {
  if (!resourceName) {
    return null;
  }

  const url = new URL(`https://places.googleapis.com/v1/${resourceName}`);
  url.searchParams.set("languageCode", languageCode);
  url.searchParams.set("regionCode", regionCode);

  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,nationalPhoneNumber,internationalPhoneNumber",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.nationalPhoneNumber || data.internationalPhoneNumber || null;
}

function getPlaceIdFromResourceName(resourceName) {
  if (!resourceName || !resourceName.startsWith("places/")) {
    return null;
  }
  return resourceName.slice("places/".length);
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && `${value}`.trim() !== "") {
      return value;
    }
  }
  return null;
}

function inferCategory(shop) {
  const score = new Map(CATEGORY_PRIORITY.map((category) => [category, 0]));
  for (const category of shop.queryCategories) {
    if (score.has(category)) {
      score.set(category, score.get(category) + 3);
    }
  }

  const content = normalizeText(
    [shop.name, shop.address, ...(shop.types || [])].join(" "),
  );

  for (const category of CATEGORY_PRIORITY) {
    const keywords = CATEGORY_KEYWORDS[category] || [];
    for (const keyword of keywords) {
      if (content.includes(` ${keyword} `)) {
        score.set(category, score.get(category) + 1);
      }
    }
  }

  let bestCategory = CATEGORY_PRIORITY[0];
  let bestScore = -1;
  for (const category of CATEGORY_PRIORITY) {
    const value = score.get(category) ?? 0;
    if (value > bestScore) {
      bestScore = value;
      bestCategory = category;
    }
  }

  if (bestScore <= 0 && shop.queryCategories.length > 0) {
    return shop.queryCategories[0];
  }
  return bestCategory;
}

function toCsv(records) {
  const headers = [
    "ten_quan",
    "vi_do",
    "kinh_do",
    "dia_chi",
    "loai_quan",
    "so_dien_thoai",
    "google_maps_url",
    "google_place_id",
  ];

  const escapeCell = (value) => {
    const text = String(value ?? "");
    if (text.includes('"') || text.includes(",") || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const rows = records.map((item) =>
    [
      item.name,
      item.lat,
      item.lng,
      item.address,
      item.category,
      item.phoneNumber,
      item.googleMapsUrl,
      item.googlePlaceId,
    ]
      .map(escapeCell)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu GOOGLE_MAPS_API_KEY trong biến môi trường.");
  }

  const options = {
    area: args.area ?? DEFAULTS.area,
    lat: toNumber(args.lat, DEFAULTS.lat),
    lng: toNumber(args.lng, DEFAULTS.lng),
    radius: toNumber(args.radius, DEFAULTS.radius),
    maxPerQuery: Math.max(1, Math.floor(toNumber(args["max-per-query"], DEFAULTS.maxPerQuery))),
    languageCode: args["language-code"] ?? DEFAULTS.languageCode,
    regionCode: args["region-code"] ?? DEFAULTS.regionCode,
    outJson: args["out-json"] ?? DEFAULTS.outJson,
    outCsv: args["out-csv"] ?? DEFAULTS.outCsv,
    enrichPhone: args.enrichPhone ?? DEFAULTS.enrichPhone,
  };

  console.log(`Bắt đầu thu thập quán quanh khu vực: ${options.area}`);
  const queryList = buildQueryList(options.area);
  const shopByPlaceId = new Map();

  for (const query of queryList) {
    console.log(`- Đang tìm: "${query.textQuery}"`);
    const places = await searchPlaces({
      apiKey,
      textQuery: query.textQuery,
      lat: options.lat,
      lng: options.lng,
      radius: options.radius,
      maxPerQuery: options.maxPerQuery,
      languageCode: options.languageCode,
      regionCode: options.regionCode,
    });

    for (const place of places) {
      const resourceName = place.name ?? null;
      const placeId = pickFirstNonEmpty(place.id, getPlaceIdFromResourceName(resourceName));
      if (!placeId) {
        continue;
      }

      const existing = shopByPlaceId.get(placeId);
      const draft = {
        googlePlaceId: placeId,
        resourceName,
        name: place.displayName?.text ?? "",
        address: place.formattedAddress ?? "",
        lat: place.location?.latitude ?? null,
        lng: place.location?.longitude ?? null,
        phoneNumber: place.nationalPhoneNumber ?? null,
        googleMapsUrl: place.googleMapsUri ?? "",
        types: Array.isArray(place.types) ? place.types : [],
        queryCategories: [query.category],
      };

      if (!existing) {
        shopByPlaceId.set(placeId, draft);
        continue;
      }

      existing.name = pickFirstNonEmpty(existing.name, draft.name) ?? "";
      existing.address = pickFirstNonEmpty(existing.address, draft.address) ?? "";
      existing.lat = pickFirstNonEmpty(existing.lat, draft.lat);
      existing.lng = pickFirstNonEmpty(existing.lng, draft.lng);
      existing.phoneNumber = pickFirstNonEmpty(existing.phoneNumber, draft.phoneNumber);
      existing.googleMapsUrl = pickFirstNonEmpty(existing.googleMapsUrl, draft.googleMapsUrl) ?? "";
      existing.types = Array.from(new Set([...(existing.types || []), ...(draft.types || [])]));

      if (!existing.queryCategories.includes(query.category)) {
        existing.queryCategories.push(query.category);
      }
    }

    await sleep(200);
  }

  if (options.enrichPhone) {
    const missingPhone = Array.from(shopByPlaceId.values()).filter(
      (item) => !item.phoneNumber,
    );
    console.log(`Bổ sung số điện thoại cho ${missingPhone.length} quán...`);
    for (const item of missingPhone) {
      item.phoneNumber =
        (await enrichPhoneByPlaceDetail({
          apiKey,
          resourceName: item.resourceName,
          languageCode: options.languageCode,
          regionCode: options.regionCode,
        })) || null;
      await sleep(120);
    }
  }

  const rows = Array.from(shopByPlaceId.values())
    .map((shop) => ({
      name: shop.name,
      lat: shop.lat,
      lng: shop.lng,
      address: shop.address,
      category: inferCategory(shop),
      phoneNumber: shop.phoneNumber ?? "",
      googleMapsUrl: shop.googleMapsUrl,
      googlePlaceId: shop.googlePlaceId,
      categoriesFoundByQuery: shop.queryCategories,
      googleTypes: shop.types,
    }))
    .filter((shop) => shop.name && shop.address && shop.lat !== null && shop.lng !== null)
    .sort((a, b) => {
      const categoryDiff =
        CATEGORY_PRIORITY.indexOf(a.category) - CATEGORY_PRIORITY.indexOf(b.category);
      if (categoryDiff !== 0) {
        return categoryDiff;
      }
      return a.name.localeCompare(b.name, "vi");
    });

  const categorySummary = CATEGORY_PRIORITY.map((category) => ({
    category,
    total: rows.filter((row) => row.category === category).length,
  }));

  const output = {
    generatedAt: new Date().toISOString(),
    source: "Google Places API",
    area: options.area,
    center: {
      lat: options.lat,
      lng: options.lng,
      radiusMeters: options.radius,
    },
    totalShops: rows.length,
    categories: categorySummary,
    shops: rows,
  };

  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const outJsonPath = path.resolve(rootDir, options.outJson);
  const outCsvPath = path.resolve(rootDir, options.outCsv);

  await fs.mkdir(path.dirname(outJsonPath), { recursive: true });
  await fs.mkdir(path.dirname(outCsvPath), { recursive: true });

  await fs.writeFile(outJsonPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await fs.writeFile(outCsvPath, `${toCsv(rows)}\n`, "utf8");

  console.log(`Hoàn tất: ${rows.length} quán`);
  console.log(`JSON: ${outJsonPath}`);
  console.log(`CSV : ${outCsvPath}`);
  console.log("Thống kê loại quán:");
  for (const item of categorySummary) {
    console.log(`  - ${item.category}: ${item.total}`);
  }
}

main().catch((error) => {
  console.error(`Lỗi: ${error.message}`);
  process.exitCode = 1;
});
