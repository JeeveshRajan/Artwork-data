export interface ArtWorkData{
    "id":number;
    "title": string;
    "place_of_origin":string;
    "artist_display": string;
    "inscriptions": string | null;
    "date_start": number;
    "date_end": number;
};

export interface ArtWorkApiResponse{
    data: ArtWorkData[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
        current_page: number;
        next_url: string | null;
    };
};