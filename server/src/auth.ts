import jwt from 'jsonwebtoken'; import crypto from 'node:crypto'; import bcrypt from 'bcryptjs'; import {prisma} from './lib/prisma.js'; import {Role} from '@prisma/client';
const accessSecret=process.env.JWT_ACCESS_SECRET!; const refreshSecret=process.env.JWT_REFRESH_SECRET!;
export type Claims={id:string;role:Role;name:string};
export const signAccess=(u:Claims)=>jwt.sign(u,accessSecret,{expiresIn:'15m'}); export const verifyAccess=(t:string)=>jwt.verify(t,accessSecret) as Claims;
export async function issueRefresh(userId:string){const raw=crypto.randomBytes(48).toString('hex'); const tokenHash=crypto.createHash('sha256').update(raw).digest('hex'); await prisma.refreshToken.create({data:{userId,tokenHash,expiresAt:new Date(Date.now()+7*864e5)}}); return raw;}
export async function rotateRefresh(raw:string){const h=crypto.createHash('sha256').update(raw).digest('hex'); const row=await prisma.refreshToken.findUnique({where:{tokenHash:h},include:{user:true}}); if(!row||row.expiresAt<new Date()) return null; await prisma.refreshToken.delete({where:{id:row.id}}); const next=await issueRefresh(row.userId); return {user:row.user,refresh:next};}
export async function hashPassword(p:string){return bcrypt.hash(p,12)} export async function checkPassword(p:string,h:string){return bcrypt.compare(p,h)}
