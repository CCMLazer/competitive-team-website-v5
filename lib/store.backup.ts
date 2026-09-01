import {DEFAULT,Site} from "./site";
const KEY="team-site-v4";
export function getSite():Site{if(typeof window==="undefined")return DEFAULT;try{return JSON.parse(localStorage.getItem(KEY)||"null")||DEFAULT}catch{return DEFAULT}}
export function putSite(s:Site){localStorage.setItem(KEY,JSON.stringify(s))}
export function clearSite(){localStorage.removeItem(KEY)}