export interface PaginatedResult<T> {
  items: T[];
  cursor?: string;
  hasMore: boolean;
}
