/**
 * Oakville tennis / pickleball court data from ArcGIS MapServer layer 3.
 * https://maps.oakville.ca/oakgis/rest/services/ArcGISOnline/AGO_Communications/MapServer/3
 */

const BASE_URL =
  "https://maps.oakville.ca/oakgis/rest/services/ArcGISOnline/AGO_Communications/MapServer/3/query";

const PAGE_SIZE = 100;

/**
 * @param {string} [where]
 * @returns {Promise<import('./oakville-types').ArcGISFeature[]>}
 */
export async function fetchArcGISFeatures(where = "1=1") {
  const all = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      where,
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
      f: "json",
      resultRecordCount: String(PAGE_SIZE),
      resultOffset: String(offset),
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) {
      throw new Error(`ArcGIS HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message ?? JSON.stringify(data.error));
    }

    const batch = data.features ?? [];
    all.push(...batch);

    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

/** @param {unknown} value */
function parsePickleballCount(value) {
  if (value == null || value === "" || value === "0") return 0;
  const match = String(value).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} attrs
 */
export function classifyFeature(name, attrs) {
  const upper = (name || "").toUpperCase();
  const isMultiLined =
    upper.includes("MULTI-LINED") || upper.includes("MULTI LINE");
  const isStandalonePickleball =
    upper.includes("PICKLEBALL") &&
    !isMultiLined &&
    !upper.includes(" AND TENNIS");

  const tennisCount = Math.max(
    0,
    Number(attrs.PUBLICTENNISCOURTCOUNT ?? attrs.TENNISCOURTCOUNT ?? 0)
  );
  const pbFromField = parsePickleballCount(attrs.PICKLEBALLCOURT);

  if (isMultiLined) {
    return { kind: "pickleball_lined", count: Math.max(1, tennisCount || 1) };
  }
  if (isStandalonePickleball) {
    return {
      kind: "pickleball_dedicated",
      count: Math.max(1, pbFromField || 1),
    };
  }
  return { kind: "tennis", count: Math.max(1, tennisCount || 1) };
}

/** @param {import('./oakville-types').ArcGISFeature[]} features */
export function detectQueueMode(features) {
  let hasStandalonePickleball = false;
  let hasStandaloneTennis = false;

  for (const feature of features) {
    const upper = (feature.attributes.NAME ?? "").toUpperCase();
    const isMultiLined =
      upper.includes("MULTI-LINED") || upper.includes("MULTI LINE");
    if (
      upper.includes("PICKLEBALL") &&
      !isMultiLined &&
      !upper.includes(" AND TENNIS")
    ) {
      hasStandalonePickleball = true;
    }
    if (upper.includes("TENNIS") && !isMultiLined) {
      hasStandaloneTennis = true;
    }
  }

  return hasStandalonePickleball && hasStandaloneTennis ? "dual" : "single";
}

/** @param {import('./oakville-types').ArcGISFeature[]} features */
function rollupBreakdown(features) {
  /** @type {{ tennis: number; pickleball_dedicated: number; pickleball_lined: number }} */
  const breakdown = {
    tennis: 0,
    pickleball_dedicated: 0,
    pickleball_lined: 0,
  };

  for (const feature of features) {
    const { kind, count } = classifyFeature(
      feature.attributes.NAME ?? "",
      feature.attributes
    );
    breakdown[kind] += count;
  }

  return breakdown;
}

/** @param {{ tennis: number; pickleball_dedicated: number; pickleball_lined: number }} breakdown */
function totalCourts(breakdown) {
  return (
    breakdown.tennis +
    breakdown.pickleball_dedicated +
    breakdown.pickleball_lined
  );
}

/** @param {{ tennis: number; pickleball_dedicated: number; pickleball_lined: number }} breakdown */
function inferCourtType(breakdown) {
  const hasTennis = breakdown.tennis > 0;
  const hasPickleball =
    breakdown.pickleball_dedicated > 0 || breakdown.pickleball_lined > 0;

  if (hasTennis && hasPickleball) return "both";
  if (hasPickleball) return "pickleball";
  return "tennis";
}

/** @param {string} courtType */
function amenitiesForType(courtType) {
  if (courtType === "both") return ["Tennis", "Pickleball", "Outdoor", "Free"];
  if (courtType === "pickleball") return ["Pickleball", "Outdoor", "Free"];
  return ["Tennis", "Outdoor", "Free"];
}

/** @param {string} name */
function stripFacilitySuffix(name) {
  return name
    .replace(/\s+Multi-Lined Pickleball.*$/i, "")
    .replace(/\s+Multi-line Pickleball.*$/i, "")
    .replace(/\s+Pickleball Courts?$/i, "")
    .replace(/\s+Tennis Courts?$/i, "")
    .replace(/\s+Ps Multi-Lined.*$/i, "")
    .trim();
}

/** @param {import('./oakville-types').ArcGISFeature[]} features */
function parkDisplayName(features) {
  const parent = features[0].attributes.PARENTPARKNAME?.trim();
  if (parent && parent.toUpperCase() !== "N/A") return parent;

  const names = features
    .map((f) => f.attributes.NAME?.trim())
    .filter(Boolean)
    .map(stripFacilitySuffix)
    .filter(Boolean);

  if (names.length === 0) return "Unknown Court";

  names.sort((a, b) => a.length - b.length);
  return names[0];
}

/** @param {string} name */
export function normalizeParkKey(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(multi lined|tennis|pickleball|courts?|court|ps)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {"single"|"dual"} queueMode
 * @param {{ tennis: number; pickleball_dedicated: number; pickleball_lined: number }} breakdown
 */
function queueCapacities(queueMode, breakdown) {
  const shared =
    breakdown.tennis +
    breakdown.pickleball_lined +
    breakdown.pickleball_dedicated;

  return {
    shared_capacity: Math.max(1, shared),
    tennis_capacity: Math.max(1, breakdown.tennis),
    pickleball_capacity: Math.max(1, breakdown.pickleball_dedicated),
  };
}

/**
 * Group ArcGIS point features into one Courtsy location per park.
 * @param {import('./oakville-types').ArcGISFeature[]} features
 */
export function consolidateOakvilleCourts(features) {
  /** @type {Map<string, import('./oakville-types').ArcGISFeature[]>} */
  const groups = new Map();

  for (const feature of features) {
    const attrs = feature.attributes;
    const key =
      attrs.PARK_ID?.trim() ||
      attrs.PARENTPARKNAME?.trim() ||
      normalizeParkKey(attrs.NAME ?? "") ||
      attrs.NAME;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(feature);
  }

  return [...groups.entries()].map(([groupKey, groupFeatures]) => {
    const name = parkDisplayName(groupFeatures);
    const court_breakdown = rollupBreakdown(groupFeatures);
    const queue_mode = detectQueueMode(groupFeatures);
    const court_type = inferCourtType(court_breakdown);
    const capacities = queueCapacities(queue_mode, court_breakdown);

    const lat =
      groupFeatures.reduce((sum, f) => sum + (f.geometry?.y ?? 0), 0) /
      groupFeatures.length;
    const lng =
      groupFeatures.reduce((sum, f) => sum + (f.geometry?.x ?? 0), 0) /
      groupFeatures.length;

    const address =
      groupFeatures.find((f) => f.attributes.ADDRESS)?.attributes.ADDRESS ??
      null;

    return {
      groupKey,
      name,
      address: address ? `${address}, Oakville, Ontario` : null,
      latitude: lat,
      longitude: lng,
      court_type,
      num_courts: Math.max(1, totalCourts(court_breakdown)),
      queue_mode,
      court_breakdown,
      ...capacities,
      amenities: amenitiesForType(court_type),
      municipality: "Oakville",
      source: "oakville-arcgis",
      arcgis_feature_count: groupFeatures.length,
      arcgis_names: groupFeatures.map((f) => f.attributes.NAME),
    };
  });
}

/** Merge rows that resolved to the same park name (e.g. split GIS groups). */
function mergeByParkName(courts) {
  /** @type {Map<string, typeof courts[number]>} */
  const merged = new Map();

  for (const court of courts) {
    const key = normalizeParkKey(court.name);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...court, court_breakdown: { ...court.court_breakdown } });
      continue;
    }

    existing.court_breakdown.tennis += court.court_breakdown.tennis;
    existing.court_breakdown.pickleball_dedicated +=
      court.court_breakdown.pickleball_dedicated;
    existing.court_breakdown.pickleball_lined +=
      court.court_breakdown.pickleball_lined;

    existing.num_courts = totalCourts(existing.court_breakdown);
    existing.arcgis_feature_count += court.arcgis_feature_count;
    existing.arcgis_names = [...existing.arcgis_names, ...court.arcgis_names];

    const fakeFeatures = existing.arcgis_names.map((name) => ({
      attributes: { NAME: name },
    }));
    existing.queue_mode = detectQueueMode(fakeFeatures);
    existing.court_type = inferCourtType(existing.court_breakdown);
    existing.amenities = amenitiesForType(existing.court_type);

    const capacities = queueCapacities(
      existing.queue_mode,
      existing.court_breakdown
    );
    existing.shared_capacity = capacities.shared_capacity;
    existing.tennis_capacity = capacities.tennis_capacity;
    existing.pickleball_capacity = capacities.pickleball_capacity;
  }

  return [...merged.values()];
}

/** Fetch and consolidate all Oakville public court locations. */
export async function fetchOakvilleCourts() {
  const features = await fetchArcGISFeatures("1=1");
  return mergeByParkName(consolidateOakvilleCourts(features));
}

export function filterByRadius(courts, center, radiusKm) {
  const R = 6371;
  return courts.filter((court) => {
    if (!court.latitude || !court.longitude) return false;
    const dLat = ((court.latitude - center.lat) * Math.PI) / 180;
    const dLng = ((court.longitude - center.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((center.lat * Math.PI) / 180) *
        Math.cos((court.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const dist = 2 * R * Math.asin(Math.sqrt(a));
    return dist <= radiusKm;
  });
}
