export interface StoreBase {
  id: string;
  name: string;
  email: string;
  address: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreListItem extends StoreBase {
  overallRating: number | null;
}

export interface StoreWithUserRating extends StoreListItem {
  userRating: number | null;
}

export interface CreateStoreWithOwnerPayload {
  store: {
    name: string;
    email: string;
    address: string;
  };
  owner: {
    name: string;
    email: string;
    password: string;
    address: string;
  };
}

export interface StoreSearchQuery {
  name?: string;
  address?: string;
}
