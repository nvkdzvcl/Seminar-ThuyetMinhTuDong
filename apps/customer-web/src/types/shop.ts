export type ShopResponse = {
  id: number;
  ownerId: string;
  name: string;
  address: string;
  shortDescription?: string;
  detailedDescription?: string;
  description: string;
  imageName: string;
  audioURL: string;
  shopTypeId?: number;
  shopTypeName?: string;
  lat: number;
  lng: number;
  avgCostPerPerson: number;
  avgWaitTimeMin: number;
  avgEatTimeMin: number;
  createdAt: string;
  status: string;
};

export type ShopCreationRequest = {
  name: string;
  address: string;
  shortDescription?: string;
  detailedDescription?: string;
  description: string;
  lat: number;
  lng: number;
  avgCostPerPerson: number;
  avgWaitTimeMin: number;
  avgEatTimeMin: number;
};

export type ShopNarrationResponse = {
  shopId: number;
  language: string;
  languageKey?: string;
  requestedLanguage?: string;
  voice: string;
  sourceText?: string;
  script?: string;
  audioUrl: string;
  cached: boolean;
  fallbackApplied?: boolean;
  updatedAt?: string;
};
