export interface RatingBase {
  id: string;
  userId: string;
  storeId: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertRatingPayload {
  value: number;
}

export interface StoreRater {
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  ratedAt: string;
}
