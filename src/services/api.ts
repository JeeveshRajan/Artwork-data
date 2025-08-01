import axios from "axios";
import type { ArtWorkApiResponse } from "../types/artworkInterface";


export const fetchData = async (pages:number,rows:number): Promise<ArtWorkApiResponse>=>{
        const responseData= await axios.get(`https://api.artic.edu/api/v1/artworks?page=${pages}&limit=${rows}`);
        return responseData.data
}