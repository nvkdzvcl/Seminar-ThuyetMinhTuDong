import type { AnalyticsSummary, DailyListenData, TopPOI, TimeRange } from '../types';
import { MOCK_SUMMARY, MOCK_DAILY_DATA, MOCK_TOP_POIS } from '../data/mockData';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchSummary(_range: TimeRange): Promise<AnalyticsSummary> {
  await delay(400);
  return { ...MOCK_SUMMARY };
}

export async function fetchDailyData(_range: TimeRange): Promise<DailyListenData[]> {
  await delay(400);
  return [...MOCK_DAILY_DATA];
}

export async function fetchTopPOIs(_range: TimeRange): Promise<TopPOI[]> {
  await delay(400);
  return [...MOCK_TOP_POIS];
}

export async function postListenEvent(poiId: string, tourId: string, durationMs: number): Promise<void> {
  await delay(200);
  console.log('[Mock Analytics] Listen event recorded:', { poiId, tourId, durationMs });
}
