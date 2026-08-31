import { Resend } from "resend";
const resend = new Resend("re_123");
console.log("Resend keys:", Object.keys(resend));
console.log("Resend emails keys:", Object.keys((resend as any).emails || {}));
console.log("Resend emails prototype:", Object.getOwnPropertyNames(Object.getPrototypeOf((resend as any).emails || {})));
