export type Dish = {
  id: number;
  shopId: number;
  name: string;
  description: string;
  type: string;
  price: number;
  isSignature: boolean;
  image: string;
  audioURL?: string;
  createdAt: string;
  status: string;
};

export type DishNarrationResponse = {
  dishId: number;
  shopId?: number;
  language: string;
  languageKey?: string;
  requestedLanguage?: string;
  voice?: string;
  sourceText?: string;
  script?: string;
  audioUrl: string;
  cached: boolean;
  fallbackApplied?: boolean;
  updatedAt?: string;
};

export type DishCreationRequest = {
  shopId: number;
  name: string;
  description: string;
  price: number;
  isSignature: boolean;
};

export type DishUpdateRequest = {
  name?: string;
  description?: string;
  type?: string;
  price?: number;
  isSignature?: boolean;
};
