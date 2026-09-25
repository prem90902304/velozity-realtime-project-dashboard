import {Request,Response,NextFunction} from 'express'; import {verifyAccess,Claims} from '../auth.js';
declare global {namespace Express {interface Request {user?:Claims}}}
export function auth(req:Request,res:Response,next:NextFunction){try{const h=req.headers.authorization;if(!h?.startsWith('Bearer ')) return res.status(401).json({error:{code:'UNAUTHORIZED',message:'Authentication required'}});req.user=verifyAccess(h.slice(7));next()}catch{return res.status(401).json({error:{code:'UNAUTHORIZED',message:'Invalid or expired access token'}})}}
export const roles=(...allowed:string[]) => (req:Request,res:Response,next:NextFunction)=>{if(!req.user||!allowed.includes(req.user.role)) return res.status(403).json({error:{code:'FORBIDDEN',message:'Insufficient permissions'}}); next()};
