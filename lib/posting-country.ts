/** Use edge-supplied geolocation only, never submitted form fields. */
export function postingCountry(request:Request):string|null{
 const cf=(request as Request&{cf?:{country?:unknown}}).cf;
 const value=cf?.country??request.headers.get('CF-IPCountry');
 return typeof value==='string'&&/^[A-Z]{2}$/.test(value)&&value!=='XX'?value:null;
}
