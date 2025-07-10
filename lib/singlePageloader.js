import apiRequest from "./apiReq"

export const singlePageloader= async ({request,params})=>{
    const res = await apiRequest("/venue/"+params.id)

    return res.data;
}