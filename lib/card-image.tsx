function cardText(value:string,fallback:string,limit:number){
 const text=(value||'').replace(/[\r\n\u2028\u2029]+/g,' ').trim()||fallback;
 let result='',units=0;for(const char of Array.from(text)){const cost=char.codePointAt(0)!>255?2:1;if(units+cost>limit)return result+'…';result+=char;units+=cost;}return result;
}
export function CardImage({src,id,title,name}:{src:string;id:number;title:string;name:string}){
 return <div style={{width:1200,height:630,position:'relative',display:'flex',background:'#171b1d',color:'#fff',border:'1px solid #353d41'}}>
 <div style={{position:'absolute',left:46,top:44,width:546,height:542,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #806e3d',padding:8,background:'#666'}}><img src={src} width={528} height={524}/></div>
 <div style={{position:'absolute',left:660,top:57,width:492,height:516,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
 <div style={{display:'flex',flexDirection:'column',gap:5}}><div style={{display:'flex',fontSize:42,fontWeight:400,lineHeight:1.15,color:'#ffba31'}}>BLOCK ACTION</div><div style={{display:'flex',fontSize:15,lineHeight:1.3,letterSpacing:1.1,color:'#9ba8af'}}>CLASSIC VERSION</div></div>
 <div style={{display:'flex',flexDirection:'column',marginTop:17,marginBottom:17}}><div style={{display:'flex',fontSize:73,fontWeight:400,lineHeight:1.05,letterSpacing:.7}}>STAGE {id}</div><div style={{display:'flex',fontSize:31,fontWeight:600,lineHeight:1.25,marginTop:20,wordBreak:'break-word',color:'#eef1f2'}}>{cardText(title,'Untitled',48)}</div><div style={{display:'flex',fontSize:20,lineHeight:1.4,marginTop:5,color:'#a4b1b8'}}>Creator: {cardText(name,'Anonymous',40)}</div></div>
 <div style={{display:'flex',fontSize:15,lineHeight:1.25,letterSpacing:1.6,paddingTop:13,borderTop:'1px solid #3b464b',color:'#93a0a6'}}>PLAY · CREATE · SHARE</div>
 </div></div>;
}
