export interface CreateReviewInput {
  order_id: string;
  communication_rating: number;
  quality_rating: number;
  reliability_rating: number;
  timeliness_rating: number;
  comment?: string;
}

export interface UpdateReviewInput {
  communication_rating?: number;
  quality_rating?: number;
  reliability_rating?: number;
  timeliness_rating?: number;
  comment?: string;
}

export interface ReviewRecord {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewer_role: 'farmer' | 'buyer';
  communication_rating: number;
  quality_rating: number;
  reliability_rating: number;
  timeliness_rating: number;
  overall_rating: number;
  comment?: string;
  verified_trade: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTrustScore {
  user_id: string;
  role: 'farmer' | 'buyer' | 'all';
  verified_review_count: number;
  average_overall_rating: number;
  communication_score: number;
  quality_score: number;
  reliability_score: number;
  timeliness_score: number;
  trust_score: number;
  updated_at: string;
}

export interface UserReviewsSummary {
  user_id: string;
  trust_score: UserTrustScore;
  reviews: ReviewRecord[];
}
