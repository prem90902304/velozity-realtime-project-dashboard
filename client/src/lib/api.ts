import axios from 'axios'; export const API=import.meta.env.VITE_API_URL||'http://localhost:4000/api';
export const api=axios.create({baseURL:API,withCredentials:true}); let token=''; export const setToken=(t:string)=>token=t; export const getToken=()=>token;
api.interceptors.request.use(c=>{if(token)c.headers.Authorization=`Bearer ${token}`;return c});
export async function refresh(){const r=await api.post('/auth/refresh');token=r.data.accessToken;return r.data}
